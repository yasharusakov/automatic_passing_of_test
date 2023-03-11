import {Configuration, OpenAIApi} from 'openai'
import {By, until} from 'selenium-webdriver'

// ChatGPT {
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
// ChatGPT }

// PassingOfTest {
const checkMultiQuiz = async driver => {
    return await driver.findElement(By.css('.test-multiquiz-save-line span')).isDisplayed()
        .then(() => true)
        .catch(() => false)
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
// PassingOfTest }