import {errorPrint, PassingOfTest} from './module.js'
import {By} from 'selenium-webdriver'
import promptSync from 'prompt-sync'
import dotenv from 'dotenv'

dotenv.config()

const prompt = promptSync()
const username = prompt('Enter username: ')
const code = prompt('Enter code: ')

console.log(`
Methods:
1) Using ChatGPT - Artificial Intelligence, you trust only AI
2) Source answers
`)

const method = prompt('Enter number of method: ')
const urlOfAnswers = method === '2' && prompt('Enter url of answers: ')
const urlOfRegistration = 'https://naurok.com.ua/test/join'

// Входная точка программы
const main = async () => {
    const {
        joinTest,
        getSourceAnswers,
        passingOfTest,
        listenCurrentQuestion,
        driverQuit
    } = new PassingOfTest(method)

    try {
        if (method === '2') {
            await getSourceAnswers(urlOfAnswers)
        }

        await joinTest(username, code, urlOfRegistration)

        await passingOfTest()

        setInterval(async () => {
            await listenCurrentQuestion()
        }, 3000)

    } catch (err) {
        errorPrint(err)
    } finally {
        await driverQuit()
    }
}

main()