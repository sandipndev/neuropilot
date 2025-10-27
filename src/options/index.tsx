import { useState } from "react"

const Options = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hi! How can I help you today?", image: null }
  ])
  const [input, setInput] = useState("")
  const [image, setImage] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target.result)
      reader.readAsDataURL(file)
    }
  }

  const sendMessage = () => {
    if (!input.trim() && !image) return

    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: input || "",
      image: image || null
    }

    setMessages((prev) => [...prev, newMessage])

    // Simple mock bot reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          text: "Interesting! Tell me more about that.",
          image: null
        }
      ])
    }, 800)

    setInput("")
    setImage(null)
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
                  src={msg.image}
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
      </div>

      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <br />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <br />
        <button onClick={sendMessage}>Send</button>
      </div>

      {image && (
        <div>
          <p>Image preview:</p>
          <img
            src={image}
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
