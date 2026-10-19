(function (root) {
  'use strict';

  const KEY = 'rest-without-scrolling-v3';
  const DEFAULT_TASK = '';
  const DEFAULT_NEXT = '';

  function defaults() {
    return {
      version: 3,
      session: { task: DEFAULT_TASK, next: DEFAULT_NEXT },
      settings: {
        paused: false,
        quietReminders: false,
        optionalNotes: true,
        libraryMode: false
      },
      lastRest: null,
      history: [],
      researcher: { version: 'A', logEnabled: false, logs: [] }
    };
  }

  const text = (value, max = 240) =>
    typeof value === 'string' ? value.slice(0, max) : '';

  const REST_TYPES = [
    'walk', 'water', 'stretch', 'eyes', 'song', 'chat', 'breathe',
    'nothing', 'own', 'phone'
  ];
  const ENDINGS = ['5', '10', '15', 'walk', 'drink', 'song', 'chat', 'self'];
  const ACTIVITIES = ['reading', 'screen', 'class', 'group', 'other'];
  const FATIGUES = ['eyes', 'body', 'mental', 'stuck', 'social', 'unsure'];
  const RESTORING = ['not', 'bit', 'yes'];
  const DURATION_REPORTS = ['shorter', 'right', 'longer', 'unsure'];

  function cleanRest(rest) {
    if (!rest || !REST_TYPES.includes(rest.type)) return null;
    return {
      type: rest.type,
      label: text(rest.label, 120),
      ownIdea: rest.type === 'own' ? text(rest.ownIdea, 160) : '',
      activity: ACTIVITIES.includes(rest.activity) ? rest.activity : '',
      fatigue: FATIGUES.includes(rest.fatigue) ? rest.fatigue : '',
      ending: ENDINGS.includes(rest.ending) ? rest.ending : 'self',
      remind: rest.remind === true
    };
  }

  function cleanHistory(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(item =>
        item && typeof item.id === 'string' &&
        REST_TYPES.includes(item.restType) &&
        RESTORING.includes(item.restoring) &&
        DURATION_REPORTS.includes(item.durationReport) &&
        ENDINGS.includes(item.ending)
      )
      .map(item => ({
        id: text(item.id, 100),
        restType: item.restType,
        label: text(item.label, 120),
        ending: item.ending,
        restoring: item.restoring,
        durationReport: item.durationReport,
        savedAt: Number.isFinite(item.savedAt) ? item.savedAt : 0
      }));
  }

  function cleanLogs(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(item =>
        item && typeof item.id === 'string' &&
        ['A', 'B'].includes(item.version) &&
        Number.isFinite(item.timeToBackMs) &&
        ['keep', 'different', 'study', 'plan', 'end'].includes(item.outcome)
      )
      .map(item => ({
        id: text(item.id, 100),
        version: item.version,
        optionalOpened: item.optionalOpened === true,
        timeToBackMs: Math.max(0, item.timeToBackMs),
        outcome: item.outcome,
        recordedAt: Number.isFinite(item.recordedAt) ? item.recordedAt : 0
      }));
  }

  function clean(raw) {
    const data = defaults();
    if (!raw || raw.version !== 3) return data;
    data.session = {
      task: text(raw.session?.task),
      next: text(raw.session?.next)
    };
    data.settings = {
      paused: raw.settings?.paused === true,
      quietReminders: raw.settings?.quietReminders === true,
      optionalNotes: raw.settings?.optionalNotes !== false,
      libraryMode: raw.settings?.libraryMode === true
    };
    data.lastRest = cleanRest(raw.lastRest);
    data.history = cleanHistory(raw.history);
    data.researcher = {
      version: raw.researcher?.version === 'B' ? 'B' : 'A',
      logEnabled: raw.researcher?.logEnabled === true,
      logs: cleanLogs(raw.researcher?.logs)
    };
    return data;
  }

  function load(storage) {
    try {
      const raw = storage.getItem(KEY);
      return { data: raw ? clean(JSON.parse(raw)) : defaults(), available: true };
    } catch {
      return { data: defaults(), available: false };
    }
  }

  function save(storage, data) {
    try {
      storage.setItem(KEY, JSON.stringify(clean(data)));
      return true;
    } catch {
      return false;
    }
  }

  function clear(storage) {
    try {
      storage.removeItem(KEY);
      return true;
    } catch {
      return false;
    }
  }

  root.RestStorage = {
    KEY, defaults, clean, load, save, clear,
    REST_TYPES, ENDINGS, ACTIVITIES, FATIGUES, RESTORING, DURATION_REPORTS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RestStorage;
})(typeof window !== 'undefined' ? window : globalThis);
