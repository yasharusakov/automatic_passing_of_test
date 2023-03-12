import {Builder, By, until, Key, Browser} from 'selenium-webdriver'
import {Options} from "selenium-webdriver/firefox.js"
import {getRandom as createRandomUserAgent} from 'random-useragent'
import promptSync from 'prompt-sync'
import dotenv from 'dotenv'
dotenv.config()

import {passingOfTestUsingAI, passingOfTestUsingSource, errorPrint} from "./module.js"

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

console.log(`
Methods:
1) Using ChatGPT - Artificial Intelligence, you trust only AI
2) Source answers
`)

const method = prompt('Enter number of method: ')
const urlOfAnswers = method === '2' && prompt('Enter url of answers: ')

const urlOfRegistration = 'https://naurok.com.ua/test/join'

// Входная точка программы
const main = async () => {
    const socks = [9050, 9052, 9053, 9054]
    const randomSock = socks[Math.floor(Math.random() * socks.length)]

    const options = new Options()

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

    const driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .withCapabilities(options)
        .build()

    try {
        let sourceData

        if (method === '2') {
            await driver.get(urlOfAnswers)

            const sourceElements = await driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

            sourceData = await Promise.allSettled(sourceElements.map(async item => {
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

        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        const passingOfTest = async () => {
            if (method === '2') {
                return await passingOfTestUsingSource(driver, sourceData)
            }

            await passingOfTestUsingAI(driver, currentQuestion)
        }

        await passingOfTest()

        // Listen current question and compare
        const listenCurrentQuestion = async () => {
            await driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === currentQuestion) {
                        return
                    }

                    currentQuestion = number
                    await passingOfTest()
                })
        }

        setInterval(async () => {
            await listenCurrentQuestion()
        }, 3000)

    } catch (err) {
        errorPrint(err)
    } finally {
        setTimeout(async () => {
            await driver.quit()
        }, 1000000)
    }
}

main()