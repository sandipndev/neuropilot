import {
  CheckCheck,
  FileText,
  Languages,
  MessageSquarePlus,
  RefreshCw
} from "lucide-react"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import { CODE_TO_LANGUAGE, type IntentName } from "~background/messages/intent"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

const SelectionCard = () => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState("")
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [lastSelectionText, setLastSelectionText] = useState("")
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)

  useEffect(() => {
    const handleSelection = () => {
      // Small delay to ensure selection has been updated
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()

        // Only show if there's new text selected and it's different from before
        if (text && text.length > 0 && text !== lastSelectionText) {
          const range = selection?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()

          if (rect) {
            setPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + window.scrollY - 10
            })
            setSelectedText(text)
            setLastSelectionText(text)
            setVisible(true)
          }
        } else if (!text) {
          // Only hide if there's no selection and card is visible
          setVisible(false)
          setLastSelectionText("")
        }
      }, 10)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside the card AND not on a button inside the card
      if (!target.closest(".plasmo-selection-card")) {
        setVisible(false)
        setLastSelectionText("")
      }
    }

    document.addEventListener("mouseup", handleSelection)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleSelection)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [lastSelectionText])

  const handleAction = async (
    action: IntentName,
    language?: keyof typeof CODE_TO_LANGUAGE
  ) => {
    console.log(`Action: ${action}`)
    console.log(`Selected text: ${selectedText}`)

    setVisible(false)
    setLastSelectionText("")
    setShowTranslateDropdown(false)

    await sendToBackground({
      name: "intent",
      body: {
        type: action,
        text: selectedText,
        language: language
      }
    })
  }

  const handleTranslateClick = () => {
    setShowTranslateDropdown(!showTranslateDropdown)
  }

  if (!visible) return null

  const buttonStyle = (isHovered: boolean, isPrimary: boolean = false) => ({
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: isPrimary
      ? isHovered
        ? "#2563eb"
        : "#3b82f6"
      : isHovered
        ? "#e5e7eb"
        : "#f9fafb",
    cursor: "pointer",
    fontWeight: 500,
    color: isPrimary ? "white" : "#374151",
    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "12px",
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
    boxShadow: isHovered
      ? "0 4px 12px rgba(0, 0, 0, 0.1)"
      : "0 1px 3px rgba(0, 0, 0, 0.05)",
    width: "100%",
    height: "100%"
  })

  return (
    <div
      className="plasmo-selection-card"
      onMouseDown={(e) => {
        // Prevent the mousedown event from bubbling to document
        e.stopPropagation()
      }}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, calc(-100% - 12px))",
        zIndex: 2147483647,
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "10px",
        boxShadow:
          "0 10px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08)",
        display: "flex",
        gap: "8px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        backdropFilter: "blur(10px)",
        animation: "slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, calc(-100% - 8px));
            }
            to {
              opacity: 1;
              transform: translate(-50%, calc(-100% - 12px));
            }
          }
        `}
      </style>

      <div
        style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
        <button
          onClick={() => handleAction("proofread")}
          onMouseEnter={() => setHoveredButton("proofread")}
          onMouseLeave={() => setHoveredButton(null)}
          style={buttonStyle(hoveredButton === "proofread")}>
          <CheckCheck size={18} strokeWidth={2.5} />
          <span>Proofread</span>
        </button>
      </div>

      <div
        style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
        <button
          onClick={handleTranslateClick}
          onMouseEnter={() => setHoveredButton("translate")}
          onMouseLeave={() => setHoveredButton(null)}
          style={buttonStyle(hoveredButton === "translate")}>
          <Languages size={18} strokeWidth={2.5} />
          <span>Translate</span>
        </button>

        {showTranslateDropdown && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "0",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "8px",
              boxShadow:
                "0 10px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08)",
              maxHeight: "300px",
              overflowY: "auto",
              minWidth: "200px",
              zIndex: 2147483648
            }}>
            {Object.entries(CODE_TO_LANGUAGE).map(([code, name]) => (
              <button
                key={code}
                onClick={() =>
                  handleAction(
                    "translate",
                    code as keyof typeof CODE_TO_LANGUAGE
                  )
                }
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  backgroundColor: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#374151",
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
        <button
          onClick={() => handleAction("rephrase")}
          onMouseEnter={() => setHoveredButton("rephrase")}
          onMouseLeave={() => setHoveredButton(null)}
          style={buttonStyle(hoveredButton === "rephrase")}>
          <RefreshCw size={18} strokeWidth={2.5} />
          <span>Rephrase</span>
        </button>
      </div>

      <div
        style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
        <button
          onClick={() => handleAction("summarize")}
          onMouseEnter={() => setHoveredButton("summarize")}
          onMouseLeave={() => setHoveredButton(null)}
          style={buttonStyle(hoveredButton === "summarize")}>
          <FileText size={18} strokeWidth={2.5} />
          <span>Summarize</span>
        </button>
      </div>

      <div
        style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
        <button
          onClick={() => handleAction("chat")}
          onMouseEnter={() => setHoveredButton("chat")}
          onMouseLeave={() => setHoveredButton(null)}
          style={buttonStyle(hoveredButton === "chat", true)}>
          <MessageSquarePlus size={18} strokeWidth={2.5} />
          <span>Chat</span>
        </button>
      </div>
    </div>
  )
}

export default SelectionCard
