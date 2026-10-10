'use strict';

const Model = window.RestModel;
const Store = window.RestStorage;
const app = document.querySelector('#app');
const panelRoot = document.querySelector('#panel-root');
const toast = document.querySelector('#toast');

let storage;
try { storage = window.localStorage; } catch { storage = null; }
const loaded = Store.load(storage);
let data = loaded.data;
let storageAvailable = loaded.available;
data.settings.paused = false;
let state = Model.initialState(data);
let supportPaused = false;
let reminderTimer = null;
let toastTimer = null;
let deleteSummaryConfirm = false;
let deleteControlsConfirm = false;
let permissionExplain = false;
let forceKindOpen = false;
const openSections = { kind: false, ending: false, reminder: false, note: false };

const iconPaths = {
  shield: '<path d="M12 3 4.5 6v5.4c0 4.8 3.2 8.2 7.5 9.6 4.3-1.4 7.5-4.8 7.5-9.6V6L12 3Z"/><path d="m9 12 2 2 4-5"/>',
  chart: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="m15 18-6-6 6-6"/>',
  coffee: '<path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 2h2a3 3 0 0 1 0 6h-2"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5Zm16 0A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>',
  trash: '<path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7"/>'
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function persist(candidate = data) {
  if (Store.save(storage, candidate)) {
    data = candidate;
    storageAvailable = true;
    return true;
  }
  storageAvailable = false;
  showToast('Local saving is unavailable. This screen still works, but changes may not be kept.');
  return false;
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5500);
}

function header() {
  const subview = ['summary', 'end'].includes(state.view);
  return `<header class="topbar">
    <div class="brand"><span class="brand-mark">${icon('pause')}</span><span>Rest Without Scrolling</span></div>
    <div class="top-actions">
      ${subview ? `<button class="icon-button with-label" data-action="back-view">${icon('arrow')}<span>Back</span></button>` : ''}
      <button class="icon-button with-label" data-action="summary" aria-label="My rest patterns">${icon('chart')}<span>My rest patterns</span></button>
      <button class="icon-button" data-action="controls" aria-label="Controls and privacy">${icon('shield')}</button>
    </div>
  </header>`;
}

function shell(content) {
  document.documentElement.classList.toggle('library', data.settings.libraryMode);
  app.innerHTML = header() + content;
  renderPanels();
}

function StudyView() {
  return `<main class="view" data-view="study">
    <div class="eyebrow"><span class="eyebrow-dot"></span>Studying</div>
    <h1>Keep your place.<br>Take your break.</h1>
    <p class="lede">Leave yourself one clear step to return to, if you like.</p>
    <section class="card session-card" aria-label="Study intention">
      <div class="field">
        <label for="study-task">What I’m doing</label>
        <input class="text-input" id="study-task" maxlength="240" value="${esc(state.session.task)}" placeholder="Essay draft, intro">
      </div>
      <div class="field">
        <label for="study-next">Next step</label>
        <input class="text-input" id="study-next" maxlength="240" value="${esc(state.session.next)}" placeholder="Write the first sentence of paragraph 2">
      </div>
      <p class="help">Saved on this device as you type. Empty works too.</p>
    </section>
    <div class="start-row">
      <button class="primary" data-action="take-break">${icon('coffee')}Take a break</button>
      <span class="shortcut">or press B</span>
    </div>
    <div class="link-row">
      <button class="link-button" data-action="controls">${icon('shield')}Controls &amp; privacy</button>
      <button class="link-button" data-action="summary">${icon('chart')}My rest patterns</button>
    </div>
  </main>`;
}

function SetupView() {
  return `<main class="view" data-view="setup">
    <div class="eyebrow"><span class="eyebrow-dot"></span>Research version B</div>
    <h1>What do you need from this break?</h1>
    <p class="lede">Tell us what led to the break, then choose from three small options.</p>
    <section class="card session-card">
      ${restKindBody(true)}
      <div class="spacer-24"></div>
      ${reminderBody(true)}
      <div class="button-row">
        <button class="primary" data-action="start-setup">Start break</button>
        <button class="text-button" data-action="cancel-setup">Cancel</button>
      </div>
    </section>
  </main>`;
}

