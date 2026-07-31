# Go Listen

A single-screen field-recording inspiration engine with a built-in field notebook.

## Main screen

- Prompts are composed to fit the available screen.
- Double-click or double-tap the top bar to reshuffle prompts.
- Completing a prompt shows the completion screen and starts the cooldown.
- The top and bottom bars remain visible on the completion screen.

## Recording log

- Double-click or double-tap the bottom bar to open the log.
- Double-click or double-tap the bottom bar again to return to the prompt or completion screen that was active.
- The log has three views: recording list, recording entry, and backup tools.
- Entries are stored in localStorage on the current browser/device.

## Backup tools

- **Backup** downloads the complete log as a Go Listen JSON backup.
- **Restore** replaces the current log with a compatible backup.
- **Merge** adds entries that are missing, using permanent entry IDs to avoid duplicates.

## Test mode

Append `?test=1` to the URL to shorten the cooldown while testing.

## Find a sound

The recording log includes a live search field that searches every part of an entry. A small vocabulary in `sounds.js` quietly expands remembered terms, so searches such as `steps`, `cars`, `bugs`, `birds`, or `train` can find related wording such as `footsteps`, `traffic`, `cricket`, `crows`, or `railroad`. Multiple words narrow the results.

The vocabulary is intentionally stored separately so it can grow without changing old log entries.
