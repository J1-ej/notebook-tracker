/**
 * CHRONO TRACKER // CLEAN NOTEBOOK JOURNAL
 * Minimalist Monochrome (Zero Glow / Zero Neon)
 * Storage Key: 'chrono_tracker_v2'
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'chrono_tracker_v2';

  // 12 Default Positive Habits
  const DEFAULT_HABITS = [
    { id: 'reading', index: 1, name: 'Reading', short: 'Reading' },
    { id: 'skincare', index: 2, name: 'Skincare', short: 'Skincare' },
    { id: 'hobby', index: 3, name: 'Hobby', short: 'Hobby' },
    { id: 'walk', index: 4, name: 'Walking', short: 'Walk' },
    { id: 'shower', index: 5, name: 'Shower / Bath', short: 'Shower' },
    { id: 'vitamins', index: 6, name: 'Vitamins', short: 'Vitamins' },
    { id: 'movie', index: 7, name: 'Movie', short: 'Movie' },
    { id: 'eyeExercise', index: 8, name: 'Eye Exercise', short: 'Eyes' },
    { id: 'journaling', index: 9, name: 'Journaling', short: 'Journal' },
    { id: 'english', index: 10, name: 'English', short: 'English' },
    { id: 'satPrep', index: 11, name: 'SAT Prep', short: 'SAT' },
    { id: 'coding', index: 12, name: 'Coding', short: 'Coding' }
  ];

  // Special 13th Column: Anti-habit
  const ANTI_HABIT = {
    id: 'relapse',
    index: 13,
    name: 'Abstinence Control',
    short: 'Abstinence'
  };

  const MONTHS_EN = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const MONTHS_EN_TITLE = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const WEEKDAYS_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const WEEKDAYS_FULL_EN = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const MOOD_NAMES = {
    1: '1 · Low',
    2: '2 · Down',
    3: '3 · Normal',
    4: '4 · Good',
    5: '5 · Great'
  };

  // State
  const state = {
    year: 2026,
    month: 9, // 9 = October 2026
    selectedDay: 30,
    activeMode: 'dock', // 'dock' | 'spread'
    spreadPageMode: 'both', // 'both' | 'left' | 'right'
    highlightUnsynced: false,
    customMetrics: [], // array of { id, name, maxHours }
    customHabits: [],  // array of { id, name, short }
    records: {} // Clean storage: zero dummy data
  };

  // =========================================================================
  // UTILITIES
  // =========================================================================

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function makeDateKey(year, month0, day) {
    return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
  }

  function getDaysInMonth(year, month0) {
    return new Date(year, month0 + 1, 0).getDate();
  }

  function getDayOfWeek(year, month0, day) {
    return new Date(year, month0, day).getDay();
  }

  function isMonday(year, month0, day) {
    return getDayOfWeek(year, month0, day) === 1;
  }

  function parseTimeStr(str) {
    if (!str || typeof str !== 'string' || !str.includes(':')) return null;
    const [h, m] = str.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  function minutesToHHMM(totalMin) {
    const norm = ((totalMin % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${pad2(h)}:${pad2(m)}`;
  }

  /**
   * Universal 24h Sleep Duration
   */
  function calcSleepDurationMinutes(bedStr, wakeStr) {
    const bed = parseTimeStr(bedStr);
    const wake = parseTimeStr(wakeStr);
    if (bed === null || wake === null) return null;
    let diff = wake - bed;
    if (diff <= 0) diff += 1440;
    return diff;
  }

  function formatDurationVerbose(mins) {
    if (mins === null || mins === undefined) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${pad2(m)}m`;
  }

  function formatDurationCompact(mins) {
    if (mins === null || mins === undefined) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${pad2(m)}`;
  }

  function createEmptyDayRecord() {
    const habits = {};
    DEFAULT_HABITS.forEach((h) => {
      habits[h.id] = false;
    });
    return {
      sleepStart: null,
      sleepEnd: null,
      screenTime: null,
      studyTime: null,
      mood: null,
      workoutTime: null,
      habits,
      customMetrics: {},
      customHabits: {},
      relapse: false,
      syncedToPaper: false
    };
  }

  function getDayRecord(year, month0, day) {
    const key = makeDateKey(year, month0, day);
    if (!state.records[key]) {
      state.records[key] = createEmptyDayRecord();
    }
    const rec = state.records[key];
    if (!rec.customMetrics) rec.customMetrics = {};
    if (!rec.customHabits) rec.customHabits = {};
    if (!rec.habits) rec.habits = {};
    return rec;
  }

  function hasAnyData(rec) {
    if (!rec) return false;
    if (rec.sleepStart && rec.sleepEnd) return true;
    if (rec.screenTime !== null && rec.screenTime !== undefined) return true;
    if (rec.studyTime !== null && rec.studyTime !== undefined) return true;
    if (rec.mood !== null && rec.mood !== undefined) return true;
    if (rec.workoutTime !== null && rec.workoutTime !== undefined) return true;
    if (rec.relapse === true) return true;
    if (rec.habits && Object.values(rec.habits).some(Boolean)) return true;
    if (rec.customHabits && Object.values(rec.customHabits).some(Boolean)) return true;
    if (rec.customMetrics && Object.values(rec.customMetrics).some((v) => v !== null && v > 0)) return true;
    return false;
  }

  // =========================================================================
  // PERSISTENCE (LOCAL STORAGE)
  // =========================================================================

  function loadState() {
    try {
      localStorage.removeItem('chrono_notebook_v1');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.records) state.records = parsed.records;
          if (Array.isArray(parsed.customMetrics)) state.customMetrics = parsed.customMetrics;
          if (Array.isArray(parsed.customHabits)) state.customHabits = parsed.customHabits;
          if (typeof parsed.year === 'number') state.year = parsed.year;
          if (typeof parsed.month === 'number') state.month = parsed.month;
          if (typeof parsed.selectedDay === 'number') state.selectedDay = parsed.selectedDay;
          if (typeof parsed.highlightUnsynced === 'boolean') {
            state.highlightUnsynced = parsed.highlightUnsynced;
          }
        }
      } else {
        state.records = {};
        state.customMetrics = [];
        state.customHabits = [];
      }
    } catch (e) {
      console.error('Error loading state:', e);
      state.records = {};
    }
  }

  function saveState(toastMsg = false) {
    try {
      const payload = {
        version: 2,
        updatedAt: new Date().toISOString(),
        year: state.year,
        month: state.month,
        selectedDay: state.selectedDay,
        highlightUnsynced: state.highlightUnsynced,
        customMetrics: state.customMetrics,
        customHabits: state.customHabits,
        records: state.records
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (toastMsg) {
        showToast(typeof toastMsg === 'string' ? toastMsg : 'Saved');
      }
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }

  let toastTimer = null;
  function showToast(text) {
    const el = document.getElementById('toastNotification');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 1600);
  }

  // =========================================================================
  // STREAK & STATS
  // =========================================================================

  function computeCleanStreakUpTo(year, month0, targetDay) {
    let streak = 0;
    let y = year;
    let m = month0;
    let d = targetDay;

    for (let i = 0; i < 365; i++) {
      const key = makeDateKey(y, m, d);
      const rec = state.records[key];
      if (!rec || !hasAnyData(rec)) {
        if (i === 0) {
          d--;
          if (d < 1) {
            m--;
            if (m < 0) { m = 11; y--; }
            d = getDaysInMonth(y, m);
          }
          continue;
        }
        break;
      }
      if (rec.relapse === true) {
        break;
      }
      streak++;
      d--;
      if (d < 1) {
        m--;
        if (m < 0) { m = 11; y--; }
        d = getDaysInMonth(y, m);
      }
    }
    return streak;
  }

  function countUnsyncedDaysInMonth(year, month0) {
    const totalDays = getDaysInMonth(year, month0);
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      const rec = state.records[makeDateKey(year, month0, d)];
      if (rec && hasAnyData(rec) && !rec.syncedToPaper) {
        count++;
      }
    }
    return count;
  }

  // =========================================================================
  // RENDER: HEADER & DAY STRIP
  // =========================================================================

  function renderHeader() {
    const monthTitle = `${MONTHS_EN[state.month]} ${state.year}`;
    document.getElementById('monthLabelText').textContent = monthTitle;
    document.getElementById('leftPageMonthCaption').textContent = monthTitle;

    const unsynced = countUnsyncedDaysInMonth(state.year, state.month);
    const badge = document.getElementById('headerUnsyncedBadge');
    badge.textContent = String(unsynced);
    badge.style.opacity = unsynced > 0 ? '1' : '0.5';
  }

  function renderDayStrip(scrollRibbon = false) {
    const container = document.getElementById('dayRibbon');
    const totalDays = getDaysInMonth(state.year, state.month);
    if (state.selectedDay > totalDays) state.selectedDay = totalDays;

    container.innerHTML = '';

    for (let d = 1; d <= totalDays; d++) {
      const dow = getDayOfWeek(state.year, state.month, d);
      const mon = dow === 1;
      const rec = state.records[makeDateKey(state.year, state.month, d)];
      const hasData = hasAnyData(rec);
      const synced = rec && rec.syncedToPaper;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-chip mono' +
        (d === state.selectedDay ? ' active' : '') +
        (mon ? ' is-mon' : '');
      btn.dataset.day = String(d);

      btn.innerHTML = `
        <span class="day-chip-dow">${mon ? 'MON' : WEEKDAYS_SHORT_EN[dow]}</span>
        <span class="day-chip-num">${pad2(d)}</span>
        <span class="day-chip-marks">
          ${hasData ? '<span class="dot-has-content"></span>' : ''}
          ${synced ? '<span class="dot-is-synced">✓</span>' : ''}
        </span>
      `;

      btn.addEventListener('click', () => {
        state.selectedDay = d;
        saveState(false);
        renderAll(false);
      });

      container.appendChild(btn);
    }

    if (scrollRibbon) {
      requestAnimationFrame(() => {
        const activeChip = container.querySelector('.day-chip.active');
        if (activeChip) {
          activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    }
  }

  // =========================================================================
  // RENDER: VIEW 1 — DAILY ENTRY
  // =========================================================================

  function renderDailyDock() {
    const d = state.selectedDay;
    const dow = getDayOfWeek(state.year, state.month, d);
    const mon = dow === 1;
    const rec = getDayRecord(state.year, state.month, d);
    const hasData = hasAnyData(rec);

    // Day Header
    document.getElementById('dockDayNumber').textContent = pad2(d);
    const monBadge = document.getElementById('dockMondayBadge');
    monBadge.classList.toggle('hidden', !mon);
    document.getElementById('dockDayTitle').textContent =
      `${MONTHS_EN_TITLE[state.month]} · ${WEEKDAYS_FULL_EN[dow]}`;

    const statusText = document.getElementById('dockDayStatus');
    if (!hasData) {
      statusText.textContent = 'No entries for this day';
    } else if (rec.syncedToPaper) {
      statusText.textContent = '✓ Transcribed to paper journal';
    } else {
      statusText.textContent = '● New entry · not yet transcribed to paper';
    }

    const syncBtn = document.getElementById('dockPaperSyncBtn');
    syncBtn.classList.toggle('synced', Boolean(rec.syncedToPaper));
    syncBtn.setAttribute('aria-pressed', String(Boolean(rec.syncedToPaper)));

    // 1. Sleep Card
    const cardSleep = document.getElementById('cardSleep');
    const sleepBadge = document.getElementById('sleepDurationBadge');
    const sleepDur = calcSleepDurationMinutes(rec.sleepStart, rec.sleepEnd);

    if (rec.sleepStart) document.getElementById('bedtimeInput').value = rec.sleepStart;
    else document.getElementById('bedtimeInput').value = '23:30';

    if (rec.sleepEnd) document.getElementById('waketimeInput').value = rec.sleepEnd;
    else document.getElementById('waketimeInput').value = '07:30';

    if (sleepDur === null) {
      cardSleep.classList.add('is-empty');
      sleepBadge.textContent = 'Not set';
      document.getElementById('sleepSummaryDur').textContent = '—';
      document.getElementById('sleepSummaryStamp').textContent = 'Enter bedtime & wakeup';
    } else {
      cardSleep.classList.remove('is-empty');
      const durText = formatDurationVerbose(sleepDur);
      sleepBadge.textContent = durText;
      document.getElementById('sleepSummaryDur').textContent = durText;
      document.getElementById('sleepSummaryStamp').textContent = `${rec.sleepStart} → ${rec.sleepEnd}`;
    }

    // 2. Screen Time Card
    const cardScreen = document.getElementById('cardScreen');
    const screenBadge = document.getElementById('screenBadge');
    const screenRange = document.getElementById('screenRange');
    if (rec.screenTime === null || rec.screenTime === undefined) {
      cardScreen.classList.add('is-empty');
      screenBadge.textContent = 'Not set';
      screenRange.value = 0;
    } else {
      cardScreen.classList.remove('is-empty');
      screenBadge.textContent = formatDurationVerbose(rec.screenTime);
      screenRange.value = rec.screenTime;
    }
    document.querySelectorAll('[data-screen-preset]').forEach((b) => {
      b.classList.toggle('active', rec.screenTime !== null && Number(b.dataset.screenPreset) === rec.screenTime);
    });

    // 3. Study Time Card
    const cardStudy = document.getElementById('cardStudy');
    const studyBadge = document.getElementById('studyBadge');
    const studyRange = document.getElementById('studyRange');
    if (rec.studyTime === null || rec.studyTime === undefined) {
      cardStudy.classList.add('is-empty');
      studyBadge.textContent = 'Not set';
      studyRange.value = 0;
    } else {
      cardStudy.classList.remove('is-empty');
      studyBadge.textContent = formatDurationVerbose(rec.studyTime);
      studyRange.value = rec.studyTime;
    }
    document.querySelectorAll('[data-study-preset]').forEach((b) => {
      b.classList.toggle('active', rec.studyTime !== null && Number(b.dataset.studyPreset) === rec.studyTime);
    });

    // 4. Mood Card
    const cardMood = document.getElementById('cardMood');
    const moodBadge = document.getElementById('moodBadge');
    if (rec.mood === null || rec.mood === undefined) {
      cardMood.classList.add('is-empty');
      moodBadge.textContent = 'Not set';
    } else {
      cardMood.classList.remove('is-empty');
      moodBadge.textContent = MOOD_NAMES[rec.mood] || `${rec.mood} / 5`;
    }
    document.querySelectorAll('.mood-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.mood) === rec.mood);
    });

    // 5. Workout Card
    const cardWorkout = document.getElementById('cardWorkout');
    const workoutBadge = document.getElementById('workoutBadge');
    const workoutRange = document.getElementById('workoutRange');
    if (rec.workoutTime === null || rec.workoutTime === undefined) {
      cardWorkout.classList.add('is-empty');
      workoutBadge.textContent = 'Not set';
      workoutRange.value = 0;
    } else {
      cardWorkout.classList.remove('is-empty');
      workoutBadge.textContent = formatDurationVerbose(rec.workoutTime);
      workoutRange.value = rec.workoutTime;
    }
    document.querySelectorAll('[data-workout-preset]').forEach((b) => {
      b.classList.toggle('active', rec.workoutTime !== null && Number(b.dataset.workoutPreset) === rec.workoutTime);
    });

    // Render Custom Time Metric Cards
    renderCustomMetricsCards(rec);

    // Right Column: Habits (Default + Custom)
    renderHabitsList(rec);

    // Column 13: Abstinence
    const streak = computeCleanStreakUpTo(state.year, state.month, d);
    document.getElementById('cleanStreakBadge').textContent = `${streak} DAYS CLEAN`;
    document.getElementById('btnCleanDay').classList.toggle('active', !rec.relapse);
    document.getElementById('btnRelapseDay').classList.toggle('active', Boolean(rec.relapse));
  }

  function renderCustomMetricsCards(rec) {
    const container = document.getElementById('customMetricsContainer');
    container.innerHTML = '';

    state.customMetrics.forEach((cm, idx) => {
      const card = document.createElement('article');
      card.className = 'clean-card';
      const maxMins = (cm.maxHours || 4) * 60;
      const curVal = (rec.customMetrics && rec.customMetrics[cm.id] !== undefined)
        ? rec.customMetrics[cm.id]
        : null;

      const hasVal = curVal !== null && curVal > 0;
      if (!hasVal) card.classList.add('is-empty');

      const colNum = 6 + idx;
      card.innerHTML = `
        <div class="card-top-row">
          <div>
            <h3 class="card-title">${colNum}. ${cm.name}</h3>
            <p class="card-caption">Custom time metric (0 — ${cm.maxHours}h)</p>
          </div>
          <div class="card-right-group">
            <span class="value-badge mono">${hasVal ? formatDurationVerbose(curVal) : 'Not set'}</span>
            <button type="button" class="del-custom-btn mono" title="Delete custom tracker">✕</button>
          </div>
        </div>

        <div class="range-controls-wrap">
          <div class="slider-row">
            <button type="button" class="step-btn mono" data-step="-15">-15m</button>
            <input type="range" class="clean-range" min="0" max="${maxMins}" step="5" value="${curVal || 0}" />
            <button type="button" class="step-btn mono" data-step="15">+15m</button>
          </div>
          <div class="range-ticks mono">
            <span>0h</span>
            <span>${(cm.maxHours / 2).toFixed(1)}h</span>
            <span>${cm.maxHours}h+</span>
          </div>
          <div class="preset-pills-row">
            <button type="button" class="preset-pill mono" data-preset="0">0m</button>
            <button type="button" class="preset-pill mono" data-preset="15">15m</button>
            <button type="button" class="preset-pill mono" data-preset="30">30m</button>
            <button type="button" class="preset-pill mono" data-preset="45">45m</button>
            <button type="button" class="preset-pill mono" data-preset="60">1h</button>
          </div>
        </div>
      `;

      // Event handlers for this custom metric card
      const rangeInput = card.querySelector('.clean-range');
      const delBtn = card.querySelector('.del-custom-btn');

      rangeInput.addEventListener('input', (e) => {
        rec.customMetrics[cm.id] = Number(e.target.value);
        saveState();
        renderAll(false);
      });

      card.querySelectorAll('[data-step]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const delta = Number(btn.dataset.step);
          const current = rec.customMetrics[cm.id] || 0;
          rec.customMetrics[cm.id] = Math.max(0, Math.min(maxMins, current + delta));
          saveState();
          renderAll(false);
        });
      });

      card.querySelectorAll('[data-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          rec.customMetrics[cm.id] = Number(btn.dataset.preset);
          saveState();
          renderAll(false);
        });
      });

      delBtn.addEventListener('click', () => {
        if (confirm(`Delete custom metric "${cm.name}" from journal?`)) {
          state.customMetrics = state.customMetrics.filter((m) => m.id !== cm.id);
          saveState(`Metric "${cm.name}" removed`);
          renderAll(false);
        }
      });

      container.appendChild(card);
    });
  }

  function renderHabitsList(rec) {
    const habitsGrid = document.getElementById('dockHabitsGrid');
    habitsGrid.innerHTML = '';

    let totalDone = 0;
    const totalHabitsCount = DEFAULT_HABITS.length + state.customHabits.length;

    // 1. Default Habits
    DEFAULT_HABITS.forEach((h) => {
      const isChecked = Boolean(rec.habits && rec.habits[h.id]);
      if (isChecked) totalDone++;

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'habit-row-item' + (isChecked ? ' checked' : '');
      item.innerHTML = `
        <div class="habit-left-group">
          <span class="habit-checkbox"></span>
          <div class="habit-text-wrap">
            <span class="habit-idx mono">#${pad2(h.index)}</span>
            <span class="habit-name">${h.name}</span>
          </div>
        </div>
      `;
      item.addEventListener('click', () => {
        rec.habits[h.id] = !isChecked;
        saveState();
        renderAll(false);
      });
      habitsGrid.appendChild(item);
    });

    // 2. Custom Habits
    state.customHabits.forEach((ch, idx) => {
      const isChecked = Boolean(rec.customHabits && rec.customHabits[ch.id]);
      if (isChecked) totalDone++;
      const habitNum = 13 + idx;

      const item = document.createElement('div');
      item.className = 'habit-row-item' + (isChecked ? ' checked' : '');
      item.innerHTML = `
        <div class="habit-left-group" role="button">
          <span class="habit-checkbox"></span>
          <div class="habit-text-wrap">
            <span class="habit-idx mono">#${pad2(habitNum)}</span>
            <span class="habit-name">${ch.name}</span>
          </div>
        </div>
        <button type="button" class="del-custom-habit-btn mono" title="Delete custom habit">✕</button>
      `;

      item.querySelector('.habit-left-group').addEventListener('click', () => {
        rec.customHabits[ch.id] = !isChecked;
        saveState();
        renderAll(false);
      });

      item.querySelector('.del-custom-habit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete custom habit "${ch.name}"?`)) {
          state.customHabits = state.customHabits.filter((h) => h.id !== ch.id);
          saveState(`Habit "${ch.name}" removed`);
          renderAll(false);
        }
      });

      habitsGrid.appendChild(item);
    });

    document.getElementById('habitsDoneFraction').textContent = `${totalDone} / ${totalHabitsCount} completed`;
  }

  // =========================================================================
  // RENDER: VIEW 2 — NOTEBOOK SPREAD
  // =========================================================================

  function renderNotebookSpread() {
    const spreadEl = document.getElementById('notebookSpread');
    spreadEl.classList.toggle('highlight-unsynced', Boolean(state.highlightUnsynced));
    spreadEl.setAttribute('data-page-mode', state.spreadPageMode);
    document.getElementById('highlightUnsyncedToggle').checked = Boolean(state.highlightUnsynced);

    const totalDays = getDaysInMonth(state.year, state.month);
    const rowHeight = 28;
    const totalHeight = totalDays * rowHeight;

    // 1. Center Spine
    const spineContainer = document.getElementById('spineRowsContainer');
    spineContainer.innerHTML = '';

    for (let d = 1; d <= totalDays; d++) {
      const mon = isMonday(state.year, state.month, d);
      const rec = getDayRecord(state.year, state.month, d);
      const hasData = hasAnyData(rec);
      const isUnsyncedActive = hasData && !rec.syncedToPaper;
      const isDimmed = state.highlightUnsynced && !isUnsyncedActive;

      const row = document.createElement('div');
      row.className = 'spine-row' +
        (mon ? ' is-mon' : '') +
        (d === state.selectedDay ? ' is-selected' : '') +
        (isDimmed ? ' dimmed-row' : '') +
        (state.highlightUnsynced && isUnsyncedActive ? ' active-unsynced-row' : '');

      const syncBtn = document.createElement('button');
      syncBtn.type = 'button';
      syncBtn.className = 'spine-check-btn mono' + (rec.syncedToPaper ? ' synced' : '');
      syncBtn.textContent = '✓';
      syncBtn.title = rec.syncedToPaper ? `Day ${d}: Synced to paper` : `Day ${d}: Mark as synced`;
      syncBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rec.syncedToPaper = !rec.syncedToPaper;
        saveState(rec.syncedToPaper ? `Day ${d}: Synced ✓` : `Day ${d}: Unsynced`);
        renderAll(false);
      });

      const numBtn = document.createElement('button');
      numBtn.type = 'button';
      numBtn.className = 'spine-num-btn';
      numBtn.textContent = String(d);
      numBtn.addEventListener('click', () => {
        state.selectedDay = d;
        saveState(false);
        renderAll(false);
      });

      const monTxt = document.createElement('span');
      monTxt.className = 'spine-mon-txt';
      monTxt.textContent = mon ? 'M' : '';

      row.appendChild(syncBtn);
      row.appendChild(numBtn);
      row.appendChild(monTxt);
      spineContainer.appendChild(row);
    }

    // 2. Left Page: Default 5 + Custom Metrics
    renderLeftPage(totalDays, rowHeight, totalHeight);

    // 3. Right Page: Default 12 + Custom Habits + Col 13
    renderRightPage(totalDays);
  }

  function renderLeftPage(totalDays, rowHeight, totalHeight) {
    const stage = document.getElementById('leftMetricsStage');
    const headerEl = document.getElementById('leftColumnsHeader');
    const footerEl = document.getElementById('leftMetricsFooter');
    stage.innerHTML = '';
    headerEl.innerHTML = '';
    footerEl.innerHTML = '';

    // Build complete metric list: 5 defaults + custom metrics
    const metricCols = [
      {
        id: 'sleep',
        title: '1. SLEEP',
        sub: 'Bed / Wake',
        ruler: ['2h', '6h', '10h', '14h'],
        defaultW: 140,
        minVal: 120,
        maxVal: 840,
        ticks: [120, 360, 600, 840],
        getVal: (rec) => calcSleepDurationMinutes(rec.sleepStart, rec.sleepEnd),
        getLabel: (rec) => (rec.sleepStart && rec.sleepEnd ? `${rec.sleepStart}/${rec.sleepEnd}` : '')
      },
      {
        id: 'screen',
        title: '2. SCREEN',
        sub: 'Phone (h:m)',
        ruler: ['0', '4h', '8h+'],
        defaultW: 105,
        minVal: 0,
        maxVal: 480,
        ticks: [120, 240, 360],
        getVal: (rec) => rec.screenTime,
        getLabel: (rec) => (rec.screenTime !== null ? formatDurationCompact(rec.screenTime) : '')
      },
      {
        id: 'study',
        title: '3. STUDY',
        sub: 'Focus (h:m)',
        ruler: ['0', '3h', '6h+'],
        defaultW: 105,
        minVal: 0,
        maxVal: 360,
        ticks: [90, 180, 270],
        getVal: (rec) => rec.studyTime,
        getLabel: (rec) => (rec.studyTime !== null ? formatDurationCompact(rec.studyTime) : '')
      },
      {
        id: 'mood',
        title: '4. MOOD',
        sub: 'Scale 1–5',
        ruler: ['1', '2', '3', '4', '5'],
        defaultW: 95,
        minVal: 1,
        maxVal: 5,
        ticks: [1, 2, 3, 4, 5],
        getVal: (rec) => rec.mood,
        getLabel: () => ''
      },
      {
        id: 'workout',
        title: '5. WORKOUT',
        sub: 'Exercise',
        ruler: ['0', '1.5h', '3h+'],
        defaultW: 105,
        minVal: 0,
        maxVal: 180,
        ticks: [45, 90, 135],
        getVal: (rec) => rec.workoutTime,
        getLabel: (rec) => (rec.workoutTime !== null ? formatDurationCompact(rec.workoutTime) : '')
      }
    ];

    // Append Custom Metrics
    state.customMetrics.forEach((cm, i) => {
      const colNum = 6 + i;
      const maxMins = (cm.maxHours || 4) * 60;
      metricCols.push({
        id: cm.id,
        title: `${colNum}. ${cm.name.toUpperCase()}`,
        sub: 'Time (h:m)',
        ruler: ['0', `${(cm.maxHours / 2).toFixed(1)}h`, `${cm.maxHours}h+`],
        defaultW: 105,
        minVal: 0,
        maxVal: maxMins,
        ticks: [maxMins * 0.25, maxMins * 0.5, maxMins * 0.75],
        getVal: (rec) => (rec.customMetrics ? rec.customMetrics[cm.id] : null),
        getLabel: (rec) => {
          const v = rec.customMetrics ? rec.customMetrics[cm.id] : null;
          return v !== null && v > 0 ? formatDurationCompact(v) : '';
        }
      });
    });

    // Dynamic grid template columns
    const gridColsStyle = `1.35fr 1fr 1fr 0.95fr 1fr ${state.customMetrics.map(() => '1fr').join(' ')}`.trim();
    headerEl.style.gridTemplateColumns = gridColsStyle;
    stage.style.gridTemplateColumns = gridColsStyle;
    footerEl.style.gridTemplateColumns = gridColsStyle;

    // Render Headers
    metricCols.forEach((col) => {
      const hDiv = document.createElement('div');
      hDiv.className = `left-col-head col-${col.id}`;
      hDiv.innerHTML = `
        <span class="col-head-title mono">${col.title}</span>
        <span class="col-head-sub mono">${col.sub}</span>
        <div class="col-ruler mono">${col.ruler.map((r) => `<span>${r}</span>`).join('')}</div>
      `;
      headerEl.appendChild(hDiv);
    });

    // Guide Rows
    const guides = document.createElement('div');
    guides.className = 'guide-rows-box';
    for (let d = 1; d <= totalDays; d++) {
      const mon = isMonday(state.year, state.month, d);
      const rec = getDayRecord(state.year, state.month, d);
      const hasData = hasAnyData(rec);
      const isUnsyncedActive = hasData && !rec.syncedToPaper;
      const isDimmed = state.highlightUnsynced && !isUnsyncedActive;

      const g = document.createElement('div');
      g.className = 'guide-row' +
        (mon ? ' is-mon' : '') +
        (d === state.selectedDay ? ' is-selected' : '') +
        (isDimmed ? ' dimmed-row' : '') +
        (state.highlightUnsynced && isUnsyncedActive ? ' active-unsynced-row' : '');
      guides.appendChild(g);
    }
    stage.appendChild(guides);

    const svgNS = 'http://www.w3.org/2000/svg';

    const colWraps = metricCols.map((col) => {
      const colDiv = document.createElement('div');
      colDiv.className = `graph-col col-${col.id}`;
      stage.appendChild(colDiv);
      return colDiv;
    });

    metricCols.forEach((col, idx) => {
      const colWrap = colWraps[idx];
      const measuredW = colWrap.getBoundingClientRect().width;
      const colW = measuredW > 30 ? Math.round(measuredW) : col.defaultW;

      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'graph-svg');
      svg.setAttribute('viewBox', `0 0 ${colW} ${totalHeight}`);

      const padX = col.id === 'mood' ? 12 : 9;
      const usableW = Math.max(20, colW - padX * 2);

      const valToX = (v) => {
        const clamped = Math.max(col.minVal, Math.min(col.maxVal, v));
        const r = (clamped - col.minVal) / (col.maxVal - col.minVal);
        return padX + r * usableW;
      };

      // Ticks
      col.ticks.forEach((t) => {
        const tx = valToX(t);
        const l = document.createElementNS(svgNS, 'line');
        l.setAttribute('x1', tx.toFixed(1));
        l.setAttribute('y1', '0');
        l.setAttribute('x2', tx.toFixed(1));
        l.setAttribute('y2', String(totalHeight));
        l.setAttribute('stroke', '#202020');
        l.setAttribute('stroke-dasharray', '2,3');
        l.setAttribute('stroke-width', '1');
        svg.appendChild(l);
      });

      // Gather points
      const pts = [];
      for (let d = 1; d <= totalDays; d++) {
        const rec = getDayRecord(state.year, state.month, d);
        const val = col.getVal(rec);
        if (val !== null && val !== undefined && !Number.isNaN(val)) {
          pts.push({
            day: d,
            x: valToX(val),
            y: (d - 0.5) * rowHeight,
            label: col.getLabel(rec),
            val,
            isUnsynced: !rec.syncedToPaper
          });
        }
      }

      // Draw lines
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', p1.x.toFixed(1));
        line.setAttribute('y1', p1.y.toFixed(1));
        line.setAttribute('x2', p2.x.toFixed(1));
        line.setAttribute('y2', p2.y.toFixed(1));

        const isDimmed = state.highlightUnsynced && !p1.isUnsynced && !p2.isUnsynced;
        line.setAttribute('stroke', '#FFFFFF');
        line.setAttribute('stroke-width', '1.6');
        line.setAttribute('stroke-opacity', isDimmed ? '0.2' : '0.9');
        if (p2.day - p1.day > 1) {
          line.setAttribute('stroke-dasharray', '3,3');
        }
        svg.appendChild(line);
      }

      // Draw dots & labels
      pts.forEach((pt) => {
        const isDimmed = state.highlightUnsynced && !pt.isUnsynced;
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('opacity', isDimmed ? '0.2' : '1');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', pt.x.toFixed(1));
        circle.setAttribute('cy', pt.y.toFixed(1));
        circle.setAttribute('r', '2.8');
        circle.setAttribute('fill', '#FFFFFF');
        circle.setAttribute('stroke', '#0A0A0A');
        circle.setAttribute('stroke-width', '1.5');
        g.appendChild(circle);

        if (pt.label) {
          const txt = document.createElementNS(svgNS, 'text');
          const placeLeft = pt.x > colW * 0.52;
          const labelX = placeLeft ? pt.x - 5 : pt.x + 5;
          txt.setAttribute('x', labelX.toFixed(1));
          txt.setAttribute('y', (pt.y + 3).toFixed(1));
          txt.setAttribute('text-anchor', placeLeft ? 'end' : 'start');
          txt.setAttribute('font-family', "'JetBrains Mono', monospace");
          txt.setAttribute('font-size', '7.6px');
          txt.setAttribute('font-weight', '600');
          txt.setAttribute('fill', '#EEEEEE');
          txt.setAttribute('paint-order', 'stroke');
          txt.setAttribute('stroke', '#0E0E0E');
          txt.setAttribute('stroke-width', '2px');
          txt.textContent = pt.label;
          g.appendChild(txt);
        } else if (col.id === 'mood') {
          const mTxt = document.createElementNS(svgNS, 'text');
          const placeLeft = pt.x > colW * 0.6;
          mTxt.setAttribute('x', (placeLeft ? pt.x - 5 : pt.x + 5).toFixed(1));
          mTxt.setAttribute('y', (pt.y + 3).toFixed(1));
          mTxt.setAttribute('text-anchor', placeLeft ? 'end' : 'start');
          mTxt.setAttribute('font-family', "'JetBrains Mono', monospace");
          mTxt.setAttribute('font-size', '7.6px');
          mTxt.setAttribute('fill', '#888888');
          mTxt.textContent = String(pt.val);
          g.appendChild(mTxt);
        }

        svg.appendChild(g);
      });

      colWrap.addEventListener('click', (e) => {
        const rect = colWrap.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const clickedDay = Math.max(1, Math.min(totalDays, Math.floor((relY / rect.height) * totalDays) + 1));
        state.selectedDay = clickedDay;
        saveState(false);
        renderAll(false);
      });

      colWrap.appendChild(svg);
    });

    // Render Footers
    metricCols.forEach((col) => {
      let sum = 0, count = 0;
      for (let d = 1; d <= totalDays; d++) {
        const r = state.records[makeDateKey(state.year, state.month, d)];
        if (!r) continue;
        const v = col.getVal(r);
        if (v !== null && v !== undefined && !Number.isNaN(v)) {
          sum += v;
          count++;
        }
      }
      const cell = document.createElement('div');
      cell.className = 'footer-cell';
      if (col.id === 'mood') {
        cell.textContent = count ? `Ø ${(sum / count).toFixed(1)}` : '—';
      } else {
        cell.textContent = count ? `Ø ${formatDurationCompact(Math.round(sum / count))}` : '—';
      }
      footerEl.appendChild(cell);
    });
  }

  function renderRightPage(totalDays) {
    const streak = computeCleanStreakUpTo(state.year, state.month, state.selectedDay);
    document.getElementById('rightPageStreakCaption').textContent = `${streak} DAYS CLEAN`;

    const headerEl = document.getElementById('rightHabitsHeader');
    const rowsEl = document.getElementById('rightHabitsRows');
    const footerEl = document.getElementById('rightHabitsFooter');
    headerEl.innerHTML = '';
    rowsEl.innerHTML = '';
    footerEl.innerHTML = '';

    // Build habit column definitions: default 12 + custom habits
    const habitsList = [];
    DEFAULT_HABITS.forEach((h) => {
      habitsList.push({
        id: h.id,
        name: h.name,
        short: h.short,
        index: h.index,
        isCustom: false
      });
    });

    state.customHabits.forEach((ch, i) => {
      habitsList.push({
        id: ch.id,
        name: ch.name,
        short: ch.short || ch.name,
        index: 13 + i,
        isCustom: true
      });
    });

    const totalGridCols = habitsList.length;
    const gridColsStyle = `repeat(${totalGridCols}, 1fr) 1.15fr`;
    headerEl.style.gridTemplateColumns = gridColsStyle;
    footerEl.style.gridTemplateColumns = gridColsStyle;

    // 1. Column Headers
    habitsList.forEach((h) => {
      const col = document.createElement('div');
      col.className = 'habit-header-col';
      col.title = `${h.index}. ${h.name}`;
      col.innerHTML = `
        <span class="habit-v-title mono">${h.short}</span>
        <span class="habit-v-num mono">${pad2(h.index)}</span>
      `;
      headerEl.appendChild(col);
    });

    // Column 13: Abstinence
    const col13 = document.createElement('div');
    col13.className = 'habit-header-col col-13';
    col13.title = 'Abstinence Control (Empty = Clean, ✕ = Relapse)';
    col13.innerHTML = `
      <span class="habit-v-title habit-col-13-title mono">${ANTI_HABIT.short}</span>
      <span class="habit-v-num mono">!</span>
    `;
    headerEl.appendChild(col13);

    // 2. Rows
    const colTotals = new Array(totalGridCols).fill(0);
    let relapseTotal = 0;

    for (let d = 1; d <= totalDays; d++) {
      const mon = isMonday(state.year, state.month, d);
      const rec = getDayRecord(state.year, state.month, d);
      const hasData = hasAnyData(rec);
      const isUnsyncedActive = hasData && !rec.syncedToPaper;
      const isDimmed = state.highlightUnsynced && !isUnsyncedActive;

      const row = document.createElement('div');
      row.className = 'right-row' +
        (mon ? ' is-mon' : '') +
        (d === state.selectedDay ? ' is-selected' : '') +
        (isDimmed ? ' dimmed-row' : '') +
        (state.highlightUnsynced && isUnsyncedActive ? ' active-unsynced-row' : '');
      row.style.gridTemplateColumns = gridColsStyle;

      // Habit Cells (Defaults + Custom)
      habitsList.forEach((h, idx) => {
        const checked = h.isCustom
          ? Boolean(rec.customHabits && rec.customHabits[h.id])
          : Boolean(rec.habits && rec.habits[h.id]);

        if (checked) colTotals[idx]++;

        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'grid-cell' + (checked ? ' checked' : '');
        cell.title = `Day ${d} · ${h.name}: ${checked ? 'Done' : 'Empty'}`;
        cell.innerHTML = '<span class="cell-ink"></span>';

        cell.addEventListener('click', () => {
          state.selectedDay = d;
          if (h.isCustom) {
            rec.customHabits[h.id] = !checked;
          } else {
            rec.habits[h.id] = !checked;
          }
          saveState();
          renderAll(false);
        });

        row.appendChild(cell);
      });

      // 13th Column: Relapse
      const isRelapse = Boolean(rec.relapse);
      if (isRelapse) relapseTotal++;

      const cell13 = document.createElement('button');
      cell13.type = 'button';
      cell13.className = 'grid-cell col-13' + (isRelapse ? ' relapsed' : '');
      cell13.title = `Day ${d} · Abstinence: ${isRelapse ? 'Relapse' : 'Clean'}`;
      cell13.innerHTML = '<span class="cell-ink"></span>';

      cell13.addEventListener('click', () => {
        state.selectedDay = d;
        rec.relapse = !isRelapse;
        saveState();
        renderAll(false);
      });

      row.appendChild(cell13);
      rowsEl.appendChild(row);
    }

    // 3. Totals Footer
    colTotals.forEach((tot) => {
      const f = document.createElement('div');
      f.className = 'r-footer-cell';
      f.textContent = String(tot);
      footerEl.appendChild(f);
    });

    const f13 = document.createElement('div');
    f13.className = 'r-footer-cell col-13';
    f13.title = 'Total relapses';
    f13.textContent = String(relapseTotal);
    footerEl.appendChild(f13);
  }

  // =========================================================================
  // VIEW SWITCHING & EVENT HANDLERS
  // =========================================================================

  function setMode(mode, subPage) {
    state.activeMode = mode;
    if (subPage) state.spreadPageMode = subPage;

    document.getElementById('viewDock').classList.toggle('active', mode === 'dock');
    document.getElementById('viewSpread').classList.toggle('active', mode === 'spread');

    document.getElementById('tabDockBtn').classList.toggle('active', mode === 'dock');
    document.getElementById('tabSpreadBtn').classList.toggle('active', mode === 'spread');

    document.querySelectorAll('[data-spread-page]').forEach((b) => {
      b.classList.toggle('active', b.dataset.spreadPage === state.spreadPageMode);
    });

    document.getElementById('bottomNavDock').classList.toggle('active', mode === 'dock');
    document.getElementById('bottomNavSpreadLeft').classList.toggle(
      'active',
      mode === 'spread' && state.spreadPageMode === 'left'
    );
    document.getElementById('bottomNavSpreadRight').classList.toggle(
      'active',
      mode === 'spread' && state.spreadPageMode === 'right'
    );
    document.getElementById('bottomNavSpreadFull').classList.toggle(
      'active',
      mode === 'spread' && state.spreadPageMode === 'both'
    );

    renderAll(false);
  }

  function renderAll(scrollRibbon = false) {
    renderHeader();
    renderDayStrip(scrollRibbon);
    renderDailyDock();
    renderNotebookSpread();
  }

  function initEvents() {
    // Mode Switcher
    document.getElementById('tabDockBtn').addEventListener('click', () => setMode('dock'));
    document.getElementById('tabSpreadBtn').addEventListener('click', () => setMode('spread'));

    // Mobile Bottom Bar
    document.getElementById('bottomNavDock').addEventListener('click', () => setMode('dock'));
    document.getElementById('bottomNavSpreadLeft').addEventListener('click', () => setMode('spread', 'left'));
    document.getElementById('bottomNavSpreadRight').addEventListener('click', () => setMode('spread', 'right'));
    document.getElementById('bottomNavSpreadFull').addEventListener('click', () => setMode('spread', 'both'));

    // Month Navigation
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
      state.month--;
      if (state.month < 0) { state.month = 11; state.year--; }
      saveState();
      renderAll(true);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
      state.month++;
      if (state.month > 11) { state.month = 0; state.year++; }
      saveState();
      renderAll(true);
    });

    document.getElementById('currentMonthBtn').addEventListener('click', () => {
      state.year = 2026;
      state.month = 9; // October 2026
      state.selectedDay = 30;
      saveState();
      renderAll(true);
    });

    // Day Prev / Next
    document.getElementById('prevDayBtn').addEventListener('click', () => {
      if (state.selectedDay > 1) {
        state.selectedDay--;
      } else {
        state.month--;
        if (state.month < 0) { state.month = 11; state.year--; }
        state.selectedDay = getDaysInMonth(state.year, state.month);
      }
      saveState();
      renderAll(true);
    });

    document.getElementById('nextDayBtn').addEventListener('click', () => {
      const maxD = getDaysInMonth(state.year, state.month);
      if (state.selectedDay < maxD) {
        state.selectedDay++;
      } else {
        state.month++;
        if (state.month > 11) { state.month = 0; state.year++; }
        state.selectedDay = 1;
      }
      saveState();
      renderAll(true);
    });

    // Paper Sync Toggle
    document.getElementById('dockPaperSyncBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.syncedToPaper = !rec.syncedToPaper;
      saveState(rec.syncedToPaper ? 'Marked as synced to paper ✓' : 'Marked as unsynced');
      renderAll(false);
    });

    // 1. SLEEP INPUTS
    const bedInput = document.getElementById('bedtimeInput');
    const wakeInput = document.getElementById('waketimeInput');

    const updateSleep = (bVal, wVal) => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.sleepStart = bVal;
      rec.sleepEnd = wVal;
      saveState();
      renderAll(false);
    };

    bedInput.addEventListener('change', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      updateSleep(bedInput.value || '23:30', rec.sleepEnd || wakeInput.value || '07:30');
    });

    wakeInput.addEventListener('change', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      updateSleep(rec.sleepStart || bedInput.value || '23:30', wakeInput.value || '07:30');
    });

    document.querySelectorAll('[data-sleep-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        const target = btn.dataset.sleepStep;
        const delta = Number(btn.dataset.delta);
        const curBed = parseTimeStr(rec.sleepStart || bedInput.value || '23:30');
        const curWake = parseTimeStr(rec.sleepEnd || wakeInput.value || '07:30');
        if (target === 'bed') {
          updateSleep(minutesToHHMM(curBed + delta), minutesToHHMM(curWake));
        } else {
          updateSleep(minutesToHHMM(curBed), minutesToHHMM(curWake + delta));
        }
      });
    });

    document.getElementById('clearSleepBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.sleepStart = null;
      rec.sleepEnd = null;
      saveState('Sleep cleared');
      renderAll(false);
    });

    // 2. SCREEN TIME
    document.getElementById('screenRange').addEventListener('input', (e) => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.screenTime = Number(e.target.value);
      saveState();
      renderAll(false);
    });

    document.querySelectorAll('[data-screen-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        rec.screenTime = Number(btn.dataset.screenPreset);
        saveState();
        renderAll(false);
      });
    });

    document.getElementById('clearScreenBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.screenTime = null;
      saveState('Screen time cleared');
      renderAll(false);
    });

    // 3. STUDY TIME
    document.getElementById('studyRange').addEventListener('input', (e) => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.studyTime = Number(e.target.value);
      saveState();
      renderAll(false);
    });

    document.querySelectorAll('[data-study-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        rec.studyTime = Number(btn.dataset.studyPreset);
        saveState();
        renderAll(false);
      });
    });

    document.getElementById('clearStudyBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.studyTime = null;
      saveState('Study time cleared');
      renderAll(false);
    });

    // 4. MOOD
    document.querySelectorAll('.mood-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        rec.mood = Number(btn.dataset.mood);
        saveState();
        renderAll(false);
      });
    });

    document.getElementById('clearMoodBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.mood = null;
      saveState('Mood cleared');
      renderAll(false);
    });

    // 5. WORKOUT
    document.getElementById('workoutRange').addEventListener('input', (e) => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.workoutTime = Number(e.target.value);
      saveState();
      renderAll(false);
    });

    document.querySelectorAll('[data-workout-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        rec.workoutTime = Number(btn.dataset.workoutPreset);
        saveState();
        renderAll(false);
      });
    });

    document.getElementById('clearWorkoutBtn').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.workoutTime = null;
      saveState('Workout cleared');
      renderAll(false);
    });

    // Duration Steppers (-15m / +15m)
    document.querySelectorAll('[data-dur-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.durStep;
        const delta = Number(btn.dataset.delta);
        const rec = getDayRecord(state.year, state.month, state.selectedDay);
        const cur = rec[field] !== null && rec[field] !== undefined ? rec[field] : 0;
        rec[field] = Math.max(0, cur + delta);
        saveState();
        renderAll(false);
      });
    });

    // 13. ABSTINENCE
    document.getElementById('btnCleanDay').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.relapse = false;
      saveState('Clean day recorded');
      renderAll(false);
    });

    document.getElementById('btnRelapseDay').addEventListener('click', () => {
      const rec = getDayRecord(state.year, state.month, state.selectedDay);
      rec.relapse = true;
      saveState('Relapse marked in column 13');
      renderAll(false);
    });

    // SPREAD CONTROLS
    document.getElementById('highlightUnsyncedToggle').addEventListener('change', (e) => {
      state.highlightUnsynced = e.target.checked;
      saveState();
      renderAll(false);
    });

    document.getElementById('markAllSyncedBtn').addEventListener('click', () => {
      const totalDays = getDaysInMonth(state.year, state.month);
      let count = 0;
      for (let d = 1; d <= totalDays; d++) {
        const rec = state.records[makeDateKey(state.year, state.month, d)];
        if (rec && hasAnyData(rec) && !rec.syncedToPaper) {
          rec.syncedToPaper = true;
          count++;
        }
      }
      saveState(count > 0 ? `Marked ${count} days as synced ✓` : 'All days already synced ✓');
      renderAll(false);
    });

    document.querySelectorAll('[data-spread-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.spreadPageMode = btn.dataset.spreadPage;
        setMode('spread', state.spreadPageMode);
      });
    });

    window.addEventListener('resize', () => {
      if (state.activeMode === 'spread') {
        renderNotebookSpread();
      }
    });

    // =======================================================================
    // ADD TRACKER MODAL LOGIC (TIME METRIC OR YES/NO HABIT)
    // =======================================================================
    const addModal = document.getElementById('addTrackerModal');
    const addForm = document.getElementById('addTrackerForm');
    const nameInput = document.getElementById('trackerNameInput');
    const scaleGroup = document.getElementById('timeScaleGroup');
    const scaleInput = document.getElementById('trackerScaleInput');
    const typeTimeBtn = document.getElementById('typeTimeBtn');
    const typeHabitBtn = document.getElementById('typeHabitBtn');
    let currentNewTrackerType = 'time'; // 'time' | 'habit'

    const setTrackerType = (type) => {
      currentNewTrackerType = type;
      typeTimeBtn.classList.toggle('active', type === 'time');
      typeHabitBtn.classList.toggle('active', type === 'habit');
      scaleGroup.classList.toggle('hidden', type !== 'time');
      if (type === 'time') {
        nameInput.placeholder = 'e.g. Meditation, Piano, Reading Time';
      } else {
        nameInput.placeholder = 'e.g. Cold Shower, No Sugar, Stretches';
      }
    };

    const openAddTrackerModal = (defaultType = 'time') => {
      setTrackerType(defaultType);
      nameInput.value = '';
      addModal.classList.remove('hidden');
      setTimeout(() => nameInput.focus(), 50);
    };

    const closeAddTrackerModal = () => {
      addModal.classList.add('hidden');
    };

    document.getElementById('openAddMetricBtn').addEventListener('click', () => openAddTrackerModal('time'));
    document.getElementById('openAddHabitBtn').addEventListener('click', () => openAddTrackerModal('habit'));
    document.getElementById('openAddTrackerTopBtn').addEventListener('click', () => openAddTrackerModal('time'));
    document.getElementById('closeAddTrackerModalBtn').addEventListener('click', closeAddTrackerModal);
    document.getElementById('cancelAddTrackerBtn').addEventListener('click', closeAddTrackerModal);

    typeTimeBtn.addEventListener('click', () => setTrackerType('time'));
    typeHabitBtn.addEventListener('click', () => setTrackerType('habit'));

    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;

      if (currentNewTrackerType === 'time') {
        const id = `custom_m_${Date.now()}`;
        const maxHours = Number(scaleInput.value) || 2;
        state.customMetrics.push({
          id,
          name,
          maxHours
        });
        saveState(`Metric "${name}" added ✓`);
      } else {
        const id = `custom_h_${Date.now()}`;
        state.customHabits.push({
          id,
          name,
          short: name.length > 9 ? name.slice(0, 8) + '.' : name
        });
        saveState(`Habit "${name}" added ✓`);
      }

      closeAddTrackerModal();
      renderAll(false);
    });

    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) closeAddTrackerModal();
    });

    // =======================================================================
    // JSON BACKUP MODAL
    // =======================================================================
    const modal = document.getElementById('backupModal');
    const jsonTextarea = document.getElementById('jsonBackupTextarea');

    const openModal = () => {
      jsonTextarea.value = JSON.stringify({
        records: state.records,
        customMetrics: state.customMetrics,
        customHabits: state.customHabits
      }, null, 2);
      modal.classList.remove('hidden');
    };

    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('openBackupModalBtn').addEventListener('click', openModal);
    document.getElementById('closeBackupModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('downloadJsonBtn').addEventListener('click', () => {
      const blob = new Blob([jsonTextarea.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-backup-${state.year}-${pad2(state.month + 1)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('JSON file downloaded');
    });

    document.getElementById('uploadJsonInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (parsed.records) state.records = parsed.records;
          else state.records = parsed;
          if (Array.isArray(parsed.customMetrics)) state.customMetrics = parsed.customMetrics;
          if (Array.isArray(parsed.customHabits)) state.customHabits = parsed.customHabits;
          saveState('Backup imported successfully');
          renderAll(true);
          closeModal();
        } catch (err) {
          showToast('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('copyJsonTextBtn').addEventListener('click', () => {
      jsonTextarea.select();
      navigator.clipboard?.writeText(jsonTextarea.value);
      showToast('Copied to clipboard');
    });

    document.getElementById('applyJsonTextBtn').addEventListener('click', () => {
      try {
        const parsed = JSON.parse(jsonTextarea.value);
        if (parsed.records) state.records = parsed.records;
        else state.records = parsed;
        if (Array.isArray(parsed.customMetrics)) state.customMetrics = parsed.customMetrics;
        if (Array.isArray(parsed.customHabits)) state.customHabits = parsed.customHabits;
        saveState('JSON text imported');
        renderAll(true);
        closeModal();
      } catch (err) {
        showToast('Invalid JSON text');
      }
    });

    document.getElementById('clearAllDataBtn').addEventListener('click', () => {
      state.records = {};
      state.customMetrics = [];
      state.customHabits = [];
      saveState('All records & custom trackers cleared');
      renderAll(true);
      closeModal();
    });
  }

  // Bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initEvents();
    renderAll(true);
  });
})();
