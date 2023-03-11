"use strict"

import {Builder, By, until, Key, Browser} from 'selenium-webdriver'
import {Options} from "selenium-webdriver/firefox.js"
import {getRandom as createRandomUserAgent} from 'random-useragent'
import promptSync from 'prompt-sync'
import dotenv from 'dotenv'
dotenv.config()

import {errorPrint, PassingOfTest} from "./module.js"

// Нужно checkMultiQuiz, getQuestionAndAnswers, passingOfTestUsingAI, запихнуть в класс с названием PassingOfTest. И расложожить его в файле module.js

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

console.log(`
    Methods:
    1) Using ChatGPT - Artificial Intelligence, you trust only AI
    2) Source answers
`)

// Входная точка программы
const main = async () => {
    const usingSourceAnswers = '2'

    const method = prompt('Enter number of method: ')
    const urlOfAnswers = method === usingSourceAnswers && prompt('Enter url of answers: ')

    const options = new Options()

    // Connection via Tor
    if (process.env?.TOR === 'enable') {
        const sokets = [9050, 9052, 9053, 9054]
        const randomSock = sokets[Math.floor(Math.random() * sokets.length)]
        options.setPreference('network.proxy.type', 1) // Я не знаю что за proxy type.
        options.setPreference('network.proxy.socks', '127.0.0.1')
        options.setPreference('network.proxy.socks_port', randomSock)
        options.setPreference('network.proxy.socks_remote_dns', true)
        options.setPreference('network.proxy.socks_version', 5)
    }

    options.setPreference('general.useragent.override', createRandomUserAgent())

    const driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .withCapabilities(options)
        .build()

    try {
        let sourceData
        if (method === usingSourceAnswers) {
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

        const urlOfRegistration = 'https://naurok.com.ua/test/join'
        const classOfPassingOfTest = new PassingOfTest(driver)

        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        const passingOfTest = async () => {
            if (method === '2') {
                return await passingOfTestUsingSource(driver, sourceData)
                return await classOfPassingOfTest().usingSource()
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