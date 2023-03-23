import PassingOfTest from './services/passing-of-test-service.js'

export const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export const errorPrint = (err) => {
    console.error(err)
}

(async () => {
    const {
        joinTest,
        getSourceAnswers,
        chooseMethodOfPassing,
        listenCurrentQuestion,
        driverQuit
    } = new PassingOfTest()

    try {
        await getSourceAnswers()
        await joinTest()
        await chooseMethodOfPassing()
        await listenCurrentQuestion()
    } catch (err) {
        errorPrint(err)
    } finally {
        await driverQuit()
    }
})()