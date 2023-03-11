import {Configuration, OpenAIApi} from 'openai'
import {By} from 'selenium-webdriver'

/*
    [class] ChatGPT
    [class] PassingOfTest
    [arrow-function] errorPrint
*/ 

export class ChatGPT {
    openai = new OpenAIApi(new Configuration({
        apiKey: process.env.API_KEY
    }))

    constructor(prompt) {
        this.prompt = prompt
    }

    async requestAndResponse() {
        let request = openai.createCompletion({
            model: 'text-davinci-003',
            prompt: this.prompt,
            max_tokens: 2048,
            temperature: 1
        })

        // Response
        return request.data.choices[0].text
    }
}

export class PassingOfTest {
    constructor(driver) {
        this.driver = driver
    }

    async checkMultiQuiz() {
        return await this.driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            .then(() => true)
            .catch(() => false)
    }

    async getQuestionAndAnswers(condition) {
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

    async usingAI() {
        const [question, answers, elements] = await getQuestionAndAnswers(this.driver, false)
        const formattedAnswers = JSON.stringify(answers, null, 3)
        const isMultiQuiz = await checkMultiQuiz(this.driver)

        // Templates for ChatGPT
        const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
        const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

        // Send request to ChatGPT and get response
        const data = new ChatGPT(isMultiQuiz ? templateMany : templateOne).requestAndResponse()

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

    async usingSource() {
        const [question, answers, elements] = await getQuestionAndAnswers(this.driver, true)

        const isMultiQuiz = await this.checkMultiQuiz(this.driver)

        await Promise.allSettled(answers.map(async (item, i) => {
            if (sourceData[question].includes(item)) {
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
}

export const errorPrint = err => console.error(err)