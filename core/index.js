import PassingOfTest from './services/passing-of-test-service.js'

// Я переделал в function declaration, так как возвращало console.log(err), а нужно, что бы оно возвращало void
export function errorPrint(err) { console.error(err) }

(async function () {
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
