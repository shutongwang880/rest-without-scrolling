# Pause / Rest without scrolling

A responsive English-language prototype for the DECO3800 student-led break concept.

## Three-screen journey

1. **Choose a break.** Optional feeling choices update suggested activities on the same screen. Select a suggestion, do nothing, scroll deliberately, or enter a personal idea; then start.
2. **Take the break.** Leave the screen and do the chosen activity. Select “I'm back” whenever ready. There are no timers or automatic prompts.
3. **Choose what's next.** Keep resting, try another break, return to study, change the study plan, or finish studying. Decisions are confirmed on this same screen. Reflection is optional and collapsed by default.

The progress indicator always identifies the current step. Someone already on a break can skip setup via a secondary link. “Turn off” remains available in the header. There is no separate plan form, setup confirmation screen, reminder settings, or competing mode navigation.

## Run

Open `dist/index.html` directly, or serve `dist/` with any static HTTP server. No build or installation is required. All fonts and assets are local.

## Boundaries

There is no app tracking, device locking, notification, timer, persistent storage, analytics, or automatic return to study. All information remains in tab memory and clears on reload. Suggested stopping moments are optional notes, not detected events. Activities in other apps or away from the device are carried out by the student.

An optional read-only WebMCP `get_break_state` tool exposes the visible step and choices when supported. Native WebMCP validation was unavailable. The regular interface does not depend on WebMCP.

## Validation

Run `node --test model.test.cjs`. Six tests cover the three-step journey, need-based suggestions, optional reflection and continued rest, bypass/opt-out, custom activity validation, and rendering templates with escaped personal text. Template checks use a minimal DOM stub, not a real browser. JavaScript syntax and local asset references were checked. Browser automation was not run following the earlier authorization decline.

## Walkthrough

- Choose “Want company”, choose to message someone, and start a break.
- Return and choose to keep resting without completing reflection.
- Try another break and choose to scroll deliberately.
- Return and choose a different study plan, or finish studying.

Ask the participant where they think they are in the flow and what they expect the next action to do. Also ask whether continuing to rest feels as legitimate as returning to study.