function BreakView() {
  const active = state.activeBreak;
  const reminderText = active && Model.isTimed(active.ending)
    ? `Your break was set for about ${active.ending} minutes. Whenever you’re ready.`
    : 'Whenever you’re ready.';
  return `<main class="view" data-view="break">
    <section class="break-message">
      <div class="eyebrow"><span class="eyebrow-dot"></span>On a break</div>
      <h1>You’re on a break.</h1>
      <p class="lede">Nothing is blocked. Your device is yours.</p>
      <div class="soft-bar" id="reminder-bar" ${active?.reminded ? '' : 'hidden'}>
        <span>${esc(reminderText)}</span>
        <span class="soft-bar-actions">
          <button class="secondary-button" data-action="return">I’m ready</button>
          <button class="icon-button" data-action="dismiss-reminder" aria-label="Dismiss reminder">${icon('x')}</button>
        </span>
      </div>
      ${active?.type ? selectedRestSummary(active) : ''}
      <div class="back-action"><button class="primary sky" data-action="return">I’m back</button></div>
    </section>
    ${supportPaused ? '<p class="paused-note">Break support is paused. “I’m back” still works whenever you’re ready.</p>' : `
      <section class="optional-zone" aria-label="Optional break choices">
        <p class="optional-heading">A little help, if you want it <span class="muted">(optional)</span></p>
        ${accordion('kind', 'Help me choose this rest', restKindBody(false))}
        ${accordion('reminder', 'Quiet reminder', reminderBody(false))}
      </section>
    `}
  </main>`;
}

function accordion(name, title, body) {
  const open = openSections[name] || (name === 'kind' && forceKindOpen);
  return `<details class="accordion" data-section="${name}" ${open ? 'open' : ''}>
    <summary>${title}</summary>
    <div class="accordion-body">${body}</div>
  </details>`;
}

function choiceChips(items, action, current, label) {
  return `<div class="chips" aria-label="${label}">${items.map(item =>
    `<button class="pill" data-action="${action}" data-value="${item.id}" aria-pressed="${current === item.id}">${item.label}</button>`
  ).join('')}</div>`;
}

function restCards() {
  const suggestions = Model.suggestions(state.setup.activity, state.setup.fatigue);
  const suggestedIds = new Set(suggestions.map(item => item.id));
  const extras = ['nothing', 'own', 'phone'].filter(id => !suggestedIds.has(id)).map(id => ({ id, ...Model.RESTS[id] }));
  return `<div class="rest-grid">${suggestions.map(item =>
    `<button class="rest-card" data-action="rest-type" data-value="${item.id}" aria-pressed="${state.setup.type === item.id}">
      <strong>${item.label}</strong><span>${item.detail}</span><em>Stops: ${Model.endingLabel(item.ending)}</em>
    </button>`
  ).join('')}</div>
  <div class="other-rests"><span>Or choose</span>${extras.map(item => `<button class="pill" data-action="rest-type" data-value="${item.id}" aria-pressed="${state.setup.type === item.id}">${item.label}</button>`).join('')}</div>`;
}

function restKindBody(setupMode) {
  const ready = state.setup.activity && state.setup.fatigue;
  return `
    <div class="guided-step">
      <p class="section-label"><span class="step-number">1</span> What were you doing?</p>
      ${choiceChips(Model.ACTIVITIES, 'activity', state.setup.activity, 'What you were doing')}
    </div>
    <div class="guided-step">
      <p class="section-label"><span class="step-number">2</span> Why do you feel tired?</p>
      ${choiceChips(Model.FATIGUES, 'fatigue', state.setup.fatigue, 'Why you feel tired')}
    </div>
    <button class="secondary-button generate-button" data-action="generate-suggestions" ${ready ? '' : 'disabled'}>Show three suggestions</button>
    ${state.suggestionsReady ? `
      <div class="guided-step suggestion-step">
        <p class="section-label"><span class="step-number">3</span> Suggested for this break</p>
        <p class="help recommendation-reason">Based on what you were doing and what feels tired.</p>
        ${restCards()}
      </div>
      ${state.setup.type === 'own' ? `<div class="own-field"><label class="section-label" for="${setupMode ? 'setup-own' : 'break-own'}">My own rest</label><input class="text-input" id="${setupMode ? 'setup-own' : 'break-own'}" maxlength="160" value="${esc(state.setup.ownIdea)}" placeholder="Sit outside, call a friend…"></div>` : ''}
      ${state.setup.type === 'phone' ? '<p class="phone-copy">Want to set where this ends? You can skip.</p>' : ''}
      ${state.setup.type ? `
        <div class="guided-step duration-step">
          <p class="section-label"><span class="step-number">4</span> Choose a time or stopping point</p>
          ${endingBody()}
        </div>
        ${selectedRestSummary(state.setup)}
      ` : ''}
    ` : ''}
  `;
}

