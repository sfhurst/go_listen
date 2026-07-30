# Go Listen — Phase 1

A minimal field-recording prompt companion.

## Run it

Open `index.html` in a browser, or serve the folder with any simple static server.

## Core behavior

- No header and no navigation.
- A screen-sized floating list of prompts.
- The app chooses the largest prompt mix that fits without scrolling.
- Completing one prompt rotates it to the back of its category queue.
- A success message appears and the prompt list stays hidden for one hour.
- State is stored in LocalStorage.
- The bottom pink/gray signature changes on each load.

## Testing

- Open `index.html?test=1` to shorten the cooldown to 10 seconds.
- Triple-tap the bottom signature to clear the cooldown immediately.

## Files

- `index.html`
- `styles.css`
- `app.js`
