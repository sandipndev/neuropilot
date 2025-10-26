type AttentionCandidate = {
  element: Element
  text: string
  score: number
  reasons: string[]
  bounds: DOMRect
  cognitivelyAttended?: boolean
  sustainedDuration?: number
}

type UIConfig = {
  debugMode: boolean
  showOverlay: boolean
}

type DebugData = {
  message: string
  topElements: AttentionCandidate[]
  currentSustainedAttention: {
    confidence: number
    wordsRead: number
    totalWords: number
    readingProgress: number
    duration: number
    cognitiveAttentionThreshold: number
    wordsPerMinute: number
  } | null
  state: {
    scrollVelocity: number
    isPageActive: boolean
    textElementsCount: number
  }
}

class CognitiveAttentionUI {
  private config: UIConfig
  private debugOverlayId = "cog-attention-debug"
  private highlightClassName = "cog-attention-highlight"

  constructor(config: UIConfig) {
    this.config = config
  }

  updateConfig(config: Partial<UIConfig>): void {
    const wasDebugMode = this.config.debugMode
    const wasShowOverlay = this.config.showOverlay

    this.config = { ...this.config, ...config }

    // Handle toggling off
    if (wasDebugMode && !this.config.debugMode) {
      this.removeDebugOverlay()
    }
    if (wasShowOverlay && !this.config.showOverlay) {
      this.removeHighlights()
    }

    // Handle toggling on
    if (!wasDebugMode && this.config.debugMode) {
      this.createDebugOverlay()
    }
  }

  update(debugData: DebugData, topCandidate?: AttentionCandidate): void {
    if (this.config.debugMode) {
      this.updateDebugOverlay(debugData)
    }

    if (this.config.showOverlay) {
      this.highlightTopElement(
        topCandidate,
        debugData.currentSustainedAttention
      )
    }
  }

  destroy(): void {
    this.removeDebugOverlay()
    this.removeHighlights()
  }

