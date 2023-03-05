import {Builder, Browser, By, Key, until} from 'selenium-webdriver'
import {Configuration, OpenAIApi} from 'openai'
import promptSync from 'prompt-sync'
import chalk from "chalk"
import dotenv from 'dotenv'
dotenv.config()

// Cool error print
const errorPrint = err => console.error(chalk.red(err))

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

async function start() {

    let driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .build()

    await driver.get('https://gs.statcounter.com/detect')

    try {
        const urlOfRegistration = 'https://naurok.com.ua/test/join'

        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        await passingOfTest()

        // Passing of test
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
                answers.push(`${i + 1}) ${answer},,, `)
            }))
                .catch(errorPrint)

            // Check if question has more than one answer to choose
            let isMultiQuiz

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            } catch (err) {
                isMultiQuiz = false
                // errorPrint(err)
            }

            // Templates for ChatGPT
            const templateOne = `Вкажи одну правильну відповіть цифрою на це запитання "${question}". Відповіді на запитання: ${answers}`
            const templateMany = `Вкажи декілька правильних відповідей цифрами на це запитання "${question}". Відповіді на запитання: ${answers}`

            // Send request to ChatGPT and get response
            console.log(chalk.blue('Waiting for response from ChatGPT...'))
            const data = await runPrompt(isMultiQuiz ? templateMany : templateOne)
                .catch(errorPrint)

            const rightAnswers = data.split(',,,').map(item => item.replace(/\D/g, '')[0])

            // Some actions on webpage
            await Promise.all(rightAnswers.map(async rightAnswer => {
                try {
                    await elements[Number(rightAnswer) - 1].click()
                } catch (err) {
                    const randomNumber = Math.floor(Math.random() * answers.length)
                    await elements[randomNumber].click()
                    console.log(80)
                    errorPrint(err)
                }
            }))
                .then(async () => {
                    if (isMultiQuiz) {
                        await driver.findElement(By.className('test-multiquiz-save-button')).click()
                    }
                })
                .catch(errorPrint)

            console.log(`${chalk.white([currentQuestion])}, Right answers: ${chalk.blue(rightAnswers)}`)
        }

        // Check current question and compare
        // If true call function again
        setInterval(async () => {
            await driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === currentQuestion) return

                    currentQuestion = number
                    await passingOfTest()
                })
        }, 3000)

    } catch (err) {
        errorPrint(err)
    } finally {
        setTimeout(async () => {
            await driver.quit()
        }, 1000000)
    }
}

const config = new Configuration({
    apiKey: process.env.API_KEY
})

const openai = new OpenAIApi(config)

const runPrompt = async (prompt) => {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 1
    })

    return response.data.choices[0].text
}

start()