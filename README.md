# Rest Without Scrolling

A desktop-first, single-page prototype for university students taking breaks during self-directed study. It uses plain HTML, CSS and JavaScript with no backend, package install, tracking or network requests.

## Main flow

1. **Study session:** edit “What I’m doing” and “Next step”. Both fields are seeded for demos and auto-save locally. Select **Take a break** or press **B**.
2. **Break:** Version A opens immediately after one click. Nothing is blocked and there is no timer, countdown or elapsed-time display. **I’m back** is always available.
3. **Optional break choices:** the student can name what they need and see three concrete suggestions. Every suggestion includes its own stopping point, such as one song, one loop or five minutes. Selecting a suggestion sets both the activity and its ending in one click. The stopping point can still be changed, and “Use my phone”, “Do nothing” and a personal idea remain available without judgement.
4. **Back:** the saved study intention appears first. Five identical options support more rest, different rest, study, a changed plan, or ending study.
5. **Optional note:** a self-reported restoration and duration answer can be saved to the private summary or skipped.

## Reminder behavior

A reminder is available only for 5, 10 or 15 minute endings and is off by default. When enabled, the app explains why browser permission is needed before requesting it. The reminder fires once, silently, uses the requested neutral copy, changes the page title once, and appears as a dismissible in-page bar. Returning or dismissing resets the title and prevents repetition.

Library mode uses a dimmer palette, removes animation, and keeps reminders inside the page. Pausing support hides the optional break-assist sections and cancels active reminders while preserving **Take a break** and **I’m back**.

## Private patterns

Saved notes stay in localStorage. Insight cards appear only when a category has at least three saved notes. The language reports counts without ranking, diagnosis or causal claims. History deletion has a confirmation step.

## Researcher mode

Press **Shift+R** to open the researcher panel:

- **Version A: One-click** starts the break immediately.
- **Version B: Set up first** asks about rest type and ending before starting.
- Optional local logging records only version, whether an optional section was opened, time from the initial break click to **I’m back**, and the selected return option.
- Logs can be exported as JSON or deleted.

Research logs are separate from student notes and are disabled by default.

## Privacy and accessibility

All persistent data is stored in localStorage. The app does not read other tabs, apps, browsing, messages or screen content. It uses no analytics and makes no network calls. Controls explain what is stored and shared, and allow support, reminders, notes and library mode to be changed.

Controls meet a 44px target minimum, have visible keyboard focus, use short neutral copy, and respect reduced-motion preferences. The UI uses local system fonts with Inter preferred, embedded line icons, and the specified warm background, sage and muted sky palette.

## Verification

Run the JavaScript syntax checks and then node --test model.test.cjs.

The checks cover seeded data, local persistence and sanitization, need-based suggestions with stopping points, one-click break state, reminder consent, private-note validation, insight thresholds, component structure, silent notification behavior, researcher logging, copy rules, accessibility tokens and local assets.
