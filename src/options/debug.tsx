import { useEffect, useState } from "react"

import { queue, taskMetadata } from "~background"

const Debug = () => {
  const [isPaused, setIsPaused] = useState(queue.isPaused)
  const [pending, setPending] = useState(queue.pending)
  const [size, setSize] = useState(queue.size)
  const [tasks, setTasks] = useState([...taskMetadata])

  useEffect(() => {
    const update = () => {
      setIsPaused(queue.isPaused)
      setPending(queue.pending)
      setSize(queue.size)
      setTasks([...taskMetadata])
    }

    // listen for queue activity
    queue.on("add", update)
    queue.on("next", update)
    queue.on("active", update)

    const interval = setInterval(update, 1000) // periodic refresh
    return () => {
      clearInterval(interval)
      queue.removeListener("add", update)
      queue.removeListener("next", update)
      queue.removeListener("active", update)
    }
  }, [])

  return (
    <div style={{ padding: "1rem", fontFamily: "monospace" }}>
      <h3>Queue Debug Panel</h3>
      <p>Paused: {isPaused ? "Yes" : "No"}</p>
      <p>Active: {pending}</p>
      <p>Waiting: {size}</p>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => queue.pause()}>Pause</button>
        <button onClick={() => queue.start()}>Start</button>
      </div>

      <h4 style={{ marginTop: "1rem" }}>Queued Tasks:</h4>
      <ul>
        {tasks.length === 0 && <li>(none)</li>}
        {tasks.map((t) => (
          <li key={t.id}>
            {t.name} — enqueued {Math.round((Date.now() - t.enqueuedAt) / 1000)}{" "}
            s ago
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Debug
