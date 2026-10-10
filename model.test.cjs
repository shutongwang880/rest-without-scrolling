const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Model = require('./dist/model.js');
const Store = require('./dist/storage.js');

const source = fs.readFileSync('./dist/app.js', 'utf8');
const css = fs.readFileSync('./dist/style.css', 'utf8');
const html = fs.readFileSync('./dist/index.html', 'utf8');

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test('new local data is seeded for an immediate demo and has no history', () => {
  const data = Store.defaults();
  assert.equal(data.session.task, 'Essay draft, intro');
  assert.equal(data.session.next, 'Write the first sentence of paragraph 2');
  assert.equal(data.settings.quietReminders, false);
  assert.equal(data.settings.optionalNotes, true);
  assert.equal(data.history.length, 0);
  assert.equal(data.researcher.version, 'A');
});

test('storage round-trips only approved local fields', () => {
  const storage = memoryStorage();
  const data = Store.defaults();
  data.lastRest = { type: 'walk', label: 'Walk', ownIdea: '', feeling: 'tired', ending: '10', remind: true };
  data.history.push({ id: 'n1', restType: 'walk', label: 'Walk', ending: '10', restoring: 'yes', durationReport: 'right', savedAt: 10 });
  data.researcher.logs.push({ id: 'l1', version: 'A', optionalOpened: true, timeToBackMs: 900, outcome: 'study', recordedAt: 20 });
  assert.equal(Store.save(storage, data), true);
  assert.deepEqual(Store.load(storage).data, data);
});

test('invalid imported history, choices and logs are discarded', () => {
  const raw = Store.defaults();
  raw.lastRest = { type: 'unknown', ending: 'never' };
  raw.history = [{ id: 'x', restType: 'walk', ending: '10', restoring: 'score-10', durationReport: 'right' }];
  raw.researcher.logs = [{ id: 'x', version: 'C', timeToBackMs: -2, outcome: 'wrong' }];
  const data = Store.clean(raw);
  assert.equal(data.lastRest, null);
  assert.equal(data.history.length, 0);
  assert.equal(data.researcher.logs.length, 0);
});

test('feeling-based suggestions change without ranking one correct rest', () => {
  const groups = Model.FEELINGS.map(item => Model.suggestions(item.id).map(rest => rest.id));
  assert.equal(new Set(groups.map(group => group.join(','))).size, 5);
  groups.forEach(group => assert.equal(group.length, 3));
  assert.ok(Model.RESTS.nothing);
  assert.ok(Model.RESTS.own);
  assert.ok(Model.RESTS.phone);
});

test('one-click break snapshots the student intention and starts without a timer', () => {
  const data = Store.defaults();
  const state = Model.initialState(data);
  const next = Model.startBreak(state, data, 1000);
  assert.equal(next.view, 'break');
  assert.deepEqual(next.activeBreak.intention, data.session);
  assert.notEqual(next.activeBreak.intention, data.session);
  assert.equal(next.activeBreak.reminderAt, null);
  assert.equal(next.activeBreak.remind, false);
});

test('only explicitly enabled minute endings create a reminder time', () => {
  const data = Store.defaults();
  for (const ending of ['walk', 'drink', 'self']) {
    const state = Model.initialState(data);
    state.setup = { ...state.setup, ending, remind: true };
    const next = Model.startBreak(state, data, 1000);
    assert.equal(next.activeBreak.reminderAt, null);
    assert.equal(next.activeBreak.remind, false);
  }
  for (const ending of ['5', '10', '15']) {
    const state = Model.initialState(data);
    state.setup = { ...state.setup, ending, remind: true };
    const next = Model.startBreak(state, data, 1000);
    assert.equal(next.activeBreak.reminderAt, 1000 + Number(ending) * 60000);
  }
});

test('private notes require both self-reported answers', () => {
  const data = Store.defaults();
  let state = Model.startBreak(Model.initialState(data), data, 1000);
  state.note = { restoring: 'yes', durationReport: '', saved: false };
  assert.throws(() => Model.makeHistoryRecord(state));
  state.note.durationReport = 'longer';
  const record = Model.makeHistoryRecord(state, 2000);
  assert.equal(record.restoring, 'yes');
  assert.equal(record.durationReport, 'longer');
  assert.deepEqual(Object.keys(record).sort(), ['durationReport','ending','id','label','restType','restoring','savedAt']);
});

test('patterns stay empty below three notes and remain neutral counts', () => {
  const note = { id: '1', restType: 'walk', label: 'Walk', ending: 'self', restoring: 'yes', durationReport: 'right', savedAt: 1 };
  assert.deepEqual(Model.insights([note, { ...note, id: '2' }]), []);
  const cards = Model.insights([note, { ...note, id: '2', restoring: 'bit' }, { ...note, id: '3', restoring: 'not' }]);
  assert.equal(cards.length, 1);
  assert.match(cards[0].text, /1 of 3/);
  assert.doesNotMatch(cards[0].text, /better|worse|should|failed/i);
});

test('phone-without-end insight also waits for three saved notes', () => {
  const note = { id: '1', restType: 'phone', label: 'Use my phone', ending: 'self', restoring: 'bit', durationReport: 'longer', savedAt: 1 };
  const cards = Model.insights([note, { ...note, id: '2' }, { ...note, id: '3', durationReport: 'right' }]);
  assert.ok(cards.some(card => card.title === 'Phone breaks without an end point'));
  assert.ok(cards.some(card => /2 of 3/.test(card.text)));
});

test('the implementation exposes the requested component structure and five equal outcomes', () => {
  for (const name of ['StudyView','BreakView','BackView','SummaryView','ControlsPanel','ResearcherPanel']) {
    assert.match(source, new RegExp('function ' + name + '\\('));
  }
  Model.OUTCOMES.forEach(item => assert.match(source, new RegExp(item.id)));
  assert.equal(Model.OUTCOMES.length, 5);
});

test('reminder implementation is silent, one-time, dismissible and library-aware', () => {
  assert.match(source, /new Notification\('Whenever you’re ready'/);
  assert.match(source, /silent: true/);
  assert.match(source, /active\.reminded = true/);
  assert.match(source, /data\.settings\.libraryMode/);
  assert.match(source, /dismiss-reminder/);
  assert.match(source, /document\.title = 'Whenever you’re ready'/);
});

test('researcher mode records only the declared usability fields and exports JSON', () => {
  for (const field of ['version','optionalOpened','timeToBackMs','outcome']) assert.match(source, new RegExp(field));
  assert.match(source, /shiftKey && event\.key\.toLowerCase\(\) === 'r'/);
  assert.match(source, /application\/json/);
  assert.match(source, /delete-logs/);
});

test('copy, assets and styling satisfy the no-network and accessibility constraints', () => {
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//i);
  assert.doesNotMatch(source + html, /distracted|wasted|back on track|failed|you should|don’t forget|don't forget/i);
  assert.match(css, /--bg: #F6F4EF/);
  assert.match(css, /--sage: #7FA48F/);
  assert.match(css, /--sky: #A9C4D6/);
  assert.match(css, /--radius: 20px/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion/);
  for (const asset of ['style.css','model.js','storage.js','app.js']) assert.match(html, new RegExp(asset.replace('.', '\\.')));
});
