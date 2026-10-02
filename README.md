# Chat Video Generator

Turns a chat conversation (JSON) into an animated MP4 of two people texting: typing
indicators, "typing…" in the header, pop-in bubbles, and a chat that scrolls up like a
real messaging app. Built with [Remotion](https://remotion.dev).

## Setup

```bash
npm install
```

Node 18+ is required. You don't need to install ffmpeg because Remotion ships its own.
Fonts load from Google Fonts at render time, so rendering needs internet access unless
you switch the theme to a local or system font.

## Render one video

```bash
npx remotion render ChatVideo out/chat1.mp4 --props=chats/chat1.json
```

Preview and tweak live in the browser:

```bash
npm run studio
```

## Batch-render every chat

```bash
npm run render:all                                  # every chats/*.json → out/<name>.mp4
npm run render:all -- --theme=custom                # force a theme for all chats
npm run render:all -- --format=horizontal           # 1920x1080 instead of 1080x1920
npm run render:all -- --only=chat1,chat2            # just some files
npm run render:all -- --chats=my-chats --out=videos # different folders
```

The bundle is built once and reused for every chat, so batches are fast.

## Chat file

```json
{
  "theme": "custom",
  "format": "vertical",
  "people": {
    "A": { "name": "Mihir", "avatar": "mihir.png" },
    "B": { "name": "Riya",  "avatar": "riya.png" }
  },
  "messages": [
    { "from": "B", "text": "Did you watch the new episode?" },
    { "from": "A", "text": "Not yet 😭 no spoilers!!", "time": "21:05" },
    { "from": "B", "text": "😏", "delay": 1.5, "typing": 2 }
  ]
}
```

- **A** is on the right (the sender). **B** is on the left, and B's name and avatar are shown in the header.
- `theme` (optional): the name of a file in `themes/`. Defaults to `default`. You can also give an inline theme object, e.g. `{ "extends": "custom", "bubble": { "fontSize": 50 } }`.
- `format` (optional): `vertical` (1080×1920) or `horizontal` (1920×1080).
- Per-message options:
  - `time`: the timestamp to show. If omitted, one is generated automatically.
  - `delay`: an extra pause in seconds before the message.
  - `typing`: overrides the typing duration in seconds.
- **Avatars:** put images in `public/avatars/`. If an avatar file is missing, a colored circle with the person's initials is shown instead. URLs also work.
- **Emoji-only messages** of 1–3 emoji are drawn large without a bubble, like WhatsApp and iMessage.

The video length is calculated automatically from the messages and timing settings.

## Themes

All styling lives in `themes/*.json`, and any new JSON file you add there is picked up
automatically. A theme can set `"extends": "<other theme>"` and only override what it
changes. Every theme ultimately falls back to `default.json`, which lists every option.

| Section | What it controls |
|---|---|
| `video` | `format` (`vertical`/`horizontal`), `fps`, optional explicit `width`/`height` |
| `background` | `type`: `solid` / `gradient` / `image` / `video`, plus `color`, `gradient` (CSS), `src` (file in `public/` or URL), `overlay`, `blur`, `panel` (a colored card on top: `color`, `inset`, `radius`, `wobble` for hand-drawn edges; `shape: "blob"` + `waveLength` for a smooth wavy outline) |
| `font` | `family`; `source`: `google` / `local` (`file` in `public/fonts/`) / `system`; `weights`; `emojiFont` (`"Noto Color Emoji"` or `null` for system emoji) |
| `layout` | `anchor` (`bottom` = messages enter at the bottom and push older ones up, `top` = fill from the top first), column max width, paddings, `messageGap`, `groupGap` (same-sender), `bubbleMaxWidth`, `fadeTop` (soft fade where messages scroll under the header) |
| `header` | `variant`: `bar` (app header) or `logo` (floating avatar + big outlined `title` in `titleFont`, with `titleStroke`); `avatar`/`title` overrides, `showStatus`, show/hide, height, colors, blur, avatar size, `onlineText`, `typingText`, back arrow, call icons, `centered` (iMessage style) |
| `phoneFrame` | `show`, bezel color/size, corner radius, margin, `notch`, shadow |
| `bubble` | `radius`, `groupRadius`, `minWidth`, `shape` (`rect`, or `blob` = smooth hand-drawn wavy outline), `wobble` (how far the edge wanders, px), `waveLength` (blob wave size, px), `irregular` (0–1, lopsided corners per bubble), `tilt` (max degrees each bubble shape leans; text stays straight), padding, font size/weight, `tail` (`curved`/`triangle`/`speech`/`none`; `speech` = comic spike under the bubble, placed with `tailInset`), `tailPosition` (`first` = WhatsApp, `last` = iMessage), `shadow`, `backdropBlur`, emoji-only size; per person `A`/`B`: `background` (color, rgba or gradient), `textColor`, `glow`, `glowSize`, `opacity`, `border`, `metaColor`, `tailColor` |
| `typing` | `style` (`dots`/`pulse`/`wave`), `bubble` (`false` = bare dots next to the avatar), dot color/size/gap, background, `showForA`, `speed` |
| `avatars` | small avatar under every bubble: `show`, `size`, `background`, `border`, `initialsColor`, `offsetY`, `offsetX` |
| `animation` | `entrance` (`pop`/`slide`/`fade`/`bounce`), scroll spring damping & duration |
| `timing` (seconds) | `startDelay`, `typingPerChar`, `minTyping`, `maxTyping`, `pauseBetween`, `endHold`, `readDelay` |
| `meta` | `timestamps`, `startTime`, `minutesPerMessage`, `clock` (`24h`/`12h`), `readTicks` and their colors |
| `sounds` | `sent`, `received`, `typing` (looped while typing), `volume`. Files are in `public/sounds/`; `null` disables a sound |
| `music` | background `src` and `volume` |

Included themes:
- **default**: a light WhatsApp-style theme.
- **doodle**: a white page with a wavy purple panel, hand-drawn pink and white bubbles with comic tails, an outlined avatar under each bubble, and a logo-style header. See `chats/chat3.json`.
- **custom**: a dark iMessage-style theme with a phone frame, gradient glowing bubbles, slide-in animation, and wave dots.

`npm run sounds` regenerates the bundled sent/received sounds (`public/sounds/*.wav`).

## How it works

- `src/timing.ts` calculates, for every message, when its typing indicator starts and when the bubble appears. Typing time is `characters × typingPerChar`, clamped between `minTyping` and `maxTyping`.
- `src/components/ChatArea.tsx` lays out all bubbles once and measures them. On each typing start or bubble appearance it springs the column upward, so the newest item stays just above the bottom edge.
- `src/theme.ts` holds the theme types, loads every theme automatically, and resolves `extends`.

## Project layout

```
chats/            input conversations
themes/           theme JSON files
public/avatars/   avatar images      public/sounds/  sound effects
public/fonts/     local font files   public/backgrounds/ images & videos
src/              Remotion composition and components
scripts/          render-all.mjs (batch), generate-sounds.mjs
out/              rendered videos
```

---

# Lesson videos (landscape language-learning dialogues)

This is a separate composition, `LessonVideo`, with its own input files (`lessons/`),
themes (`lesson-themes/`) and batch script. It doesn't change anything in the chat videos.

For each line:
1. The character pops in.
2. Its card grows out of the character.
3. The Japanese text appears, then the reading and translation.
4. The voice clip plays. The line lasts exactly as long as the audio.
5. There's a pause, then the next character.

An empty grey card marks where the next line will appear. When the cards fill the
screen, everything scrolls up.

## Render

```bash
npx remotion render LessonVideo out/lessons/lesson1.mp4 --props=lessons/lesson1.json
npm run render:lessons                          # every lessons/*.json → out/lessons/<name>.mp4
npm run render:lessons -- --theme=default --only=lesson1 --format=vertical
```

## Lesson file

```json
{
  "theme": "default",
  "title": "Japanese Greetings",
  "subtitle": "Lesson 1",
  "background": { "type": "image", "src": "backgrounds/sky.png" },
  "characters": {
    "ghost":   { "image": "characters/ghost.png",   "side": "right", "height": 340 },
    "snowman": { "image": "characters/snowman.png", "side": "left",  "height": 380, "offsetX": 60, "offsetY": 10, "flip": false }
  },
  "lines": [
    { "character": "ghost",   "text": "おはよう",   "translation": "Good morning", "audio": "audio/ohayou-1.mp3" },
    { "character": "snowman", "text": "おはよう！", "translation": "Morning!",     "audio": "audio/ohayou-2.mp3",
      "reading": "ohayou!", "repeat": 2, "pause": 2.0 }
  ]
}
```

- `title` / `subtitle`: the text at the top. Leave it out for no title.
- `background` (optional): overrides the theme background for this lesson only. It takes the same options as chat themes (`solid` / `gradient` / `image` / `video`).
- `characters`: any number of characters, each with:
  - `image`: a transparent PNG or SVG in `public/characters/`.
  - `side`: which end of the card the character stands at.
  - `height`, `offsetX` (positive = further outward), `offsetY`, `flip`.

  Characters can also be defined once in a lesson theme's `characters` so every lesson in a series shares them.
- Per line:
  - `audio`: a voice clip in `public/audio/`, in mp3, wav, m4a or ogg format.
  - `repeat`: plays the clip several times, for repeat-after-me.
  - `pause`: seconds to wait before the next line, overriding the theme.
  - `duration`: how long to hold a line that has no audio.

## Lesson theme (`lesson-themes/*.json`)

Themes can use `"extends"` just like chat themes. `default.json` is the light-blue comic-card look and lists every option.

| Section | What it controls |
|---|---|
| `video` | `format` (`horizontal` by default, or `vertical`), `fps` |
| `background` | same as chat themes (`solid` / `gradient` / `image` / `video`, `overlay`, `panel`) |
| `fonts` | Google Fonts for `text`, `translation`, `reading`, `title`, plus `emoji` |
| `title` | size, weight, color, outline, subtitle style, `top`, `align`, `scroll` (title scrolls away with the cards, or stays fixed) |
| `layout` | `paddingX`, `top` (where the first card starts), `bottom`, `cardGap`, `characterInset` (how far the card stops short on the character's side), `peek` |
| `card` | background, `border`, `radius`, hard offset `shadow`, paddings, `minHeight`, `align` (`auto` = away from the character), text/reading/translation sizes and colors, `translationFormat` (e.g. `"({t})"`), `entrance` (`grow` / `pop` / `slide` / `fade`), `textReveal` (`fade` / `typewriter` / `none`) |
| `placeholder` | grey "next card" placeholder: `show`, `background`, `radius` |
| `character` | default `height`, `offsetX`, `offsetY`, `entrance` (`pop` / `slide` / `drop` / `fade`), `idle` (`bob`), `talk` (`bounce` while its audio plays) |
| `timing` (seconds) | `startDelay`, `characterLead` (character before card), `textDelay`, `audioDelay`, `pauseBetween` (between two audio lines), `repeatGap`, `endHold`, and `secondsPerChar` / `minLine` for lines without audio |
| `sounds` | `characterIn` / `cardIn` effects, `volume`, `voiceVolume` |
| `music` | background `src` and `volume` |

The included ghost and snowman (`public/characters/*.svg`) and voice clips
(`public/audio/*.wav`, read by an English text-to-speech voice) are placeholders.
Replace them with your own art and recordings.
