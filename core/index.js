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