import {By} from 'selenium-webdriver'
import {checkMultiQuiz, errorPrint} from "../index.js"
import {getQuestionAndAnswers} from "./getQuestionAndAnswers.js"

export const passingOfTestUsingSource = async (driver, sourceData) => {
    const [question, answers, elements] = await getQuestionAndAnswers(driver, true)

    if (!sourceData[question]) return

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