const {runPrompt} = require('./chatgpt')

const start = async () => {
    const data = await runPrompt('how are you')
    console.log(data)
}

start()