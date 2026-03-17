(() => {
  if (window.__EXAM_COUNTDOWN_OVERLAY__) return;
  window.__EXAM_COUNTDOWN_OVERLAY__ = true;

  const STORAGE_KEY = "examCountdownWidgetPosition";
  const DISPLAY_TIMEZONE = "Asia/Dhaka";

  const rawSchedule = Array.isArray(window.EXAM_SCHEDULE) ? window.EXAM_SCHEDULE : [];

  function buildDate(item) {
    if (item.datetime) {
      return new Date(item.datetime);
    }

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

  const host = document.createElement("div");
  host.id = "exam-countdown-extension-host";
  host.style.position = "fixed";
  host.style.top = "80px";
  host.style.right = "16px";
  host.style.left = "auto";
  host.style.bottom = "auto";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  host.style.userSelect = "none";

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      .widget {
        width: 278px;
        pointer-events: auto;
        background: rgba(17, 24, 39, 0.96);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(10px);
        font-family: Arial, Helvetica, sans-serif;
        overflow: hidden;
      }

      .widget.dragging {
        opacity: 0.96;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
      }

      .top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        cursor: grab;
        touch-action: none;
      }

      .widget.dragging .top {
        cursor: grabbing;
      }

      .drag-icon {
        color: #94a3b8;
        font-size: 18px;
        line-height: 1;
        padding-top: 2px;
        flex: 0 0 auto;
      }

      .info {
        min-width: 0;
        flex: 1;
      }

      .label {
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #9ca3af;
        margin-bottom: 5px;
        font-weight: 700;
      }

      .subject {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.25;
        word-break: break-word;
      }

      .meta {
        margin-top: 5px;
        font-size: 11px;
        color: #cbd5e1;
        line-height: 1.35;
        word-break: break-word;
      }

      .countdown {
        margin-top: 7px;
        font-size: 15px;
        font-weight: 700;
        color: #86efac;
      }

      .toggle {
        width: 32px;
        height: 32px;
        flex: 0 0 32px;
        border: 0;
        border-radius: 10px;
        background: rgba(255,255,255,0.08);
        color: #fff;
        cursor: pointer;
        font-size: 13px;
        line-height: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .toggle:hover {
        background: rgba(255,255,255,0.14);
      }

      .upcoming {
        border-top: 1px solid rgba(255,255,255,0.1);
        padding: 10px 12px 12px;
        max-height: 300px;
        overflow-y: auto;
      }

      .hidden {
        display: none;
      }

      .upcoming-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #cbd5e1;
        margin-bottom: 8px;
      }

      .item {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .item-left {
        min-width: 0;
        flex: 1;
      }

      .item-title {
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        word-break: break-word;
        line-height: 1.35;
      }

      .item-date {
        font-size: 11px;
        color: #cbd5e1;
        margin-top: 3px;
      }

      .item-remaining {
        font-size: 12px;
        font-weight: 700;
        color: #fcd34d;
        white-space: nowrap;
        align-self: center;
      }

      .empty {
        font-size: 12px;
        color: #cbd5e1;
      }
    </style>

    <div class="widget" id="widget">
      <div class="top" id="dragBar">
        <div class="drag-icon" title="Drag to move">⋮⋮</div>

        <div class="info">
          <div class="label">Next Exam</div>
          <div class="subject" id="subject">Loading...</div>
          <div class="meta" id="meta"></div>
          <div class="countdown" id="countdown">--</div>
        </div>

        <button class="toggle" id="toggle" title="Show upcoming exams">▼</button>
      </div>

      <div class="upcoming hidden" id="upcoming"></div>
    </div>
  `;

  (document.body || document.documentElement).appendChild(host);

  const widget = shadow.getElementById("widget");
  const dragBar = shadow.getElementById("dragBar");
  const subjectEl = shadow.getElementById("subject");
  const metaEl = shadow.getElementById("meta");
  const countdownEl = shadow.getElementById("countdown");
  const upcomingEl = shadow.getElementById("upcoming");
  const toggleBtn = shadow.getElementById("toggle");

  let expanded = false;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

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

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  function formatShortCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatDate(date) {
    return date.toLocaleString("en-GB", {
      timeZone: DISPLAY_TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  function formatTopMeta(exam) {
    const dateText = formatDate(exam.date);
    return exam.code ? `Code: ${exam.code} • ${dateText}` : dateText;
  }

  function getFutureExams(now = new Date()) {
    return exams.filter(exam => exam.date.getTime() > now.getTime());
  }

  function setPosition(left, top) {
    host.style.left = `${Math.round(left)}px`;
    host.style.top = `${Math.round(top)}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  }

  function clampPosition() {
    const margin = 8;
    const width = widget.offsetWidth || 278;
    const height = widget.offsetHeight || 120;

    let left = parseInt(host.style.left, 10);
    let top = parseInt(host.style.top, 10);

    if (!Number.isFinite(left)) {
      const rect = host.getBoundingClientRect();
      left = rect.left;
    }

    if (!Number.isFinite(top)) {
      const rect = host.getBoundingClientRect();
      top = rect.top;
    }

    if (!Number.isFinite(left)) left = window.innerWidth - width - 16;
    if (!Number.isFinite(top)) top = 80;

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    left = Math.min(Math.max(margin, left), maxLeft);
    top = Math.min(Math.max(margin, top), maxTop);

    setPosition(left, top);
  }

  function getSavedPosition() {
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

  function savePosition(position) {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [STORAGE_KEY]: position }, () => resolve());
          return;
        }
      } catch (error) {}

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (error) {}

      resolve();
    });
  }

  async function saveCurrentPosition() {
    const left = parseInt(host.style.left, 10);
    const top = parseInt(host.style.top, 10);

    if (Number.isFinite(left) && Number.isFinite(top)) {
      await savePosition({ left, top });
    }
  }

  async function restorePosition() {
    const saved = await getSavedPosition();

    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      setPosition(saved.left, saved.top);
      requestAnimationFrame(clampPosition);
      return;
    }

    requestAnimationFrame(() => {
      const width = widget.offsetWidth || 278;
      const defaultLeft = Math.max(8, window.innerWidth - width - 16);
      setPosition(defaultLeft, 80);
      clampPosition();
    });
  }

  function renderUpcoming(now, currentExam) {
    if (!expanded) return;

    const laterExams = exams.filter(
      exam => exam.date.getTime() > now.getTime() && exam.id !== currentExam?.id
    );

    if (!laterExams.length) {
      upcomingEl.innerHTML = `
        <div class="upcoming-title">Coming Up Next</div>
        <div class="empty">No more exams after this one.</div>
      `;
      return;
    }

    upcomingEl.innerHTML = `
      <div class="upcoming-title">Coming Up Next</div>
      ${laterExams
        .map((exam, index) => {
          const title = `${exam.code ? exam.code + " — " : ""}${exam.subject}`;
          return `
            <div class="item">
              <div class="item-left">
                <div class="item-title">${index + 1}. ${escapeHtml(title)}</div>
                <div class="item-date">${escapeHtml(formatDate(exam.date))}</div>
              </div>
              <div class="item-remaining">${escapeHtml(formatShortCountdown(exam.date - now))}</div>
            </div>
          `;
        })
        .join("")}
    `;
  }

  function render() {
    if (!exams.length) {
      subjectEl.textContent = "No exams added";
      metaEl.textContent = "Edit exams-data.js";
      countdownEl.textContent = "--";
      toggleBtn.style.display = "none";
      upcomingEl.classList.add("hidden");
      return;
    }

    const now = new Date();
    const futureExams = getFutureExams(now);

    if (!futureExams.length) {
      subjectEl.textContent = "All exams finished";
      metaEl.textContent = "Great job";
      countdownEl.textContent = "00d 00h 00m 00s";
      toggleBtn.style.display = "none";

      if (expanded) {
        upcomingEl.innerHTML = `
          <div class="upcoming-title">Coming Up Next</div>
          <div class="empty">No upcoming exams left.</div>
        `;
      }

      return;
    }

    const current = futureExams[0];
    subjectEl.textContent = current.subject;
    metaEl.textContent = formatTopMeta(current);
    countdownEl.textContent = formatCountdown(current.date - now);
    toggleBtn.style.display = "inline-flex";

    renderUpcoming(now, current);
  }

  function onPointerMove(event) {
    if (!dragging) return;

    event.preventDefault();

    const margin = 8;
    const width = widget.offsetWidth || 278;
    const height = widget.offsetHeight || 120;

    let newLeft = startLeft + (event.clientX - startX);
    let newTop = startTop + (event.clientY - startY);

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    newLeft = Math.min(Math.max(margin, newLeft), maxLeft);
    newTop = Math.min(Math.max(margin, newTop), maxTop);

    setPosition(newLeft, newTop);
  }

  async function onPointerUp() {
    if (!dragging) return;

    dragging = false;
    widget.classList.remove("dragging");

    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);

    await saveCurrentPosition();
  }

  dragBar.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;

    if (event.target && event.target.closest && event.target.closest("#toggle")) {
      return;
    }

    const rect = host.getBoundingClientRect();

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    setPosition(startLeft, startTop);
    widget.classList.add("dragging");

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);

    event.preventDefault();
  });

  toggleBtn.addEventListener("click", () => {
    expanded = !expanded;
    upcomingEl.classList.toggle("hidden", !expanded);
    toggleBtn.textContent = expanded ? "▲" : "▼";
    render();

    requestAnimationFrame(async () => {
      clampPosition();
      await saveCurrentPosition();
    });
  });

  window.addEventListener("resize", () => {
    clampPosition();
    saveCurrentPosition();
  });

  render();
  restorePosition();
  setInterval(render, 1000);
})();