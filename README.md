# moods*

> Choose a feeling. Press play. Enter the mood.

**moods*** is a cinematic, background-first music experience. Select a vibe and the entire visual atmosphere transforms around a curated YouTube playlist.

## Quick Start

Simply open `index.html` in any modern browser, or serve it locally:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Setting Up Real Playlists

1. Open `js/moods.js`
2. Replace the placeholder playlist IDs:

```javascript
aura:       { playlistId: 'YOUR_YOUTUBE_PLAYLIST_ID' }
afterhours: { playlistId: 'YOUR_YOUTUBE_PLAYLIST_ID' }
affection:  { playlistId: 'YOUR_YOUTUBE_PLAYLIST_ID' }
alive:      { playlistId: 'YOUR_YOUTUBE_PLAYLIST_ID' }
```

3. Use YouTube playlist IDs from URLs like `youtube.com/playlist?list=PLxxxxxxx`

## Replacing Background Images

Place your images in `assets/backgrounds/`:

```
assets/backgrounds/
├── aura-desktop.jpg       (16:9, ≥1920px wide)
├── aura-mobile.jpg        (9:16, ≥1080px wide)
├── afterhours-desktop.jpg
├── afterhours-mobile.jpg
├── affection-desktop.jpg
├── affection-mobile.jpg
├── alive-desktop.jpg
└── alive-mobile.jpg
```

For best performance, use WebP format and compress images to under 500KB each.

## Analytics

The site includes a stub for analytics in `js/analytics.js`. To connect a real service:

### GoatCounter (free, privacy-friendly)
1. Sign up at [goatcounter.com](https://www.goatcounter.com)
2. Add the script tag to `index.html`
3. Use their API to fetch visit counts

### Cloudflare Web Analytics (free)
1. Add the Cloudflare beacon script to `index.html`
2. View analytics in the Cloudflare dashboard

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `→` | Seek forward 5s |
| `←` | Seek backward 5s |
| `Shift + →` | Next track |
| `Shift + ←` | Previous track |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute / Unmute |
| `Escape` | Close moods menu |

## Tech Stack

- HTML5
- CSS3 (vanilla, no frameworks)
- Vanilla JavaScript (no dependencies)
- YouTube IFrame Player API
- Google Fonts (Bebas Neue, Inter)

## Project Structure

```
moods/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── moods.js      # Mood definitions & data
│   ├── player.js     # YouTube player integration
│   ├── main.js       # Application controller
│   └── analytics.js  # Analytics stub
├── assets/
│   ├── backgrounds/  # Mood background images
│   ├── icons/        # (Reserved for future use)
│   └── logo.svg      # Site logo
└── README.md
```

## License

All rights reserved.
