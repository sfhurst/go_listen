# Go Listen — Phase 1

A minimal field-recording prompt companion.

## Run it

Open `index.html` in a browser, or serve the folder with any simple static server.

## Core behavior

- No header and no navigation.
- A screen-sized floating list that never scrolls.
- Master prompts are lowercase.
- The page composer adds `record` to at least three short prompts.
- The app chooses the largest prompt mix that fits the current screen.
- Completing one prompt rotates it to the back of its category queue.
- A success message appears and the prompt list stays hidden for one hour.
- State is stored in LocalStorage.
- Top and bottom pink signatures use different pattern rules.
- Double-tap the top signature to reshuffle all three prompt queues.

## Testing

- Open `index.html?test=1` to shorten the cooldown to 10 seconds.
- Triple-tap the bottom signature to clear the cooldown immediately.
- Double-tap the top signature to inspect another complete set without marking anything finished.

## Files

- `index.html`
- `styles.css`
- `app.js`
