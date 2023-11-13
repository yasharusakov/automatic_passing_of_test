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
import {getRandom as getRandomUserAgent} from 'random-useragent'
import {Options as FirefoxOptions} from 'selenium-webdriver/firefox.js'
import promptSync from 'prompt-sync'

export default class PreparingTest {
    #prompt

    constructor() {
        this.#prompt = promptSync()
        this.username = this.#prompt('Enter username: ')
        this.code = this.#prompt('Enter code: ')
        this.urlOfAnswers = this.#prompt('Enter url of answers: ')
        this.driver = this.#createDriver()
        this.urlOfRegistration = 'https://naurok.com.ua/test/join'
        this.sourceData = null
    }

    debugMode(text, data) {
        if (process.env.MODE === 'debug') {
            console.log(text, data)
        }
    }

    #createDriver() {
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

        // Random User-Agent
        options.setPreference('general.useragent.override', getRandomUserAgent())

        const driver = new Builder()
            .forBrowser(Browser.FIREFOX)
            .withCapabilities(options)
            .build()

        return driver
    }

    async isDisplayedByCss(item, selector) {
        const isDisplayed = await item.findElement(By.css(selector)).isDisplayed()
            .then(() => true)
            .catch(() => false)

        this.debugMode('Is displayed: ', isDisplayed)

        return isDisplayed
    }

    async getSourceAnswers() {
        try {
            await this.driver.get(this.urlOfAnswers)

            const sourceElements = await this.driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

            const sourceData = await Promise.all(sourceElements.map(async item => {
                const question = await item.findElement(By.css('.homework-stat-question-line p')).getText()

                const isDisplayedImage = await this.isDisplayedByCss(item, '.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct img')

                const answers = await item.findElements(By.css(`.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct ${isDisplayedImage ? 'img' : 'p'}`))
                    .then(async data => {
                        return await Promise.all(data.map(async item => {
                            if (isDisplayedImage) return await item.getAttribute('src')
                            return await item.getText().then(text => text.trim())
                        }))
                    })

                return [question.trim(), answers]
            })).then(data => {
                const object = {}
                data.forEach(item => {
                    const [question, answers] = item
                    object[question] = answers
                })
                return object
            })

            this.sourceData = sourceData

            this.debugMode('Right answers: ', sourceData)
        } catch (error) {
            console.error(`Error in getSourceAnswers: ${error}`)
        }
    }

    async joinTest() {
        try {
            await this.driver.get(this.urlOfRegistration)
            await this.driver.findElement(By.id('joinform-name')).sendKeys(this.username, Key.ENTER)
            await this.driver.findElement(By.id('joinform-gamecode')).sendKeys(this.code, Key.ENTER)
            await this.driver.findElement(By.className('join-button-test')).click()
        } catch (error) {
            console.error(`Error in joinTest: ${error}`)
        }
    }

    driverQuit() {
        try {
            setTimeout(async () => {
                await this.driver.quit()
            }, 18000000)
        } catch (error) {
            console.error(`Error in driverQuit: ${error}`)
        }
    }
}