function endingBody() {
  return `<p class="help ending-help">Use a time, keep the suggestion’s natural end, or decide for yourself.</p><div class="chips" aria-label="How the break will end">${Model.endingOptions(state.setup.type).map(item =>
    `<button class="pill" data-action="ending" data-value="${item.id}" aria-pressed="${state.setup.ending === item.id}">${item.label}</button>`
  ).join('')}</div>`;
}

function selectedRestSummary(rest) {
  if (!rest?.type) return '';
  return `<div class="selected-rest" aria-live="polite">
    <span>Your break</span>
    <strong>${esc(Model.restLabel(rest))}</strong>
    <small>Stops: ${esc(Model.endingLabel(rest.ending))}</small>
  </div>`;
}

function reminderBody() {
  const timed = Model.isTimed(state.setup.ending);
  return `
    <label class="toggle-row">
      <span class="toggle-copy"><strong>Remind me once, quietly</strong><span>Silent. You can ignore it.</span></span>
      <input class="switch" id="break-reminder" type="checkbox" ${timed && state.setup.remind ? 'checked' : ''} ${timed ? '' : 'disabled'} aria-label="Remind me once, quietly">
    </label>
    ${!timed ? '<p class="help">Choose 5, 10 or 15 minutes if you want a reminder.</p>' : ''}
    ${permissionExplain && timed && state.setup.remind && !data.settings.libraryMode ? `<div class="permission-card">
      To show one reminder after you leave this tab, Pause needs notification permission.
      <div class="permission-actions">
        <button class="secondary-button" data-action="allow-notification">Allow notification</button>
        <button class="text-button" data-action="page-only">Use page only</button>
      </div>
    </div>` : ''}
    ${data.settings.libraryMode ? '<p class="help">Library mode keeps reminders inside this page.</p>' : ''}
  `;
}

function BackView() {
  const active = state.activeBreak;
  const task = active?.intention?.task || '';
  const next = active?.intention?.next || '';
  const planned = active && Model.isTimed(active.ending)
    ? `<p class="return-plan">You planned about ${active.ending} minutes.</p>` : '';
  return `<main class="view" data-view="back">
    <section class="card return-card">
      <div class="label">Your way back <button class="edit-link" data-action="edit-return">Edit</button></div>
      <div class="return-row"><span>You were doing</span><strong>${esc(task) || 'No task note was set'}</strong></div>
      <div class="return-row"><span>Next step</span><strong>${esc(next) || 'Choose one when you’re ready'}</strong></div>
      ${planned}
    </section>
    <div class="spacer-24"></div>
    <h1>How would you like to continue?</h1>
    <div class="outcome-grid" aria-label="What to do next">
      ${Model.OUTCOMES.map(item => `<button class="equal-option" data-action="outcome" data-value="${item.id}">${item.label}</button>`).join('')}
    </div>
    ${state.backChoice === 'plan' ? planPanel() : ''}
    ${data.settings.optionalNotes ? QuickNote() : ''}
  </main>`;
}

function planPanel() {
  return `<section class="card plan-panel">
    <h2>Change my plan</h2>
    <p class="help">No explanation needed.</p>
    <div class="field"><label for="plan-task">What I’m doing</label><input class="text-input" id="plan-task" maxlength="240" value="${esc(state.planDraft.task)}"></div>
    <div class="field"><label for="plan-next">Next step</label><input class="text-input" id="plan-next" maxlength="240" value="${esc(state.planDraft.next)}"></div>
    <div class="button-row"><button class="secondary-button" data-action="save-plan">Save</button><button class="text-button" data-action="cancel-plan">Cancel</button></div>
  </section>`;
}

