let debug_mod = undefined 

import {Builder, Browser, By, Key, until} from 'selenium-webdriver' 
import promptSync from 'prompt-sync' 
import chalk from "chalk" 
import dotenv from 'dotenv' 
import {Configuration, OpenAIApi} from 'openai' 

dotenv.config()

const prompt = promptSync() 
const USERNAME = prompt('Enter username: ') 
const CODE = prompt('Enter code: ') 

async function start() {
    let driver = await new Builder().forBrowser(Browser.FIREFOX).build() 
    try {
        const urlOfRegistration = 'https://naurok.com.ua/test/join'

        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(USERNAME, Key.ENTER) 
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(CODE, Key.ENTER) 
        await driver.findElement(By.className('join-button-test')).click() 

        let currentQuestion = 1 

        await fn() 

        // Passing of test
        async function fn() {
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

            // Check if question has more than one answer to choose
            let isMultiQuiz 

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed() 
            } catch (err) {
                isMultiQuiz = false 
            }

            // Templates for ChatGPT
            const templateOne = `Вкажи одну правильну відповіть тільки однією цифрою на це запитання "${question}". Відповіді на запитання: ${answers}` 
            const templateMany = `Вкажи правильні відповіді тільки цифрами через кому на це запитання "${question}". Відповіді на запитання: ${answers}` 

            // Send request to ChatGPT and get response
            const data = await runPrompt(isMultiQuiz ? templateMany : templateOne)
                .catch((err) => console.log(debug_mod ? err : err.message)) 
            const rightAnswers = data.split(',,,').map(item => item.replace(/\D/g, '')[0]) 

            // Some actions on webpage
            try {
                await Promise.all(rightAnswers.map(async rightAnswer => {
                    await elements[Number(rightAnswer) - 1].click() 
                }))
                    .then(async () => {
                        if (isMultiQuiz) {
                            try {
                                await driver.findElement(By.className('test-multiquiz-save-button')).click()
                            } catch (err) {
                                console.log(chalk. chalk.bgRed(chalk.white(debug_mod ? err : err.message)))
                            }
                        }
                    }) 
            } catch (err) {
                console.log(chalk.bgRed(chalk.white(debug_mod ? err : err.message))) 
            }

            console.log(`QUESTION IS ${chalk.white(currentQuestion)}, RIGHT ANSWERS: ${chalk.blue(rightAnswers)}`) 
        }

        // Check current question and compare
        // If true call function again
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
        console.log(chalk.bgRed(chalk.white(debug_mod ? err : err.message))) 
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
    }).catch(err => {
        console.log(err)
    }) 

    return response.data.choices[0].text
}

start()