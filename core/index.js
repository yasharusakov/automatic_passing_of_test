import {PassingOfTest} from './services/passing-of-test-service.js'

export const errorPrint = err => console.error(err)

const start = async () => {
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
}

start()