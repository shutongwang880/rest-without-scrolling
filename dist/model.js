(function (root) {
  'use strict';

  const FEELINGS = [
    { id: 'tired', label: 'Rest my eyes' },
    { id: 'bored', label: 'Change the pace' },
    { id: 'stressed', label: 'Settle my mind' },
    { id: 'chat', label: 'Talk to someone' },
    { id: 'unsure', label: 'Not sure' }
  ];

  const RESTS = {
    walk: { label: 'Walk one loop', detail: 'Go to one familiar spot and come back.', ending: 'walk' },
    water: { label: 'Get water or a snack', detail: 'Make one thing, then pause there.', ending: 'drink' },
    stretch: { label: 'Stretch for five minutes', detail: 'Change position and loosen up.', ending: '5' },
    eyes: { label: 'Rest my eyes for five minutes', detail: 'Look away from the screen or close them.', ending: '5' },
    song: { label: 'Listen to one song', detail: 'Choose one track, without starting a feed.', ending: 'song' },
    chat: { label: 'Have one short chat', detail: 'Talk to someone nearby or call a friend.', ending: 'chat' },
    breathe: { label: 'Sit and breathe for five minutes', detail: 'Let your body settle without another task.', ending: '5' },
    nothing: { label: 'Do nothing for a while', detail: 'No exercise and nothing to finish.', ending: 'self' },
    own: { label: 'My own idea', detail: 'Choose what works for you.', ending: 'self' },
    phone: { label: 'Use my phone', detail: 'That can be the rest you want.', ending: 'self' }
  };

  const SUGGESTIONS = {
    tired: ['eyes', 'water', 'nothing'],
    bored: ['walk', 'song', 'stretch'],
    stressed: ['breathe', 'eyes', 'walk'],
    chat: ['chat', 'walk', 'water'],
    unsure: ['song', 'walk', 'nothing']
  };

  const ENDINGS = [
    { id: '5', label: '5 min' },
    { id: '10', label: '10 min' },
    { id: '15', label: '15 min' },
    { id: 'walk', label: 'After one loop' },
    { id: 'drink', label: 'When it is ready' },
    { id: 'song', label: 'After one song' },
    { id: 'chat', label: 'After one chat' },
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

  function recommendedEnding(type) {
    return RESTS[type]?.ending || 'self';
  }

  function endingLabel(ending) {
    return ENDINGS.find(item => item.id === ending)?.label || 'I’ll come back myself';
  }

  function endingOptions(type) {
    const recommended = recommendedEnding(type);
    const ids = [recommended, '5', '10', '15', 'self'];
    return [...new Set(ids)].map(id => ENDINGS.find(item => item.id === id)).filter(Boolean);
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
    isTimed, initialState, restDraft, suggestions, recommendedEnding, endingLabel, endingOptions, restLabel,
    startBreak, makeHistoryRecord, insights, cryptoId
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RestModel;
})(typeof window !== 'undefined' ? window : globalThis);
