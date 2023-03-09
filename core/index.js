import {Builder, By, until, Key, Browser} from 'selenium-webdriver'
import {Options} from "selenium-webdriver/firefox.js"
import {Configuration, OpenAIApi} from 'openai'
import {getRandom} from 'random-useragent'
import promptSync from 'prompt-sync'
import dotenv from 'dotenv'

dotenv.config()

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

const errorPrint = err => console.error(err)

const checkMultiQuiz = async driver => {
    return await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
        .then(() => true)
        .catch(() => false)
}

const config = new Configuration({
    apiKey: process.env.API_KEY
})
const openai = new OpenAIApi(config)

const chatGPT = async (prompt) => {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 1
    })

    return response.data.choices[0].text
}

const getQuestionAndAnswers = async (driver, condition) => {
    const [{value: question}, {value: elements}] = await Promise.allSettled([
        driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText(),
        driver.wait(until.elementsLocated(By.className('question-option-inner-content')))
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

async function passingOfTestUsingAI(driver) {
    const [question, answers, elements] = await getQuestionAndAnswers(driver, false)
    const formattedAnswers = JSON.stringify(answers, null, 3)
    const isMultiQuiz = await checkMultiQuiz(driver)

    // Templates for ChatGPT
    const templateOne = `Вкажи правильну відповідь тільки цифрою. Question: ${question}. Answers: ${formattedAnswers}`
    const templateMany = `Вкажи правильні відповіді тільки цифрами. Question: ${question}. Answers: ${formattedAnswers}`

    // Send request to ChatGPT and get response
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

const passingOfTestUsingSource = async (driver, sourceData) => {
    const [question, answers, elements] = await getQuestionAndAnswers(driver, true)

    const isMultiQuiz = await checkMultiQuiz(driver)

    await Promise.allSettled(answers.map(async (item, i) => {
        if (sourceData[question].includes(item)) {
            await elements[i].click()
        }
    }))
        .then(async () => {
            if (isMultiQuiz) {
                await driver.findElement(By.className('test-multiquiz-save-button')).click()
            }
        })
        .catch(errorPrint)
}

console.log(`
Methods:
1) Using ChatGPT - Artificial Intelligence, you trust only AI
2) Source answers
`)

const method = prompt('Enter number of method: ')
const urlOfAnswers = method === '2' && prompt('Enter url of answers: ')

const urlOfRegistration = 'https://naurok.com.ua/test/join'

const start = async () => {
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
    options.setPreference('general.useragent.override', getRandom())

    const driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .withCapabilities(options)
        .build()

    try {
        let sourceData

        if (method === '2') {
            await driver.get(urlOfAnswers)

            const sourceElements = await driver.wait(until.elementsLocated(By.css('.homework-stats .content-block')))

            sourceData = await Promise.allSettled(sourceElements.map(async item => {
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

        // Join test
        await driver.get(urlOfRegistration)
        await driver.findElement(By.id('joinform-name')).sendKeys(username, Key.ENTER)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(code, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        const passingOfTest = async () => {
            if (method === '2') {
                return await passingOfTestUsingSource(driver, sourceData)
            }

            await passingOfTestUsingAI(driver, currentQuestion)
        }

        await passingOfTest()

        // Listen current question and compare
        const listenCurrentQuestion = async () => {
            await driver.findElement(By.className('currentActiveQuestion')).getText()
                .then(async data => {
                    const number = Number(data)
                    if (number === currentQuestion) {
                        return
                    }

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