  // Debug overlay methods
  private createDebugOverlay(): void {
    if (document.getElementById(this.debugOverlayId)) return

    const overlay = document.createElement("div")
    overlay.id = this.debugOverlayId
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 999999;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      max-height: 80vh;
      overflow-y: auto;
    `
    document.body.appendChild(overlay)
  }

  private updateDebugOverlay(data: DebugData): void {
    if (!this.config.debugMode) return

    const overlay = document.getElementById(this.debugOverlayId)
    if (!overlay) {
      this.createDebugOverlay()
      return
    }

    let html = `
      <div style="border-bottom: 2px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
        <strong>🧠 ATTENTION TRACKER</strong>
      </div>
      <div style="margin-bottom: 10px; color: #ffff00;">
        ${data.message}
      </div>
    `

    if (
      data.topElements &&
      data.topElements.length > 0 &&
      data.currentSustainedAttention
    ) {
      const sustained = data.currentSustainedAttention
      const progress = Math.min(
        100,
        (sustained.duration / sustained.cognitiveAttentionThreshold) * 100
      )
      const progressBar = "█".repeat(Math.floor(progress / 10))
      const emptyBar = "░".repeat(10 - Math.floor(progress / 10))
      const metThreshold =
        sustained.duration >= sustained.cognitiveAttentionThreshold
      const statusIcon = metThreshold ? "✓" : "⏱️"
      const statusColor = metThreshold ? "#00ff00" : "#ffaa00"

      const readingInfo = `
        <div style="color: #00ff88; font-size: 11px; margin-bottom: 3px;">
          Reading: ${sustained.wordsRead} / ${sustained.totalWords} words (${sustained.readingProgress.toFixed(0)}%)
        </div>
        <div style="color: #888; font-size: 10px;">
          @ ${sustained.wordsPerMinute} WPM
        </div>
      `

      const thresholdMet = metThreshold
        ? '<div style="color: #00ff00; font-size: 10px; margin-top: 5px;">✓ Cognitive attention threshold met!</div>'
        : ""

      html += `
        <div style="margin: 10px 0; padding: 10px; background: rgba(0,100,255,0.1); border: 2px solid ${statusColor}; border-radius: 5px;">
          <div style="color: ${statusColor}; font-weight: bold; margin-bottom: 5px;">
            ${statusIcon} SUSTAINED ATTENTION: ${(sustained.duration / 1000).toFixed(1)}s / ${(sustained.cognitiveAttentionThreshold / 1000).toFixed(0)}s
          </div>
          <div style="font-family: monospace; color: ${statusColor}; margin-bottom: 5px;">
            [${progressBar}${emptyBar}] ${progress.toFixed(0)}%
          </div>
          <div style="color: #00aaff; font-size: 11px; margin-bottom: 3px;">
            Confidence: ${sustained.confidence}%
          </div>
          ${readingInfo}
          ${thresholdMet}
        </div>
      `

      html +=
        '<div style="margin-top: 10px;"><strong>Top Candidates:</strong></div>'

      data.topElements.forEach((elem, idx) => {
        const preview =
          elem.text.substring(0, 60) + (elem.text.length > 60 ? "..." : "")
        const color = idx === 0 ? "#00ff00" : idx === 1 ? "#ffff00" : "#888"
        const cogBadge = elem.cognitivelyAttended ? " 🧠" : ""

        html += `
          <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-left: 3px solid ${color};">
            <div style="color: ${color}; font-weight: bold;">
              #${idx + 1} - Score: ${elem.score.toFixed(0)}${cogBadge}
            </div>
            <div style="font-size: 10px; color: #aaa; margin: 3px 0;">
              ${elem.reasons.join(" + ")}
            </div>
            <div style="font-size: 11px; font-style: italic; margin-top: 5px;">
              "${preview}"
            </div>
          </div>
        `
      })
    }

    html += `
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; font-size: 10px; color: #666;">
        Scroll: ${data.state.scrollVelocity.toFixed(0)} px/s | 
        Active: ${data.state.isPageActive ? "✓" : "✗"} | 
        Elements: ${data.state.textElementsCount}
      </div>
    `

    overlay.innerHTML = html
  }

  private removeDebugOverlay(): void {
    const overlay = document.getElementById(this.debugOverlayId)
    if (overlay) overlay.remove()
  }

  // Green box overlay methods
  private highlightTopElement(
    candidate: AttentionCandidate | undefined,
    sustainedAttention: DebugData["currentSustainedAttention"]
  ): void {
    if (!this.config.showOverlay) return

    this.removeHighlights()

    if (!candidate) return

    const bounds = candidate.bounds
    const highlight = document.createElement("div")
    highlight.className = this.highlightClassName
    highlight.style.cssText = `
      position: absolute;
      left: ${bounds.left + window.scrollX}px;
      top: ${bounds.top + window.scrollY}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      border: 2px solid #00ff00;
      background: rgba(0, 255, 0, 0.1);
      pointer-events: none;
      z-index: 999998;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    `
    document.body.appendChild(highlight)

    // Add reading progress indicator
    if (
      sustainedAttention &&
      sustainedAttention.duration >=
        sustainedAttention.cognitiveAttentionThreshold
    ) {
      if (sustainedAttention.readingProgress > 0) {
        const progressHeight =
          (bounds.height * sustainedAttention.readingProgress) / 100

        const progressOverlay = document.createElement("div")
        progressOverlay.className = this.highlightClassName
        progressOverlay.style.cssText = `
          position: absolute;
          left: ${bounds.left + window.scrollX}px;
          top: ${bounds.top + window.scrollY}px;
          width: ${bounds.width}px;
          height: ${progressHeight}px;
          background: linear-gradient(to bottom, 
            rgba(144, 238, 144, 0.3) 0%, 
            rgba(144, 238, 144, 0.2) 80%,
            rgba(144, 238, 144, 0) 100%);
          pointer-events: none;
          z-index: 999999;
          border-bottom: 2px dashed #90ee90;
        `
        document.body.appendChild(progressOverlay)

        // Add percentage label
        if (sustainedAttention.readingProgress < 100) {
          const label = document.createElement("div")
          label.className = this.highlightClassName
          label.style.cssText = `
            position: absolute;
            left: ${bounds.left + window.scrollX + bounds.width - 60}px;
            top: ${bounds.top + window.scrollY + progressHeight - 20}px;
            background: rgba(144, 238, 144, 0.9);
            color: #000;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-family: monospace;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000000;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          `
          label.textContent = `${sustainedAttention.readingProgress.toFixed(0)}% read`
          document.body.appendChild(label)
        }
      }
    }
  }

  private removeHighlights(): void {
    document
      .querySelectorAll(`.${this.highlightClassName}`)
      .forEach((el) => el.remove())
  }
}

export default CognitiveAttentionUI
