/**
 * Cognitive Attention Tracking System
 * Predicts what content the user is reading based on multiple behavioral cues
 */

interface AttentionUpdateData {
  timestamp: number;
  url: string;
  title: string;
  topElements: Array<{
    rank: number;
    text: string;
    score: number;
    reasons: string[];
    cognitivelyAttended: boolean;
    sustainedDuration?: number;
  }>;
  currentSustainedAttention: SustainedAttention | null;
}

interface CognitiveAttentionConfig {
  updateInterval?: number;
  mouseHoverThreshold?: number;
  idleThreshold?: number;
  scrollVelocityThreshold?: number;
  debugMode?: boolean;
  minTextLength?: number;
  cognitiveAttentionThreshold?: number;
  ignoreSelectors?: string[];
  onUpdate?: (data: AttentionUpdateData) => void;
}

interface TrackerState {
  mousePosition: { x: number; y: number };
  lastMouseMove: number;
  isPageActive: boolean;
  scrollPosition: number;
  lastScrollTime: number;
  scrollVelocity: number;
  mouseHoverElement: Element | null;
  mouseHoverStartTime: number | null;
  isScrolling: boolean;
  lastActivity: number;
  currentTopElement: Element | null;
  topElementStartTime: number | null;
}

interface TextElement {
  element: HTMLElement;
  text: string;
  tag: string;
  bounds: DOMRect | null;
  isMainContent: boolean;
}

interface AttentionCandidate {
  element: Element;
  text: string;
  score: number;
  reasons: string[];
  bounds: DOMRect;
  cognitivelyAttended?: boolean;
  sustainedDuration?: number;
}

interface SustainedAttentionHistory {
  element: Element;
  text: string;
  firstSeenAt: number;
  totalDuration: number;
  sessions: any[];
}

interface CurrentSustainedAttention {
  element: Element;
  text: string;
  currentDuration: number;
  metThreshold: boolean;
  thresholdProgress: number;
}

interface DebugOverlayData {
  message: string;
  topElements: AttentionCandidate[];
}

class CognitiveAttentionTracker {
  private config: Required<Omit<CognitiveAttentionConfig, "onUpdate">>;
  private onUpdateCallback?: (data: AttentionUpdateData) => void;
  private state: TrackerState;
  private textElements: TextElement[];
  private attentionScores: Map<Element, AttentionCandidate>;
  private sustainedAttentionHistory: Map<Element, SustainedAttentionHistory>;
  private scrollTimeout: ReturnType<typeof setTimeout> | null;
  private trackingInterval?: ReturnType<typeof setInterval>;
  private handleMouseMove: (e: MouseEvent) => void;
  private handleScroll: () => void;
  private handleVisibilityChange: () => void;
  private lastBroadcastedElement: Element | null = null; // Track what we've already broadcasted

