import {By, until} from 'selenium-webdriver'
import {PreparingTest} from './preparing-test-service.js'
import {errorPrint} from '../index.js'
import {ChatGPTService} from './chatgpt-service.js'

export class PassingOfTest extends PreparingTest {
    constructor() {
        super()
        this.chatgpt = new ChatGPTService()
        this.currentQuestion = 1
    }

    checkMultiQuiz = async () => {
        return await this.driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            .then(() => true)
            .catch(() => false)
    }

    getQuestionAndAnswers = async (condition) => {
        const [{value: question}, {value: elements}] = await Promise.allSettled([
            this.driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText(),
            this.driver.wait(until.elementsLocated(By.className('question-option-inner-content')))
        ])

        const answers = await Promise.allSettled(elements.map(async (element, index) => {
            const paragraphs = await element.findElements(By.css('p'))
                .catch(errorPrint)

            const answer = await Promise.allSettled(paragraphs.map(async paragraph => await paragraph.getText()))
                .then(data => data.map(item => item.value).join(' ').trim())
                .catch(errorPrint)

            return !condition ? `(${index + 1}) : ${answer}, ` : answer
        }))
            .then(answers => answers.map(answer => answer.value))
            .catch(errorPrint)

        return [question.trim(), answers, elements]
    }

    usingAI = async () => {
        const [question, answers, elements] = await this.getQuestionAndAnswers(false)
        const formattedAnswers = JSON.stringify(answers, null, 3)
        const isMultiQuiz = await this.checkMultiQuiz()

        // Templates for ChatGPT
        const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
        const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

        // Send request to ChatGPT and get response
        const data = await this.chatgpt.query(isMultiQuiz ? templateMany : templateOne)
            .catch(errorPrint)

        let rightAnswers = data.split(',')
            .map(item => {
                const number = Number(item.replace(/\D/g, '')[0])
                if (number && number <= answers.length) {
                    return number
                }
            })
            .filter(item => item)

        // Actions on webpage to pass the test
        await Promise.allSettled(rightAnswers.map(async rightAnswer => {
            await elements[Number(rightAnswer) - 1].click()
        }))
            .then(async () => {
                if (isMultiQuiz) {
                    await this.driver.findElement(By.className('test-multiquiz-save-button')).click()
                }
            })
            .catch(errorPrint)
    }

    usingSource = async () => {
        const [question, answers, elements] = await this.getQuestionAndAnswers(true)
        const isMultiQuiz = await this.checkMultiQuiz()

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
            await this.usingSource()
        } else {
            await this.usingAI()
        }
    }

    listenCurrentQuestion = async () => {
        const launch = async () => {
            await this.driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === this.currentQuestion) return

                    this.currentQuestion = number
                    await this.chooseMethodOfPassing()
                })
        }

        setInterval(launch, 2500)
    }
}