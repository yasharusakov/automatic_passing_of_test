/* Copyright 2023 yasharusakov and Transparency010101
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

import {Configuration, OpenAIApi} from 'openai'
import dotenv from 'dotenv'
dotenv.config()

class ChatGPTService {
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

export default new ChatGPTService()