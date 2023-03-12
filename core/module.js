import {Configuration, OpenAIApi} from 'openai'
import {Browser, Builder, By, until, Key} from 'selenium-webdriver'
import {getRandom as createRandomUserAgent} from 'random-useragent'
import {Options} from 'selenium-webdriver/firefox.js'

/*
    [class] ChatGPT
       - [function] askGPT
    [class] PassingOfTest extends ChatGPT
       - [function] createDriver
       - [function] joinTest
       - [function] getSourceAnswers
       - [function] checkMultiQuiz
       - [function] getQuestionAndAnswers
       - [function] passingOfTestUsingAI
       - [function] passingOfTestUsingSource
       - [function] passingOfTest
       - [function] listenCurrentQuestion
       - [function] driverQuit
    [function] errorPrint
*/

export class ChatGPT {
    constructor() {
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.API_KEY
        }))
    }

    async askGPT(prompt) {
        const response = await this.openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 2048,
            temperature: 1
        })

        return response.data.choices[0].text
    }
}

export class PassingOfTest extends ChatGPT {
    constructor(method) {
        super(method)
        this.driver = this.createDriver()
        this.sourceData = null
        this.currentQuestion = 1
        this.method = method
    }

    // Sync
    createDriver = () => {
        const socks = [9050, 9052, 9053, 9054]
        const randomSock = socks[Math.floor(Math.random() * socks.length)]

        const options = new Options()

        // Connection via Tor
        if (process.env?.TOR === 'enable') {
            options.setPreference('network.proxy.type', 1)
            options.setPreference('network.proxy.socks', '127.0.0.1')
            options.setPreference('network.proxy.socks_port', randomSock)
            options.setPreference('network.proxy.socks_remote_dns', true)
            options.setPreference('network.proxy.socks_version', 5)
        }

        // Random User-Agent
        options.setPreference('general.useragent.override', createRandomUserAgent())

        const driver = new Builder()
            .forBrowser(Browser.FIREFOX)
            .withCapabilities(options)
            .build()

        return driver
    }

    joinTest = async (username, code, urlOfRegistration) => {
        await this.driver.get(urlOfRegistration)
        await this.driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await this.driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await this.driver.findElement(By.className('join-button-test')).click()
    }

    getSourceAnswers = async (urlOfAnswers) => {
        await this.driver.get(urlOfAnswers)

        const sourceElements = await this.driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

        this.sourceData = await Promise.allSettled(sourceElements.map(async item => {
            const question = await item.findElement(By.css('.homework-stat-question-line p')).getText()
                .then(data => data.trim())

            const answers = await item.findElements(By.css('.homework-stat-question-line .homework-stat-options .homework-stat-option-line .correct p'))
                .then(async answers => {
                    return await Promise.allSettled(answers.map(async answer => {
                        return await answer.getText()
                            .then(data => data.trim())
                    }))
                        .then(data => data.map(item => item.value))
                })
                .catch(errorPrint)

            return [question, answers]
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

    passingOfTestUsingAI = async () => {
        const [question, answers, elements] = await this.getQuestionAndAnswers(false)
        const formattedAnswers = JSON.stringify(answers, null, 3)
        const isMultiQuiz = await this.checkMultiQuiz()

        // Templates for ChatGPT
        const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
        const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

        // Send request to ChatGPT and get response
        const data = await this.askGPT(isMultiQuiz ? templateMany : templateOne)
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

    passingOfTestUsingSource = async () => {
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

    passingOfTest = async () => {
        if (this.method === '2') {
            await this.passingOfTestUsingSource()
        } else {
            await this.passingOfTestUsingAI()
        }
    }

    listenCurrentQuestion = async () => {
        await this.driver.findElement(By.className('currentActiveQuestion')).getText()
            .then(async data => {
                const number = Number(data)
                if (number === this.currentQuestion) return

                this.currentQuestion = number
                await this.passingOfTest()
            })
    }

    driverQuit = async () => {
        setTimeout(async () => {
            await this.driver.quit()
        }, 1000000)
    }
}


export const errorPrint = err => console.error(err)