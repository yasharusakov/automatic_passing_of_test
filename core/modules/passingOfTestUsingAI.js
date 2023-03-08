import {Configuration, OpenAIApi} from 'openai'
import {By} from 'selenium-webdriver'
import {getQuestionAndAnswers} from "./getQuestionAndAnswers.js"
import {checkMultiQuiz, errorPrint} from "../index.js"
import chalk from "chalk"
import dotenv from 'dotenv'
dotenv.config()

const config = new Configuration({
    apiKey: process.env.API_KEY
})

const openai = new OpenAIApi(config)

export const chatGPT = async (prompt) => {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 1
    })

    return response.data.choices[0].text
}

export async function passingOfTestUsingAI(driver, currentQuestion) {
    const [question, answers, elements] = await getQuestionAndAnswers(driver, false)
    console.log(chalk.bgMagenta.white(`${currentQuestion}. ${question}`))

    const formattedAnswers = JSON.stringify(answers, null, 3)
    console.log(chalk.blue(formattedAnswers))

    const isMultiQuiz = await checkMultiQuiz(driver)

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

    console.log(chalk.white('Right answers:'), chalk.yellow(rightAnswers))

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
}