function QuickNote() {
  return `<details class="accordion note-card" data-section="note" ${openSections.note ? 'open' : ''}>
    <summary>Quick note <span class="muted">(optional)</span></summary>
    <div class="accordion-body">
      <p class="section-label">How restoring did it feel?</p>
      <div class="radio-group">
        ${[['not','Not really'],['bit','A bit'],['yes','Yes']].map(([value,label]) => radio('restoring', value, label, state.note.restoring)).join('')}
      </div>
      <p class="section-label">Did it run longer than you expected?</p>
      <div class="radio-group">
        ${[['shorter','Shorter'],['right','About right'],['longer','Longer'],['unsure','Not sure']].map(([value,label]) => radio('durationReport', value, label, state.note.durationReport)).join('')}
      </div>
      <div class="note-actions">
        <button class="secondary-button" data-action="save-note" ${state.note.restoring && state.note.durationReport && !state.note.saved ? '' : 'disabled'}>${state.note.saved ? 'Saved' : 'Save to my private summary'}</button>
        <button class="text-button" data-action="skip-note">Skip</button>
      </div>
      <p class="help">Only notes you save are kept. Delete anytime.</p>
    </div>
  </details>`;
}

function radio(name, value, label, current) {
  return `<label class="radio-chip"><input type="radio" name="${name}" value="${value}" ${current === value ? 'checked' : ''}><span>${label}</span></label>`;
}

function SummaryView() {
  const cards = Model.insights(data.history);
  return `<main class="view" data-view="summary">
    <div class="subview-head"><div><div class="eyebrow"><span class="eyebrow-dot"></span>Private summary</div><h1>My rest patterns</h1><p class="lede">Only you can see this. Built only from notes you chose to save.</p></div></div>
    ${cards.length ? `<div class="insight-grid">${cards.map(card => `<article class="insight-card"><h3>${esc(card.title)}</h3><p>${esc(card.text)}</p></article>`).join('')}</div>` : '<section class="card empty-state"><h2>Nothing yet.</h2><p class="lede">Notes you save will appear here.</p></section>'}
    <div class="button-row"><button class="secondary-button danger" data-action="ask-delete-history">${icon('trash')}Delete my history</button></div>
    ${deleteSummaryConfirm ? `<div class="confirm-box"><p>Delete all saved break notes from this device?</p><div class="button-row"><button class="secondary-button" data-action="confirm-delete-history">Delete history</button><button class="text-button" data-action="cancel-delete-history">Cancel</button></div></div>` : ''}
  </main>`;
}

function EndView() {
  return `<main class="view closed-message" data-view="end">
    <div class="eyebrow"><span class="eyebrow-dot"></span>Study closed</div>
    <h1>Study closed.</h1>
    <p class="lede">Pick it up whenever you like.</p>
    <div class="start-row" style="justify-content:center"><button class="primary" data-action="done">Done</button></div>
  </main>`;
}

function render(preserveFocus = false) {
  const focused = preserveFocus ? document.activeElement?.id : null;
  let content;
  if (state.view === 'study') content = StudyView();
  if (state.view === 'setup') content = SetupView();
  if (state.view === 'break') content = BreakView();
  if (state.view === 'back') content = BackView();
  if (state.view === 'summary') content = SummaryView();
  if (state.view === 'end') content = EndView();
  shell(content);
  document.querySelector('main')?.setAttribute('tabindex', '-1');
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
  if (!preserveFocus) document.querySelector('main')?.focus?.({ preventScroll: true });
}

