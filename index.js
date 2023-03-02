const {runPrompt} = require('./chatgpt')
const {passingOfTest} = require('./passing_of_test')

const start = async () => {
    await passingOfTest()
    const data = await runPrompt('Do you believe in god?')
    console.log(data)
}

start()