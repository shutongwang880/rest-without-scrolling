# Pause / Rest without scrolling

An English-language prototype for DECO3800. It helps a student set their own ending before a break, leave without monitoring, return through a saved study step, and optionally learn from private reflections.

## Workflow

1. **Set a study intention.** The student may enter what they are doing and one small next step. Remembering this on the device is optional.
2. **Agree on the break.** Choose an optional feeling, a suggested or usual break, doing nothing, deliberate scrolling, or a personal activity. Choose an ending: 5/10/15 minutes, one lap, finishing a drink, a personal event, or returning independently.
3. **Authorize support.** A silent one-time page reminder is available only for timed endings and is off by default. Event endings are never detected. Starting the break snapshots the student's study intention.
4. **Take the break.** The student can leave the page. There is no lockout, countdown, app tracking, repeated prompt, or automatic return to study.
5. **Return and decide.** The return card shows the saved task and next step. Five equally styled choices remain available: keep resting, try another break, return to study, adjust the plan, or finish studying.
6. **Reflect optionally.** A student may report restoration and whether the break ran longer than wanted. Only explicitly saved reflections enter the private device summary.

## Private summary

Saved reflections use browser-local storage. Activity-level patterns appear only after three saved reflections for that activity. Comparisons about breaks running long appear only when both open-ended and bounded groups have at least three self-reported answers. The summary describes answers and does not claim a causal effect.

Students may disable reflection or saving, delete individual reflections, delete all reflection history, remove usual breaks, or delete all Pause data. Turning saving off prevents future saves and leaves existing entries available for deletion.

## Data boundaries

Pause uses only student-entered intentions, break choices, endings, reminder consent, and optional reflection answers. It does not read other apps, browsing, messages, screen content, or actual device activity. A natural ending such as “after one lap” is a note for the student and is not detected. Timed reminders use the local clock and only appear while this page is available.

Anyone using the same browser profile may be able to see locally saved information. The interface states this before saving. Unsaved in-progress state clears on reload. No data is sent to a server by this prototype.

## Run and verify

Open `dist/index.html` or serve `dist/` with any static server. No build or dependency installation is required.

Run `node --test model.test.cjs`. Twelve tests cover intention snapshots, reminder consent and single delivery, event boundaries, all five return choices, usual breaks, custom input validation, explicit reflection records, evidence thresholds, local persistence and deletion, blocked storage, and safe screen rendering. Browser automation was not run following the earlier authorization decline.

An optional read-only WebMCP `get_break_state` tool exposes the visible stage, activity, and reminder state in supported browsers. It does not expose intentions or reflection history, and the interface does not depend on it.
