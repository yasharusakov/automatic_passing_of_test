import PassingOfTest from './services/passing-of-test-service.js'

export function errorPrint(err) { console.error(err) }

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