function ControlsPanel() {
  return `<div class="panel-backdrop" data-action="close-controls">
    <aside class="side-panel" aria-label="Controls and privacy" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="panel-head"><h2>Controls &amp; privacy</h2><button class="icon-button" data-action="close-controls" aria-label="Close controls">${icon('x')}</button></div>
      <section class="panel-section"><h3>What this uses</h3><p>Your task note, study activity, reason for fatigue, rest choice, stopping point, and notes you save. Nothing else.</p></section>
      <section class="panel-section"><h3>What’s shared</h3><p>Nothing. Private to you on this browser profile.</p></section>
      <section class="panel-section">
        ${settingToggle('pause-support', 'Pause support this session', 'Break buttons keep working.', supportPaused)}
        ${settingToggle('quiet-reminders', 'Quiet reminders', 'Off by default. One silent reminder at most.', data.settings.quietReminders)}
        ${settingToggle('optional-notes', 'Optional notes', 'Show the private note card after a break.', data.settings.optionalNotes)}
        ${settingToggle('library-mode', 'Library mode', 'Dimmer colours. Page-only reminders. No animation.', data.settings.libraryMode)}
        ${permissionExplain && !data.settings.libraryMode ? `<div class="permission-card">To show one reminder after you leave this tab, Pause needs notification permission.<div class="permission-actions"><button class="secondary-button" data-action="allow-notification">Allow notification</button><button class="text-button" data-action="page-only">Use page only</button></div></div>` : ''}
      </section>
      <section class="panel-section">
        <button class="secondary-button danger" data-action="ask-controls-delete">Delete my break history</button>
        ${deleteControlsConfirm ? `<div class="confirm-box"><p>Delete every saved break note from this device?</p><div class="button-row"><button class="secondary-button" data-action="confirm-delete-history">Delete history</button><button class="text-button" data-action="cancel-controls-delete">Cancel</button></div></div>` : ''}
      </section>
      <p class="panel-footer">Pause or turn this off anytime, no penalty.${storageAvailable ? '' : ' Local saving is unavailable in this browser.'}</p>
    </aside>
  </div>`;
}

function settingToggle(id, title, help, checked) {
  return `<label class="toggle-row"><span class="toggle-copy"><strong>${title}</strong><span>${help}</span></span><input class="switch" id="${id}" type="checkbox" ${checked ? 'checked' : ''}></label>`;
}

function ResearcherPanel() {
  return `<section class="researcher-panel" aria-label="Researcher mode">
    <div class="panel-head"><div><h2>Researcher mode</h2><p>Usability-testing controls. Stored locally and clearly separated from student notes.</p></div><button class="icon-button" data-action="close-researcher" aria-label="Close researcher mode">${icon('x')}</button></div>
    <div class="research-options">
      <button class="research-choice" data-action="research-version" data-value="A" aria-pressed="${data.researcher.version === 'A'}"><strong>Version A: One-click</strong><br><span class="small">Break starts immediately.</span></button>
      <button class="research-choice" data-action="research-version" data-value="B" aria-pressed="${data.researcher.version === 'B'}"><strong>Version B: Set up first</strong><br><span class="small">Choose rest and ending before starting.</span></button>
    </div>
    ${settingToggle('research-log', 'Record research log', 'Version, optional opening, return time and selected outcome.', data.researcher.logEnabled)}
    <p>${data.researcher.logs.length} local research log${data.researcher.logs.length === 1 ? '' : 's'}.</p>
    <div class="research-actions">
      <button data-action="export-logs">${icon('download')}Export JSON</button>
      <button data-action="delete-logs">${icon('trash')}Delete logs</button>
    </div>
  </section>`;
}

function renderPanels() {
  let html = '';
  if (state.controlsOpen) html += ControlsPanel();
  if (state.researcherOpen) html += ResearcherPanel();
  panelRoot.innerHTML = html;
}

function beginBreak() {
  const clickedAt = Date.now();
  state.setup = Model.restDraft(data);
  state.suggestionsReady = false;
  openSections.kind = openSections.ending = openSections.reminder = false;
  forceKindOpen = false;
  if (data.researcher.version === 'B') {
    state.researchStartAt = clickedAt;
    state.view = 'setup';
    render();
    return;
  }
  state = Model.startBreak(state, data);
  state.activeBreak.startedAt = clickedAt;
  forceKindOpen = true;
  openSections.kind = true;
  scheduleReminder(true);
  render();
}

function startSetupBreak() {
  state = Model.startBreak(state, data);
  state.activeBreak.startedAt = state.researchStartAt || state.activeBreak.startedAt;
  state.researchStartAt = null;
  saveLastRest();
  scheduleReminder(true);
  render();
}

function saveLastRest() {
  if (!state.setup.type) return;
  const lastRest = {
    type: state.setup.type,
    label: Model.restLabel(state.setup),
    ownIdea: state.setup.type === 'own' ? state.setup.ownIdea.trim() : '',
    activity: state.setup.activity,
    fatigue: state.setup.fatigue,
    ending: state.setup.ending,
    remind: state.setup.remind
  };
  persist({ ...data, lastRest });
}

