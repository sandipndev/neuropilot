import { useStorage } from "@plasmohq/storage/hook"

import {
  COGNITIVE_ATTENTION_DEBUG_MODE,
  COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME,
  COGNITIVE_ATTENTION_SHOW_OVERLAY,
  COGNITIVE_ATTENTION_SUSTAINED_TIME,
  COGNITIVE_ATTENTION_WORDS_PER_MINUTE
} from "~default-settings"

const Popup = () => {
  const openOptions = () => chrome.runtime.openOptionsPage()

  // hooks for each setting
  const [sustainedTime, _, sustainedOps] = useStorage(
    COGNITIVE_ATTENTION_SUSTAINED_TIME.key,
    COGNITIVE_ATTENTION_SUSTAINED_TIME.defaultValue
  )

  const [idleThreshold, __, idleOps] = useStorage(
    COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.key,
    COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.defaultValue
  )

  const [wordsPerMinute, ___, wpmOps] = useStorage(
    COGNITIVE_ATTENTION_WORDS_PER_MINUTE.key,
    COGNITIVE_ATTENTION_WORDS_PER_MINUTE.defaultValue
  )

  const [debugMode, ____, debugOps] = useStorage(
    COGNITIVE_ATTENTION_DEBUG_MODE.key,
    COGNITIVE_ATTENTION_DEBUG_MODE.defaultValue
  )

  const [showOverlay, _____, overlayOps] = useStorage(
    COGNITIVE_ATTENTION_SHOW_OVERLAY.key,
    COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue
  )

  return (
    <div style={{ padding: "10px", width: "250px", fontFamily: "sans-serif" }}>
      <h3>🧠 NeuroPilot Settings</h3>
      <button onClick={openOptions}>Open Options</button>

      <div style={{ marginTop: "15px" }}>
        <label>
          Sustained Time (ms):
          <input
            type="number"
            value={sustainedTime}
            onChange={(e) =>
              sustainedOps.setRenderValue(Number(e.target.value))
            }
          />
        </label>
        <button onClick={() => sustainedOps.setStoreValue(sustainedTime)}>
          Save
        </button>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label>
          Idle Threshold (ms):
          <input
            type="number"
            value={idleThreshold}
            onChange={(e) => idleOps.setRenderValue(Number(e.target.value))}
          />
        </label>
        <button onClick={() => idleOps.setStoreValue(idleThreshold)}>
          Save
        </button>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label>
          Words per Minute:
          <input
            type="number"
            value={wordsPerMinute}
            onChange={(e) => wpmOps.setRenderValue(Number(e.target.value))}
          />
        </label>
        <button onClick={() => wpmOps.setStoreValue(wordsPerMinute)}>
          Save
        </button>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => debugOps.setRenderValue(e.target.checked)}
          />
          Debug Mode
        </label>
        <button onClick={() => debugOps.setStoreValue(debugMode === true)}>
          Save
        </button>
      </div>

      <div style={{ marginTop: "15px" }}>
        <label>
          <input
            type="checkbox"
            checked={showOverlay}
            onChange={(e) => overlayOps.setRenderValue(e.target.checked)}
          />
          Show Overlay
        </label>
        <button onClick={() => overlayOps.setStoreValue(showOverlay === true)}>
          Save
        </button>
      </div>
    </div>
  )
}

export default Popup
