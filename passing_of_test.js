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

        // PASSING OF TEST
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
        const templateOne = `Обери одну правильну відповідь, напиши тільки цифру. Питання:"${question}". Варіанти відповідей: ${answers}`
        const templateMany = `Обери декілька правильних відповідей, напиши тільки цифрами правильні відповіді через кому. Питання:"${question}". Варіанти відповідей: ${answers}`

        // SEND REQUEST TO ChatGPT AND GET RESPONSE
        const data = await runPrompt(isMultiQuiz ? templateMany : templateOne)
        const rightAnswers = data.replace(/\D/g, '').split('')

        // SOME ACTIONS ON WEBPAGE
        await Promise.all(rightAnswers.map(async (rightAnswer) => {
            await elements[Number(rightAnswer) - 1].click()
        }))
            .then(async () => {
                if (isMultiQuiz) {
                    await driver.findElement(By.className('test-multiquiz-save-button')).click()
                }
            })

        console.log(`Multiquiz is ${isMultiQuiz}`)
        console.log(question)
        console.log(answers)
        console.log(`Right answers: ${rightAnswers}`)
    } finally {
        // await driver.quit()
    }
}

module.exports = {passingOfTest}