function syncActiveBreak(resetReminder = false) {
  if (!state.activeBreak) return;
  const draft = state.setup;
  state.activeBreak = {
    ...state.activeBreak,
    type: draft.type,
    label: Model.restLabel(draft),
    ownIdea: draft.type === 'own' ? draft.ownIdea.trim() : '',
    activity: draft.activity,
    fatigue: draft.fatigue,
    ending: draft.ending,
    remind: draft.remind && Model.isTimed(draft.ending),
    optionalOpened: state.activeBreak.optionalOpened || state.optionalOpen
  };
  if (resetReminder) {
    state.activeBreak.reminded = false;
    state.activeBreak.reminderAt = state.activeBreak.remind
      ? Date.now() + Number(draft.ending) * 60000
      : null;
  }
  if (draft.type) {
    saveLastRest();
  }
  scheduleReminder(false);
}

function scheduleReminder(reset) {
  clearTimeout(reminderTimer);
  reminderTimer = null;
  const active = state.activeBreak;
  if (!active || state.view !== 'break' || supportPaused || !active.remind || active.reminded) return;
  if (reset || !active.reminderAt) active.reminderAt = Date.now() + Number(active.ending) * 60000;
  const delay = active.reminderAt - Date.now();
  if (delay <= 0) return fireReminder();
  reminderTimer = setTimeout(fireReminder, delay);
}

function fireReminder() {
  clearTimeout(reminderTimer);
  reminderTimer = null;
  const active = state.activeBreak;
  if (!active || active.reminded || supportPaused || state.view !== 'break') return;
  active.reminded = true;
  active.reminderAt = null;
  active.remind = false;
  state.setup.remind = false;
  document.title = 'Whenever you’re ready';
  const message = `Your break was set for about ${active.ending} minutes. Whenever you’re ready.`;
  if (!data.settings.libraryMode && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification('Whenever you’re ready', { body: message, silent: true, tag: 'rest-without-scrolling' });
      notification.onclick = () => { window.focus(); returnFromBreak(); notification.close(); };
    } catch {}
  }
  render(true);
}

async function allowNotification() {
  permissionExplain = false;
  if (!('Notification' in window)) {
    showToast('Browser notifications are unavailable. The reminder will stay inside this page.');
    render(true);
    return;
  }
  try {
    const result = await Notification.requestPermission();
    showToast(result === 'granted' ? 'One silent browser reminder is allowed.' : 'The reminder will stay inside this page.');
  } catch {
    showToast('The reminder will stay inside this page.');
  }
  render(true);
}

function returnFromBreak() {
  clearTimeout(reminderTimer);
  reminderTimer = null;
  document.title = 'Rest Without Scrolling';
  if (state.activeBreak && !state.activeBreak.returnedAt) state.activeBreak.returnedAt = Date.now();
  state.view = 'back';
  state.planDraft = { ...state.session };
  state.backChoice = null;
  forceKindOpen = false;
  render();
}

function chooseOutcome(outcome) {
  recordResearch(outcome);
  if (outcome === 'keep') {
    state.view = 'break';
    state.activeBreak.remind = false;
    state.activeBreak.reminderAt = null;
    state.activeBreak.reminded = false;
    render();
    return;
  }
  if (outcome === 'different') {
    state.view = 'break';
    state.setup.type = '';
    state.setup.ownIdea = '';
    state.suggestionsReady = Boolean(state.setup.activity && state.setup.fatigue);
    forceKindOpen = true;
    openSections.kind = true;
    render();
    return;
  }
  if (outcome === 'plan') {
    state.backChoice = 'plan';
    state.planDraft = { ...state.session };
    render();
    return;
  }
  if (outcome === 'study') {
    state.view = 'study';
    state.activeBreak = null;
    render();
    return;
  }
  if (outcome === 'end') {
    state.view = 'end';
    render();
  }
}

function recordResearch(outcome) {
  const active = state.activeBreak;
  if (!active || active.researchLogged || !data.researcher.logEnabled) return;
  const log = {
    id: Model.cryptoId(),
    version: active.version,
    optionalOpened: active.optionalOpened === true,
    timeToBackMs: Math.max(0, (active.returnedAt || Date.now()) - active.startedAt),
    outcome,
    recordedAt: Date.now()
  };
  active.researchLogged = true;
  persist({ ...data, researcher: { ...data.researcher, logs: [...data.researcher.logs, log] } });
}

