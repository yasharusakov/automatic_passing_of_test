require('dotenv').config()
const {Builder, Browser, By, Key, until} = require('selenium-webdriver')
const {runPrompt} = require("./chatgpt")

async function passingOfTest() {
    let driver = await new Builder().forBrowser(Browser.FIREFOX).build()
    try {
        // JOIN TEST
        await driver.get(process.env.NAUROK_URL)
        await driver.findElement(By.id('joinform-gamecode')).sendKeys(process.env.NAUROK_GAMECODE, Key.ENTER)
        await driver.findElement(By.id('joinform-name')).sendKeys(process.env.NAUROK_USERNAME, Key.ENTER)
        await driver.findElement(By.className('join-button-test')).click()

        let currentQuestion = 1

        await fn()

        // PASSING OF TEST
        async function fn() {
            // GET QUESTION AND ANSWERS
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
                answers.push(`${i + 1}) ${answer}`)
            }))

            // CHECK IF QUESTION HAS MORE THAN ONE ANSWER TO CHOOSE
            let isMultiQuiz

            try {
                isMultiQuiz = await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
            } catch (err) {
                isMultiQuiz = false
            }

            // TEMPLATES FOR ChatGPT
            const templateOne = `Напиши правильний варіант цифрою. Запитання: "${question}". Відповіді на запитання: ${answers}`
            const templateMany = `Напиши усі правильні варіанти цифрами. Запитання: "${question}". Відповіді на запитання: ${answers}`

            // SEND REQUEST TO ChatGPT AND GET RESPONSE
            const data = await runPrompt(isMultiQuiz ? templateMany : templateOne)
            const rightAnswers = data.replace(/\D/g, '').split('')

            // SOME ACTIONS ON WEBPAGE
            try {
                await Promise.all(rightAnswers.map(async rightAnswer => {
                    await elements[Number(rightAnswer) - 1].click()
                }))
                    .then(async () => {
                        if (isMultiQuiz) {
                            await driver.findElement(By.className('test-multiquiz-save-button')).click()
                        }
                    })
            } catch (err) {
                console.log(err)
            }

            console.log(`
                CURRENT QUESTION IS ${currentQuestion}. ${question} \n
                RIGHT ANSWERS: ${rightAnswers} \n
                [END OF ${currentQuestion} QUESTION]
            `)
        }

        // CHECK CURRENT QUESTION AND COMPARE
        // IF TRUE CALL FUNCTION AGAIN
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
        }, 1500)
    } catch (err) {
        console.log(err)
    } finally {
        setTimeout(async () => {
            await driver.quit()
        }, 1000000)
    }
}

module.exports = {passingOfTest}