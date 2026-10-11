import React from "react";

// Renders a HH:MM:SS string as fixed-width, tabular cells so the layout never
// shifts as digits change. Each digit lives in a cell whose inner element is
// keyed by its value — when only that digit changes, React remounts just that
// element and a short CSS roll animation plays, so the countdown reads like a
// mechanical display rather than jittering proportional text.
function CountdownDisplay({ value }) {
  const characters = String(value).split("");

  return (
    <div className="countdown-display" aria-hidden="true">
      {characters.map((character, index) => {
        if (character === ":") {
          return (
            <span key={`sep-${index}`} className="countdown-display__sep">
              :
            </span>
          );
        }

        return (
          <span key={`slot-${index}`} className="countdown-display__cell">
            <span key={character} className="countdown-display__digit">
              {character}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default CountdownDisplay;
