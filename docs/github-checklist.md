# ScreenCueTime GitHub Checklist

## Overview

Use this checklist as a GitHub-ready implementation tracker for the next evolution of ScreenCueTime.

Related docs:

- [Product Spec](./product-spec.md)
- [Implementation Plan](./implementation-plan.md)

## Epic: Controlled Finish-State Playback

### Goal

Make the timer finish state visible, controllable, and trustworthy for both direct media and YouTube playback.

### Success Criteria

- [ ] Users can see what media is active when the timer ends
- [ ] Users can play, pause, stop, replay, and reset from the app UI
- [ ] YouTube playback is no longer hidden
- [ ] Autoplay-blocked states are clearly recoverable
- [ ] Validation remains strict so generic page URLs are rejected before timer start

## Milestone 1: Playback Control Foundation

### 1. Playback State Model

- [ ] Add a formal `playbackStatus` model separate from timer state
- [ ] Define statuses: `idle`, `playing`, `paused`, `blocked`, `stopped`, `ended`, `failed`
- [ ] Refactor `App.jsx` so playback behavior is driven from explicit state transitions
- [ ] Add shared playback action handlers for play, pause, stop, replay, and reset
- [ ] Ensure finished-state messaging reads from playback state instead of ad hoc note updates

### 2. Source Model and Validation

- [ ] Extend `classifySongLink` to return structured source data
- [ ] Include `type`, `src`, and `label` in the playback source object
- [ ] Derive a readable label for direct media URLs from the file path
- [ ] Derive a fallback label for YouTube sources
- [ ] Preserve strict media validation for unsupported URLs
- [ ] Add tests to ensure generic URLs like `https://example.com` are still rejected

### 3. Finished-State Playback Panel

- [ ] Create a visible playback panel component for the finished state
- [ ] Display media label in the playback panel
- [ ] Display media type in the playback panel
- [ ] Display playback status in the playback panel
- [ ] Add a clear action row for playback controls
- [ ] Keep the countdown and "Time is up" messaging visible alongside the panel

### 4. App-Level Playback Controls

- [ ] Add `Play` control
- [ ] Add `Pause` control
- [ ] Add `Stop` control
- [ ] Add `Replay` control
- [ ] Keep `Reset` as a separate timer-level action
- [ ] Ensure `Stop` does not force a return to setup mode
- [ ] Ensure `Replay` restarts media from the beginning

### 5. Direct Media Playback Behavior

- [ ] Implement play behavior for direct media via the native media element
- [ ] Implement pause behavior for direct media
- [ ] Implement stop behavior for direct media with current time reset
- [ ] Implement replay behavior for direct media
- [ ] Handle `ended` events and map them to a visible `ended` state
- [ ] Handle blocked autoplay and map it to a visible `blocked` state
- [ ] Decide whether direct `.mp4` and `.webm` sources should be visibly rendered in Milestone 1

### 6. YouTube Playback Visibility and Control

- [ ] Make YouTube playback visible in the finished state
- [ ] Decide implementation path:
  - [ ] Option A: visible iframe with native controls
  - [ ] Option B: YouTube IFrame Player API with app-level control wiring
- [ ] Ensure the user can at least pause or stop YouTube playback predictably
- [ ] Ensure reset unloads or deactivates YouTube playback cleanly
- [ ] Document any temporary limitations if Option A is used first

### 7. Autoplay Blocked Recovery

- [ ] Add a dedicated blocked state view in the playback panel
- [ ] Add plain-language blocked-state copy
- [ ] Add a prominent `Play Now` recovery action
- [ ] Keep the playback panel visible after blocked autoplay attempts
- [ ] Distinguish blocked playback from failed playback in the UI

### 8. Finished-State UI and Responsive Styling

- [ ] Redesign finished-state layout to support timer plus playback panel
- [ ] Keep the timer visually dominant
- [ ] Ensure playback controls are visible without scrolling on common desktop sizes
- [ ] Ensure the finished state works cleanly on mobile widths
- [ ] Add distinct visual styling for `playing`, `paused`, `blocked`, `stopped`, and `failed`

### 9. Test Coverage

- [ ] Extend unit tests for structured playback source data
- [ ] Add tests for derived media labels
- [ ] Add tests for playback status transitions
- [ ] Add tests that verify the playback panel appears when the timer finishes
- [ ] Add tests that verify blocked autoplay shows recovery UI
- [ ] Add tests that verify `Stop` keeps the user on the finished screen
- [ ] Add tests that verify `Reset` returns the user to setup mode
- [ ] Ensure `npm run build` stays gated on passing unit tests

## Milestone 2: Better Media Identity

### 10. Media Confidence Improvements

- [ ] Improve playback labels beyond raw URLs where possible
- [ ] Add better setup-screen messaging about selected media
- [ ] Consider showing a thumbnail or richer YouTube identity if technically feasible
- [ ] Clarify the difference between direct media and YouTube behavior in the UI

## Milestone 3: Pre-Flight Confidence

### 11. Setup-Screen Preview and Validation

- [ ] Add a `Test Media` action to the setup screen
- [ ] Let users preview direct media before starting the timer
- [ ] Let users preview YouTube playback before starting the timer
- [ ] Add clearer setup-time warnings for risky or limited playback cases
- [ ] Improve validation copy when a link is syntactically valid but unsupported

## Recommended Delivery Order

- [ ] Slice 1: playback state model plus structured source model
- [ ] Slice 2: playback panel UI shell plus direct media controls
- [ ] Slice 3: visible YouTube playback integration
- [ ] Slice 4: blocked autoplay recovery and responsive polish
- [ ] Slice 5: expanded tests and regression hardening

## Definition of Done

- [ ] Finished state includes a visible playback panel
- [ ] Direct media can be played, paused, stopped, and replayed from app UI
- [ ] YouTube playback is no longer hidden
- [ ] Users can recover from blocked autoplay without resetting the timer
- [ ] Reset stops all playback cleanly
- [ ] Validation remains strict for unsupported generic URLs
- [ ] Tests cover critical playback state transitions
- [ ] Build passes with tests included
