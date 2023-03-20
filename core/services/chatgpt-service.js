import {Configuration, OpenAIApi} from 'openai'
import dotenv from 'dotenv'
dotenv.config()

export class ChatGPTService {
    #openai

    constructor() {
        this.#openai = new OpenAIApi(new Configuration({
            apiKey: process.env.API_KEY
        }))
    }

    async query(prompt) {
        const response = await this.#openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 2048,
            temperature: 1
        })

        return response.data.choices[0].text
    }
}