const { Builder, By } = require('selenium-webdriver')

describe('client', function () {

  describe('profile', function () {
    const baseUrl = 'http://localhost:5163/profile'
    let driver

    beforeEach(async function () {
      driver = await new Builder().forBrowser('firefox').build()
      await driver.get(baseUrl)
    })

    afterEach(async function () {
      await driver.quit()
    })

    it('should have a button', async function () {
      const details = await driver.findElement(By.id('mainButton'))
      await details.click()

      expect(details.click()).toBeDefined()
    })

  })
})
