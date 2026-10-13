# Rest Without Scrolling

A lightweight desktop web prototype that helps university students take intentional breaks without locking their device, monitoring their activity, or pressuring them to return immediately.

The prototype asks what the student was doing and what feels tired, then offers three small rest suggestions with clear stopping points. Students remain free to choose a duration, use their own idea, keep resting, change their plan, or end the study session.

## Live demo

[Open the public prototype](https://shutongwang880.github.io/rest-without-scrolling/)

## Why this exists

Students often open TikTok, Instagram, or YouTube when they feel tired after studying. A short break can then become prolonged scrolling without providing the recovery they expected.

This project treats rest as legitimate. It supports a clearer start and end to a break while keeping control with the student.

## Workflow

### 1. Save a way back

Before the break, the student can record:

- what they are working on;
- the next small step.

These notes make returning easier, but both fields are optional.

### 2. Understand the situation

The rest guide asks one question at a time:

1. **What were you doing?**

   Examples include reading or writing, screen work, a class or meeting, and group work.
2. **What feels tired?**

   Examples include tired eyes, a stiff body, a full mind, feeling stuck, or needing a social pause.

### 3. Choose a suggested rest

The prototype combines both answers and presents three relevant options, such as:

- rest your eyes for five minutes;
- walk one loop;
- stretch for five minutes;
- listen to one song;
- get water or a snack;
- have one short conversation;
- sit quietly and breathe;
- do nothing for a while.

Each suggestion has a clear stopping point. The student can also write a custom rest, use their phone, or leave the break open-ended.

### 4. Choose a duration

After choosing a rest, the student may select:

- 5 minutes;
- 10 minutes;
- 15 minutes;
- the suggestion's natural stopping point;
- “I’ll come back myself.”

A single quiet reminder is available for timed breaks. It is optional, silent, and can be ignored.

### 5. Decide what happens next

When the student returns, the saved task and next step appear with five equally weighted choices:

- keep resting;
- try a different rest;
- go back to studying;
- change the plan;
- end study for today.

An optional check-in records whether the break felt restoring and whether it lasted longer than expected. Saved notes stay on the device and can form a private summary after repeated use.

## Design principles

- **Student-led:** the student starts, changes, and ends the break.
- **No restriction:** the prototype never locks the device or blocks another app.
- **No monitoring:** it does not read browsing history, screen content, or app usage.
- **Progressive disclosure:** only one decision is shown at a time.
- **Neutral language:** returning to study is one valid option among several.
- **Clear stopping points:** suggestions favour finite activities over endless feeds.
- **Optional reflection:** recovery matters more than returning quickly.

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
