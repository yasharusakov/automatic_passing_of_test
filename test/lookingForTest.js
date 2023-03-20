import {Builder, By, Key} from 'selenium-webdriver'
import {Options as FirefoxOptions} from 'selenium-webdriver/firefox.js'
import {getRandom as createRandomUserAgent} from 'random-useragent'

let options = new FirefoxOptions()

const names = ["abama", "jfkas;ld", "sjdhjklhskjd", "dhaj", "dfjalsjk", "jahkjk"]

const sokets = [9050, 9052, 9053, 9054]
const randomSock = sokets[Math.floor(Math.random() * sokets.length)]

options.setPreference('network.proxy.type', 1)
options.setPreference('network.proxy.socks', '127.0.0.1')
options.setPreference('network.proxy.socks_port', randomSock)
options.setPreference('network.proxy.socks_remote_dns', true)
options.setPreference('network.proxy.socks_version', 5)

options.setPreference('general.useragent.override', createRandomUserAgent())

async function main() {
    const driver = await new Builder()
        .forBrowser('firefox')
        .build()

    await driver.get("https://naurok.com.ua/test/join")

    const test = async () => {
        try {
            // Генерирует 7 значное число
            const code = Math.floor(1000000 + Math.random() * 9000000)
            const randomName = names[Math.floor(Math.random() * names.length)]

            await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
            await driver.findElement(By.id('joinform-name')).sendKeys(randomName, Key.ENTER)
            await driver.findElement(By.css('.btn .btn-orange .btn-lg .btn-block .join-button-test')).click()
        } catch (err) {
        } finally {
            await driver.findElement(By.id('joinform-gamecode')).clear()
            await driver.findElement(By.id('joinform-name')).clear()
        }
    }

    setInterval(test, 2000)
}

main()