require('dotenv').config()
const {Builder, Browser, By, Key} = require('selenium-webdriver')

async function passingOfTest() {
  let driver = await new Builder().forBrowser(Browser.FIREFOX).build()
  try {
    // JOIN TEST
    await driver.get(process.env.NAUROK_URL)
    await driver.findElement(By.id('joinform-gamecode')).sendKeys(process.env.NAUROK_GAMECODE, Key.ENTER)
    await driver.findElement(By.id('joinform-name')).sendKeys(process.env.NAUROK_USERNAME, Key.ENTER)
    await driver.gefindElementt(By.className('join-button-test')).click()
  } finally {
    // await driver.quit()
  }
}

module.exports = {passingOfTest}