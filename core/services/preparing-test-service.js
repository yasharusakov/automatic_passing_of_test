import {Browser, Builder, By, until, Key} from 'selenium-webdriver'
import {getRandom as createRandomUserAgent} from 'random-useragent'
import {Options as FirefoxOptions} from 'selenium-webdriver/firefox.js'
import promptSync from 'prompt-sync'

import {errorPrint} from '../index.js'

export default class PreparingTest {
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

        // Random User-Agent
        options.setPreference('general.useragent.override', createRandomUserAgent())

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

            const answers = await item.findElements(By.css('.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct p'))
                .then(async answers => {
                    return await Promise.allSettled(answers.map(async answer => {
                        return await answer.getText()
                            .then(data => data.trim())
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