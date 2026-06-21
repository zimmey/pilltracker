# 💊 Antibiotic Tracker

A tiny, mobile-friendly static site to track a 10-day antibiotic course taken
every 8 hours (8 AM · 4 PM · 12 AM). No backend, no login — check-ins are saved
in your browser's `localStorage` on the device you use.

## Use it

Open the published page (see below), set your **course start date**, and tap a
dose to mark it taken (tap again to undo). The top cards show your **next dose**
and overall **progress**, with overdue doses highlighted in red.

> Because state lives in `localStorage`, track on **one device** (your phone).
> Clearing site data or switching browsers will reset your check-ins. The
> "Reset all check-ins" button clears them deliberately.

## Publish on GitHub Pages

1. Push this repo to GitHub (already connected to `origin`):
   ```bash
   git add -A && git commit -m "Antibiotic tracker" && git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment**.
3. Set **Source** = *Deploy from a branch*, **Branch** = `main`, folder = `/ (root)`.
4. Wait ~1 minute, then open `https://<username>.github.io/pilltracker/`.
5. On your phone, use the browser's **Add to Home Screen** for one-tap access.

## Customize

All schedule settings are constants at the top of `app.js`:

```js
var TOTAL_DAYS = 10;     // length of the course
var DOSES_PER_DAY = 3;   // doses per day
var INTERVAL_H = 8;      // hours between doses
var FIRST_DOSE_H = 8;    // hour of the first dose (8 = 8 AM)
```

## Files

- `index.html` — markup
- `styles.css` — mobile-first dark theme
- `app.js` — schedule generation, check-in state, rendering