  constructor(config: CognitiveAttentionConfig = {}) {
    // Store the callback separately
    this.onUpdateCallback = config.onUpdate;

    // Configuration
    this.config = {
      updateInterval: config.updateInterval || 500, // ms
      mouseHoverThreshold: config.mouseHoverThreshold || 1000, // ms
      idleThreshold: config.idleThreshold || 10000, // ms - user truly idle (no activity)
      scrollVelocityThreshold: config.scrollVelocityThreshold || 500, // px/s
      debugMode: config.debugMode || false,
      minTextLength: config.minTextLength || 20, // minimum characters for text element
      cognitiveAttentionThreshold: config.cognitiveAttentionThreshold || 5000, // ms - minimum time to consider true attention
      ignoreSelectors: config.ignoreSelectors || [
        "nav",
        "header",
        "footer",
        "aside",
        "button",
        ".nav",
        ".navigation",
        ".navbar",
        ".menu",
        ".menubar",
        ".header",
        ".footer",
        ".sidebar",
        ".side-bar",
        ".side_bar",
        ".advertisement",
        ".ad",
        ".ads",
        ".promo",
        ".cookie-banner",
        ".cookie-notice",
        ".popup",
        ".modal",
        ".overlay",
        ".toolbar",
        ".chrome",
        ".controls",
        ".dropdown",
        ".dropdown-menu",
        // Wikipedia-specific
        ".vector-header",
        ".vector-menu",
        ".vector-dropdown",
        ".mw-header",
        ".mw-footer",
        ".mw-navigation",
        ".vector-sticky-header",
        ".vector-page-toolbar",
        // ARIA roles
        '[role="navigation"]',
        '[role="banner"]',
        '[role="complementary"]',
        '[role="search"]',
        '[role="toolbar"]',
        '[role="menu"]',
        '[aria-label*="navigation" i]',
        '[aria-label*="menu" i]',
      ],
      ...config,
    };

    // State
    this.state = {
      mousePosition: { x: 0, y: 0 },
      lastMouseMove: Date.now(),
      isPageActive: true,
      scrollPosition: 0,
      lastScrollTime: Date.now(),
      scrollVelocity: 0,
      mouseHoverElement: null,
      mouseHoverStartTime: null,
      isScrolling: false,
      lastActivity: Date.now(),
      currentTopElement: null,
      topElementStartTime: null,
    };

    // Tracking data
    this.textElements = [];
    this.attentionScores = new Map<Element, AttentionCandidate>();
    this.sustainedAttentionHistory = new Map<Element, SustainedAttentionHistory>(); // Track how long each element has been top
    this.scrollTimeout = null;

    // Initialize event handlers
    this.handleMouseMove = (e: MouseEvent) => {
      this.state.mousePosition = { x: e.clientX, y: e.clientY };
      this.state.lastMouseMove = Date.now();
      this.state.lastActivity = Date.now();

      // Check if hovering over text element
      const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);

      if (hoveredElement !== this.state.mouseHoverElement) {
        this.state.mouseHoverElement = hoveredElement;
        this.state.mouseHoverStartTime = Date.now();
      }
    };

