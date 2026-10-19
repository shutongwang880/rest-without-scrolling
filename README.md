# Rest Without Scrolling

A lightweight desktop web prototype that helps university students deliberately move between study, rest, return, a changed plan, or closing for the day — without locking their device, monitoring their activity, or pressuring them to return.

The prototype centres intentional decision-making rather than screen-time reduction. Students can leave an optional re-entry cue, use a pause suggestion or their own idea, select an optional stopping point, then choose what comes next without judgement.

## Live demo

[Open the public prototype](https://shutongwang880.github.io/rest-without-scrolling/)

## Why this exists

Students often open TikTok, Instagram, or YouTube when they feel tired after studying. A short break can then become prolonged scrolling without providing the recovery they expected.

This project treats rest as legitimate. It supports a clearer start and end to a break while keeping control with the student.

## Workflow

### 1. Choose an entry

The home screen recognises two real situations:

- **I want to take a break** opens a simple pause picker before the student steps away.
- **I’ve been scrolling for a while** lets the student self-identify that they want help and goes directly to the decision screen.

The tool never watches other apps or infers when a pause has become too long.

### 2. Choose a pause

The planned-pause path presents three simple options immediately:

- rest eyes for five minutes;
- walk one loop;
- get water or a snack.

Students can also choose an open rest, their own idea, or phone use. **Help me choose** is available on demand; it asks only what would feel useful, then provides three tailored ideas.

### 3. Choose a boundary if useful

Suggested pauses keep their natural stopping point. Only an open rest, a self-chosen activity, or phone use shows the optional boundary choices:

- 5 minutes;
- 10 minutes;
- 15 minutes;
- the suggestion's natural stopping point;
- “I’ll come back myself.”

A single quiet reminder is available for timed breaks. It is optional, silent, and can be ignored.

### 4. Choose what happens next

Both entry paths meet at the same four equally weighted choices:

- return to the next small step;
- take more rest;
- change the plan;
- finish for today.

Choosing to return opens an optional “one small way back” cue after the decision, not before the break. Finishing needs no checklist; a student can optionally leave a new starting cue and configure the optional one-time quiet pause reminder for a future pause.

## Design principles

- **Student-led:** the student starts, changes, and ends the break.
- **No restriction:** the prototype never locks the device or blocks another app.
- **No monitoring:** it does not read browsing history, screen content, app usage, or notifications.
- **Progressive disclosure:** only one decision is shown at a time.
- **Neutral language:** returning, resting longer, changing plans, and finishing are equally valid.
- **Clear stopping points:** suggestions favour finite activities over endless feeds.
- **Optional reflection:** recovery matters more than returning quickly; there are no scores, streaks, rankings, or time-wasted messages.

## Run locally

No package installation or build step is required.

    python3 -m http.server 8080 --directory dist

Then open [http://localhost:8080](http://localhost:8080).

To run the checks:

    node --test model.test.cjs

## Project structure

    dist/
      index.html    Page shell
      style.css     Responsive interface styles
      model.js      Rest options, recommendation logic, and state helpers
      storage.js    Local data validation and persistence
      app.js        Views and interactions
    model.test.cjs  Node-based behavior and privacy checks

## Reuse and adaptation

The project is intentionally dependency-free so it can be copied into a course project, usability study, or another wellbeing tool.

Useful places to adapt:

- edit activity and fatigue choices in **dist/model.js**;
- change recommendation mappings in **SUGGESTIONS** and **ACTIVITY_HINTS**;
- edit rest options and stopping points in **RESTS**;
- change visual tokens at the top of **dist/style.css**;
- replace the seeded study task in **dist/storage.js**.

If new persistent fields are added, update the validation rules in **dist/storage.js** so imported local data remains constrained.

## Privacy

All persistent information is stored in the browser's local storage. The prototype has no backend, analytics, tracking, external fonts, or network requests. Users can delete their saved break history at any time.

## License

This project is available under the [MIT License](LICENSE). You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies under the terms of that license.
