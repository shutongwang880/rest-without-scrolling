(function (root) {
  'use strict';

  const FEELINGS = [
    { id: 'tired', label: 'Tired' },
    { id: 'bored', label: 'Bored' },
    { id: 'stressed', label: 'Stressed' },
    { id: 'chat', label: 'Want to chat' },
    { id: 'unsure', label: 'Not sure' }
  ];

  const RESTS = {
    walk: { label: 'Walk', detail: 'Move somewhere else for a little while.' },
    water: { label: 'Water or snack', detail: 'Get something you feel like having.' },
    stretch: { label: 'Stretch', detail: 'Change position or loosen up.' },
    eyes: { label: 'Rest my eyes', detail: 'Look away or close them for a while.' },
    chat: { label: 'Chat offline', detail: 'Talk to someone nearby if you like.' },
    breathe: { label: 'Breathe', detail: 'Sit quietly and let your breathing settle.' },
    nothing: { label: 'Do nothing', detail: 'No exercise and nothing to finish.' },
    own: { label: 'My own idea', detail: 'Choose what works for you.' },
    phone: { label: 'Use my phone', detail: 'That can be the rest you want.' }
  };

  const SUGGESTIONS = {
    tired: ['eyes', 'water', 'stretch'],
    bored: ['walk', 'stretch', 'breathe'],
    stressed: ['breathe', 'walk', 'eyes'],
    chat: ['chat', 'walk', 'water'],
    unsure: ['walk', 'water', 'eyes']
  };

  const ENDINGS = [
    { id: '5', label: '5 min' },
    { id: '10', label: '10 min' },
    { id: '15', label: '15 min' },
    { id: 'walk', label: 'After a walk' },
    { id: 'drink', label: 'After my drink' },
    { id: 'self', label: 'I’ll come back myself' }
  ];

  const OUTCOMES = [
    { id: 'keep', label: 'Keep resting' },
    { id: 'different', label: 'Try a different rest' },
    { id: 'study', label: 'Go back to studying' },
    { id: 'plan', label: 'Change my plan' },
    { id: 'end', label: 'End study for today' }
  ];

  const isTimed = ending => ['5', '10', '15'].includes(ending);

  function initialState(data) {
    return {
      view: 'study',
      session: { ...data.session },
      activeBreak: null,
      setup: restDraft(data),
      backChoice: null,
      planDraft: { ...data.session },
      note: { restoring: '', durationReport: '', saved: false },
      optionalOpen: false,
      researcherOpen: false,
      controlsOpen: false,
      summaryOpen: false,
      endMessage: false
    };
  }

  function restDraft(data) {
    return {
      feeling: '',
      type: '',
      ownIdea: '',
      ending: 'self',
      remind: data.settings.quietReminders === true
    };
  }

  function suggestions(feeling) {
    return (SUGGESTIONS[feeling] || SUGGESTIONS.unsure).map(id => ({ id, ...RESTS[id] }));
  }

  function restLabel(draft) {
    if (!draft?.type) return 'Open break';
    if (draft.type === 'own') return draft.ownIdea.trim() || RESTS.own.label;
    return RESTS[draft.type]?.label || 'Open break';
  }

  function startBreak(state, data, now = Date.now()) {
    const draft = state.setup;
    const activeBreak = {
      id: cryptoId(),
      startedAt: now,
      returnedAt: null,
      optionalOpened: state.optionalOpen,
      type: draft.type,
      label: restLabel(draft),
      ownIdea: draft.type === 'own' ? draft.ownIdea.trim().slice(0, 160) : '',
      feeling: draft.feeling,
      ending: draft.ending,
      remind: draft.remind === true && isTimed(draft.ending),
      reminded: false,
      reminderAt:
        draft.remind === true && isTimed(draft.ending)
          ? now + Number(draft.ending) * 60000
          : null,
      intention: { ...state.session },
      version: data.researcher.version
    };
    return {
      ...state,
      view: 'break',
      activeBreak,
      optionalOpen: false,
      note: { restoring: '', durationReport: '', saved: false },
      backChoice: null,
      endMessage: false
    };
  }

  function cryptoId() {
    try {
      return crypto.randomUUID();
    } catch {
      return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
    }
  }

  function makeHistoryRecord(state, now = Date.now()) {
    if (!state.activeBreak || !['not', 'bit', 'yes'].includes(state.note.restoring)) {
      throw new Error('Choose how restoring the break felt before saving.');
    }
    if (!['shorter', 'right', 'longer', 'unsure'].includes(state.note.durationReport)) {
      throw new Error('Choose how the break length felt before saving.');
    }
    return {
      id: cryptoId(),
      restType: state.activeBreak.type || 'nothing',
      label: state.activeBreak.label,
      ending: state.activeBreak.ending,
      restoring: state.note.restoring,
      durationReport: state.note.durationReport,
      savedAt: now
    };
  }

  function insights(history) {
    const cards = [];
    const groups = new Map();
    history.forEach(item => {
      const key = item.restType;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    for (const [key, items] of groups) {
      if (items.length < 3 || cards.length >= 2) continue;
      const yes = items.filter(item => item.restoring === 'yes').length;
      cards.push({
        title: RESTS[key]?.label || items[0].label,
        text: `In ${yes} of ${items.length} saved notes, you said this felt restoring.`
      });
    }

    const phoneOpen = history.filter(item => item.restType === 'phone' && item.ending === 'self');
    if (phoneOpen.length >= 3 && cards.length < 3) {
      const longer = phoneOpen.filter(item => item.durationReport === 'longer').length;
      cards.push({
        title: 'Phone breaks without an end point',
        text: `You answered “Longer” in ${longer} of ${phoneOpen.length} saved notes.`
      });
    }
    return cards.slice(0, 3);
  }

  root.RestModel = {
    FEELINGS, RESTS, SUGGESTIONS, ENDINGS, OUTCOMES,
    isTimed, initialState, restDraft, suggestions, restLabel,
    startBreak, makeHistoryRecord, insights, cryptoId
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RestModel;
})(typeof window !== 'undefined' ? window : globalThis);
