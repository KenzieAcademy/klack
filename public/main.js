const userList = document.getElementById("users");
const messagesDiv = document.getElementById("messageslist");
const textarea = document.getElementById("newmessage");
const ding = new Audio('typewriter_ding.m4a');

let messages = [{timestamp: 0}];

let name = window.prompt("Enter your name");
if(name.length===0) name = "Anon-" + Math.floor(Math.random()*1000);

function appendMessage(msg) {
    messages.push(msg);
    messagesDiv.innerHTML +=
      `<div class="message"><strong>${msg.sender}</strong><br>${msg.message}</div>`;
}

function listUsers(users) {
    let userStrings = users.map((user) =>
        (user.active ? `<span class="active"><span class="cyan">&#9679;</span> ${user.name}</span>` : `<span class="inactive">&#9675; ${user.name}</span>`)
    );
    userList.innerHTML = userStrings.join("<br>");
}

function scrolledToBottom() {
    return messagesDiv.scrollTop + 600 >= messagesDiv.scrollHeight;
}
function scrollMessages() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function fetchMessages() {
    fetch("/messages?for=" + encodeURIComponent(name))
        .then(response => response.json())
        .then(data => {
            const shouldScroll = scrolledToBottom();
            var shouldDing = false;
            listUsers(data.users);
            for(let i = 0; i < data.messages.length; i++){ 
                let msg = data.messages[i];
                if(msg.timestamp > messages[messages.length-1].timestamp) {
                    appendMessage(msg);
                    shouldDing = true;
                }
            }
            if(shouldScroll && shouldDing) scrollMessages();
            if(shouldDing) ding.play();
            setTimeout(fetchMessages, 5000);
        })
}

document.getElementById("newmessage").addEventListener("keypress", (event) => {
    if(event.keyCode === 13 && !event.shiftKey) {
        textarea.disabled = true;
        const postRequestOptions = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({sender: name, message: textarea.value}),
        }
        fetch("/messages", postRequestOptions)
            .then(response => response.json())
            .then(msg => {
                appendMessage(msg);
                scrollMessages();
                textarea.value="";
                textarea.disabled = false;
                textarea.focus();
            })
    }
})

fetchMessages();