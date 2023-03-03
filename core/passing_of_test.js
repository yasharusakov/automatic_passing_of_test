import dotenv from 'dotenv'
dotenv.config({path: '../.env'})
import {Builder, Browser, By, Key, until} from 'selenium-webdriver'
import {runPrompt} from "./chatgpt.js"
import promptSync from 'prompt-sync'
import chalk from "chalk"

const URL = 'https://naurok.com.ua/test/join'

const prompt = promptSync()
const USERNAME = prompt('Enter username: ')
const CODE = prompt('Enter code: ')

async function passingOfTest() {
    let driver = await new Builder().forBrowser(Browser.FIREFOX).build()
    try {
        // JOIN TEST
        await driver.get(URL)
        await driver.findElement(By.id('joinform-name')).sendKeys(USERNAME, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(CODE, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        await fn()

        // PASSING OF TEST
        async function fn() {
            // GET QUESTION AND ANSWERS
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
                answers.push(`${i + 1}) ${answer},,, `)
            }))

            // CHECK IF QUESTION HAS MORE THAN ONE ANSWER TO CHOOSE
            let isMultiQuiz

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            } catch (err) {
                isMultiQuiz = false
            }

            // TEMPLATES FOR ChatGPT
            const templateOne = `Вкажи одну правильну відповіть тільки однією цифрою на це запитання "${question}". Відповіді на запитання: ${answers}`
            const templateMany = `Вкажи правильні відповіді тільки цифрами через кому на це запитання "${question}". Відповіді на запитання: ${answers}`

            // SEND REQUEST TO ChatGPT AND GET RESPONSE
            const data = await runPrompt(isMultiQuiz ? templateMany : templateOne)
            const rightAnswers = data.split(',,,').map(item => item.replace(/\D/g, '')[0])

            // SOME ACTIONS ON WEBPAGE
            try {
                await Promise.all(rightAnswers.map(async rightAnswer => {
                    await elements[Number(rightAnswer) - 1].click()
                }))
                    .then(async () => {
                        if (isMultiQuiz) {
                            try {
                                await driver.findElement(By.className('test-multiquiz-save-button')).click()
                            } catch (err) {
                                console.log(chalk. chalk.bgRed(chalk.white(err.message)))
                            }
                        }
                    })
            } catch (err) {
                console.log(chalk.bgRed(chalk.white(err.message)))
            }

            console.log(`QUESTION IS ${chalk.white(currentQuestion)}, RIGHT ANSWERS: ${chalk.blue(rightAnswers)}`)
        }

        // CHECK CURRENT QUESTION AND COMPARE
        // IF TRUE CALL FUNCTION AGAIN
        await setInterval(async () => {
            await driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === currentQuestion) {
                        return
                    }

                    currentQuestion = number
                    await fn()
                })
        }, 2000)

    } catch (err) {
        console.log(chalk.bgRed(chalk.white(err.message)))
    } finally {
        setTimeout(async () => {
            await driver.quit()
        }, 1000000)
    }
}

export {passingOfTest}