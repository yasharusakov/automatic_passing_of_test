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
            const [{value: question}, {value: elements}] = await Promise.allSettled([
                await driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText(),
                await driver.wait(until.elementsLocated(By.className('question-option-inner-content')))
            ])

            console.log(chalk.bgGreen(chalk.white(`ㅤ${currentQuestion}. ${question}ㅤ`)))

            const answers = await Promise.allSettled(elements.map(async (element, i) => {
                const paragraphs = await element.findElements(By.css('p'))
                    .catch(errorPrint)

                const answer = await Promise.allSettled(paragraphs.map(async paragraph => {
                    return await paragraph.getText()
                }))
                    .then(paragraphs => paragraphs.map(parapraph => parapraph.value).join(' '))
                    .catch(errorPrint)

                return `(${i + 1}) : ${answer}, `
            }))
                .then(answers => answers.map(answer => answer.value))
                .catch(errorPrint)

            const formattedAnswers = JSON.stringify(answers, null, 3)
            console.log(chalk.blue(formattedAnswers))

            // Check if question has more than one answer to choose
            let isMultiQuiz

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            } catch (err) {
                isMultiQuiz = false
            }

            // Templates for ChatGPT
            const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
            const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

            // Send request to ChatGPT and get response
            console.log(chalk.magenta('Waiting for response from ChatGPT...'))
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
                console.log(chalk.yellow('Был выбран рандомный ответ'))
                const randomAnswer = Math.floor(Math.random() * answers.length)
                rightAnswers = [randomAnswer ? randomAnswer : 1]
            }

            // Actions on webpage to pass the test
            await Promise.allSettled(rightAnswers.map(async rightAnswer => {
                await elements[Number(rightAnswer) - 1].click()
            }))
                .then(async () => {
                    if (isMultiQuiz) {
                        await driver.findElement(By.className('test-multiquiz-save-button')).click()
                    }
                })
                .catch(errorPrint)

            console.log(chalk.white('Right answers:'), chalk.yellow(rightAnswers))
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