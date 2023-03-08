import {Builder, Browser, By, Key, until} from 'selenium-webdriver'
import {Options} from 'selenium-webdriver/firefox.js'
import {passingOfTestUsingAI} from "./modules/passingOfTestUsingAI.js"
import {passingOfTestUsingSource} from "./modules/passingOfTestUsingSource.js"
import randomUserAgent from "random-useragent"
import promptSync from 'prompt-sync'
import chalk from 'chalk'

export const errorPrint = (err) => {
    console.error(chalk.red(err))
}

const prompt = promptSync()
const username = prompt(chalk.magenta.bold('Enter username: '))
const code = prompt(chalk.magenta.bold('Enter code: '))

console.log(`
${chalk.white.bold('Methods to pass the test:')}
${chalk.yellow('1.')} ${chalk.blue('Using ChatGPT - Artificial Intelligence, you trust only AI')}
${chalk.yellow('2.')} ${chalk.blue('Source answers')}
`)

const method = prompt(chalk.magenta.bold('Enter number of method to pass the test: '))
const urlOfAnswers = method.includes(2) ? prompt(chalk.magenta.bold('Enter url of answers: ')) : 1

const urlOfRegistration = 'https://naurok.com.ua/test/join'

export const checkMultiQuiz = async (driver) => {
    let isMultiQuiz

    try {
        isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
    } catch (err) {
        isMultiQuiz = false
    }

    return isMultiQuiz
}

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
        let sourceData

        if (method.includes(2)) {
            await driver.get(urlOfAnswers)

            const sourceElements = await driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

            sourceData = await Promise.allSettled(sourceElements.map(async (item, i) => {
                const question = await item.findElement(By.css('.homework-stat-question-line p')).getText()
                const answers = await item.findElements(By.css('.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct p'))
                    .then(async answers => {
                        return await Promise.allSettled(answers.map(async answer => {
                            return await answer.getText()
                                .then(data => data.trim())
                        }))
                    })

                return [question.trim(), answers.map(item => item.value)]
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
            if (method.includes(2)) {
                await passingOfTestUsingSource(driver, sourceData)
            } else {
                await passingOfTestUsingAI(driver, currentQuestion)
            }
        }

        await passingOfTest()

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