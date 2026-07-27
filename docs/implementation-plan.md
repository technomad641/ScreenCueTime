# ScreenCueTime Implementation Plan

## Document Info

- Product: ScreenCueTime
- Type: Engineering implementation plan
- Status: Draft v1
- Last updated: 2026-04-26
- Related doc: [product-spec.md](./product-spec.md)

## Purpose

This document translates the product spec into concrete engineering work. It is intended to help the team build the next version of ScreenCueTime in small, testable milestones.

The immediate objective is to solve the current finish-state playback gap:

- users cannot clearly see YouTube playback
- users cannot pause or stop playback from the app UI
- playback status is not modeled clearly
- recovery from autoplay issues is weak

## Delivery Strategy

Build this in three milestones:

1. Playback Control Foundation
2. Media Identity and Setup Confidence
3. Pre-Flight Validation and Preview

Milestone 1 is the required next step. Milestones 2 and 3 should be designed so they can reuse the same playback state model and UI components.

## Milestone 1: Playback Control Foundation

### Goal

Make the finished state visible, controllable, and trustworthy.

### User Outcomes

- The user can see what kind of media is active.
- The user can pause, stop, replay, or reset without confusion.
- YouTube playback is visibly rendered on screen.
- If autoplay fails, the recovery path is obvious.

### Scope

- visible playback panel
- app-level playback controls
- visible YouTube player
- direct media playback controls
- playback status state model
- autoplay blocked state and recovery UI

### Out of Scope

- metadata fetching from YouTube or remote URLs
- setup-screen media preview
- multiple saved timers or playlists

## Engineering Workstreams

## Workstream 1: Playback State Model

### Objective

Replace the current loose playback handling with explicit playback state.

### Tasks

1. Introduce a `playbackStatus` enum or constant map.
2. Add statuses:
   - `idle`
   - `playing`
   - `paused`
   - `blocked`
   - `stopped`
   - `ended`
   - `failed`
3. Separate timer lifecycle state from playback lifecycle state.
4. Track current playback source in a structured object that includes:
   - `type`
   - `src`
   - `label`
5. Add central playback actions:
   - `playPlayback`
   - `pausePlayback`
   - `stopPlayback`
   - `replayPlayback`
   - `resetTimer`

### Files Likely Affected

- [src/App.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/App.jsx)
- [src/timerUtils.js](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/timerUtils.js)

### Acceptance Criteria

- playback state is no longer inferred only from timer state
- one playback status is always active once timer completion occurs
- playback actions can be called from UI controls

## Workstream 2: Media Metadata Derivation

### Objective

Give the UI enough information to describe what is playing, even before rich metadata exists.

### Tasks

1. Extend source classification to derive a lightweight label.
2. For direct media URLs, derive a filename-style label from the pathname.
3. For YouTube URLs, derive a stable fallback label such as:
   - `YouTube video`
   - `YouTube: <video-id>`
4. Keep validation strict so generic page URLs are still rejected.

### Files Likely Affected

- [src/timerUtils.js](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/timerUtils.js)
- [src/timerUtils.test.js](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/timerUtils.test.js)

### Acceptance Criteria

- every playable source has a displayable label
- unsupported generic URLs still fail validation before the timer starts

## Workstream 3: Visible Playback Panel

### Objective

Render a visible media region and a control surface in the finished state.

### Tasks

1. Add a new `PlaybackPanel` component.
2. Add a `PlaybackControls` component or local subcomponent.
3. Show in the panel:
   - media label
   - media type
   - playback status
   - primary controls
4. Preserve the countdown and finished messaging above or beside the panel.
5. Ensure the panel works for both direct media and YouTube.

### Suggested Files

- [src/components/PlaybackPanel.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/components/PlaybackPanel.jsx)
- [src/components/PlaybackControls.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/components/PlaybackControls.jsx)
- [src/App.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/App.jsx)
- [src/styles.css](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/styles.css)

### Acceptance Criteria

- finished state shows a visible playback area
- user can identify the current media type without guessing
- controls are visible without relying on browser fallback UI

## Workstream 4: Direct Media Control Integration

### Objective

Support play, pause, stop, and replay for direct audio or video sources.

### Tasks

1. Keep a visible media element strategy for direct playback.
2. Decide whether direct playback remains audio-only in v1 or allows visible video for direct `.mp4` or `.webm`.
3. Implement:
   - play via `.play()`
   - pause via `.pause()`
   - stop via `.pause()` plus current time reset
   - replay via current time reset and play
4. Handle `ended` events from the media element.
5. Handle playback promise rejection for autoplay-blocked states.

### Files Likely Affected

- [src/App.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/App.jsx)
- [src/styles.css](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/styles.css)

### Acceptance Criteria

- direct playback can be paused and resumed from app UI
- stop does not force an immediate reset
- ended state is reflected correctly in the UI

## Workstream 5: YouTube Playback Integration

### Objective

Replace the hidden YouTube iframe behavior with visible and controllable YouTube playback.

### Implementation Options

### Option A: Visible embed with native controls

Simpler implementation, lower control reliability.

Tasks:

1. Render the iframe visibly inside the playback panel.
2. Enable native YouTube controls.
3. Keep app-level controls limited if iframe control is not reliable.

Risk:

- pause, stop, and replay may not be reliably driven from app UI.

### Option B: YouTube IFrame Player API

Recommended implementation for dependable app-level controls.

Tasks:

1. Load the YouTube IFrame Player API script.
2. Create a player instance after timer completion for YouTube sources.
3. Wire app controls to player methods:
   - `playVideo`
   - `pauseVideo`
   - `stopVideo`
   - `seekTo(0)`
