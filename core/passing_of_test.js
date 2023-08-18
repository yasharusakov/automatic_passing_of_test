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
import PreparingOfTest from './preparing_of_test.js'

export default class PassingOfTest extends PreparingOfTest {
    #currentQuestion

    constructor() {
        super()
        this.#currentQuestion = 1
    }

    #getQuestionAndAnswers = async () => {
        try {
            const isDisplayedImage = await this.isDisplayedByCss(this.driver, '.question-option-image')

            const questionElement = await this.driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText()
            const elements = await this.driver.wait(until.elementsLocated(By.css(isDisplayedImage ? '.question-option-image' : '.question-option-inner-content')))

            const answers = await Promise.all(elements.map(async (element) => {
                if (isDisplayedImage) {
                    const src = await element.getAttribute('style')
                    return src.slice(src.indexOf('https'), src.lastIndexOf('"'))
                }

                const paragraphs = await element.findElements(By.css('p'))
                const answerText = await Promise.all(paragraphs.map(async paragraph => await paragraph.getText()))
                return answerText.join(' ').trim()
            }))

            return [questionElement.trim(), answers, elements]
        } catch (error) {
            console.error(`Error in getQuestionAndAnswers: ${error}`)
        }
    }

    usingSource = async () => {
        try {
            const [question, answers, elements] = await this.#getQuestionAndAnswers()
            const isMultiQuiz = await this.isDisplayedByCss(this.driver, '.test-multiquiz-save-line span')

            await Promise.all(answers.map(async (item, i) => {
                if (this.sourceData[question].includes(item)) {
                    await elements[i].click()
                }
            })).then(async () => {
                if (isMultiQuiz) {
                    await this.driver.findElement(By.css('.test-multiquiz-save-button')).click()
                }
            })
        } catch (error) {
            console.error(`Error in usingSource: ${error}`)
        }
    }

    listenCurrentQuestion = () => {
        const launch = async () => {
            try {
                const currentActiveQuestionElement = await this.driver.findElement(By.css('.currentActiveQuestion'))
                const data = await currentActiveQuestionElement.getText()
                const number = Number(data)

                if (number !== this.#currentQuestion) {
                    this.#currentQuestion = number
                    await this.usingSource()
                }
            } catch (error) {
                console.error(`Error in listenCurrentQuestion: ${error}`)
            }
        }

        setInterval(launch, 2500)
    }
}