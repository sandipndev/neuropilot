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

import Debug from "./Debug"

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
  const [debugOpen, setDebugOpen] = useState(false)
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false)

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
    <div className="max-w-5xl mx-auto p-4 space-y-3">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure how NeuroPilot monitors and tracks your focus
        </p>
      </div>

      {saveMessage && (
        <div
          className={`animate-fadeIn ${
            modelSettingsSaved
              ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
              : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
          } border px-3 py-2 rounded text-sm flex items-center gap-2`}>
          {modelSettingsSaved ? (
            <svg
              className="w-4 h-4 flex-shrink-0"
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
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="text-xs">{saveMessage}</span>
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-3">
        <section className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Cognitive Attention
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Reading and attention tracking
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sustained Time{" "}
                <span className="text-slate-500 font-normal">
                  (focus duration)
                </span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {sustainedTime}ms
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Idle Threshold{" "}
                <span className="text-slate-500 font-normal">
                  (inactivity time)
                </span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {(idleThreshold / 1000).toFixed(0)}s
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reading Speed{" "}
                <span className="text-slate-500 font-normal">(words/min)</span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-blue-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {wordsPerMinute}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => {
                    setDebugMode(e.target.checked)
                    showSaveMessage()
                  }}
                  className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded"
                />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Debug Mode{" "}
                  <span className="text-slate-500">(console logs)</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => {
                    setShowOverlay(e.target.checked)
                    showSaveMessage()
                  }}
                  className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded"
                />
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Show Overlay{" "}
                  <span className="text-slate-500">(visual indicator)</span>
                </div>
              </label>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
              <svg
                className="w-4 h-4 text-orange-600 dark:text-orange-400"
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
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Doomscrolling Detection
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Alerts for rapid content consumption
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Items Threshold{" "}
                <span className="text-slate-500 font-normal">
                  (items before alert)
                </span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-orange-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {itemsThreshold}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time Window{" "}
                <span className="text-slate-500 font-normal">
                  (tracking period)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  value={timeWindow}
                  onChange={(e) => {
                    setTimeWindow(Number(e.target.value))
                    showSaveMessage()
                  }}
                  min="30000"
                  max="900000"
                  step="1000"
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-orange-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {(timeWindow / 1000).toFixed(0)}s
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
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
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Focus Management
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Focus tracking settings
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Inactivity Threshold{" "}
                <span className="text-slate-500 font-normal">(pause time)</span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-green-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {(focusInactivityThreshold / 60000).toFixed(0)}m
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                <svg
                  className="w-4 h-4 text-purple-600 dark:text-purple-400"
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
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  System
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Maintenance settings
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Data Cleanup{" "}
                <span className="text-slate-500 font-normal">
                  (cleanup frequency)
                </span>
              </label>
              <div className="flex items-center gap-2">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-purple-600"
                />
                <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                  {(gcInterval / (24 * 60 * 60 * 1000)).toFixed(0)}d
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Model Settings - Collapsible */}
        <details
          open={modelSettingsOpen}
          onToggle={(e) =>
            setModelSettingsOpen((e.target as HTMLDetailsElement).open)
          }
          className="group bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-yellow-200 dark:border-yellow-800">
          <summary className="cursor-pointer px-4 py-3 font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-yellow-600 dark:text-yellow-400"
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
              <div>
                <div className="font-semibold">Model Settings (Advanced)</div>
                <div className="text-xs font-normal text-slate-600 dark:text-slate-400">
                  AI model behavior • Requires Chrome restart
                </div>
              </div>
            </span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
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
          <div className="px-4 pb-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2 mb-3">
              <div className="flex gap-1.5 items-start">
                <svg
                  className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Warning:</strong> Incorrect values may degrade
                  performance
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Top K{" "}
                  <span className="text-slate-500 font-normal">
                    (tokens to consider){" "}
                    {defaultTopK !== null && `• Default: ${defaultTopK}`}
                  </span>
                </label>
                <div className="flex items-center gap-2">
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
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                    {modelTopK ?? defaultTopK ?? "..."}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Temperature{" "}
                  <span className="text-slate-500 font-normal">
                    (creativity) • Default:{" "}
                    {MODEL_TEMPERATURE_MULTIPLIER.defaultValue.toFixed(1)}x
                  </span>
                </label>
                <div className="flex items-center gap-2">
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
                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-yellow-600"
                  />
                  <span className="min-w-[60px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs font-mono">
                    {modelTempMultiplier.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Queue - Collapsible */}
        <details
          open={debugOpen}
          onToggle={(e) => setDebugOpen((e.target as HTMLDetailsElement).open)}
          className="group bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <summary className="cursor-pointer px-4 py-3 font-medium text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <div>
                <div className="font-semibold">Queue</div>
                <div className="text-xs font-normal text-slate-600 dark:text-slate-400">
                  Background task monitoring
                </div>
              </div>
            </span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
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
          <div className="px-4 pb-4">
            <Debug />
          </div>
        </details>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleResetToDefaults}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
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
