# Pause — Rest Without Scrolling

A responsive, English-language interactive prototype for the DECO3800 student-led break concept.

Open `dist/index.html` directly, or serve `dist/` with any static HTTP server. There is no installation or build step.

## Walkthrough

1. Optionally choose a current feeling, select a break activity, and choose 3, 5, 10 minutes or no timer.
2. Start the break. Extend it, pause its timer, switch activities, or turn support off.
3. Use “Prototype · preview the check-in” to demonstrate the timed prompt without waiting. Actual timers use elapsed wall-clock time, including time away from the tab.
4. Optionally reflect. Choose more rest, return to study, change the plan, finish studying, or dismiss the check-in entirely.
5. Open “Your controls” to inspect information use or disable support.

## Boundaries

- No device locking, browser activity monitoring, app detection, push notifications, sound, productivity scores, or automatic return to study.
- Choices and reflections are held only in tab memory. Reloading clears them. There is no database or analytics.
- Optional Google Fonts are requested for typography; system fonts are the offline fallback.
- A timed check-in only appears inside this page. Closing the tab stops the prototype. Browser background throttling may delay the visible check-in until the tab is opened again.
- WebMCP exposes a read-only `get_break_state` tool when supported. Support is optional; the entire interface works without it.

## Suggested usability tasks

- “You feel tired while studying. Choose a break that suits you.”
- “The planned break is over, but you still want to rest. What would you do?”
- “You decide to change your study plan.”
- “You no longer want the tool to prompt you.”

Ask whether the suggestions or check-in felt supportive or pressuring, whether skipping reflection was clear, and whether the participant understood the information used. This prototype tests those questions; it does not establish that the intervention improves wellbeing.
