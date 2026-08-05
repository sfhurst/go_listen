# Go Listen — animated composition build

This build adds restrained motion without changing the approved collage geometry.

- Prompts slowly fade, swell, and settle into their assigned positions.
- Double-tapping the top bar lets the current composition softly scramble before a new page settles in.
- Completing a prompt confirms the check, then the collage slowly scrambles and fades into the existing one-hour completion screen.
- When the cooldown ends while the page is open, the completion message fades and the updated prompt page settles into place.
- Top and bottom signature bars remain on the completion screen.
- `?test=1` changes the cooldown to 10 seconds for testing.
- Reduced-motion system preferences are respected.


## Focus-motion update

- The full prompt composition wakes together over roughly 1.5 seconds.
- Prompts begin slightly blurred, faint, small, and offset, then focus and settle at once.
- Completion and reroll transitions loosen and blur the whole composition together rather than cascading from top to bottom.
- Reduced-motion preferences remain respected.

## Favicon

The project includes the Go Listen pink pulse-bar favicon in browser, Apple touch, and Android sizes.
