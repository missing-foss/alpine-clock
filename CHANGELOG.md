# Changelog

## 0.1.3

- The clock page draws its face with DOM calls instead of writing it as HTML, so no setting can ever become markup. The face looks exactly as before.

## 0.1.2

- The clock page now checks its settings itself: a hand colour is used only when it is written as `#RRGGBB`, and the face only when it is Night or Day; anything else falls back to the face's own colours. Kiosk Satellite already passed only checked settings, so this hardens the page rather than fixing anything that could happen in the app.

## 0.1.1

- Needs Kiosk Satellite 2026.10.23 or newer.
- README: Installation (from Community Plugins, by address, or from a ZIP) and Data sections.

## 0.1.0

- First release: the station clock with its stop-to-go movement, the face drawn as SVG, the optional Alpine ridge, hour numbers, custom hand colours, size and slow drift.
