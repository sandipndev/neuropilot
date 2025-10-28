import { AllChats } from "./chat"
import Debug from "./debug"
import Settings from "./settings"

import "./styles.css"

const Options = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            NeuroPilot
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure your focus and productivity settings
          </p>
        </header>

        <details className="group bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-lg text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </span>
            <svg
              className="w-5 h-5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="px-6 pb-6">
            <Settings />
          </div>
        </details>

        <details className="group bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-lg text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Debug
            </span>
            <svg
              className="w-5 h-5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="px-6 pb-6">
            <Debug />
          </div>
        </details>

        <details className="group bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-lg text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </span>
            <svg
              className="w-5 h-5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="px-6 pb-6">
            <AllChats />
          </div>
        </details>
      </div>
    </div>
  )
}

export default Options
