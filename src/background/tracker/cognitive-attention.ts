/**
 * Cognitive Attention Tracking System
 * Predicts what content the user is reading based on multiple behavioral cues
 */

export interface SustainedAttention {
  text: string;
  confidence: number; // 0-100, how confident we are the user was reading this
  wordsRead?: number; // Estimated words read based on reading speed
  totalWords?: number; // Total words in the text
  readingProgress?: number; // Percentage of text read (0-100)
  readingTimeElapsed?: number; // Time spent reading in milliseconds
}

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
  wordsPerMinute?: number; // Average reading speed (default: 200-250 WPM)
  readingProgressInterval?: number; // How often to emit reading progress events (ms)
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
  hoveredImage: HTMLImageElement | null;
  imageHoverStartTime: number | null;
  lastCaptionedImage: string | null;
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
  lastEmittedProgress: number; // Track last reading progress percentage emitted
  lastEmittedTime: number; // Track when we last emitted an event
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
  private lastBroadcastedElement: Element | null = null;
  private imageHoverCheckInterval?: ReturnType<typeof setInterval>;

  constructor(config: CognitiveAttentionConfig = {}) {
    this.onUpdateCallback = config.onUpdate;

    this.config = {
      updateInterval: config.updateInterval || 500,
      mouseHoverThreshold: config.mouseHoverThreshold || 1000,
      idleThreshold: config.idleThreshold || 10000,
      scrollVelocityThreshold: config.scrollVelocityThreshold || 500,
      debugMode: config.debugMode || false,
      minTextLength: config.minTextLength || 20,
      cognitiveAttentionThreshold: config.cognitiveAttentionThreshold || 5000,
      wordsPerMinute: config.wordsPerMinute || 150, // Reading speed
      readingProgressInterval: config.readingProgressInterval || 1000, // Emit every 10s of reading
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
        ".vector-header",
        ".vector-menu",
        ".vector-dropdown",
        ".mw-header",
        ".mw-footer",
        ".mw-navigation",
        ".vector-sticky-header",
        ".vector-page-toolbar",
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
      hoveredImage: null,
      imageHoverStartTime: null,
      lastCaptionedImage: null,
    };

    this.textElements = [];
    this.attentionScores = new Map<Element, AttentionCandidate>();
    this.sustainedAttentionHistory = new Map<Element, SustainedAttentionHistory>();
    this.scrollTimeout = null;

    this.handleMouseMove = (e: MouseEvent) => {
      this.state.mousePosition = { x: e.clientX, y: e.clientY };
      this.state.lastMouseMove = Date.now();
      this.state.lastActivity = Date.now();

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

      this.state.scrollVelocity = Math.abs((scrollDelta / timeDelta) * 1000);
      this.state.scrollPosition = currentScroll;
      this.state.lastScrollTime = now;
      this.state.isScrolling = true;
      this.state.lastActivity = now;

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
    this.discoverTextElements();
    this.setupEventListeners();

    this.trackingInterval = setInterval(() => {
      this.calculateAttention();
    }, this.config.updateInterval);

    this.imageHoverCheckInterval = setInterval(() => {
      this.checkImageHover();
    }, 100);

    if (this.config.debugMode) {
      this.createDebugOverlay();
    }

    return this;
  }

  destroy(): void {
    clearInterval(this.trackingInterval);
    clearInterval(this.imageHoverCheckInterval);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("scroll", this.handleScroll);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    const overlay = document.getElementById("cog-attention-debug");
    if (overlay) overlay.remove();
    
    const captionOverlay = document.getElementById("image-caption-overlay");
    if (captionOverlay) captionOverlay.remove();
  }

  private discoverTextElements(): void {
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

        if (
          !text ||
          text.length < this.config.minTextLength ||
          htmlElem.offsetWidth === 0 ||
          htmlElem.offsetHeight === 0
        ) {
          continue;
        }

        if (this.shouldIgnoreElement(elem)) {
          ignoredCount++;
          continue;
        }

        const isInMainContent = this.isInMainContent(htmlElem);

        this.textElements.push({
          element: htmlElem,
          text: text,
          tag: tag,
          bounds: null,
          isMainContent: isInMainContent,
        });
      }
    });
  }

  private getIgnoreReason(element: Element): string {
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
    let current: Element | null = element;

    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      const role = current.getAttribute("role");
      const id = (current.id || "").toLowerCase();
      const className = (current.className || "").toString().toLowerCase();

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

    return false;
  }

  private shouldIgnoreElement(element: Element): boolean {
    let current: Element | null = element;

    while (current && current !== document.body) {
      const tagName = current.tagName.toLowerCase();
      if (
        ["nav", "header", "footer", "aside", "button", "input", "select", "textarea"].includes(
          tagName
        )
      ) {
        return true;
      }

      for (let selector of this.config.ignoreSelectors) {
        try {
          if (current.matches(selector)) {
            return true;
          }
        } catch (e) {}
      }

      const className = (current.className || "").toString().toLowerCase();
      const id = (current.id || "").toLowerCase();
      const combined = className + " " + id;

      if (
        combined.match(
          /\b(nav|menu|header|footer|sidebar|side-bar|side_bar|advertisement|banner|cookie|popup|modal|dropdown|toolbar|chrome|controls|button|widget)\b/
        )
      ) {
        return true;
      }

      const role = current.getAttribute("role");
      if (
        role &&
        ["navigation", "banner", "complementary", "search", "toolbar", "menu", "menubar"].includes(
          role
        )
      ) {
        return true;
      }

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

  private calculateConfidenceScore(
    candidate: AttentionCandidate,
    sustainedDuration: number
  ): number {
    let confidence = 0;

    // 1. Sustained duration factor (0-40 points)
    const durationFactor = Math.min(
      40,
      (sustainedDuration / this.config.cognitiveAttentionThreshold) * 40
    );
    confidence += durationFactor;

    // 2. Score quality (0-30 points)
    const scoreQuality = Math.min(30, (candidate.score / 115) * 30);
    confidence += scoreQuality;

    // 3. Engagement signals (0-30 points)
    let engagementPoints = 0;

    if (candidate.reasons.some((r) => r.includes("mouse-over-text"))) {
      engagementPoints += 15;
    } else if (candidate.reasons.some((r) => r.includes("hover"))) {
      engagementPoints += 10;
    } else if (candidate.reasons.some((r) => r.includes("proximity"))) {
      engagementPoints += 5;
    }

    if (candidate.reasons.some((r) => r.includes("slow-scroll") || r.includes("no-scroll"))) {
      engagementPoints += 10;
    }

    if (candidate.reasons.some((r) => r.includes("main-content"))) {
      engagementPoints += 5;
    }

    confidence += Math.min(30, engagementPoints);

    return Math.round(Math.min(100, confidence));
  }

  private countWords(text: string): number {
    // Count words in text (split by whitespace)
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private calculateReadingProgress(
    text: string,
    durationMs: number
  ): {
    wordsRead: number;
    totalWords: number;
    readingProgress: number;
  } {
    const totalWords = this.countWords(text);
    const minutesElapsed = durationMs / 60000;
    const wordsRead = Math.min(Math.floor(minutesElapsed * this.config.wordsPerMinute), totalWords);
    const readingProgress = totalWords > 0 ? Math.min(100, (wordsRead / totalWords) * 100) : 0;

    return {
      wordsRead,
      totalWords,
      readingProgress,
    };
  }

  private calculateAttention(): AttentionCandidate[] | void {
    const now = Date.now();
    this.attentionScores.clear();

    const timeSinceLastActivity = now - this.state.lastActivity;
    const isIdle = timeSinceLastActivity > this.config.idleThreshold;

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

      if (!this.isElementInViewport(bounds)) {
        return;
      }

      let score = 0;
      const reasons = [];

      // 1. VIEWPORT POSITION SCORE (0-30 points)
      score += 20;
      reasons.push("in-viewport(20)");

      if (!this.state.isScrolling) {
        const viewportHeight = window.innerHeight;
        const elementCenterY = (bounds.top + bounds.bottom) / 2;
        const viewportCenterY = viewportHeight / 2;
        const distanceFromCenter =
          Math.abs(elementCenterY - viewportCenterY) / (viewportHeight / 2);

        if (distanceFromCenter < 0.5) {
          const centerBonus = Math.floor(10 * (1 - distanceFromCenter * 2));
          score += centerBonus;
          reasons.push(`center-focus(${centerBonus})`);
        }
      }

      // 2. MOUSE PROXIMITY SCORE (0-35 points)
      const mouseX = this.state.mousePosition.x;
      const mouseY = this.state.mousePosition.y;

      if (
        mouseX >= bounds.left &&
        mouseX <= bounds.right &&
        mouseY >= bounds.top &&
        mouseY <= bounds.bottom
      ) {
        const elementAtMouse = document.elementFromPoint(mouseX, mouseY);
        const isTextUnderMouse =
          elementAtMouse === textElem.element || textElem.element.contains(elementAtMouse);
        const hasTextUnderMouse =
          elementAtMouse &&
          "innerText" in elementAtMouse &&
          (elementAtMouse as HTMLElement).innerText &&
          (elementAtMouse as HTMLElement).innerText.trim().length > 0;

        if (isTextUnderMouse && hasTextUnderMouse) {
          score += 25;
          reasons.push("mouse-over-text(25)");

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
          score += 5;
          reasons.push("mouse-near(5)");
        }
      } else {
        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = (bounds.top + bounds.bottom) / 2;
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

        if (distance < 200) {
          const proximityScore = Math.floor(15 * (1 - distance / 200));
          score += proximityScore;
          reasons.push(`proximity(${proximityScore})`);
        }
      }

      // 3. SCROLL BEHAVIOR SCORE (0-25 points)
      if (this.state.isScrolling) {
        if (this.state.scrollVelocity > this.config.scrollVelocityThreshold) {
          score -= 15;
          reasons.push("fast-scroll(-15)");
        } else {
          score += 15;
          reasons.push("slow-scroll(15)");
        }
      } else {
        score += 10;
        reasons.push("no-scroll(10)");
      }

      // 4. ELEMENT IMPORTANCE SCORE (0-10 points)
      const tag = textElem.tag.toLowerCase();
      if (tag.match(/^h[1-3]$/)) {
        score += 10;
        reasons.push("heading(10)");
      } else if (tag.match(/^h[4-6]$/)) {
        score += 5;
        reasons.push("subheading(5)");
      }

      const style = window.getComputedStyle(textElem.element);
      if (style.fontWeight === "bold" || parseInt(style.fontWeight) >= 600) {
        score += 3;
        reasons.push("bold(3)");
      }

      // 5. MAIN CONTENT AREA BONUS (0-15 points)
      if (textElem.isMainContent) {
        score += 15;
        reasons.push("main-content(15)");
      }

      candidates.push({
        element: textElem.element,
        text: textElem.text,
        score: Math.max(0, score),
        reasons: reasons,
        bounds: bounds,
      });
    });

    candidates.sort((a, b) => b.score - a.score);

    const topCandidate = candidates[0];

    if (topCandidate) {
      if (this.state.currentTopElement !== topCandidate.element) {
        this.state.currentTopElement = topCandidate.element;
        this.state.topElementStartTime = now;

        if (!this.sustainedAttentionHistory.has(topCandidate.element)) {
          this.sustainedAttentionHistory.set(topCandidate.element, {
            element: topCandidate.element,
            text: topCandidate.text,
            firstSeenAt: now,
            totalDuration: 0,
            lastEmittedProgress: 0,
            lastEmittedTime: now,
          });
        }
      }

      const sustainedDuration =
        this.state.topElementStartTime !== null ? now - this.state.topElementStartTime : 0;

      const history = this.sustainedAttentionHistory.get(topCandidate.element);
      if (history) {
        history.totalDuration = sustainedDuration;

        if (sustainedDuration >= this.config.cognitiveAttentionThreshold) {
          topCandidate.cognitivelyAttended = true;
          topCandidate.sustainedDuration = sustainedDuration;
        }
      }
    }

    candidates.slice(0, 10).forEach((candidate) => {
      this.attentionScores.set(candidate.element, candidate);
    });

    if (this.config.debugMode) {
      this.updateDebugOverlay({
        message: "👁️ Tracking active",
        topElements: candidates.slice(0, 5),
      });
      this.highlightTopElement(candidates[0]);
    }

    if (this.onUpdateCallback && candidates.length > 0 && topCandidate) {
      const sustainedDuration =
        this.state.topElementStartTime !== null ? now - this.state.topElementStartTime : 0;
      const metThreshold = sustainedDuration >= this.config.cognitiveAttentionThreshold;

      if (metThreshold) {
        const history = this.sustainedAttentionHistory.get(topCandidate.element);

        if (history) {
          const readingProgress = this.calculateReadingProgress(
            topCandidate.text,
            sustainedDuration
          );
          const timeSinceLastEmit = now - history.lastEmittedTime;

          // Emit if:
          // 1. It's a new element (different from last broadcasted), OR
          // 2. Enough time has passed since last emission (readingProgressInterval), OR
          // 3. User has progressed significantly in reading (at least 10% more)
          const isNewElement = topCandidate.element !== this.lastBroadcastedElement;
          const hasEnoughTimePassed = timeSinceLastEmit >= this.config.readingProgressInterval;
          const hasProgressedEnough =
            readingProgress.readingProgress >= history.lastEmittedProgress + 10;

          if (isNewElement || hasEnoughTimePassed || hasProgressedEnough) {
            const confidence = this.calculateConfidenceScore(topCandidate, sustainedDuration);

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
                text: topCandidate.text,
                confidence: confidence,
                wordsRead: readingProgress.wordsRead,
                totalWords: readingProgress.totalWords,
                readingProgress: readingProgress.readingProgress,
                readingTimeElapsed: sustainedDuration,
              },
            };

            this.onUpdateCallback(updateData);
            this.lastBroadcastedElement = topCandidate.element;
            history.lastEmittedProgress = readingProgress.readingProgress;
            history.lastEmittedTime = now;
          }
        }
      }
    }

    return candidates;
  }

  getTopAttention(count = 1): AttentionCandidate | AttentionCandidate[] | undefined {
    const sorted = Array.from(this.attentionScores.values()).sort((a, b) => b.score - a.score);
    return count === 1 ? sorted[0] : sorted.slice(0, count);
  }

  getCognitivelyAttendedElements(): SustainedAttentionHistory[] {
    return Array.from(this.sustainedAttentionHistory.values())
      .filter((history) => history.totalDuration >= this.config.cognitiveAttentionThreshold)
      .sort((a, b) => b.totalDuration - a.totalDuration);
  }

  getCurrentSustainedAttention(): SustainedAttention | null {
    if (!this.state.currentTopElement || this.state.topElementStartTime === null) return null;

    const duration = Date.now() - this.state.topElementStartTime;
    const history = this.sustainedAttentionHistory.get(this.state.currentTopElement);
    const topCandidate = this.attentionScores.get(this.state.currentTopElement);

    if (!topCandidate) return null;

    const confidence = this.calculateConfidenceScore(topCandidate, duration);
    const readingProgress = this.calculateReadingProgress(topCandidate.text, duration);

    return {
      text: history?.text || (this.state.currentTopElement as HTMLElement).innerText || "",
      confidence: confidence,
      wordsRead: readingProgress.wordsRead,
      totalWords: readingProgress.totalWords,
      readingProgress: readingProgress.readingProgress,
      readingTimeElapsed: duration,
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
      const sustained = this.getCurrentSustainedAttention();
      if (sustained && this.state.topElementStartTime !== null) {
        const duration = Date.now() - this.state.topElementStartTime;
        const progress = Math.min(100, (duration / this.config.cognitiveAttentionThreshold) * 100);
        const progressBar = "█".repeat(Math.floor(progress / 10));
        const emptyBar = "░".repeat(10 - Math.floor(progress / 10));
        const metThreshold = duration >= this.config.cognitiveAttentionThreshold;
        const statusIcon = metThreshold ? "✓" : "⏱️";
        const statusColor = metThreshold ? "#00ff00" : "#ffaa00";

        const readingInfo =
          sustained.wordsRead !== undefined && sustained.totalWords !== undefined
            ? `<div style="color: #00ff88; font-size: 11px; margin-bottom: 3px;">
              Reading: ${sustained.wordsRead} / ${sustained.totalWords} words (${sustained.readingProgress?.toFixed(0)}%)
            </div>
            <div style="color: #888; font-size: 10px;">
              @ ${this.config.wordsPerMinute} WPM
            </div>`
            : "";

        const thresholdMet = metThreshold
          ? '<div style="color: #00ff00; font-size: 10px; margin-top: 5px;">✓ Cognitive attention threshold met!</div>'
          : "";

        html += `
          <div style="margin: 10px 0; padding: 10px; background: rgba(0,100,255,0.1); border: 2px solid ${statusColor}; border-radius: 5px;">
            <div style="color: ${statusColor}; font-weight: bold; margin-bottom: 5px;">
              ${statusIcon} SUSTAINED ATTENTION: ${(duration / 1000).toFixed(1)}s / ${(this.config.cognitiveAttentionThreshold / 1000).toFixed(0)}s
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

    // Add reading progress indicator
    if (this.state.currentTopElement && this.state.topElementStartTime !== null) {
      const duration = Date.now() - this.state.topElementStartTime;
      const readingProgress = this.calculateReadingProgress(candidate.text, duration);

      // Only show progress overlay if threshold is met and there's actual progress
      if (
        duration >= this.config.cognitiveAttentionThreshold &&
        readingProgress.readingProgress > 0
      ) {
        const progressOverlay = document.createElement("div");
        progressOverlay.className = "cog-attention-highlight";

        // Calculate height based on reading progress
        const progressHeight = (bounds.height * readingProgress.readingProgress) / 100;

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
        `;
        document.body.appendChild(progressOverlay);

        // Add a small label showing percentage read
        if (readingProgress.readingProgress < 100) {
          const label = document.createElement("div");
          label.className = "cog-attention-highlight";
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
          `;
          label.textContent = `${readingProgress.readingProgress.toFixed(0)}% read`;
          document.body.appendChild(label);
        }
      }
    }
  }

  private checkImageHover(): void {
    const hoveredElement = document.elementFromPoint(
      this.state.mousePosition.x,
      this.state.mousePosition.y
    );

    let imageElement: HTMLImageElement | null = null;
    if (hoveredElement instanceof HTMLImageElement) {
      imageElement = hoveredElement;
    } else if (hoveredElement) {
      const parentImg = hoveredElement.closest("img");
      if (parentImg instanceof HTMLImageElement) {
        imageElement = parentImg;
      }
    }

    if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
      if (this.state.hoveredImage !== imageElement) {
        this.state.hoveredImage = imageElement;
        this.state.imageHoverStartTime = Date.now();
        this.showImageHoverHighlight(imageElement);
      } else {
        const hoverDuration = Date.now() - (this.state.imageHoverStartTime || 0);
        this.updateImageHoverProgress(imageElement, hoverDuration);
        
        if (
          hoverDuration >= 1500 &&
          this.state.lastCaptionedImage !== imageElement.src
        ) {
          this.state.lastCaptionedImage = imageElement.src;
          this.generateImageCaption(imageElement);
        }
      }
    } else {
      if (this.state.hoveredImage) {
        this.state.hoveredImage = null;
        this.state.imageHoverStartTime = null;
        this.hideImageHoverHighlight();
        this.hideImageCaptionOverlay();
      }
    }
  }

  private showImageHoverHighlight(image: HTMLImageElement): void {
    this.hideImageHoverHighlight();

    const bounds = image.getBoundingClientRect();
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "image-hover-highlight image-hover-svg");
    svg.style.cssText = `
      position: fixed;
      left: ${bounds.left}px;
      top: ${bounds.top}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      pointer-events: none;
      z-index: 999997;
    `;

    // Calculate perimeter for the progress stroke
    const width = bounds.width;
    const height = bounds.height;
    const perimeter = 2 * (width + height);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0.5");
    rect.setAttribute("y", "0.5");
    rect.setAttribute("width", (width - 1).toString());
    rect.setAttribute("height", (height - 1).toString());
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", "#bfff00");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", perimeter.toString());
    rect.setAttribute("stroke-dashoffset", perimeter.toString());
    rect.setAttribute("class", "image-hover-progress");
    rect.style.filter = "drop-shadow(0 0 4px rgba(191, 255, 0, 0.8))";

    svg.appendChild(rect);
    document.body.appendChild(svg);

    const overlay = document.createElement("div");
    overlay.className = "image-hover-highlight";
    overlay.style.cssText = `
      position: fixed;
      left: ${bounds.left}px;
      top: ${bounds.top}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      background: rgba(191, 255, 0, 0.08);
      pointer-events: none;
      z-index: 999996;
      border-radius: 2px;
    `;
    document.body.appendChild(overlay);
  }

  private updateImageHoverProgress(image: HTMLImageElement, hoverDuration: number): void {
    const progressRect = document.querySelector(".image-hover-progress") as SVGRectElement;
    const svg = document.querySelector(".image-hover-svg") as SVGElement;
    const overlay = document.querySelectorAll(".image-hover-highlight")[1] as HTMLElement;
    
    if (!progressRect || !svg) return;

    // Update position to track image on scroll
    const bounds = image.getBoundingClientRect();
    svg.style.left = `${bounds.left}px`;
    svg.style.top = `${bounds.top}px`;
    if (overlay) {
      overlay.style.left = `${bounds.left}px`;
      overlay.style.top = `${bounds.top}px`;
    }

    // Progress over 2 seconds (2000ms) - clockwise
    const progress = Math.min(100, (hoverDuration / 2000) * 100);
    const perimeter = parseFloat(progressRect.getAttribute("stroke-dasharray") || "0");
    const offset = perimeter - (perimeter * progress) / 100;
    progressRect.setAttribute("stroke-dashoffset", offset.toString());

    if (progress >= 100) {
      progressRect.style.animation = "pulse 0.5s ease-in-out infinite";
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `;
      if (!document.querySelector('style[data-image-pulse]')) {
        style.setAttribute('data-image-pulse', 'true');
        document.head.appendChild(style);
      }
    }
  }

  private hideImageHoverHighlight(): void {
    document.querySelectorAll(".image-hover-highlight").forEach((el) => {
      el.remove();
    });
  }

  private async generateImageCaption(image: HTMLImageElement): Promise<void> {
    try {
      const src = image.src;
      const alt = image.alt || "";
      const title = image.title || "";

      const response = await fetch(src);
      const blob = await response.blob();

      // Convert blob to base64 for message passing
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        chrome.runtime.sendMessage(
          {
            type: "IMAGE_CAPTION_REQUEST",
            data: {
              src,
              alt,
              title,
              imageData: base64data,
              mimeType: blob.type,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("[Image Caption Error]", chrome.runtime.lastError);
              return;
            }

            if (response && response.caption) {
              console.log("[Image Caption Generated]", {
                src,
                alt,
                title,
                caption: response.caption,
              });

              this.hideImageHoverHighlight();
              this.showImageCaptionOverlay(image, response.caption);
            }
          }
        );
      };

      reader.onerror = () => {
        console.error("[Image Caption Error] Failed to read image blob");
      };
    } catch (error) {
      console.error("[Image Caption Error]", error);
    }
  }

  private showImageCaptionOverlay(image: HTMLImageElement, caption: string): void {
    this.hideImageCaptionOverlay();

    const bounds = image.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.id = "image-caption-overlay";
    overlay.style.cssText = `
      position: fixed;
      left: ${bounds.left}px;
      top: ${bounds.bottom + 10}px;
      background: rgba(0, 0, 0, 0.9);
      color: #ffffff;
      padding: 10px 15px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 999999;
      max-width: ${Math.min(bounds.width, 400)}px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      pointer-events: none;
    `;
    overlay.textContent = caption;
    document.body.appendChild(overlay);
  }

  private hideImageCaptionOverlay(): void {
    const overlay = document.getElementById("image-caption-overlay");
    if (overlay) overlay.remove();
  }
}

export default CognitiveAttentionTracker;
export type { AttentionUpdateData, SustainedAttention };
