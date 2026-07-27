# ScreenCueTime Product Spec

## Document Info

- Product: ScreenCueTime
- Type: Product specification
- Status: Draft v1
- Last updated: 2026-04-26

## Summary

ScreenCueTime is a fullscreen countdown timer that triggers media playback when time reaches zero. The current product succeeds at basic countdown and playback initiation, but it falls short once playback starts. Users can trigger a YouTube video, yet they are not given clear controls to pause or stop it, and the UI does not visibly confirm what media is playing.

This spec defines the next evolution of ScreenCueTime: a timer experience that remains immersive while giving users clear, dependable playback visibility and control.

## Problem Statement

Today, the product has a trust gap at the moment that matters most: playback start.

Current issues:

- A YouTube video may start playing, but the user cannot clearly see the player.
- There is no obvious stop or pause control in the ScreenCueTime UI.
- Reset is overloaded as the only practical recovery path.
- The app gives weak confirmation about what media is currently playing.
- The behavior feels fragile during high-stakes use cases like stage cues, classes, workouts, or events.

In countdown products, the finish state is the payoff. If that state feels uncontrollable, the product feels risky.

## Product Vision

ScreenCueTime should feel like a reliable countdown cue system, not just a timer that happens to launch media.

When the timer completes, users should immediately understand:

- what is playing
- whether playback successfully started
- how to pause, stop, or restart it
- how to recover if autoplay is blocked or playback fails

## Goals

1. Make playback state visible and understandable at the moment the timer finishes.
2. Give users first-class playback controls inside the app UI.
3. Preserve the large-screen countdown feel without forcing users into a confusing embedded-player experience.
4. Reduce failure anxiety for YouTube playback and direct media playback.
5. Create a clear foundation for future playback enhancements.

## Non-Goals

1. Building a multi-track playlist system in this phase.
2. Adding user accounts, cloud sync, or backend storage.
3. Supporting every video provider on the web.
4. Replacing native browser media behavior with a custom full media engine.

## Primary Users

### Live presenter or event host

Needs a visible countdown, dependable finish cue, and fast recovery if playback behaves unexpectedly.

### Teacher, coach, or facilitator

Needs a simple timer that can transition into a recognizable audio or video cue without technical confusion.

### Casual home user

Needs confidence that the timer will end with the expected media and can be stopped easily.

## Current Experience

### Setup state

The user enters duration and a media link.

### Running state

The countdown fills the screen and hides media context.

### Finished state

Playback is attempted, but the resulting media experience is inconsistent:

- direct audio may play invisibly unless autoplay is blocked
- YouTube may play in a hidden iframe
- there is no dedicated stop or pause affordance
- the user may not know whether the expected song or video is actually active

## Opportunity

The product does not need to become a full media player. It needs a better finish-state experience.

The most valuable next move is to introduce a dedicated playback panel that appears when the timer ends and gives users control without losing the product's fullscreen character.

## Proposed Product Direction

Introduce a new finish-state playback experience with two principles:

1. Always show what is playing.
2. Always show how to control it.

This should be implemented as a visible media panel layered into the finished state rather than hiding playback implementation details off-screen.

## Functional Requirements

### 1. Visible Media State

When the timer reaches zero, the finished screen must show:

- media type: YouTube or direct media
- playback status: playing, paused, blocked, ended, failed
- media label
- clear action controls

For v1, media label can be lightweight:

- YouTube: show "YouTube video ready" or video URL summary
- direct media: show filename or URL-derived label

Future phases can fetch richer titles or metadata.

### 2. Playback Controls

The finished state must include first-class controls:

- Play
- Pause
- Stop
- Replay
- Reset timer

Definitions:

- Play: start or resume current media
- Pause: pause media while preserving current timer-finished state
- Stop: stop media and return playback to an idle-ended state
- Replay: start media again from the beginning
- Reset timer: stop media and return to setup mode

### 3. Visible YouTube Playback

For YouTube links, the finished state must render a visible player area instead of a hidden iframe.

Requirements:

- Player is visually present in the UI
- User can see that YouTube content is active
- App-level controls remain available even if native YouTube controls also exist
- Layout works on desktop and mobile

### 4. Direct Media Playback UX

For direct media URLs, the finished state must show a visible playback card with:

- current state message
- browser audio controls when useful
- app-level play, pause, stop, replay actions

Native controls can remain available as a fallback, but they should not be the only control surface.

### 5. Autoplay Failure Handling

If autoplay is blocked, the app must make recovery obvious.

Required behavior:

- show a visible blocked state
- explain what happened in plain language
- present a primary "Play Now" action
- preserve the media player on screen so the user can recover immediately

### 6. Finished-State Layout

The finished state should evolve from a pure timer view into a timer-plus-player view.

Recommended layout:

- large timer still visible
- status headline such as "Time is up"
- media panel beneath or beside the timer
- action row with playback controls

The timer should remain important, but playback should no longer be invisible.

## UX Principles

### Clarity over cleverness

Users should never have to guess whether media is playing.

### Control at the moment of risk

The most important controls should appear exactly when playback starts.

### Preserve immersion

The UI can remain bold and presentation-friendly while still showing playback status and controls.

### Graceful fallback

