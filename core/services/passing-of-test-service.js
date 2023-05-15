/* Copyright 2023 yasharusakov and Transparency010101
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

import {By, until} from 'selenium-webdriver'

import PreparingTest from './preparing-test-service.js'
import ChatGPTService from './chatgpt-service.js'
import {errorPrint, random} from '../index.js'

export default class PassingOfTest extends PreparingTest {
    #currentQuestion

    constructor() {
        super()
        this.#currentQuestion = 1
    }

    #checkMultiQuiz = async () => {
        return await this.driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            .then(() => true)
            .catch(() => false)
    }

    #getQuestionAndAnswers = async (condition) => {
        const isDisplayedImage = await this.driver.findElement(By.css('.question-option-image')).isDisplayed()
            .then(() => true)
            .catch(() => false)

        const [{value: question}, {value: elements}] = await Promise.allSettled([
            this.driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText(),
            this.driver.wait(until.elementsLocated(By.css(isDisplayedImage ? '.question-option-image' : '.question-option-inner-content')))
        ])

        if (isDisplayedImage && !condition) {
            return [question.trim(), null, elements, isDisplayedImage]
        }

        const answers = await Promise.allSettled(elements.map(async (element, index) => {

            if (isDisplayedImage) {
                const src = await element.getAttribute('style')
                return src.slice(src.indexOf('https'), src.lastIndexOf('"'))
            }

            const paragraphs = await element.findElements(By.css('p'))

            const answer = await Promise.allSettled(paragraphs.map(async paragraph => await paragraph.getText()))
                .then(data => data.map(item => item.value).join(' ').trim())

            return condition ? answer : `(${index + 1}) : ${answer}, `
        }))
            .then(answers => answers.map(answer => answer.value))

        return [question.trim(), answers, elements]
    }

    #usingAI = async () => {
        const [question, answers, elements, isDisplayedImage] = await this.#getQuestionAndAnswers(false)
        const formattedAnswers = JSON.stringify(answers, null, 3)
        const isMultiQuiz = await this.#checkMultiQuiz()

        const randomForAI = async () => {
            const count = random(1, elements.length)
            const randomAnswers = []

            if (!isMultiQuiz) return await elements[random(0, elements.length - 1)].click()

            while (randomAnswers.length !== count) {
                const randomAnswer = random(0, elements.length - 1)
                if (randomAnswers.includes(randomAnswer)) return
                randomAnswers.push(randomAnswer)
            }

            return await Promise.allSettled(randomAnswers.map(async answer => {
                await elements[answer].click()
            }))
                .then(async () => {
                    if (isMultiQuiz) {
                        await this.driver.findElement(By.className('test-multiquiz-save-button')).click()
                    }
                })
        }

        if (isDisplayedImage) return await randomForAI()

        // Templates for ChatGPT
        const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
        const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

        // Send request to ChatGPT and get response
        const data = await ChatGPTService.query(isMultiQuiz ? templateMany : templateOne)
            .catch(errorPrint)

        if (!data) return await randomForAI()

        let rightAnswers = data.split(',')
            .map(item => {
                const number = Number(item.replace(/\D/g, '')[0])
                if (number && number <= answers.length) return number
            })
            .filter(item => item)

        // Actions on webpage to pass the test
        await Promise.allSettled(rightAnswers.map(async rightAnswer => await elements[Number(rightAnswer) - 1].click()))
            .then(async () => {
                if (isMultiQuiz) {
                    await this.driver.findElement(By.className('test-multiquiz-save-button')).click()
                }
            })
            .catch(errorPrint)
    }

    #usingSource = async () => {
        const [question, answers, elements] = await this.#getQuestionAndAnswers(true)
        const isMultiQuiz = await this.#checkMultiQuiz()

        await Promise.allSettled(answers.map(async (item, i) => {
            if (this.sourceData[question].includes(item)) {
                await elements[i].click()
            }
        }))
            .then(async () => {
                if (isMultiQuiz) {
                    await this.driver.findElement(By.className('test-multiquiz-save-button')).click()
                }
            })
            .catch(errorPrint)
    }

    chooseMethodOfPassing = async () => {
        if (this.method === '2') {
            await this.#usingSource()
        } else {
            await this.#usingAI()
        }
    }

    listenCurrentQuestion = async () => {
        const launch = async () => {
            await this.driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === this.#currentQuestion) return

                    this.#currentQuestion = number
                    await this.chooseMethodOfPassing()
                })
        }

        setInterval(launch, 2500)
    }
}