function saveNote() {
  try {
    const record = Model.makeHistoryRecord(state);
    if (persist({ ...data, history: [...data.history, record] })) {
      state.note.saved = true;
      render(true);
      showToast('Saved to your private summary.');
    }
  } catch (error) {
    showToast(error.message);
  }
}

function updateSession(task, next) {
  state.session = {
    task: task.slice(0, 240),
    next: next.slice(0, 240)
  };
  persist({ ...data, session: { ...state.session } });
}

function settingChange(id, checked) {
  if (id === 'pause-support') {
    supportPaused = checked;
    if (checked) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
      if (state.activeBreak) {
        state.activeBreak.remind = false;
        state.activeBreak.reminderAt = null;
      }
      state.setup.remind = false;
      document.title = 'Rest Without Scrolling';
    }
  } else if (id === 'research-log') {
    persist({ ...data, researcher: { ...data.researcher, logEnabled: checked } });
  } else {
    const map = {
      'quiet-reminders': 'quietReminders',
      'optional-notes': 'optionalNotes',
      'library-mode': 'libraryMode'
    };
    const key = map[id];
    if (key) persist({ ...data, settings: { ...data.settings, [key]: checked } });
    if (id === 'quiet-reminders') {
      state.setup.remind = checked && Model.isTimed(state.setup.ending);
      permissionExplain = checked && !data.settings.libraryMode &&
        (!('Notification' in window) || Notification.permission === 'default');
      if (state.activeBreak) syncActiveBreak(true);
    }
    if (id === 'library-mode' && checked) permissionExplain = false;
  }
  render(true);
}

function openSummary() {
  state.returnView = ['summary', 'end'].includes(state.view) ? 'study' : state.view;
  state.view = 'summary';
  deleteSummaryConfirm = false;
  render();
}

function backView() {
  state.view = state.returnView || 'study';
  render();
}

function deleteHistory() {
  if (persist({ ...data, history: [] })) {
    deleteSummaryConfirm = deleteControlsConfirm = false;
    render(true);
    showToast('Your saved break history was deleted.');
  }
}

function exportLogs() {
  const body = JSON.stringify({
    label: 'Rest Without Scrolling researcher log',
    exportedAt: new Date().toISOString(),
    logs: data.researcher.logs
  }, null, 2);
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'rest-without-scrolling-research-log.json';
  link.click();
  URL.revokeObjectURL(url);
}