    this.handleScroll = () => {
      const now = Date.now();
      const currentScroll = window.scrollY;
      const timeDelta = now - this.state.lastScrollTime;
      const scrollDelta = currentScroll - this.state.scrollPosition;

      // Calculate scroll velocity (pixels per second)
      this.state.scrollVelocity = Math.abs((scrollDelta / timeDelta) * 1000);
      this.state.scrollPosition = currentScroll;
      this.state.lastScrollTime = now;
      this.state.isScrolling = true;
      this.state.lastActivity = now;

      // Reset scrolling flag after delay
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.state.isScrolling = false;
        this.state.scrollVelocity = 0;
      }, 150);
    };

    this.handleVisibilityChange = () => {
      this.state.isPageActive = !document.hidden;
      if (this.state.isPageActive) {
        this.state.lastActivity = Date.now();
      }
    };
  }

  init(): this {
    // Cognitive Attention Tracker initialized

    // Discover all text elements
    this.discoverTextElements();

    // Set up event listeners
    this.setupEventListeners();

    // Start tracking loop
    this.trackingInterval = setInterval(() => {
      this.calculateAttention();
    }, this.config.updateInterval);

    // Create debug overlay if enabled
    if (this.config.debugMode) {
      this.createDebugOverlay();
    }

    return this;
  }

  destroy(): void {
    clearInterval(this.trackingInterval);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

    // Remove event listeners
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("scroll", this.handleScroll);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    // Remove debug overlay
    const overlay = document.getElementById("cog-attention-debug");
    if (overlay) overlay.remove();
  }

  private discoverTextElements(): void {
    // Find all text-containing elements - focusing on content tags only
    // Excluded: 'span', 'div', 'a' as they're often in navigation/UI chrome
    const textTags = [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "td",
      "blockquote",
      "article",
      "section",
    ];

    this.textElements = [];
    let ignoredCount = 0;

    textTags.forEach((tag) => {
      const elements = document.getElementsByTagName(tag);

      for (let elem of Array.from(elements)) {
        const htmlElem = elem as HTMLElement;
        const text = htmlElem.innerText?.trim();

        // Filter out elements with insufficient text or hidden elements
        if (
          !text ||
          text.length < this.config.minTextLength ||
          htmlElem.offsetWidth === 0 ||
          htmlElem.offsetHeight === 0
        ) {
          continue;
        }

        // Check if element or any parent matches ignore selectors
        if (this.shouldIgnoreElement(elem)) {
          ignoredCount++;
          continue;
        }

        // Additional check: prioritize elements in main content areas
        const isInMainContent = this.isInMainContent(htmlElem);

        this.textElements.push({
          element: htmlElem,
          text: text,
          tag: tag,
          bounds: null, // Will be calculated dynamically
          isMainContent: isInMainContent,
        });
      }
    });
  }

  private getIgnoreReason(element: Element): string {
    // Helper method to explain why an element is ignored (for debugging)
    let current: Element | null = element;

    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      if (
        ["nav", "header", "footer", "aside", "button", "input", "select", "textarea"].includes(
          tagName
        )
      ) {
        return `parent <${tagName}>`;
      }

      const className = (current.className || "").toString().toLowerCase();
      const id = (current.id || "").toLowerCase();
      const combined = className + " " + id;

      if (
        combined.match(
          /\b(nav|menu|header|footer|sidebar|side-bar|side_bar|advertisement|banner|cookie|popup|modal|dropdown|toolbar|chrome|controls|button|widget)\b/
        )
      ) {
        const match = combined.match(
          /\b(nav|menu|header|footer|sidebar|side-bar|side_bar|advertisement|banner|cookie|popup|modal|dropdown|toolbar|chrome|controls|button|widget)\b/
        );
        return match ? `class/id contains "${match[0]}"` : "unknown";
      }

      const role = current.getAttribute("role");
      if (
        role &&
        ["navigation", "banner", "complementary", "search", "toolbar", "menu", "menubar"].includes(
          role
        )
      ) {
        return `role="${role}"`;
      }

      current = current.parentElement as Element | null;
    }

    return "unknown";
  }

  private isInMainContent(element: Element): boolean {
    // Check if element is within main content area (not chrome/UI)
    let current: Element | null = element;

    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const role = current.getAttribute("role");
      const id = (current.id || "").toLowerCase();
      const className = (current.className || "").toString().toLowerCase();

      // Positive signals - element is in main content
      if (
        tagName === "main" ||
        tagName === "article" ||
        role === "main" ||
        role === "article" ||
        id.includes("content") ||
        id.includes("main") ||
        className.includes("content") ||
        className.includes("article")
      ) {
        return true;
      }

      current = current.parentElement as Element | null;
    }

    return false; // No main content indicator found
  }

  private shouldIgnoreElement(element: Element): boolean {
    // Check if element itself or any ancestor matches ignore criteria
    let current: Element | null = element;

    while (current && current !== document.body) {
      // Check tag name - immediately reject common non-content elements
      const tagName = current.tagName.toLowerCase();
      if (
        ["nav", "header", "footer", "aside", "button", "input", "select", "textarea"].includes(
          tagName
        )
      ) {
        return true;
      }

      // Check against CSS selectors
      for (let selector of this.config.ignoreSelectors) {
        try {
          if (current.matches(selector)) {
            return true;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }

      // Check common class/id patterns (more comprehensive)
      const className = (current.className || "").toString().toLowerCase();
      const id = (current.id || "").toLowerCase();
      const combined = className + " " + id;

      // More aggressive pattern matching for navigation, menus, UI chrome
      if (
        combined.match(
          /\b(nav|menu|header|footer|sidebar|side-bar|side_bar|advertisement|banner|cookie|popup|modal|dropdown|toolbar|chrome|controls|button|widget)\b/
        )
      ) {
        return true;
      }

      // Check ARIA roles that indicate non-content areas
      const role = current.getAttribute("role");
      if (
        role &&
        ["navigation", "banner", "complementary", "search", "toolbar", "menu", "menubar"].includes(
          role
        )
      ) {
        return true;
      }

      // Check aria-label for navigation-related keywords
      const ariaLabel = (current.getAttribute("aria-label") || "").toLowerCase();
      if (ariaLabel.match(/\b(navigation|menu|nav|banner|header|footer|sidebar)\b/)) {
        return true;
      }

      current = current.parentElement as Element | null;
    }

    return false;
  }

  private setupEventListeners(): void {
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("scroll", this.handleScroll, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private isElementInViewport(bounds: DOMRect): boolean {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    return (
      bounds.top < viewportHeight &&
      bounds.bottom > 0 &&
      bounds.left < viewportWidth &&
      bounds.right > 0
    );
  }

  private calculateAttention(): AttentionCandidate[] | void {
    const now = Date.now();
    this.attentionScores.clear();

    // Check idle state
    const timeSinceLastActivity = now - this.state.lastActivity;
    const isIdle = timeSinceLastActivity > this.config.idleThreshold;

    // If page is not active or user is idle for too long, reduce all scores
    if (!this.state.isPageActive || isIdle) {
      if (this.config.debugMode) {
        this.updateDebugOverlay({
          message: isIdle ? "💤 User is idle" : "👋 Page not active",
          topElements: [],
        });
      }
      return;
    }

    const candidates: AttentionCandidate[] = [];

    this.textElements.forEach((textElem: TextElement) => {
      const bounds = textElem.element.getBoundingClientRect();
      textElem.bounds = bounds;

      // Skip if not in viewport
      if (!this.isElementInViewport(bounds)) {
        return;
      }

      let score = 0;
      const reasons = [];

      // 1. VIEWPORT POSITION SCORE (0-30 points)
      // Base score for being in viewport
      score += 20;
      reasons.push("in-viewport(20)");

      // Additional bonus for center area when NOT scrolling (user is likely reading)
      if (!this.state.isScrolling) {
        const viewportHeight = window.innerHeight;
        const elementCenterY = (bounds.top + bounds.bottom) / 2;
        const viewportCenterY = viewportHeight / 2;

        // Calculate distance from viewport center (0 = perfect center, 1 = edge)
        const distanceFromCenter =
          Math.abs(elementCenterY - viewportCenterY) / (viewportHeight / 2);

        // Give up to 10 bonus points for being near center (when not scrolling)
        if (distanceFromCenter < 0.5) {
          // Within center 50% of viewport
          const centerBonus = Math.floor(10 * (1 - distanceFromCenter * 2));
          score += centerBonus;
          reasons.push(`center-focus(${centerBonus})`);
        }
      }

      // 2. MOUSE PROXIMITY SCORE (0-35 points)
      const mouseX = this.state.mousePosition.x;
      const mouseY = this.state.mousePosition.y;

      // Check if mouse is within element bounds
      if (
        mouseX >= bounds.left &&
        mouseX <= bounds.right &&
        mouseY >= bounds.top &&
        mouseY <= bounds.bottom
      ) {
        // IMPORTANT: Only give points if there's actual text under the mouse cursor
        // Get the element directly at mouse position
        const elementAtMouse = document.elementFromPoint(mouseX, mouseY);

        // Check if the element at mouse position is the text element itself or a child of it
        const isTextUnderMouse =
          elementAtMouse === textElem.element || textElem.element.contains(elementAtMouse);

        // Also verify the element at mouse has text content (not an image, empty div, etc)
        const hasTextUnderMouse =
          elementAtMouse &&
          "innerText" in elementAtMouse &&
          (elementAtMouse as HTMLElement).innerText &&
          (elementAtMouse as HTMLElement).innerText.trim().length > 0;

        if (isTextUnderMouse && hasTextUnderMouse) {
          // Mouse is directly over text element with actual text
          score += 25;
          reasons.push("mouse-over-text(25)");

          // Bonus if hovering for a while
          if (
            this.state.mouseHoverElement === textElem.element &&
            this.state.mouseHoverStartTime !== null
          ) {
            const hoverDuration = now - this.state.mouseHoverStartTime;
            if (hoverDuration > this.config.mouseHoverThreshold) {
              score += 10;
              reasons.push(`hover-${Math.floor(hoverDuration / 1000)}s(10)`);
            }
          }
        } else {
          // Mouse is over the element bounds but not over actual text
          // Give much smaller proximity bonus
          score += 5;
          reasons.push("mouse-near(5)");
        }
      } else {
        // Calculate proximity to mouse (closer = higher score)
        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

        // Within 200px gets partial points
        if (distance < 200) {
          const proximityScore = Math.floor(15 * (1 - distance / 200));
          score += proximityScore;
          reasons.push(`proximity(${proximityScore})`);
        }
      }

      // 3. SCROLL BEHAVIOR SCORE (0-25 points)
      if (this.state.isScrolling) {
        // Fast scrolling = probably not reading
        if (this.state.scrollVelocity > this.config.scrollVelocityThreshold) {
          score -= 15;
          reasons.push("fast-scroll(-15)");
        } else {
          // Slow scrolling = probably reading
          score += 15;
          reasons.push("slow-scroll(15)");
        }
      } else {
        // Not scrolling = likely reading
        score += 10;
        reasons.push("no-scroll(10)");
      }

      // 4. ELEMENT IMPORTANCE SCORE (0-10 points)
      // Headings and emphasized content get bonus
      const tag = textElem.tag.toLowerCase();
      if (tag.match(/^h[1-3]$/)) {
        score += 10;
        reasons.push("heading(10)");
      } else if (tag.match(/^h[4-6]$/)) {
        score += 5;
        reasons.push("subheading(5)");
      }

      // Bold or emphasized text
      const style = window.getComputedStyle(textElem.element);
      if (style.fontWeight === "bold" || parseInt(style.fontWeight) >= 600) {
        score += 3;
        reasons.push("bold(3)");
      }

      // 5. MAIN CONTENT AREA BONUS (0-15 points)
      // Strongly prefer elements in main content area
      if (textElem.isMainContent) {
        score += 15;
        reasons.push("main-content(15)");
      }

      candidates.push({
        element: textElem.element,
        text: textElem.text,
        score: Math.max(0, score), // Ensure non-negative
        reasons: reasons,
        bounds: bounds,
      });
    });

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Track sustained attention on top element
    const topCandidate = candidates[0];

    if (topCandidate) {
      // Check if top element changed
      if (this.state.currentTopElement !== topCandidate.element) {
        this.state.currentTopElement = topCandidate.element;
        this.state.topElementStartTime = now;

        // Initialize sustained attention tracking for this element
        if (!this.sustainedAttentionHistory.has(topCandidate.element)) {
          this.sustainedAttentionHistory.set(topCandidate.element, {
            element: topCandidate.element,
            text: topCandidate.text,
            firstSeenAt: now,
            totalDuration: 0,
            sessions: [],
          });
        }
      }

      // Calculate how long this element has been top
      const sustainedDuration =
        this.state.topElementStartTime !== null ? now - this.state.topElementStartTime : 0;

      // Update sustained attention history
      const history = this.sustainedAttentionHistory.get(topCandidate.element);
      if (history) {
        history.totalDuration = sustainedDuration;

        // Mark as cognitively attended if threshold met
        if (sustainedDuration >= this.config.cognitiveAttentionThreshold) {
          topCandidate.cognitivelyAttended = true;
          topCandidate.sustainedDuration = sustainedDuration;
        }
      }
    }

    // Store top candidates
    candidates.slice(0, 10).forEach((candidate) => {
      this.attentionScores.set(candidate.element, candidate);
    });

    // Update debug display
    if (this.config.debugMode) {
      this.updateDebugOverlay({
        message: "👁️ Tracking active",
        topElements: candidates.slice(0, 5),
      });
      this.highlightTopElement(candidates[0]);
    }

    // Only broadcast when sustained attention threshold is met (and it's a new element)
    if (this.onUpdateCallback && candidates.length > 0) {
      const currentSustained = this.getCurrentSustainedAttention();

      // Only trigger callback if:
      // 1. Sustained attention threshold is met
      // 2. It's a different element than we last broadcasted
      if (
        currentSustained?.metThreshold &&
        currentSustained.element !== this.lastBroadcastedElement
      ) {
        const updateData: AttentionUpdateData = {
          timestamp: Date.now(),
          url: window.location.href,
          title: document.title,
          topElements: candidates.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            text: item.text,
            score: item.score,
            reasons: item.reasons,
            cognitivelyAttended: item.cognitivelyAttended || false,
            sustainedDuration: item.sustainedDuration,
          })),
          currentSustainedAttention: {
            text: currentSustained.text,
            currentDuration: currentSustained.currentDuration,
            metThreshold: currentSustained.metThreshold,
            thresholdProgress: currentSustained.thresholdProgress,
          },
        };

        this.onUpdateCallback(updateData);
        this.lastBroadcastedElement = currentSustained.element;
      }
    }

    return candidates;
  }

  getTopAttention(count = 1): AttentionCandidate | AttentionCandidate[] | undefined {
    const sorted = Array.from(this.attentionScores.values()).sort((a, b) => b.score - a.score);

    return count === 1 ? sorted[0] : sorted.slice(0, count);
  }

  getCognitivelyAttendedElements(): SustainedAttentionHistory[] {
    // Returns elements that have received sustained attention (met threshold)
    return Array.from(this.sustainedAttentionHistory.values())
      .filter((history) => history.totalDuration >= this.config.cognitiveAttentionThreshold)
      .sort((a, b) => b.totalDuration - a.totalDuration);
  }

  getCurrentSustainedAttention(): CurrentSustainedAttention | null {
    // Returns current top element and how long it's been attended
    if (!this.state.currentTopElement || this.state.topElementStartTime === null) return null;

    const duration = Date.now() - this.state.topElementStartTime;
    const history = this.sustainedAttentionHistory.get(this.state.currentTopElement);

    return {
      element: this.state.currentTopElement,
      text: history?.text || (this.state.currentTopElement as HTMLElement).innerText || "",
      currentDuration: duration,
      metThreshold: duration >= this.config.cognitiveAttentionThreshold,
      thresholdProgress: Math.min(100, (duration / this.config.cognitiveAttentionThreshold) * 100),
    };
  }

  private createDebugOverlay(): void {
    const overlay = document.createElement("div");
    overlay.id = "cog-attention-debug";
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
    `;
    document.body.appendChild(overlay);
  }

  private updateDebugOverlay(data: DebugOverlayData): void {
    const overlay = document.getElementById("cog-attention-debug");
    if (!overlay) return;

    let html = `
      <div style="border-bottom: 2px solid #00ff00; margin-bottom: 10px; padding-bottom: 5px;">
        <strong>🧠 ATTENTION TRACKER</strong>
      </div>
      <div style="margin-bottom: 10px; color: #ffff00;">
        ${data.message}
      </div>
    `;

    if (data.topElements && data.topElements.length > 0) {
      // Show sustained attention status
      const sustained = this.getCurrentSustainedAttention();
      if (sustained) {
        const progressBar = "█".repeat(Math.floor(sustained.thresholdProgress / 10));
        const emptyBar = "░".repeat(10 - Math.floor(sustained.thresholdProgress / 10));
        const statusIcon = sustained.metThreshold ? "✓" : "⏱️";
        const statusColor = sustained.metThreshold ? "#00ff00" : "#ffaa00";

        html += `
          <div style="margin: 10px 0; padding: 10px; background: rgba(0,100,255,0.1); border: 2px solid ${statusColor}; border-radius: 5px;">
            <div style="color: ${statusColor}; font-weight: bold; margin-bottom: 5px;">
              ${statusIcon} SUSTAINED ATTENTION: ${(sustained.currentDuration / 1000).toFixed(
                1
              )}s / ${(this.config.cognitiveAttentionThreshold / 1000).toFixed(0)}s
            </div>
            <div style="font-family: monospace; color: ${statusColor};">
              [${progressBar}${emptyBar}] ${sustained.thresholdProgress.toFixed(0)}%
            </div>
            ${
              sustained.metThreshold
                ? '<div style="color: #00ff00; font-size: 10px; margin-top: 5px;">✓ Cognitive attention threshold met!</div>'
                : ""
            }
          </div>
        `;
      }

      html += '<div style="margin-top: 10px;"><strong>Top Candidates:</strong></div>';

      data.topElements.forEach((elem, idx) => {
        const preview = elem.text.substring(0, 60) + (elem.text.length > 60 ? "..." : "");
        const color = idx === 0 ? "#00ff00" : idx === 1 ? "#ffff00" : "#888";
        const cogBadge = elem.cognitivelyAttended ? " 🧠" : "";

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
        `;
      });
    }

    // Add stats
    html += `
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333; font-size: 10px; color: #666;">
        Scroll: ${this.state.scrollVelocity.toFixed(0)} px/s | 
        Active: ${this.state.isPageActive ? "✓" : "✗"} | 
        Elements: ${this.textElements.length}
      </div>
    `;

    overlay.innerHTML = html;
  }

  private highlightTopElement(candidate: AttentionCandidate | undefined): void {
    // Remove previous highlights
    document.querySelectorAll(".cog-attention-highlight").forEach((el) => {
      el.remove();
    });

    if (!candidate) return;

    const bounds = candidate.bounds;
    const highlight = document.createElement("div");
    highlight.className = "cog-attention-highlight";
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
    `;
    document.body.appendChild(highlight);
  }
}

export default CognitiveAttentionTracker;
export type { AttentionUpdateData };
