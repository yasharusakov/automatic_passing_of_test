import {Configuration, OpenAIApi} from 'openai'
import dotenv from 'dotenv'
dotenv.config()

const config = new Configuration({
    apiKey: process.env.API_KEY
})

const openai = new OpenAIApi(config)

export const runPrompt = async (prompt) => {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 1
    })

    return response.data.choices[0].text
}