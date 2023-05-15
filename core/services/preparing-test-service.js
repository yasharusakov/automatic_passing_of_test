/* Copyright 2023 yasharusakov and Transparency010101
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

import {Browser, Builder, By, until, Key} from 'selenium-webdriver'
import {getRandom as getRandomUserAgent, getRandomData} from 'random-useragent'
import {Options as FirefoxOptions} from 'selenium-webdriver/firefox.js'
import promptSync from 'prompt-sync'
import {errorPrint} from '../index.js'

export default class PreparingTest {
    #userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0'
    #prompt

    constructor() {
        this.#prompt = promptSync()
        this.username = this.#prompt('Enter username: ')
        this.code = this.#prompt('Enter code: ')
        console.log(`
        Methods:
        1) Using ChatGPT - Artificial Intelligence, you trust only AI
        2) Source answers
        `)
        this.method = this.#prompt('Enter number of method: ')
        this.urlOfAnswers = this.method === '2' && this.#prompt('Enter url of answers: ')
        this.driver = this.#createDriver()
        this.urlOfRegistration = 'https://naurok.com.ua/test/join'
        this.sourceData = null
    }

    #createDriver = () => {
        const socks = [9050, 9052, 9053, 9054]
        const randomSock = socks[Math.floor(Math.random() * socks.length)]

        const options = new FirefoxOptions()

        // Connection via Tor
        if (process.env?.TOR === 'enable') {
            options.setPreference('network.proxy.type', 1)
            options.setPreference('network.proxy.socks', '127.0.0.1')
            options.setPreference('network.proxy.socks_port', randomSock)
            options.setPreference('network.proxy.socks_remote_dns', true)
            options.setPreference('network.proxy.socks_version', 5)
        }

        // Random User-Agent(пока что не рандомный, временно)
        options.setPreference('general.useragent.override', this.#userAgent)

        const driver = new Builder()
            .forBrowser(Browser.FIREFOX)
            .withCapabilities(options)
            .build()

        return driver
    }

    getSourceAnswers = async () => {
        if (this.method !== '2') return

        await this.driver.get(this.urlOfAnswers)

        const sourceElements = await this.driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

        this.sourceData = await Promise.allSettled(sourceElements.map(async item => {
            const question = await item.findElement(By.css('.homework-stat-question-line p')).getText()
                .then(data => data.trim())

            let isDisplayedImage

            try {
                isDisplayedImage = await item.findElement(
                    By.css('.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct img')
                ).isDisplayed()
            } catch (e) {
                isDisplayedImage = false
            }

            const answers = await item.findElements(By.css(`.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct ${isDisplayedImage ? 'img' : 'p'}`))
                .then(async data => {
                    return await Promise.allSettled(data.map(async item => {
                        if (isDisplayedImage) return await item.getAttribute('src')

                        return await item.getText()
                            .then(text => text.trim())
                    }))
                        .then(data => data.map(item => item.value))
                })
                .catch(errorPrint)

            return [question, answers]
        }))
            .then(data => {
                const object = {}

                data.forEach(item => {
                    const el = item.value
                    object[el[0]] = el[1]
                })

                return object
            })
    }

    joinTest = async () => {
        await this.driver.get(this.urlOfRegistration)
        await this.driver.findElement(By.id('joinform-name')).sendKeys(this.username, Key.ENTER)
        await this.driver.findElement(By.id('joinform-gamecode')).sendKeys(this.code, Key.ENTER)
        await this.driver.findElement(By.className('join-button-test')).click()
    }

    driverQuit = async () => {
        setTimeout(async () => {
            await this.driver.quit()
        }, 1000000000)
    }
}