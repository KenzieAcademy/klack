const express = require('express')
const querystring = require('querystring');
const port = 3000
const app = express()

// List of all messages
let messages = []

// Track last active times for each sender
let users = {}

app.use(express.static("./public"))
app.use(express.json())

function userSortFn(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;      
}

app.get("/messages", (request, response) => {
    const now = Date.now();
    const requireActiveSince = now - (15*1000) // consider inactive after 15 seconds
    usersSimple = Object.keys(users).map((x) => ({name: x, active: (users[x] > requireActiveSince)}))
    usersSimple.sort(userSortFn);
    usersSimple.filter((a) => (a.name !== request.query.for))
    users[request.query.for] = now;
    response.send({messages: messages.slice(-40), users: usersSimple})
})

app.post("/messages", (request, response) => {
    // add a timestamp to each incoming message.
    let timestamp = Date.now()
    request.body.timestamp = timestamp
    messages.push(request.body)
    users[request.body.sender] = timestamp
    response.status(201)
    response.send(request.body)
})

app.listen(3000)