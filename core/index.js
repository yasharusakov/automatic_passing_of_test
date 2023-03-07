import {Builder, Browser, By, Key, until} from 'selenium-webdriver'
import {Options} from 'selenium-webdriver/firefox.js'
import randomUserAgent from "random-useragent"
import promptSync from 'prompt-sync'
import {chatGPT} from "./chatgpt.js"
import chalk from 'chalk'
import dotenv from 'dotenv'
dotenv.config()

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

const errorPrint = (err) => {
    console.error(chalk.red(err))
}

const urlOfRegistration = 'https://naurok.com.ua/test/join'

const start = async () => {
    const socks = [9050, 9052, 9053, 9054]
    const randomSock = socks[Math.floor(Math.random() * socks.length)]

    let options = new Options()

    // Connection via Tor
    if (process.env.TOR && process.env.TOR.includes('enable')) {
        options.setPreference('network.proxy.type', 1)
        options.setPreference('network.proxy.socks', '127.0.0.1')
        options.setPreference('network.proxy.socks_port', randomSock)
        options.setPreference('network.proxy.socks_remote_dns', true)
        options.setPreference('network.proxy.socks_version', 5)
    }

    // Random User-Agent
    options.setPreference('general.useragent.override', randomUserAgent.getRandom())

    const driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .withCapabilities(options)
        .build()

    try {
        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        await passingOfTest()

        async function passingOfTest() {
            // Get question and answers
            const question = await driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText()
            const elements = await driver.wait(until.elementsLocated(By.className('question-option-inner-content')))
            const answers = []

            await Promise.all(elements.map(async (element, i) => {
                const paragraphs = await element.findElements(By.css('p'))

                let answer = ''

                await Promise.all(paragraphs.map(async paragraph => {
                    await paragraph.getText()
                        .then(value => {
                            answer += `${value} `
                        })
                }))
                answers.push(`${i + 1}) ${answer} ,`)
            }))
                .catch(errorPrint)

            // Check if question has more than one answer to choose
            let isMultiQuiz

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            } catch (err) {
                isMultiQuiz = false
            }

            // Templates for ChatGPT
            const templateOne = `Обери одну правильну відповіть цифрою на це запитання "${question}". Варіанти відповідей на запитання: ${answers}`
            const templateMany = `Обери тільки правильні відповіді цифрами на це запитання "${question}". Варіанти відповідей на запитання: ${answers}`

            // Send request to ChatGPT and get response
            console.log(chalk.blue('Waiting for response from ChatGPT...'))
            const data = await chatGPT(isMultiQuiz ? templateMany : templateOne)
                .catch(errorPrint)

            let rightAnswers = data.split(',')
                .map(item => {
                    const number = Number(item.replace(/\D/g, '')[0])

                    if (number && number <= answers.length) {
                        return number
                    }
                })
                .filter(item => item)

            // If right answers are exist choose random answer
            if (!rightAnswers.length) {
                const randomAnswer = Math.floor(Math.random() * answers.length)
                rightAnswers = [randomAnswer ? randomAnswer : 1]
            }

            // Actions on webpage to pass the test
            await Promise.all(rightAnswers.map(async rightAnswer => {
                await elements[Number(rightAnswer) - 1].click()
            }))
                .then(async () => {
                    if (isMultiQuiz) {
                        await driver.findElement(By.className('test-multiquiz-save-button')).click()
                    }
                })
                .catch(errorPrint)

            console.log(`${chalk.white(currentQuestion)}, Right answers: [${chalk.blue(rightAnswers)}]`)
        }

        // Listen current question and compare
        const listenCurrentQuestion = async () => {
            await driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === currentQuestion) return

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

start()