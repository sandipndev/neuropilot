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
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Queue Debug Panel
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor background task queue status
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${isPaused ? "bg-red-500" : "bg-green-500"} animate-pulse`}
            />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Status
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {isPaused ? "Paused" : "Running"}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {pending}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-4 h-4 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Waiting
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {size}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {!isPaused ? (
          <button
            onClick={() => queue.pause()}
            className="cursor-pointer flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            disabled={isPaused}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Pause Queue
          </button>
        ) : (
          <button
            onClick={() => queue.start()}
            className="cursor-pointer flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            disabled={!isPaused}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            Start Queue
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Queued Tasks
          </h2>
          <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
            {tasks.length}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-8 border border-dashed border-slate-300 dark:border-slate-600 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No tasks in queue
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              The queue is currently empty
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="font-mono font-medium text-slate-900 dark:text-white truncate">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-4">
                      Task ID: <span className="font-mono text-xs">{t.id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {Math.round((Date.now() - t.enqueuedAt) / 1000)}s ago
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Debug
