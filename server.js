require('dotenv').config()
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163
const { Pool } = require('pg')
const axios = require('axios')
const querystring = require('querystring')

const generateRandomString = async function (length) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const stateKey = 'spotify_auth_state'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const query = async function (sql, params) {
  let client
  let results = []
  try {
    client = await pool.connect()
    const response = await client.query(sql, params)
    if (response && response.rows) {
      results = response.rows
    }
  } catch (err) {
    console.error(err)
  }
  if (client) client.release()
  return results
}

const queryAllSongs = async function () {
  const sql = 'SELECT chart_id, number, name, artist, album, length FROM tune_chart ORDER BY number;'
  const results = await query(sql)

  return { songs: results }
}

const numOfSongs = async function () {
  const sql = 'SELECT COUNT(chart_id) as total FROM tune_chart WHERE chart_id = 1;'
  const results = await query(sql)
  return results[0].total
}

const findSongNum = async function (name) {
  const sql = `SELECT number FROM tune_chart Where name = '${name}';`
  const results = await query(sql)
  return results[0].number

}

module.exports = {
  query,
  queryAllSongs,
  generateRandomString,
  numOfSongs,
  findSongNum
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', async function (req, res) {
    const songs = await queryAllSongs()
    if (songs != null) {
      res.status(200).send('healthy')
    } else {
      res.status(500).send('Database query failed. Try again later...')
    }
  })
  .get('/', async function (req, res) {
    const songs = await queryAllSongs()
    res.render('pages/index', songs)
  })
  .get('/about', function (req, res) {
    const ejsData = {}
    res.render('pages/about', ejsData)
  })
  .get('/profile', function (req, res) {
    const ejsData = {}
    res.render('pages/profile', ejsData)
  })
  .post('/addSong', async function (req, res) {
    res.set({ 'Content-Type': 'application/json' })

    if (req.body.songTitle !== '' && req.body.songArtist !== '' && req.body.songAlbum !== '' && req.body.songLength !== '') {
      const client = await pool.connect()
      const song = await numOfSongs()
      numSongs = parseInt(song)
      const insertSql = `INSERT INTO tune_chart (chart_id, number, name, artist, album, length) VALUES
      (${1}, ${numSongs + 1},$1::TEXT, $2::TEXT, $3::TEXT, $4::INTEGER)`
      await client.query(insertSql, [req.body.songTitle, req.body.songArtist, req.body.songAlbum, req.body.songLength])
      res.json({ ok: true })
      client.release()
    } else {
      res.status(400).json({ ok: false })
    }
  })
  .post('/removeSong', async function (req, res) {
    res.set({ 'Content-Type': 'application/json' })

    if (req.body.removeSong !== '') {
      const client = await pool.connect()

      try {
        const song = await findSongNum(req.body.removeSong)
        numSong = parseInt(song)
        const removeSql = `DELETE FROM tune_chart WHERE number = ${numSong}`
        await client.query(removeSql)
        res.json({ ok: true })
        client.release()
      } catch (error) {
        res.status(400).json({ ok: false })
      }
    } else {
      res.status(400).json({ ok: false })
    }
  })
  .get('/login', function (req, res) {
    const state = generateRandomString(16)
    res.cookie(stateKey, state)
    const scope = 'user-read-private user-read-email'
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        state
      }))
  })
  .get('/callback', function (req, res) {
    const code = req.query.code || null

    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      }
    })
      .then(response => {
        if (response.status === 200) {
          const access_token = response.data.access_token
          const refresh_token = response.data.refresh_token

          res.redirect('/profile#' + querystring.stringify({ access_token, refresh_token }))
        } else {
          res.send(response)
        }
      })
      .catch(error => {
        res.send(error)
      })
  })
  .get('/refresh_token', function (req, res) {
    const { refresh_token } = req.query

    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      }
    })
      .then(response => {
        res.send(response.data)
      })
      .catch(error => {
        res.send(error)
      })
  })

  .listen(PORT, () => console.log(`Listening on ${PORT}`))
