# Burger Bite — brand identity presentation

A full-screen, keynote-style HTML presentation. No build step, no dependencies.

## Run

Open `index.html` in a browser (double-click it), or serve the folder:

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
| Jump | click a segment of the bottom progress bar; `#7` in the URL opens slide 7 |

Slides 2, 3, 5, 6, 8 and 10 have in-slide builds, so press next to reveal the next step.

## Structure

```
index.html   slides (semantic <section>s) and CSS-built mockups
styles.css   design system, slide layouts, animation
script.js    slide engine, transitions, in-slide builds, HUD
assets/      the supplied logo files, used untouched
```

Colours were sampled from `burger-bite-logo-transparent.png`:
Bun Orange `#FA8F0E`, Cheese Yellow `#FEB61F`, Lettuce Green `#4EB400`, Tomato Red `#EA120C`, Deep Brown `#2A0600`, Warm Cream `#FCEAC0`.

`prefers-reduced-motion` is respected: transitions cut instantly and builds show their end state.
