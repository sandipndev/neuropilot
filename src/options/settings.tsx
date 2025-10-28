import { useState } from "react"

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
  GARBAGE_COLLECTION_INTERVAL
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

  const [saveMessage, setSaveMessage] = useState("")

  const handleResetToDefaults = () => {
    setSustainedTime(COGNITIVE_ATTENTION_SUSTAINED_TIME.defaultValue)
    setIdleThreshold(COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.defaultValue)
    setWordsPerMinute(COGNITIVE_ATTENTION_WORDS_PER_MINUTE.defaultValue)
    setDebugMode(COGNITIVE_ATTENTION_DEBUG_MODE.defaultValue)
    setShowOverlay(COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue)
    setItemsThreshold(DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.defaultValue)
    setTimeWindow(DOOMSCROLLING_TIME_WINDOW.defaultValue)
    setGcInterval(GARBAGE_COLLECTION_INTERVAL.defaultValue)
    setFocusInactivityThreshold(FOCUS_INACTIVITY_THRESHOLD.defaultValue)

    setSaveMessage("All settings reset to defaults!")
    setTimeout(() => setSaveMessage(""), 3000)
  }

  const showSaveMessage = () => {
    setSaveMessage("Settings saved!")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  return (
    <div>
      <h1>NeuroPilot Settings</h1>
      <p>Configure how NeuroPilot monitors and tracks your focus</p>

      {saveMessage && <div>{saveMessage}</div>}

      <section>
        <h2>Cognitive Attention</h2>
        <p>Settings for tracking reading and attention patterns</p>

        <div>
          <label>
            Sustained Time (ms): How long focus must be sustained to register
            attention
          </label>
          <input
            type="number"
            value={sustainedTime}
            onChange={(e) => {
              setSustainedTime(Number(e.target.value))
              showSaveMessage()
            }}
            min="100"
            step="100"
          />
          <span>{sustainedTime}ms</span>
        </div>

        <div>
          <label>
            Idle Threshold (ms): Time of inactivity before considering user idle
          </label>
          <input
            type="number"
            value={idleThreshold}
            onChange={(e) => {
              setIdleThreshold(Number(e.target.value))
              showSaveMessage()
            }}
            min="1000"
            step="1000"
          />
          <span>{(idleThreshold / 1000).toFixed(0)}s</span>
        </div>

        <div>
          <label>
            Reading Speed (WPM): Words per minute reading speed assumption
          </label>
          <input
            type="number"
            value={wordsPerMinute}
            onChange={(e) => {
              setWordsPerMinute(Number(e.target.value))
              showSaveMessage()
            }}
            min="50"
            step="10"
          />
          <span>{wordsPerMinute} WPM</span>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => {
                setDebugMode(e.target.checked)
                showSaveMessage()
              }}
            />
            Debug Mode: Enable console logging for attention tracking
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => {
                setShowOverlay(e.target.checked)
                showSaveMessage()
              }}
            />
            Show Overlay: Display visual overlay when attention is detected
          </label>
        </div>
      </section>

      <section>
        <h2>Doomscrolling Detection</h2>
        <p>Configure alerts for rapid content consumption</p>

        <div>
          <label>
            Items Threshold: Number of items viewed before triggering alert
          </label>
          <input
            type="number"
            value={itemsThreshold}
            onChange={(e) => {
              setItemsThreshold(Number(e.target.value))
              showSaveMessage()
            }}
            min="1"
            step="1"
          />
          <span>{itemsThreshold} items</span>
        </div>

        <div>
          <label>
            Time Window (ms): Time window for counting rapid attention switches
          </label>
          <input
            type="number"
            value={timeWindow}
            onChange={(e) => {
              setTimeWindow(Number(e.target.value))
              showSaveMessage()
            }}
            min="1000"
            step="1000"
          />
          <span>{(timeWindow / 1000).toFixed(0)}s</span>
        </div>
      </section>

      <section>
        <h2>Focus Management</h2>
        <p>Settings for focus tracking and inactivity detection</p>

        <div>
          <label>
            Inactivity Threshold: Time of inactivity before pausing focus
            session
          </label>
          <input
            type="number"
            value={focusInactivityThreshold}
            onChange={(e) => {
              setFocusInactivityThreshold(Number(e.target.value))
              showSaveMessage()
            }}
            min="60000"
            step="60000"
          />
          <span>{(focusInactivityThreshold / 60000).toFixed(0)} min</span>
        </div>
      </section>

      <section>
        <h2>System</h2>
        <p>Background system maintenance settings</p>

        <div>
          <label>
            Data Cleanup Interval: How often to clean up old data (days)
          </label>
          <input
            type="number"
            value={gcInterval / (24 * 60 * 60 * 1000)}
            onChange={(e) => {
              setGcInterval(Number(e.target.value) * 24 * 60 * 60 * 1000)
              showSaveMessage()
            }}
            min="1"
            step="1"
          />
          <span>{(gcInterval / (24 * 60 * 60 * 1000)).toFixed(0)} days</span>
        </div>
      </section>

      <div>
        <button onClick={handleResetToDefaults}>Reset All to Defaults</button>
      </div>
    </div>
  )
}

export default Settings
