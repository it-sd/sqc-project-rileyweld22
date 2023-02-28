require('dotenv').config()
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163

const { Pool } = require('pg')

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
  const sql = `SELECT chart_id, number, name, artist, album, length FROM tune_chart ORDER BY number;`
  const results = await query(sql)
  //console.log(results)
  return { songs: results }
}

module.exports = {
  query,
  queryAllSongs
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', async function (req, res) {
    const songs = await queryAllSongs()
    if (songs != null){
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
  .post('/register', async function (req, res) {

    res.set({'Content-Type': 'application/json' })

    if(req.body.username !== '' && req.body.password !== ''){
      const client = await pool.connect()
      const insertSql = `INSERT INTO profile (username, password) VALUES
      ($1::TEXT, $2::TEXT)`
      await client.query(insertSql, [req.body.username, req.body.password])
      res.json({ ok: true })
      client.release()
    } else {
      res.status(400).json({ ok: false })
    }


  })

  .listen(PORT, () => console.log(`Listening on ${PORT}`))