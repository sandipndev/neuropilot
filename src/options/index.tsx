import { useState } from "react"

import { streamResponse } from "./chat"

type Message = {
  id: number
  sender: "user" | "bot"
  text: string
  image: File | null
}

const Options = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "bot", text: "Hi! How can I help you today?", image: null }
  ])
  const [input, setInput] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [isThinking, setIsThinking] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() && !image) return

    const newMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input || "",
      image: image || null
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setImage(null)
    setIsThinking(true)

    // Create placeholder bot message
    const botMessageId = Date.now() + 1
    const botMessage: Message = {
      id: botMessageId,
      sender: "bot",
      text: "",
      image: null
    }
    setMessages((prev) => [...prev, botMessage])

    try {
      await streamResponse(
        newMessage.text,
        newMessage.image ? [newMessage.image] : null,
        (chunk, done) => {
          if (done) {
            setIsThinking(false)
          } else {
            // Append chunk to bot message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId
                  ? { ...msg, text: msg.text + chunk }
                  : msg
              )
            )
          }
        }
      )
    } catch (error) {
      console.error("Error getting response:", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: "Sorry, I encountered an error. Please try again."
              }
            : msg
        )
      )
      setIsThinking(false)
    }
  }

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
            {msg.image && (
              <div>
                <img
                  src={URL.createObjectURL(msg.image)}
                  alt="uploaded"
                  style={{
                    maxWidth: "200px",
                    display: "block",
                    marginTop: "5px"
                  }}
                />
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div>
            <b>Bot:</b> <i>Thinking...</i>
          </div>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isThinking && sendMessage()}
          disabled={isThinking}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={isThinking}
        />
        <br />
        <button onClick={sendMessage} disabled={isThinking}>
          {isThinking ? "Sending..." : "Send"}
        </button>
      </div>

      {image && (
        <div>
          <p>Image preview:</p>
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            style={{
              maxWidth: "200px",
              display: "block",
              marginBottom: "10px"
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Options
