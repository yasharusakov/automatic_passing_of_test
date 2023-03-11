/* 
    Что это?
    Что бы вручную не искать тесты на naurok я сделал этот js скипт.
    К основной программе(automatic_passing_of_test) она не относиться.
    Это независимя и изолированая программа от всего остального проекта.
    Что она делает? Она ищет актуальные коды от тестов.
*/

import {Builder, By, Key} from 'selenium-webdriver'
import {Options} from 'selenium-webdriver/firefox.js'
import {getRandom as createRandomUserAgent} from 'random-useragent'

let options = new Options()

// Нужно что бы он создавал рандомные имена
const names = ["abama", "jfkas;ld", "sjdhjklhskjd", "dhaj", "dfjalsjk", "jahkjk"]

const sokets = [9050, 9052, 9053, 9054]
const randomValue = (arr, max) => Math.floor(Math.random() * (max ? max : arr.length))
const randomSock = sokets[randomValue(sokets)]

options.setPreference('network.proxy.type', 1)
options.setPreference('network.proxy.socks', '127.0.0.1')
options.setPreference('network.proxy.socks_port', randomSock)
options.setPreference('network.proxy.socks_remote_dns', true)
options.setPreference('network.proxy.socks_version', 5)

options.setPreference('general.useragent.override', createRandomUserAgent())

let code = ''

async function main() {
    const driver = await new Builder()
        .forBrowser('firefox')
        .build()

    await driver.get("https://naurok.com.ua/test/join")

    const test = async () => {
        try {
            // Генерирует 7 значное число
            while (code.length < 7) {
                code += randomValue(null, 9)
            }

            const randomName = names[randomValue(names)]

            await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
            await driver.findElement(By.id('joinform-name')).sendKeys(randomName, Key.ENTER)
            // Когда используешь css, обезательно перед названием класса или айди пишишь . и #
            await driver.findElement(By.css('.btn .btn-orange .btn-lg .btn-block .join-button-test')).click()
        } catch (err) {
        } finally {
            await driver.findElement(By.id('joinform-gamecode')).clear()
            await driver.findElement(By.id('joinform-name')).clear()
            console.log(code)
            code = ''
        }
    }

    setInterval(test, 2000)
}

main()