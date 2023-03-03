import dotenv from 'dotenv';
import {Configuration, OpenAIApi} from 'openai';

dotenv.config();

const config = new Configuration({
    apiKey: process.env.API_KEY
})

const openai = new OpenAIApi(config);

const runPrompt = async (prompt) => {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 2048,
        temperature: 1
    }).catch(err => {
        console.log(err)
    });

    return response.data.choices[0].text
}

export {runPrompt}