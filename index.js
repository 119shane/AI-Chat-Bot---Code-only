import {initializeApp} from 'firebase/app'
import {getDatabase, ref, push, get, remove} from 'firebase/database'

import {process} from "/env"
import { Configuration, OpenAIApi } from "openai"

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

const appSettings = {
    databaseURL: 'https://you-know-all-ai-app-default-rtdb.asia-southeast1.firebasedatabase.app/'
}

const app = initializeApp(appSettings)

const database = getDatabase(app)

const conversationInDatabase = ref(database)

let instructionObject ={
    role: 'system',
    content: 'you are a very helpful assistant who is expert in general knowlage and gives short answers'
}

const userInput = document.getElementById("user_input")
const messagesContainer = document.getElementById("message_container")

document.addEventListener('submit', (e)=> {
    e.preventDefault()
    const userMsg = document.createElement('div')
    userMsg.classList.add('msg', 'user_msg')
    userMsg.textContent = userInput.value
    messagesContainer.appendChild(userMsg)
    push(conversationInDatabase, {
        role: 'user',
        content: userInput.value 
    })
    fetchAiData()
    userInput.value = ''
})

function fetchAiData() {
    get(conversationInDatabase).then(async (snapShot) => {
        if(snapShot.exists()){
            const conversationArr = Object.values(snapShot.val())
            conversationArr.unshift(instructionObject)
            
            const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationArr,
            presence_penalty: 0,
            frequency_penalty: 0.6,
            })
            push(conversationInDatabase, response.data.choices[0].message)
            const aiResponse = response.data.choices[0].message.content
            const aiMsg = document.createElement('div')
            aiMsg.classList.add('msg', "assistant_msg")
            aiMsg.textContent = aiResponse
            messagesContainer.appendChild(aiMsg)
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        } else {
            console.log("no data available")
        }
    })
}

function renderConversationFromDb() {
    get(conversationInDatabase).then(async snapshot => {
        if(snapshot.exists()){
            const arr = Object.values(snapshot.val())
            arr.forEach(item => {
                const newDiv = document.createElement('div')
                newDiv.classList.add('msg', 
                `${item.role === 'user' ? 'user' : 'assistant'}_msg`
                )
                newDiv.textContent = item.content
                messagesContainer.appendChild(newDiv)
                
            })
        }
    })
}
renderConversationFromDb()

const closeBtn = document.getElementById("close_btn")

closeBtn.addEventListener('click', ()=> {
    remove(conversationInDatabase)
    messagesContainer.innerHTML = `<div class="msg assistant_msg"> How can I help you? </div>`
})







