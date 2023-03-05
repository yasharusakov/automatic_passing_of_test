import {Builder, Browser, By, Key, until} from 'selenium-webdriver'
import {Configuration, OpenAIApi} from 'openai'
import {Options} from 'selenium-webdriver/firefox.js'
import promptSync from 'prompt-sync'
import chalk from 'chalk'
import dotenv from 'dotenv'
dotenv.config()

const desktopAgents = [
    'Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0',
    'Mozilla/5.0 (Android 10; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ',
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) ',
    'AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) ',
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) ',
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0'
]

// Cool error print
const errorPrint = err => console.error(chalk.red(err))

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

async function start() {
    const socks = [9050, 9052, 9053, 9054]
    const randomSock = socks[Math.floor(Math.random() * socks.length)]
    const randomDesktopAgent = desktopAgents[Math.floor(Math.random() * socks.length)]

    let options = new Options()

    // Connection via Tor
    options.setPreference('network.proxy.type', 1)
    options.setPreference('network.proxy.socks', '127.0.0.1')
    options.setPreference('network.proxy.socks_port', randomSock)
    options.setPreference('network.proxy.socks_remote_dns', true)
    options.setPreference('network.proxy.socks_version', 5)

    // Desktop agent
    options.setPreference('general.useragent.override', randomDesktopAgent)

    let driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .withCapabilities(options)
        .build()

    try {
        const urlOfRegistration = 'https://naurok.com.ua/test/join'

        // Join test
        await driver.get('https://www.whatismybrowser.com/detect/what-is-my-user-agent/')
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