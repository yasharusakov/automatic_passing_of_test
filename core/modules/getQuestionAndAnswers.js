import {By, until} from 'selenium-webdriver'
import {errorPrint} from "../index.js"

export const getQuestionAndAnswers = async (driver, condition) => {
    const [{value: question}, {value: elements}] = await Promise.allSettled([
        driver.wait(until.elementLocated(By.css('.test-content-text-inner p'))).getText(),
        driver.wait(until.elementsLocated(By.className('question-option-inner-content')))
    ])

    const answers = await Promise.allSettled(elements.map(async (element, i) => {
        const paragraphs = await element.findElements(By.css('p'))
            .catch(errorPrint)

        const answer = await Promise.allSettled(paragraphs.map(async paragraph => {
            return await paragraph.getText()
        }))
            .then(paragraphs => paragraphs.map(parapraph => parapraph.value).join(' '))
            .catch(errorPrint)

        if (!condition) {
            return `(${i + 1}) : ${answer.trim()}, `
        }

        return answer.trim()
    }))
        .then(answers => answers.map(answer => answer.value))
        .catch(errorPrint)

    return [question.trim(), answers, elements]
}