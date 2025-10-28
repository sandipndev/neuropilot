import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  COGNITIVE_ATTENTION_DEBUG_MODE,
  COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME,
  COGNITIVE_ATTENTION_SHOW_OVERLAY,
  COGNITIVE_ATTENTION_SUSTAINED_TIME,
  COGNITIVE_ATTENTION_WORDS_PER_MINUTE,
  DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD,
  DOOMSCROLLING_TIME_WINDOW,
  FOCUS_INACTIVITY_THRESHOLD,
  GARBAGE_COLLECTION_INTERVAL,
  MODEL_TEMPERATURE_MULTIPLIER,
  MODEL_TOPK
} from "~default-settings"

const Settings = () => {
  // Cognitive Attention Settings
  const [sustainedTime, setSustainedTime] = useStorage(
    COGNITIVE_ATTENTION_SUSTAINED_TIME.key,
    COGNITIVE_ATTENTION_SUSTAINED_TIME.defaultValue
  )
  const [idleThreshold, setIdleThreshold] = useStorage(
    COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.key,
    COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.defaultValue
  )
  const [wordsPerMinute, setWordsPerMinute] = useStorage(
    COGNITIVE_ATTENTION_WORDS_PER_MINUTE.key,
    COGNITIVE_ATTENTION_WORDS_PER_MINUTE.defaultValue
  )
  const [debugMode, setDebugMode] = useStorage(
    COGNITIVE_ATTENTION_DEBUG_MODE.key,
    COGNITIVE_ATTENTION_DEBUG_MODE.defaultValue
  )
  const [showOverlay, setShowOverlay] = useStorage(
    COGNITIVE_ATTENTION_SHOW_OVERLAY.key,
    COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue
  )

  // Doomscrolling Settings
  const [itemsThreshold, setItemsThreshold] = useStorage(
    DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.key,
    DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.defaultValue
  )
  const [timeWindow, setTimeWindow] = useStorage(
    DOOMSCROLLING_TIME_WINDOW.key,
    DOOMSCROLLING_TIME_WINDOW.defaultValue
  )

  // System Settings
  const [gcInterval, setGcInterval] = useStorage(
    GARBAGE_COLLECTION_INTERVAL.key,
    GARBAGE_COLLECTION_INTERVAL.defaultValue
  )
  const [focusInactivityThreshold, setFocusInactivityThreshold] = useStorage(
    FOCUS_INACTIVITY_THRESHOLD.key,
    FOCUS_INACTIVITY_THRESHOLD.defaultValue
  )

  // Model Settings
  const [modelTopK, setModelTopK] = useStorage(MODEL_TOPK.key, (v) => v ?? null)
  const [modelTempMultiplier, setModelTempMultiplier] = useStorage(
    MODEL_TEMPERATURE_MULTIPLIER.key,
    MODEL_TEMPERATURE_MULTIPLIER.defaultValue
  )
  const [defaultTopK, setDefaultTopK] = useState<number | null>(null)

  const [saveMessage, setSaveMessage] = useState("")
  const [modelSettingsSaved, setModelSettingsSaved] = useState(false)

  // Load default topK on mount
  useEffect(() => {
    const loadDefaultTopK = async () => {
      try {
        if (typeof MODEL_TOPK.defaultValue === "function") {
          const value = await MODEL_TOPK.defaultValue()
          setDefaultTopK(value)
        }
      } catch (error) {
        console.error("Failed to load default topK:", error)
      }
    }
    loadDefaultTopK()
  }, [])

  const handleResetToDefaults = async () => {
    setSustainedTime(COGNITIVE_ATTENTION_SUSTAINED_TIME.defaultValue)
    setIdleThreshold(COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.defaultValue)
    setWordsPerMinute(COGNITIVE_ATTENTION_WORDS_PER_MINUTE.defaultValue)
    setDebugMode(COGNITIVE_ATTENTION_DEBUG_MODE.defaultValue)
    setShowOverlay(COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue)
    setItemsThreshold(DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.defaultValue)
    setTimeWindow(DOOMSCROLLING_TIME_WINDOW.defaultValue)
    setGcInterval(GARBAGE_COLLECTION_INTERVAL.defaultValue)
    setFocusInactivityThreshold(FOCUS_INACTIVITY_THRESHOLD.defaultValue)
    setModelTopK(null)
    setModelTempMultiplier(MODEL_TEMPERATURE_MULTIPLIER.defaultValue)

    setSaveMessage("All settings reset to defaults!")
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const showSaveMessage = () => {
    setSaveMessage("Settings saved!")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  const showModelSettingsSaveMessage = () => {
    setModelSettingsSaved(true)
    setSaveMessage(
      "Model settings saved! Please restart Chrome for changes to take effect."
    )
    setTimeout(() => {
      setSaveMessage("")
      setModelSettingsSaved(false)
    }, 5000)
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure how NeuroPilot monitors and tracks your focus
        </p>
      </div>

      {saveMessage && (
        <div
          className={`animate-fadeIn ${
            modelSettingsSaved
              ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
              : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
          } border px-4 py-3 rounded-lg flex items-center gap-2`}>
          {modelSettingsSaved ? (
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>{saveMessage}</span>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              Cognitive Attention
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Settings for tracking reading and attention patterns
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Sustained Time
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                How long focus must be sustained to register attention
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={sustainedTime}
                onChange={(e) => {
                  setSustainedTime(Number(e.target.value))
                  showSaveMessage()
                }}
                min="100"
                max="5000"
                step="100"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {sustainedTime}ms
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Idle Threshold
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Time of inactivity before considering user idle
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={idleThreshold}
                onChange={(e) => {
                  setIdleThreshold(Number(e.target.value))
                  showSaveMessage()
                }}
                min="1000"
                max="30000"
                step="1000"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {(idleThreshold / 1000).toFixed(0)}s
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reading Speed
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Words per minute reading speed assumption
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={wordsPerMinute}
                onChange={(e) => {
                  setWordsPerMinute(Number(e.target.value))
                  showSaveMessage()
                }}
                min="50"
                max="500"
                step="10"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {wordsPerMinute} WPM
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => {
                  setDebugMode(e.target.checked)
                  showSaveMessage()
                }}
                className="w-5 h-5 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Debug Mode
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Enable console logging for attention tracking
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => {
                  setShowOverlay(e.target.checked)
                  showSaveMessage()
                }}
                className="w-5 h-5 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Show Overlay
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Display visual overlay when attention is detected
                </div>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              Doomscrolling Detection
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure alerts for rapid content consumption
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Items Threshold
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Number of items viewed before triggering alert
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={itemsThreshold}
                onChange={(e) => {
                  setItemsThreshold(Number(e.target.value))
                  showSaveMessage()
                }}
                min="1"
                max="50"
                step="1"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {itemsThreshold} items
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Time Window
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Time window for counting rapid attention switches
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={timeWindow}
                onChange={(e) => {
                  setTimeWindow(Number(e.target.value))
                  showSaveMessage()
                }}
                min="1000"
                max="60000"
                step="1000"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {(timeWindow / 1000).toFixed(0)}s
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              Focus Management
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Settings for focus tracking and inactivity detection
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Inactivity Threshold
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Time of inactivity before pausing focus session
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={focusInactivityThreshold}
                onChange={(e) => {
                  setFocusInactivityThreshold(Number(e.target.value))
                  showSaveMessage()
                }}
                min="60000"
                max="600000"
                step="60000"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {(focusInactivityThreshold / 60000).toFixed(0)} min
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
              System
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Background system maintenance settings
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Data Cleanup Interval
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                How often to clean up old data
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={gcInterval / (24 * 60 * 60 * 1000)}
                onChange={(e) => {
                  setGcInterval(Number(e.target.value) * 24 * 60 * 60 * 1000)
                  showSaveMessage()
                }}
                min="1"
                max="30"
                step="1"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="min-w-[80px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {(gcInterval / (24 * 60 * 60 * 1000)).toFixed(0)} days
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 bg-yellow-50/50 dark:bg-yellow-900/10">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                Model Settings (Advanced)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                These settings control the AI model behavior. Only modify if you
                understand their impact.
              </p>
            </div>
          </div>

          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Warning:</strong> Changing these settings requires a
                Chrome restart to take effect. Incorrect values may degrade
                model performance.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Top K
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Number of top tokens to consider during generation
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={modelTopK ?? defaultTopK ?? 1}
                onChange={(e) => {
                  setModelTopK(Number(e.target.value))
                  showModelSettingsSaveMessage()
                }}
                min="1"
                max="40"
                step="1"
                disabled={defaultTopK === null}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="min-w-[100px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {modelTopK ?? defaultTopK ?? "Loading..."}
              </span>
            </div>
            {defaultTopK !== null && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                Default: {defaultTopK}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Temperature Multiplier
              <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                Controls randomness in output (higher = more creative)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                value={modelTempMultiplier}
                onChange={(e) => {
                  setModelTempMultiplier(Number(e.target.value))
                  showModelSettingsSaveMessage()
                }}
                min="0.1"
                max="2.0"
                step="0.1"
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
              />
              <span className="min-w-[100px] px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-mono">
                {modelTempMultiplier.toFixed(1)}x
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
              Default: {MODEL_TEMPERATURE_MULTIPLIER.defaultValue.toFixed(1)}x
            </p>
          </div>
        </div>
      </section>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleResetToDefaults}
          className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset All to Defaults
        </button>
      </div>
    </div>
  )
}

export default Settings
