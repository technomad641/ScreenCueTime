import React from "react";

// A progress outline that traces the perimeter of the countdown screen and
// drains as time runs down. `remaining` is the fraction of time left (1 at the
// start, 0 at zero). The rects use pathLength="1" so the dash math is a simple
// normalized fraction regardless of the viewport's size or aspect ratio; their
// geometry (position, size, corner radius, stroke) is set in CSS.
function ProgressRing({ remaining }) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(remaining) ? remaining : 0));

  return (
    <svg className="progress-ring" aria-hidden="true" preserveAspectRatio="none">
      <rect className="progress-ring__track" pathLength="1" />
      <rect
        className="progress-ring__value"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - clamped}
      />
    </svg>
  );
}

export default ProgressRing;
