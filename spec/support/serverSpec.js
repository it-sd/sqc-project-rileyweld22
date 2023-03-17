const { request } = require('express')
const { queryAllSongs, numOfSongs, findSongNum, query } =
  require('../../server.js')

const { generateRandomString } =
  require('../../server.js')

describe('song server', function () {
  const baseUrl = 'http://localhost:5163'
  const shouldBeAbove200 = async function (route) {
    it('should be above 200', async function () {
      const url = new URL(route, baseUrl)
      const res = await fetch(url)
      expect(res.status).toBeGreaterThanOrEqual(200)
    }, 10000)
  }
  const shouldBeLessThan399 = async function (route) {
    it('should be below 399', async function () {
      const url = new URL(route, baseUrl)
      const res = await fetch(url)
      expect(res.status).toBeLessThanOrEqual(399)
    }, 10000)
  }
  describe("GET '/health'", function () {
    shouldBeAbove200('/health')
  })
  describe("GET '/'", function () {
    shouldBeAbove200('/')
  })
  describe("GET '/health'", function () {
    shouldBeLessThan399('/health')
  })
  describe("GET '/'", function () {
    shouldBeLessThan399('/')
  })

  describe('query', function () {
    it('should query sql information', async function () {
      const sql = 'SELECT COUNT(chart_id) FROM tune_chart;'
      const results = await query(sql)
      expect(results).toBeDefined()
      expect(results[0].count).toEqual('2')
    })
  })

  describe('queryAllSongs', function () {
    it('should return more than 2 songs', async function () {
      const results = await queryAllSongs()
      expect(results).toBeDefined()
      expect(results.songs).toBeDefined()
      expect(results.songs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('querySong', function () {
    beforeEach(async function () {
      this.results = await queryAllSongs(1)
    })

    const shouldHave = function (source, property) {
      expect(source).toBeDefined()
      expect(source + '.' + property).toBeDefined()
    }

    it('should return a number', function () {
      shouldHave(this.results, 'number')
    })
    it('should return a name', function () {
      shouldHave(this.results, 'name')
    })
    it('should return a artist', function () {
      shouldHave(this.results, 'artist')
    })
    it('should return a album', function () {
      shouldHave(this.results, 'album')
    })
    it('should return a length', function () {
      shouldHave(this.results, 'length')
    })
  })

  describe('generateRandomString', function () {
    it('should return a random string', async function () {
      const resultsOne = await generateRandomString(10)
      const resultsTwo = await generateRandomString(0)
      expect(resultsOne.length).toBeGreaterThan(5)
      expect(resultsTwo.length).toBeLessThan(5)
    })
  })

  describe('numOfSongs', function () {
    it('should return a query from the database', async function () {
      const results = await numOfSongs()
      expect(results.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('findSongNum', function () {
    it('should return the index of the songs Woods', async function () {
      const results = await findSongNum('Woods')
      expect(results).toEqual(1)
    })
  })
})