If the browser or provider limits autoplay, the app should fail informatively, not silently.

## Proposed User Flow

### Flow A: Successful YouTube playback

1. User enters a timer and YouTube link.
2. Timer runs fullscreen.
3. At zero, the screen transitions to the finished state.
4. A visible YouTube player appears with clear playback controls.
5. User can pause, stop, replay, or reset.

### Flow B: Successful direct media playback

1. User enters a timer and direct media URL.
2. Timer runs fullscreen.
3. At zero, audio or video starts.
4. A visible playback panel confirms the media is active.
5. User can pause, stop, replay, or reset.

### Flow C: Autoplay blocked

1. Timer reaches zero.
2. Playback attempt is blocked.
3. Finished state shows a blocked status and a visible player panel.
4. User presses Play Now.
5. Playback starts without requiring a hidden or confusing recovery path.

## UX Scope by Phase

### Phase 1: Playback Control Foundation

Goal: eliminate invisible playback and lack of control.

Scope:

- visible finished-state media panel
- visible YouTube player
- app-level playback controls
- direct media control states
- autoplay-blocked recovery state
- better playback status copy

### Phase 2: Better Media Identity

Goal: help users trust what they selected.

Scope:

- URL-derived media labels
- YouTube thumbnail or title handling if technically feasible
- stronger validation and preview messaging before timer start

### Phase 3: Pre-Flight Confidence

Goal: reduce end-of-timer surprises.

Scope:

- preview selected media before starting timer
- "test media" action on setup screen
- clearer warnings for unsupported or risky playback cases

## Detailed Product Requirements

### PRD-1: Finished-state media panel

The app must render a dedicated media panel whenever the timer is in the finished state and a valid media source exists.

Acceptance criteria:

- panel appears for YouTube and direct media
- panel remains visible until reset
- panel includes status and controls

### PRD-2: Stop control

The app must provide a stop action that stops currently playing media without forcing immediate reset to setup.

Acceptance criteria:

- stop halts direct media playback
- stop halts YouTube playback or transitions it to a non-playing state
- user stays on the finished screen after stop

### PRD-3: Pause and replay controls

The app must provide pause and replay actions for supported media types.

Acceptance criteria:

- pause pauses current playback
- replay starts playback from the beginning
- controls behave predictably after blocked or ended states

### PRD-4: Visible YouTube player

The app must show a visible YouTube player region when a YouTube source is used.

Acceptance criteria:

- player is not hidden off-screen
- player is visibly associated with the finished state
- player remains usable on mobile widths

### PRD-5: Playback status model

The app should formally track playback status in UI state.

Suggested statuses:

- idle
- playing
- paused
- blocked
- stopped
- ended
- failed

Acceptance criteria:

- one status is always active in finished mode
- status text shown to user matches underlying playback state

## Technical Notes

The current code keeps playback logic in a single component and uses:

- hidden `<audio>` for direct media
- hidden YouTube iframe for YouTube playback

To support this spec, the implementation should likely move toward:

- a dedicated playback state model
- a visible media panel component
- media-type-specific control adapters

Suggested implementation direction:

1. Extract playback state and actions from `App.jsx`
2. Introduce a `mediaStatus` state machine
3. Add a visible `PlaybackPanel` component
4. Create separate handling for:
   - direct audio/video
   - YouTube embed/player control

Important note:

YouTube play, pause, and stop behavior may require tighter integration than a plain embed URL. If native iframe query params are not enough for reliable controls, the product should adopt the YouTube IFrame Player API in a later implementation step.

## Risks and Constraints

### Browser autoplay restrictions

Some playback failures are platform-level behavior, not app bugs. The UI should explain that clearly.

### YouTube control limitations

Reliable app-level control may require YouTube API integration rather than a simple iframe URL.

### Fullscreen balance

Adding visible player UI could reduce the dramatic countdown feel if overdesigned. The layout should stay focused and presentation-friendly.

## Success Metrics

Short-term success can be measured qualitatively:

- users can identify what is playing without confusion
- users can stop playback without leaving the finished state
- fewer complaints about playback feeling hidden or uncontrollable

If analytics are added later, useful metrics would include:

- autoplay blocked rate
- playback start success rate
- stop or replay usage rate
- reset-after-finish rate

## Open Questions

1. Should the finished-state media panel be compact by default or large and prominent?
2. Should the timer remain dominant after playback begins, or should media become primary?
3. Do we want native YouTube controls visible, app-level controls only, or both?
4. Should "Stop" keep the last selected media loaded for replay, or fully unload it?
5. Should the setup screen gain a "Test Media" action in the next milestone?

## Recommendation

Build Phase 1 next.

It solves the clearest trust and usability issue without overcomplicating the product. The most important win is simple: when the timer ends, the user should see the media and control the media.

## Implementation Milestone Proposal

### Milestone: Controlled Finish State

Deliverables:

- visible playback panel on finish
- visible YouTube player
- play, pause, stop, replay, reset controls
- playback status messaging
- blocked-state recovery path

Definition of done:

- user can clearly see what is happening at timer completion
- user can stop or pause playback from the app UI
- YouTube playback is no longer hidden
- direct media fallback is visible and understandable
