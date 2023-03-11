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

let options = new Options();
let driver = await new Builder().forBrowser('firefox').build()

// Нужно что бы он создавал рандомные имена
const names = ["abama", "jfkas;ld", "sjdhjklhskjd", "dhaj", "dfjalsjk", "jahkjk"]

const sokets = [9050, 9052, 9053, 9054]
const randomSock = sokets[Math.floor(Math.random() * sokets.length)]

options.setPreference('network.proxy.type', 1) 
options.setPreference('network.proxy.socks', '127.0.0.1')
options.setPreference('network.proxy.socks_port', randomSock)
options.setPreference('network.proxy.socks_remote_dns', true)
options.setPreference('network.proxy.socks_version', 5)

options.setPreference('general.useragent.override', createRandomUserAgent())

let code

await driver.get("https://naurok.com.ua/test/join")

async function main() {
    try {
        // Оно не всегда генерирует 7-ми значное число. Нужно исправить.
        code = (Math.random() * 10**7).toFixed(0)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.id('joinform-name')).sendKeys(names[Math.floor(Math.random() * names.length)], Key.ENTER)
        await driver.findElement(By.css('btn btn-orange btn-lg btn-block join-button-test')).click()
        console.log(code)
    } catch {
    } finally {
        await driver.findElement(By.id('joinform-gamecode')).clear()
        await driver.findElement(By.id('joinform-name')).clear()
    }
}

// Нужно ставить минимум 2 скунду, а то оно не работает.
setInterval(main, 2000)
