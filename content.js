(() => {
  if (window.__EXAM_COUNTDOWN_REFERENCE_STYLE_FIXED_V6__) return;
  window.__EXAM_COUNTDOWN_REFERENCE_STYLE_FIXED_V6__ = true;

  const STORAGE_KEY = "examCountdownReferenceStyleStateV6";
  const DISPLAY_TIMEZONE = "Asia/Dhaka";

  const BASE_WIDTH = 476;
  const MIN_SCALE = 0.58;
  const MAX_SCALE = 1.55;
  const DEFAULT_SCALE = 1;

  const THEMES = [
    { id: "aurora", short: "A", label: "Aurora" },
    { id: "emerald", short: "E", label: "Emerald" }
  ];

  const BODY_FONT_URL =
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.getURL === "function"
      ? chrome.runtime.getURL("fonts/PlusJakartaSans.ttf")
      : "";

  const TITLE_FONT_URL =
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.getURL === "function"
      ? chrome.runtime.getURL("fonts/BebasNeue-Regular.ttf")
      : "";

  const fontFaceCss = `
    ${BODY_FONT_URL ? `
      @font-face {
        font-family: "Plus Jakarta Sans";
        src: url("${BODY_FONT_URL}") format("truetype");
        font-style: normal;
        font-weight: 200 800;
        font-display: swap;
      }
    ` : ""}

    ${TITLE_FONT_URL ? `
      @font-face {
        font-family: "Bebas Neue Local";
        src: url("${TITLE_FONT_URL}") format("truetype");
        font-style: normal;
        font-weight: 400;
        font-display: swap;
      }
    ` : ""}
  `;

  const rawSchedule = Array.isArray(window.EXAM_SCHEDULE) ? window.EXAM_SCHEDULE : [];

  function buildDate(item) {
    if (item.datetime) return new Date(item.datetime);

    return new Date(
      Number(item.year),
      Number(item.month) - 1,
      Number(item.day),
      Number(item.hour || 0),
      Number(item.minute || 0),
      Number(item.second || 0)
    );
  }

  const exams = rawSchedule
    .map((item, index) => ({
      id: `exam-${index}`,
      code: item.code ? String(item.code) : "",
      subject: item.subject || `Exam ${index + 1}`,
      date: buildDate(item)
    }))
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const examMap = new Map(exams.map(exam => [exam.id, exam]));

  const host = document.createElement("div");
  host.id = "exam-countdown-overlay-host";
  host.style.position = "fixed";
  host.style.top = "72px";
  host.style.right = "16px";
  host.style.left = "auto";
  host.style.bottom = "auto";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  host.style.userSelect = "none";

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      ${fontFaceCss}

      * {
        box-sizing: border-box;
      }

      .card {
        --ui-scale: 1;

        --card-radius: calc(28px * var(--ui-scale));
        --button-radius: calc(16px * var(--ui-scale));
        --pill-radius: calc(28px * var(--ui-scale));

        --glass-border: rgba(255, 255, 255, 0.14);

        --accent-left: rgba(98, 225, 255, 0.22);
        --accent-right: rgba(194, 92, 255, 0.18);
        --accent-bottom: rgba(92, 88, 255, 0.18);

        --glow-left: rgba(87, 227, 255, 0.22);
        --glow-right: rgba(213, 101, 255, 0.18);
        --glow-bottom: rgba(103, 93, 255, 0.18);

        --label-color: rgba(212, 225, 245, 0.92);
        --meta-color: rgba(255, 255, 255, 0.97);

        --subject-1: #ffffff;
        --subject-2: #eef8ff;
        --subject-3: #dff5ff;

        --countdown-text: #d8fff4;
        --countdown-bg:
          linear-gradient(135deg, rgba(47, 84, 90, 0.50), rgba(52, 66, 117, 0.42)),
          rgba(255, 255, 255, 0.06);
        --countdown-border: rgba(255, 255, 255, 0.11);
        --countdown-shadow: rgba(0, 0, 0, 0.18);
        --countdown-glow: rgba(135, 255, 230, 0.10);

        --control-bg:
          linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06)),
          rgba(255,255,255,0.05);
        --control-border: rgba(255,255,255,0.12);
        --control-text: #ffffff;

        --upcoming-bg: rgba(255,255,255,0.04);
        --upcoming-item-bg: rgba(255,255,255,0.05);
        --upcoming-title: rgba(234, 243, 255, 0.95);
        --upcoming-meta: rgba(244, 248, 255, 0.90);
        --upcoming-remaining: #e0fff6;

        position: relative;
        width: calc(${BASE_WIDTH}px * var(--ui-scale));
        max-width: calc(100vw - 16px);
        pointer-events: auto;
        border-radius: var(--card-radius);
        border: 1px solid var(--glass-border);
        overflow: hidden;
        color: #fff;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0.01) 100%),
          radial-gradient(circle at 8% 8%, var(--accent-left) 0%, transparent 28%),
          radial-gradient(circle at 95% 12%, var(--accent-right) 0%, transparent 30%),
          radial-gradient(circle at 72% 96%, var(--accent-bottom) 0%, transparent 34%),
          linear-gradient(180deg, rgba(18, 20, 28, 0.92), rgba(10, 12, 18, 0.95));
        box-shadow:
          0 calc(20px * var(--ui-scale)) calc(48px * var(--ui-scale)) rgba(0, 0, 0, 0.42),
          0 calc(8px * var(--ui-scale)) calc(18px * var(--ui-scale)) rgba(0, 0, 0, 0.18),
          inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(22px) saturate(165%);
        -webkit-backdrop-filter: blur(22px) saturate(165%);
        font-family:
          "Plus Jakarta Sans",
          -apple-system,
          BlinkMacSystemFont,
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          Arial,
          sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      .card::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0) 54%),
          linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
        opacity: 0.95;
      }

      .card::after {
        content: "";
        position: absolute;
        inset: -10%;
        pointer-events: none;
        background:
          radial-gradient(circle at 12% 18%, var(--glow-left), transparent 20%),
          radial-gradient(circle at 88% 24%, var(--glow-right), transparent 22%),
          radial-gradient(circle at 70% 88%, var(--glow-bottom), transparent 22%);
        filter: blur(calc(22px * var(--ui-scale)));
        opacity: 0.75;
      }

      .card.dragging,
      .card.resizing {
        box-shadow:
          0 calc(26px * var(--ui-scale)) calc(56px * var(--ui-scale)) rgba(0, 0, 0, 0.48),
          0 calc(10px * var(--ui-scale)) calc(24px * var(--ui-scale)) rgba(0, 0, 0, 0.20),
          inset 0 1px 0 rgba(255,255,255,0.10);
      }

      .card.theme-aurora {
        --accent-left: rgba(98, 225, 255, 0.24);
        --accent-right: rgba(195, 106, 255, 0.20);
        --accent-bottom: rgba(92, 88, 255, 0.18);

        --glow-left: rgba(98, 225, 255, 0.24);
        --glow-right: rgba(195, 106, 255, 0.18);
        --glow-bottom: rgba(92, 88, 255, 0.18);

        --subject-1: #ffffff;
        --subject-2: #eef8ff;
        --subject-3: #d9f3ff;

        --countdown-text: #d8fff4;
        --countdown-bg:
          linear-gradient(135deg, rgba(52, 88, 90, 0.52), rgba(58, 73, 126, 0.42)),
          rgba(255,255,255,0.06);
        --countdown-glow: rgba(140,255,227,0.10);
      }

      .card.theme-emerald {
        --accent-left: rgba(58, 197, 166, 0.20);
        --accent-right: rgba(61, 121, 212, 0.14);
        --accent-bottom: rgba(60, 164, 92, 0.14);

        --glow-left: rgba(58, 197, 166, 0.18);
        --glow-right: rgba(61, 121, 212, 0.14);
        --glow-bottom: rgba(60, 164, 92, 0.14);

        --label-color: rgba(225, 255, 244, 0.90);
        --meta-color: rgba(245, 255, 250, 0.96);

        --subject-1: #ffffff;
        --subject-2: #ddfff2;
        --subject-3: #baffdf;

        --countdown-text: #e7fff6;
        --countdown-bg:
          linear-gradient(135deg, rgba(34, 86, 73, 0.56), rgba(30, 60, 56, 0.44)),
          rgba(255,255,255,0.06);
        --countdown-glow: rgba(92, 235, 188, 0.10);

        --control-bg:
          linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05)),
          linear-gradient(135deg, rgba(34, 98, 78, 0.25), rgba(26, 65, 54, 0.22));
      }

      .card.state-soon {
        --countdown-text: #ffe7b3;
        --countdown-bg:
          linear-gradient(135deg, rgba(126, 96, 34, 0.58), rgba(97, 56, 25, 0.44)),
          rgba(255,255,255,0.06);
        --countdown-glow: rgba(255, 200, 85, 0.12);
      }

      .card.state-now {
        --countdown-text: #ffd5df;
        --countdown-bg:
          linear-gradient(135deg, rgba(124, 44, 64, 0.62), rgba(85, 20, 40, 0.48)),
          rgba(255,255,255,0.06);
        --countdown-glow: rgba(255, 115, 160, 0.14);
      }

      .shell {
        position: relative;
        z-index: 2;
      }

      .main-row {
        display: flex;
        align-items: stretch;
        gap: calc(16px * var(--ui-scale));
        padding:
          calc(22px * var(--ui-scale))
          calc(22px * var(--ui-scale))
          calc(18px * var(--ui-scale));
        cursor: grab;
        touch-action: none;
      }

      .card.dragging .main-row {
        cursor: grabbing;
      }

      .content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .label {
        font-size: calc(13px * var(--ui-scale));
        line-height: 1;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 800;
        color: var(--label-color);
        margin-bottom: calc(10px * var(--ui-scale));
      }

      .subject {
        font-family:
          "Bebas Neue Local",
          "Bebas Neue",
          "Oswald",
          "Arial Narrow",
          "Impact",
          sans-serif;
        font-size: calc(46px * var(--ui-scale));
        line-height: 0.95;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        font-weight: 400;
        background: linear-gradient(
          180deg,
          var(--subject-1) 0%,
          var(--subject-2) 45%,
          var(--subject-3) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 calc(8px * var(--ui-scale)) calc(20px * var(--ui-scale)) rgba(0,0,0,0.18);
        word-break: break-word;
      }

      .meta {
        margin-top: calc(14px * var(--ui-scale));
        font-size: calc(17px * var(--ui-scale));
        line-height: 1.32;
        color: var(--meta-color);
        font-weight: 800;
        letter-spacing: 0.015em;
        text-transform: uppercase;
        word-break: break-word;
        text-shadow: 0 calc(2px * var(--ui-scale)) calc(10px * var(--ui-scale)) rgba(0,0,0,0.18);
      }

      .countdown-wrap {
        margin-top: calc(20px * var(--ui-scale));
        width: 100%;
      }

      .countdown-pill {
        width: 100%;
        min-height: calc(92px * var(--ui-scale));
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding:
          calc(16px * var(--ui-scale))
          calc(26px * var(--ui-scale));
        border-radius: var(--pill-radius);
        border: 1px solid var(--countdown-border);
        background: var(--countdown-bg);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          0 calc(10px * var(--ui-scale)) calc(22px * var(--ui-scale)) var(--countdown-shadow),
          0 0 calc(18px * var(--ui-scale)) var(--countdown-glow);
        color: var(--countdown-text);
        font-size: calc(30px * var(--ui-scale));
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0;
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum" 1, "lnum" 1;
        text-shadow: 0 0 calc(12px * var(--ui-scale)) var(--countdown-glow);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        flex-wrap: nowrap;
      }

      .controls {
        flex: 0 0 calc(56px * var(--ui-scale));
        display: flex;
        flex-direction: column;
        gap: calc(14px * var(--ui-scale));
        align-items: center;
      }

      .control-btn {
        width: calc(48px * var(--ui-scale));
        height: calc(48px * var(--ui-scale));
        border: 1px solid var(--control-border);
        border-radius: var(--button-radius);
        background: var(--control-bg);
        color: var(--control-text);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 calc(8px * var(--ui-scale)) calc(18px * var(--ui-scale)) rgba(0,0,0,0.10);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: inherit;
        font-weight: 800;
        transition: transform 0.14s ease, filter 0.14s ease, box-shadow 0.14s ease;
      }

      .control-btn:hover {
        filter: brightness(1.05);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.14),
          0 calc(10px * var(--ui-scale)) calc(20px * var(--ui-scale)) rgba(0,0,0,0.14);
      }

      .control-btn:active {
        transform: scale(0.97);
      }

      .toggle-btn {
        font-size: calc(20px * var(--ui-scale));
        line-height: 1;
      }

      .theme-btn {
        font-size: calc(19px * var(--ui-scale));
        line-height: 1;
        letter-spacing: 0.02em;
      }

      .upcoming {
        margin:
          0
          calc(18px * var(--ui-scale))
          calc(18px * var(--ui-scale))
          calc(18px * var(--ui-scale));
        padding:
          calc(16px * var(--ui-scale))
          calc(16px * var(--ui-scale))
          calc(16px * var(--ui-scale));
        border-radius: calc(22px * var(--ui-scale));
        border: 1px solid rgba(255,255,255,0.08);
        background: var(--upcoming-bg);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .hidden {
        display: none;
      }

      .upcoming-title {
        font-size: calc(14px * var(--ui-scale));
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-weight: 900;
        color: var(--upcoming-title);
        margin-bottom: calc(12px * var(--ui-scale));
      }

      .upcoming-list {
        display: flex;
        flex-direction: column;
        gap: calc(10px * var(--ui-scale));
        max-height: min(calc(360px * var(--ui-scale)), calc(100vh - 260px));
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 0;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        touch-action: pan-y;
      }

      .upcoming-list::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      .upcoming-item {
        display: flex;
        justify-content: space-between;
        gap: calc(12px * var(--ui-scale));
        padding:
          calc(14px * var(--ui-scale))
          calc(16px * var(--ui-scale));
        border-radius: calc(16px * var(--ui-scale));
        background: var(--upcoming-item-bg);
        border: 1px solid rgba(255,255,255,0.07);
      }

      .upcoming-item-left {
        min-width: 0;
        flex: 1;
      }

      .upcoming-item-title {
        font-size: calc(17px * var(--ui-scale));
        line-height: 1.35;
        font-weight: 900;
        color: rgba(255,255,255,0.99);
        word-break: break-word;
        text-shadow: 0 calc(2px * var(--ui-scale)) calc(10px * var(--ui-scale)) rgba(0,0,0,0.16);
      }

      .upcoming-item-meta {
        margin-top: calc(6px * var(--ui-scale));
        font-size: calc(13.4px * var(--ui-scale));
        line-height: 1.45;
        color: var(--upcoming-meta);
        text-transform: uppercase;
        font-weight: 800;
      }

      .upcoming-item-right {
        align-self: center;
        white-space: nowrap;
        font-size: calc(14.5px * var(--ui-scale));
        font-weight: 900;
        color: var(--upcoming-remaining);
        font-variant-numeric: tabular-nums;
        font-feature-settings: "tnum" 1, "lnum" 1;
      }

      .empty {
        font-size: calc(15px * var(--ui-scale));
        color: rgba(255,255,255,0.86);
        font-weight: 800;
      }

      .resize-handle {
        position: absolute;
        right: calc(10px * var(--ui-scale));
        bottom: calc(10px * var(--ui-scale));
        width: calc(28px * var(--ui-scale));
        height: calc(28px * var(--ui-scale));
        cursor: nwse-resize;
        z-index: 6;
        border-radius: calc(10px * var(--ui-scale));
        border: 1px solid rgba(255,255,255,0.10);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04)),
          rgba(255,255,255,0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .resize-handle::before {
        content: "";
        width: calc(12px * var(--ui-scale));
        height: calc(12px * var(--ui-scale));
        border-right: 2px solid rgba(255,255,255,0.85);
        border-bottom: 2px solid rgba(255,255,255,0.85);
        transform: translate(-1px, -1px);
        opacity: 0.95;
      }

      @media (max-width: 700px) {
        .card {
          width: calc(100vw - 18px);
        }

        .main-row {
          gap: calc(12px * var(--ui-scale));
          padding:
            calc(18px * var(--ui-scale))
            calc(18px * var(--ui-scale))
            calc(14px * var(--ui-scale));
        }

        .subject {
          font-size: calc(40px * var(--ui-scale));
        }

        .meta {
          font-size: calc(15px * var(--ui-scale));
        }

        .countdown-pill {
          font-size: calc(26px * var(--ui-scale));
          min-height: calc(84px * var(--ui-scale));
          padding:
            calc(14px * var(--ui-scale))
            calc(18px * var(--ui-scale));
        }

        .upcoming-item-title {
          font-size: calc(15.5px * var(--ui-scale));
        }

        .upcoming-item-meta {
          font-size: calc(12.2px * var(--ui-scale));
        }

        .upcoming-item-right {
          font-size: calc(13.2px * var(--ui-scale));
        }
      }
    </style>

    <div class="card theme-aurora" id="card">
      <div class="shell">
        <div class="main-row" id="dragArea">
          <div class="content">
            <div class="label">Next Exam</div>
            <div class="subject" id="subject">LOADING...</div>
            <div class="meta" id="meta"></div>

            <div class="countdown-wrap">
              <div class="countdown-pill" id="countdown">--</div>
            </div>
          </div>

          <div class="controls">
            <button class="control-btn toggle-btn" id="toggleBtn" title="Show upcoming exams">▼</button>
            <button class="control-btn theme-btn" id="themeBtn" title="Switch theme">A</button>
          </div>
        </div>

        <div class="upcoming hidden" id="upcoming"></div>
        <div class="resize-handle" id="resizeHandle" title="Drag to resize"></div>
      </div>
    </div>
  `;

  (document.body || document.documentElement).appendChild(host);

  const card = shadow.getElementById("card");
  const dragArea = shadow.getElementById("dragArea");
  const subjectEl = shadow.getElementById("subject");
  const metaEl = shadow.getElementById("meta");
  const countdownEl = shadow.getElementById("countdown");
  const toggleBtn = shadow.getElementById("toggleBtn");
  const themeBtn = shadow.getElementById("themeBtn");
  const upcomingEl = shadow.getElementById("upcoming");
  const resizeHandle = shadow.getElementById("resizeHandle");

  let expanded = false;
  let currentTheme = "aurora";
  let action = null;

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let startScale = DEFAULT_SCALE;

  let lastUpcomingSignature = "";
  let lastCurrentExamId = "";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeTheme(themeId) {
    return THEMES.some(theme => theme.id === themeId) ? themeId : "aurora";
  }

  function getThemeInfo(themeId) {
    return THEMES.find(theme => theme.id === themeId) || THEMES[0];
  }

  function applyTheme(themeId) {
    currentTheme = normalizeTheme(themeId);

    for (const theme of THEMES) {
      card.classList.remove(`theme-${theme.id}`);
    }

    card.classList.add(`theme-${currentTheme}`);

    const theme = getThemeInfo(currentTheme);
    themeBtn.textContent = theme.short;
    themeBtn.title = `Theme: ${theme.label}`;
  }

  function cycleTheme() {
    const currentIndex = THEMES.findIndex(theme => theme.id === currentTheme);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % THEMES.length : 0;
    applyTheme(THEMES[nextIndex].id);
  }

  function getCurrentScale() {
    const inlineValue = parseFloat(card.style.getPropertyValue("--ui-scale"));
    if (Number.isFinite(inlineValue)) return inlineValue;

    const computedValue = parseFloat(getComputedStyle(card).getPropertyValue("--ui-scale"));
    if (Number.isFinite(computedValue)) return computedValue;

    return DEFAULT_SCALE;
  }

  function setScale(scale) {
    const safe = clamp(scale, MIN_SCALE, MAX_SCALE);
    card.style.setProperty("--ui-scale", String(safe));
  }

  function setPosition(left, top) {
    host.style.left = `${Math.round(left)}px`;
    host.style.top = `${Math.round(top)}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  }

  function clampPosition() {
    const margin = 8;
    const rect = host.getBoundingClientRect();
    const width = rect.width || BASE_WIDTH;
    const height = rect.height || 220;

    let left = parseInt(host.style.left, 10);
    let top = parseInt(host.style.top, 10);

    if (!Number.isFinite(left)) left = rect.left;
    if (!Number.isFinite(top)) top = rect.top;

    if (!Number.isFinite(left)) left = window.innerWidth - width - 16;
    if (!Number.isFinite(top)) top = 72;

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    left = clamp(left, margin, maxLeft);
    top = clamp(top, margin, maxTop);

    setPosition(left, top);
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}D ${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
  }

  function formatShortCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes}M`;
  }

  function formatUpperDate(date) {
    return date
      .toLocaleDateString("en-GB", {
        timeZone: DISPLAY_TIMEZONE,
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
      .toUpperCase();
  }

  function formatUpperTime(date) {
    return date
      .toLocaleTimeString("en-GB", {
        timeZone: DISPLAY_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
      .toUpperCase();
  }

  function formatTopMeta(exam) {
    const datePart = formatUpperDate(exam.date);
    const timePart = formatUpperTime(exam.date);
    return `CODE:${exam.code} • ${datePart} • T:${timePart}`;
  }

  function formatUpcomingMeta(exam) {
    return `${formatUpperDate(exam.date)} • ${formatUpperTime(exam.date)} • CODE:${exam.code}`;
  }

  function formatSubjectTitle(subject) {
    return String(subject || "").toUpperCase();
  }

  function getFutureExams(now = new Date()) {
    return exams.filter(exam => exam.date.getTime() > now.getTime());
  }

  function getLaterExams(now, currentExam) {
    return exams.filter(
      exam => exam.date.getTime() > now.getTime() && exam.id !== currentExam?.id
    );
  }

  function applyUrgency(ms) {
    card.classList.remove("state-soon", "state-now");

    if (ms <= 24 * 60 * 60 * 1000) {
      card.classList.add("state-now");
      return;
    }

    if (ms <= 7 * 24 * 60 * 60 * 1000) {
      card.classList.add("state-soon");
    }
  }

  function getSavedState() {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([STORAGE_KEY], result => {
            resolve(result && result[STORAGE_KEY] ? result[STORAGE_KEY] : null);
          });
          return;
        }
      } catch (error) {}

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        resolve(raw ? JSON.parse(raw) : null);
      } catch (error) {
        resolve(null);
      }
    });
  }

  function saveState(state) {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [STORAGE_KEY]: state }, () => resolve());
          return;
        }
      } catch (error) {}

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {}

      resolve();
    });
  }

  async function saveCurrentState() {
    const left = parseInt(host.style.left, 10);
    const top = parseInt(host.style.top, 10);
    const scale = getCurrentScale();

    if (Number.isFinite(left) && Number.isFinite(top) && Number.isFinite(scale)) {
      await saveState({
        left,
        top,
        scale,
        theme: currentTheme,
        expanded
      });
    }
  }

  async function restoreState() {
    const saved = await getSavedState();

    requestAnimationFrame(() => {
      setScale(saved && Number.isFinite(saved.scale) ? saved.scale : DEFAULT_SCALE);
      applyTheme(saved && saved.theme ? saved.theme : "aurora");

      expanded = !!(saved && saved.expanded);
      upcomingEl.classList.toggle("hidden", !expanded);
      toggleBtn.textContent = expanded ? "▲" : "▼";

      const rect = host.getBoundingClientRect();
      const width = rect.width || BASE_WIDTH;
      const defaultLeft = Math.max(8, window.innerWidth - width - 16);

      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        setPosition(saved.left, saved.top);
      } else {
        setPosition(defaultLeft, 72);
      }

      clampPosition();
      render();
    });
  }

  function buildUpcomingList(now, currentExam) {
    if (!expanded) return;

    const laterExams = getLaterExams(now, currentExam);
    const signature = laterExams.map(exam => exam.id).join("|");

    if (!laterExams.length) {
      if (lastUpcomingSignature !== "__empty__") {
        upcomingEl.innerHTML = `
          <div class="upcoming-title">Upcoming</div>
          <div class="empty">No more exams after this one.</div>
        `;
        lastUpcomingSignature = "__empty__";
      }
      return;
    }

    if (signature === lastUpcomingSignature) {
      return;
    }

    upcomingEl.innerHTML = `
      <div class="upcoming-title">Upcoming</div>
      <div class="upcoming-list" id="upcomingList">
        ${laterExams
          .map((exam, index) => {
            const title = `${index + 1}. ${exam.subject}`;
            return `
              <div class="upcoming-item" data-exam-id="${escapeHtml(exam.id)}">
                <div class="upcoming-item-left">
                  <div class="upcoming-item-title">${escapeHtml(title)}</div>
                  <div class="upcoming-item-meta">${escapeHtml(formatUpcomingMeta(exam))}</div>
                </div>
                <div class="upcoming-item-right" data-role="remaining" data-exam-id="${escapeHtml(exam.id)}"></div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    lastUpcomingSignature = signature;
    updateUpcomingCountdowns(now);
  }

  function updateUpcomingCountdowns(now) {
    if (!expanded) return;

    const badges = upcomingEl.querySelectorAll('[data-role="remaining"][data-exam-id]');
    badges.forEach(badge => {
      const examId = badge.getAttribute("data-exam-id");
      const exam = examMap.get(examId);
      if (!exam) return;
      badge.textContent = formatShortCountdown(exam.date - now);
    });
  }

  function render() {
    if (!exams.length) {
      subjectEl.textContent = "NO EXAMS ADDED";
      metaEl.textContent = "EDIT EXAMS-DATA.JS";
      countdownEl.textContent = "--";
      toggleBtn.style.display = "none";
      card.classList.remove("state-soon", "state-now");
      upcomingEl.classList.add("hidden");
      lastUpcomingSignature = "";
      lastCurrentExamId = "";
      return;
    }

    const now = new Date();
    const futureExams = getFutureExams(now);

    if (!futureExams.length) {
      subjectEl.textContent = "ALL EXAMS FINISHED";
      metaEl.textContent = "GOOD JOB";
      countdownEl.textContent = "00D 00H 00M 00S";
      toggleBtn.style.display = "inline-flex";
      card.classList.remove("state-soon", "state-now");

      if (expanded && lastUpcomingSignature !== "__done__") {
        upcomingEl.innerHTML = `
          <div class="upcoming-title">Upcoming</div>
          <div class="empty">No upcoming exams left.</div>
        `;
        lastUpcomingSignature = "__done__";
      }

      lastCurrentExamId = "__done__";
      return;
    }

    const current = futureExams[0];
    const remaining = current.date - now;

    subjectEl.textContent = formatSubjectTitle(current.subject);
    metaEl.textContent = formatTopMeta(current);
    countdownEl.textContent = formatCountdown(remaining);
    toggleBtn.style.display = "inline-flex";
    toggleBtn.textContent = expanded ? "▲" : "▼";

    applyUrgency(remaining);

    if (expanded) {
      if (lastCurrentExamId !== current.id) {
        lastUpcomingSignature = "";
      }
      buildUpcomingList(now, current);
      updateUpcomingCountdowns(now);
    }

    lastCurrentExamId = current.id;
  }

  function attachMoveListeners() {
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
  }

  function detachMoveListeners() {
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);
  }

  function onPointerMove(event) {
    if (!action) return;

    event.preventDefault();

    if (action === "drag") {
      const margin = 8;
      const rect = host.getBoundingClientRect();
      const width = rect.width || BASE_WIDTH;
      const height = rect.height || 220;

      let newLeft = startLeft + (event.clientX - startX);
      let newTop = startTop + (event.clientY - startY);

      const maxLeft = Math.max(margin, window.innerWidth - width - margin);
      const maxTop = Math.max(margin, window.innerHeight - height - margin);

      newLeft = clamp(newLeft, margin, maxLeft);
      newTop = clamp(newTop, margin, maxTop);

      setPosition(newLeft, newTop);
      return;
    }

    if (action === "resize") {
      const delta = ((event.clientX - startX) + (event.clientY - startY)) / 2;
      const newScale = clamp(startScale + delta / 240, MIN_SCALE, MAX_SCALE);
      setScale(newScale);
      clampPosition();
    }
  }

  async function onPointerUp() {
    if (!action) return;

    action = null;
    card.classList.remove("dragging", "resizing");
    detachMoveListeners();
    clampPosition();
    await saveCurrentState();
  }

  dragArea.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;

    if (event.target && event.target.closest && event.target.closest(".control-btn")) {
      return;
    }

    const rect = host.getBoundingClientRect();

    action = "drag";
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    setPosition(startLeft, startTop);
    card.classList.add("dragging");
    attachMoveListeners();

    event.preventDefault();
  });

  resizeHandle.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;

    action = "resize";
    startX = event.clientX;
    startY = event.clientY;
    startScale = getCurrentScale();

    card.classList.add("resizing");
    attachMoveListeners();

    event.preventDefault();
    event.stopPropagation();
  });

  toggleBtn.addEventListener("click", async () => {
    expanded = !expanded;
    upcomingEl.classList.toggle("hidden", !expanded);
    toggleBtn.textContent = expanded ? "▲" : "▼";

    if (expanded) {
      lastUpcomingSignature = "";
    }

    render();

    requestAnimationFrame(async () => {
      clampPosition();
      await saveCurrentState();
    });
  });

  themeBtn.addEventListener("click", async () => {
    cycleTheme();
    render();
    await saveCurrentState();
  });

  function findElementInPath(event, className) {
    const path = event.composedPath ? event.composedPath() : [];
    for (const node of path) {
      if (node && node.classList && node.classList.contains(className)) {
        return node;
      }
    }
    return null;
  }

  upcomingEl.addEventListener(
    "wheel",
    event => {
      const list = findElementInPath(event, "upcoming-list");
      if (!list) return;

      const canScroll = list.scrollHeight > list.clientHeight + 1;
      event.stopPropagation();

      if (!canScroll) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      list.scrollTop += event.deltaY;
    },
    { passive: false }
  );

  upcomingEl.addEventListener(
    "touchmove",
    event => {
      const list = findElementInPath(event, "upcoming-list");
      if (!list) return;
      event.stopPropagation();
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    clampPosition();
    saveCurrentState();
  });

  applyTheme("aurora");
  render();
  restoreState();
  setInterval(render, 1000);
})();