function handleAction(action, value) {
  if (action === 'take-break') beginBreak();
  if (action === 'start-setup') startSetupBreak();
  if (action === 'cancel-setup') { state.view = 'study'; render(); }
  if (action === 'return') returnFromBreak();
  if (action === 'dismiss-reminder') {
    state.activeBreak.reminded = false;
    document.title = 'Rest Without Scrolling';
    render(true);
  }
  if (action === 'activity' || action === 'fatigue') {
    state.setup[action] = value;
    state.setup.type = '';
    state.setup.ownIdea = '';
    state.setup.ending = 'self';
    state.setup.remind = false;
    state.suggestionsReady = false;
    syncActiveBreak(true);
    render(true);
  }
  if (action === 'generate-suggestions' && state.setup.activity && state.setup.fatigue) {
    state.suggestionsReady = true;
    render(true);
  }
  if (action === 'rest-type') {
    state.setup.type = value;
    state.setup.ending = Model.recommendedEnding(value);
    state.setup.remind = Model.isTimed(state.setup.ending) && data.settings.quietReminders;
    if (value !== 'own') state.setup.ownIdea = '';
    syncActiveBreak(true);
    render(true);
  }
  if (action === 'ending') {
    state.setup.ending = value;
    state.setup.remind = Model.isTimed(value) && data.settings.quietReminders;
    syncActiveBreak(true);
    render(true);
  }
  if (action === 'use-usual' && data.lastRest) {
    state.setup = { ...data.lastRest, remind: false };
    state.suggestionsReady = true;
    syncActiveBreak(true);
    render(true);
  }
  if (action === 'allow-notification') allowNotification();
  if (action === 'page-only') { permissionExplain = false; render(true); }
  if (action === 'outcome') chooseOutcome(value);
  if (action === 'save-plan') {
    updateSession(state.planDraft.task, state.planDraft.next);
    state.backChoice = null;
    state.view = 'study';
    state.activeBreak = null;
    render();
  }
  if (action === 'cancel-plan') { state.backChoice = null; render(); }
  if (action === 'edit-return') {
    state.backChoice = 'plan';
    state.planDraft = { ...state.session };
    render();
  }
  if (action === 'save-note') saveNote();
  if (action === 'skip-note') { openSections.note = false; state.note = { restoring: '', durationReport: '', saved: false }; render(true); }
  if (action === 'summary') openSummary();
  if (action === 'back-view') backView();
  if (action === 'controls') { state.controlsOpen = true; renderPanels(); }
  if (action === 'close-controls') { state.controlsOpen = false; renderPanels(); }
  if (action === 'ask-delete-history') { deleteSummaryConfirm = true; render(true); }
  if (action === 'cancel-delete-history') { deleteSummaryConfirm = false; render(true); }
  if (action === 'ask-controls-delete') { deleteControlsConfirm = true; renderPanels(); }
  if (action === 'cancel-controls-delete') { deleteControlsConfirm = false; renderPanels(); }
  if (action === 'confirm-delete-history') deleteHistory();
  if (action === 'done') { state.view = 'study'; state.activeBreak = null; render(); }
  if (action === 'close-researcher') { state.researcherOpen = false; renderPanels(); }
  if (action === 'research-version') {
    persist({ ...data, researcher: { ...data.researcher, version: value } });
    renderPanels();
  }
  if (action === 'export-logs') exportLogs();
  if (action === 'delete-logs') {
    persist({ ...data, researcher: { ...data.researcher, logs: [] } });
    renderPanels();
    showToast('Research logs deleted.');
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (button.classList.contains('panel-backdrop') && event.target !== button) return;
  handleAction(action, button.dataset.value);
});

document.addEventListener('input', event => {
  const element = event.target;
  if (element.id === 'study-task' || element.id === 'study-next') {
    const task = document.querySelector('#study-task')?.value || '';
    const next = document.querySelector('#study-next')?.value || '';
    updateSession(task, next);
  }
  if (element.id === 'setup-own' || element.id === 'break-own') {
    state.setup.ownIdea = element.value;
    syncActiveBreak(false);
  }
  if (element.id === 'plan-task') state.planDraft.task = element.value;
  if (element.id === 'plan-next') state.planDraft.next = element.value;
});

document.addEventListener('change', event => {
  const element = event.target;
  if (element.id === 'break-reminder') {
    state.setup.remind = element.checked;
    const settings = { ...data.settings, quietReminders: element.checked };
    persist({ ...data, settings });
    permissionExplain = element.checked && !data.settings.libraryMode &&
      (!('Notification' in window) || Notification.permission === 'default');
    syncActiveBreak(true);
    render(true);
  }
  if (element.name === 'restoring' || element.name === 'durationReport') {
    state.note[element.name] = element.value;
    state.note.saved = false;
    render(true);
  }
  if (['pause-support', 'quiet-reminders', 'optional-notes', 'library-mode', 'research-log'].includes(element.id)) {
    settingChange(element.id, element.checked);
  }
});

document.addEventListener('toggle', event => {
  const details = event.target;
  if (!details.matches?.('details[data-section]')) return;
  const name = details.dataset.section;
  openSections[name] = details.open;
  if (details.open && ['kind', 'ending', 'reminder'].includes(name)) {
    state.optionalOpen = true;
    if (state.activeBreak) state.activeBreak.optionalOpened = true;
  }
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (state.controlsOpen) { state.controlsOpen = false; renderPanels(); return; }
    if (state.researcherOpen) { state.researcherOpen = false; renderPanels(); }
  }
  if (event.shiftKey && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    state.researcherOpen = !state.researcherOpen;
    renderPanels();
    return;
  }
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'b' && state.view === 'study') {
    event.preventDefault();
    beginBreak();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.activeBreak?.reminderAt && Date.now() >= state.activeBreak.reminderAt) fireReminder();
});

window.addEventListener('storage', event => {
  if (event.key !== Store.KEY && event.key !== null) return;
  const fresh = Store.load(storage);
  data = fresh.data;
  storageAvailable = fresh.available;
  render(true);
});

render();