4. Listen to player state events and map them into app `playbackStatus`.
5. Clean up player instance on reset or source change.

### Recommendation

Use Option B for Milestone 1 if the team wants true app-level controls for YouTube. If implementation speed matters more than completeness, ship Option A first and explicitly mark YouTube controls as partially native.

### Files Likely Affected

- [src/App.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/App.jsx)
- new helper such as [src/youtubePlayer.js](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/youtubePlayer.js)

### Acceptance Criteria

- YouTube playback is visible on screen
- user can stop or pause playback in a predictable way
- reset unloads or deactivates YouTube playback cleanly

## Workstream 6: Autoplay Blocked Recovery

### Objective

Make failed autoplay easy to recover from.

### Tasks

1. Add a visible blocked state in the playback panel.
2. Provide plain-language copy for blocked playback.
3. Add a prominent `Play Now` action.
4. Keep the playback panel visible after blocked attempts.
5. Distinguish between:
   - blocked
   - failed
   - ended

### Files Likely Affected

- [src/App.jsx](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/App.jsx)
- [src/styles.css](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/styles.css)

### Acceptance Criteria

- blocked playback never looks like silent success
- user can recover without resetting the timer

## Workstream 7: Finished-State Layout and Styling

### Objective

Evolve the UI from a timer-only finish state into a timer-plus-player experience.

### Tasks

1. Redesign the finished screen layout for desktop.
2. Redesign the finished screen layout for mobile.
3. Ensure timer remains visually prominent.
4. Introduce a player panel with strong contrast and clear spacing.
5. Add clear visual states for:
   - playing
   - paused
   - blocked
   - stopped
   - failed

### Files Likely Affected

- [src/styles.css](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/styles.css)

### Acceptance Criteria

- finished screen remains readable on large and small screens
- controls are easy to locate immediately after timer completion

## Workstream 8: Tests

### Objective

Protect the new behavior with both unit and integration coverage.

### Tasks

1. Extend unit tests in [src/timerUtils.test.js](/Users/rajatsingh/IdeaProjects/ScreenCueTime/src/timerUtils.test.js) for:
   - derived labels
   - continued URL validation behavior
2. Add component or interaction tests for playback status transitions.
3. Add tests covering:
   - timer finishes and panel appears
   - blocked playback shows recovery state
   - stop keeps user on finished screen
   - reset returns user to setup
4. If the repo adopts Playwright later, add end-to-end tests for:
   - direct media flow
   - YouTube flow
   - autoplay failure fallback

### Acceptance Criteria

- tests cover core playback state transitions
- current validation bug remains protected by tests
- build remains gated by unit test success

## Suggested Sequence of Implementation

1. Refactor playback state model.
2. Extend source metadata and labels.
3. Build `PlaybackPanel` UI shell with placeholder controls.
4. Integrate direct media control behavior.
5. Integrate YouTube visible playback.
6. Add blocked-state recovery behavior.
7. Polish responsive layout and states.
8. Add or expand tests around transitions.

## Milestone 1 Task Breakdown

### Task 1: Refactor source model

- Update `classifySongLink` to return label-friendly structured data.
- Preserve strict validation rules.

### Task 2: Add playback status state

- Replace note-only playback messaging with formal state.
- Normalize behavior for direct and YouTube sources.

### Task 3: Add visible playback panel

- Create panel component.
- Move finished-state media messaging into panel.

### Task 4: Add direct media controls

- Implement play, pause, stop, replay for native media.

### Task 5: Add visible YouTube playback

- Choose between simple visible embed and YouTube API.
- Implement visible player with control support.

### Task 6: Add blocked-state UX

- Show blocked status with `Play Now`.

### Task 7: Style and responsive pass

- Fit timer and playback panel into one coherent finish state.

### Task 8: Expand tests

- Add unit and interaction coverage for the new state model.

## Recommended Architecture Changes

To keep `App.jsx` from growing further, the next implementation should split responsibilities:

### Recommended module split

- `src/App.jsx`
  - top-level timer orchestration
- `src/timerUtils.js`
  - parsing, labels, formatters, validation
- `src/components/PlaybackPanel.jsx`
  - visible playback area
- `src/components/PlaybackControls.jsx`
  - action buttons
- `src/mediaControllers/directMediaController.js`
  - native media behavior
- `src/mediaControllers/youtubeController.js`
  - YouTube integration and event mapping

This split is not mandatory for the first commit, but it is the cleanest direction.

## Technical Risks

### Risk 1: YouTube control limitations

If the team uses only a visible iframe URL, app-level pause and stop may remain weak. This is the strongest reason to consider the YouTube IFrame Player API.

### Risk 2: Browser autoplay inconsistency

Some platforms will still block autoplay unpredictably. The UI must treat this as a first-class state, not an edge case.

### Risk 3: Overloading the finish state

If too much UI is added, the product may lose the dramatic timer feel. The layout should prioritize hierarchy and clarity.

## Definition of Done for Milestone 1

Milestone 1 is done when:

1. Finished state contains a visible media panel.
2. YouTube playback is no longer hidden.
3. Direct media playback can be paused, stopped, and replayed from the app UI.
4. User can recover from autoplay-blocked playback without resetting.
5. Timer reset still stops all playback cleanly.
6. Tests cover the new state transitions and build remains green.

## Proposed Next Step

Start with Workstreams 1 through 4 in a first implementation slice:

- playback state model
- structured media source labels
- playback panel UI shell
- direct media controls

That gives the app immediate product improvement even before full YouTube API integration lands.
