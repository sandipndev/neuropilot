const Popup = () => {
  const openOptions = () => chrome.runtime.openOptionsPage()

  return (
    <div style={{ padding: "10px", width: "200px" }}>
      <h3>Extension Popup</h3>
      <button onClick={openOptions}>Open Options</button>
    </div>
  )
}

export default Popup
