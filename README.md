# Burger Bite — brand identity presentation

A full-screen, keynote-style HTML presentation: 13 slides, each 100vw × 100vh, no page scrolling.
No build step, no dependencies.

## Run

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls

| Action | Input |
| --- | --- |
| Next build / slide | `→` `↓` `Space` `Enter` `PageDown`, swipe left, **next** button |
| Previous | `←` `↑` `PageUp` `Shift+Space`, swipe right, **prev** button |
| First / last slide | `Home` / `End` |
| Fullscreen | `F` |
| Jump | click a segment of the bottom progress bar, or open `#7` in the URL |

Slides 2, 3, 5, 6, 7, 9 and 12 have in-slide builds, so press next to reveal the next step.

## Slides

01 Opening · 02 The idea · 03 Logo anatomy · 04 Personality · 05 Colour system · 06 Brand territory ·
07 The slogan · 08 Why it works · 09 The brand in the world · 10 Digital · 11 Brand voice · 12 Scale test · 13 Finale

## Assets

```
assets/logos/          transparent-logo.png is the master mark; -1024/-512/-256 are the same artwork resized
assets/applications/   26 supplied application mockups (logo already placed)
```

The logo is never redrawn. Every appearance is an `<img>` (or crop) of the supplied PNG. Objects built in CSS
(app icon, website, social profile, sticker, posters) carry the real PNG.

## Brand system palette

Burnt Tangerine `#E76F2E` · Midnight Charcoal `#24211E` · Pickle Green `#6F8F3D` · Warm Oat `#F3E4C8`
(core identity), with Paprika `#B8432E` and Soft Butter `#F2C14E` as supporting accents only.
The logo keeps its own colours; the system palette is separate.

Slogan: **Bite first. You'll understand.**

`prefers-reduced-motion` is respected: transitions cut instantly and builds show their end state.
