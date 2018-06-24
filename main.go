package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"
    "strings"
)

// Custom data types
type SimpleUser struct {
    Name   string `json:"name"`
    Active bool `json:"active"`
}

type MessageResponse struct {
    Messages []*Message `json:"messages"`
    Users []*SimpleUser `json:"users"`
}

type Message struct {
    Message string `json:"message"`
    Sender string `json:"sender"`
    Timestamp time.Time `json:"timestamp"`
}

// List of all messages
var messages []*Message

// Track last active times for each sender
var users map[string]time.Time

// generic comparison function for case-insensitive alphabetic sorting on the
// name field
type ByName []*SimpleUser

func (n ByName) Len() int {
	return len(n)
}

func (n ByName) Swap(i, j int) {
	n[i], n[j] = n[j], n[i]
}

func (n ByName) Less(i, j int) bool {
	return strings.ToLower(n[i].Name) < strings.ToLower(n[j].Name)
}

func main() {
    users = make(map[string]time.Time) 
    messages = make([]*Message, 0)

	// routing
	http.HandleFunc("/messages", MessageHandler)
	http.Handle("/", http.FileServer(http.Dir("public")))

	fmt.Println("Serving on port 3000")
	http.ListenAndServe(":3000", nil)
}

func MessageHandler(rw http.ResponseWriter, r *http.Request) {
    // set the appropriate content type for headers
    rw.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case "GET":
        // get the current time
		now := time.Now()

        // consider users active if they have connected (GET or POST) in last 15
        // seconds
		requireActiveSince := now.Add(time.Second * 15 * -1)

		query := r.URL.Query()
        var usersSimple = make([]*SimpleUser, 0)

        // create a new list of users with a flag indicating whether they have
        // been active recently
		for name, lastActive := range users {
            usersSimple = append(usersSimple, &SimpleUser{
                Name:   name,
                Active: lastActive.After(requireActiveSince),
            })
		}

        // sort the list of users alphabetically by name
		sort.Sort(ByName(usersSimple))

        users[query["for"][0]] = now

        // send the latest 40 messages and the full user list, annotated with
        // active flags
        messageResponse := &MessageResponse{
            Messages: messages,
            Users: usersSimple,
        }

        js, _ := json.Marshal(messageResponse)
        rw.Write(js)
        

	case "POST":
		timestamp := time.Now()
		decoder := json.NewDecoder(r.Body)
        var message Message
        err := decoder.Decode(&message)

        if err != nil {
            panic(err)
        }

        // add a timestamp to each incoming message.
        message.Timestamp = timestamp

        // append the new message to the message list
        messages = append(messages, &message)

        // update the posting user's last access timestamp (so we know they are
        // active)
        users[message.Sender] = timestamp


        // Send back the successful response.
        js, _ := json.Marshal(message)
        rw.Write(js)
	}
}
