# Pause / Rest without scrolling

An English-language, responsive prototype for DECO3800. The central interaction is choosing rest that matches a student's current need, with an explicit route for someone who notices they have been scrolling.

## Run

Open `dist/index.html` directly, or serve `dist/` using any static HTTP server. No installation or build is needed. The interface uses local system fonts and no remote assets.

## Two entry points

- **I want a break:** optionally identify a need, choose a relevant break or an activity of your own, and optionally note a natural moment to reconsider. Scrolling deliberately is always a valid option.
- **I've been scrolling:** voluntarily check whether the current break still fits. Keep scrolling, choose another break, revise the study plan, return to studying, or finish for the day. Reflection is optional.

Suggested activities differ for wanting less input, novelty, company, distance from a task, and uncertainty. A student's own choice is always available. Activities outside this page are carried out by the student; the prototype does not open or control other apps.

## Timing and autonomy

There is no timer by default and no countdown display. An optional setting schedules one quiet, in-page check-in after approximately 5, 10, or 15 minutes. The page uses wall-clock time so it can show a requested prompt after returning from a background tab. Browser throttling may delay its display. Closing the tab ends the prototype.

Natural stopping cues such as “when the song ends” are personal notes only. They are never detected or enforced. Continuing a break or dismissing a check-in cancels further reminders. Support can be switched off at any point.

## Data and boundaries

Choices and notes exist only in tab memory. Reloading clears them. There are no analytics, accounts, logs, device locks, app monitoring, push notifications, or automatic redirection to study.

A read-only `get_break_state` WebMCP tool is registered only in supported browsers. Native WebMCP validation was unavailable in this environment; ordinary interface operation does not depend on it.

## Validation

Run `node --test model.test.cjs`. Eight tests cover different needs, default untimed breaks, one-time reminders, cancellation and opt-out, voluntary scrolling, all next-step choices, custom text and validation, and screen-template generation with escaped personal text. Template checks use a minimal DOM stub and are not browser layout or end-to-end checks. Browser automation was not run because authorization was declined earlier in the thread.

## Walkthrough prompts

1. You want to feel connected to someone while taking a study break. Choose what you want to do.
2. You notice you have been scrolling longer than you intended. Decide what feels right now.
3. You deliberately want to keep scrolling. Continue without being pushed back to study.
4. Choose a natural stopping cue without setting a timer.
5. Cancel a requested check-in or switch support off.

Ask whether the options reflect the student's need, whether the interaction feels patronising, whether the stopping cue is useful, and whether continuing to rest feels equally legitimate. The prototype supports testing these questions; it does not establish wellbeing benefits.
