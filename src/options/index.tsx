import Debug from "./debug"
import Settings from "./settings"

const Options = () => {
  return (
    <div>
      <details>
        <summary>Settings</summary>
        <Settings />
      </details>
      <details>
        <summary>Debug</summary>
        <Debug />
      </details>
    </div>
  )
}

export default Options
