# Chat & Japanese Learning Video Generator

Turn simple JSON files into finished MP4 videos. Built with [Remotion](https://remotion.dev)
(React-based video rendering) and TypeScript.

There are three kinds of video. Each one has its own input folder, its own themes and its own render commands:

| Video type | Composition | What it looks like | Input folder | Themes folder | Default size |
|---|---|---|---|---|---|
| **Chat** | `ChatVideo` | Two people texting: typing indicators, pop-in bubbles, the chat building up from the bottom like a real messaging app | `chats/` | `themes/` | 1080×1920 (vertical) |
| **Lesson** | `LessonVideo` | Japanese Q&A: each slide is a separate question and answer. Each line has its own animated GIF beside a comic-style card with the Japanese and English, plays its English audio once and then its Japanese audio 3×, then the slide clears for the next one | `lessons/` | `lesson-themes/` | 1920×1080 (landscape) |
| **Phrase** | `PhraseVideo` | YouTube-style sentence learning: one sentence at a time writes itself in, the English appears below, and an animated GIF plays beside it | `phrases/` | `phrase-themes/` | 1920×1080 (landscape) |

All styling (colors, fonts, sizes, animations, timing) lives in theme JSON files, so you can
change the look without touching code.

---

## Contents

1. [Setup](#setup)
2. [Command cheat sheet](#command-cheat-sheet)
3. [Lesson Studio (editor for lesson videos)](#lesson-studio-editor-for-lesson-videos)
4. [Previewing in Remotion Studio](#previewing-in-remotion-studio)
5. [How-to guides](#how-to-guides)
6. [Shared concepts](#shared-concepts-all-video-types)
7. [Chat videos](#chat-videos)
8. [Lesson videos](#lesson-videos)
9. [Phrase videos](#phrase-videos)
10. [Troubleshooting](#troubleshooting)
11. [Project layout](#project-layout)

---

## Setup

Requirements:
- **Node.js 18+**
- **Internet access while rendering.** Fonts load from Google Fonts. You can switch a chat theme to a local or system font if you need to render offline.

You don't need to install ffmpeg or Chrome. Remotion downloads its own copies the first time you render, so the first render takes a little longer.

```bash
git clone git@github.com:TheMihirSensei/chat-video.git
cd chat-video
npm install
```

Run all commands from the project folder.

---

## Command cheat sheet

### Render a single video

| What | Command |
|---|---|
| Chat video | `npx remotion render ChatVideo out/chat1.mp4 --props=chats/chat1.json` |
| Lesson video | `npx remotion render LessonVideo out/lessons/lesson1.mp4 --props=lessons/lesson1.json` |
| Phrase video | `npx remotion render PhraseVideo out/phrases/phrase1.mp4 --props=phrases/phrase1.json` |

The pattern is always:

```bash
npx remotion render <Composition> <output.mp4> --props=<input.json>
```

There are npm shortcuts for the sample files: `npm run render` (chat1), `npm run render:lesson` (lesson1) and `npm run render:phrase` (phrase1).

### Render every file in a folder (batch)

| What | Command | Output |
|---|---|---|
| All chats | `npm run render:all` | `out/<name>.mp4` |
| All lessons | `npm run render:lessons` | `out/lessons/<name>.mp4` |
| All phrases | `npm run render:phrases` | `out/phrases/<name>.mp4` |

The batch scripts build the project once and reuse it for every file, so they're faster than
running the single-video command many times. If one file fails, the rest still render, and the
failures are listed at the end.

**Batch options.** Put `--` before them so npm passes them through:

| Option | Example | What it does |
|---|---|---|
| `--theme=<name>` | `--theme=doodle` | Use this theme for every file, overriding any `"theme"` set inside the files |
| `--format=<f>` | `--format=horizontal` | `vertical` (1080×1920) or `horizontal` (1920×1080) |
| `--only=<a,b>` | `--only=lesson1,lesson2` | Render only these files (names without `.json`) |
| `--out=<dir>` | `--out=videos` | Save the videos to a different folder |
| `--chats=<dir>` / `--lessons=<dir>` / `--phrases=<dir>` | `--lessons=season2` | Read input files from a different folder |
| `--concurrency=<n>` | `--concurrency=4` | Number of frames rendered in parallel |

Examples:

```bash
npm run render:all -- --theme=doodle --only=chat3
npm run render:lessons -- --format=vertical
npm run render:phrases -- --only=phrase1 --out=videos/phrases
```

### Useful extra commands

| Command | What it does |
|---|---|
| `npm run editor` | Opens **Lesson Studio** at http://localhost:3210, a form-based editor for lesson videos ([details](#lesson-studio-editor-for-lesson-videos)) |
| `npm run studio` | Opens Remotion Studio, a live preview in your browser ([details](#previewing-in-remotion-studio)) |
| `npx remotion still PhraseVideo out/frame.png --frame=120 --props=phrases/phrase1.json` | Renders one frame as a PNG, a quick way to check a look without rendering the whole video |
| `npx remotion compositions --props=lessons/lesson1.json` | Prints each composition's size and length in frames and seconds |
| `npx remotion render ... --frames=0-150` | Renders only part of a video (frames 0–150) |
| `npm run typecheck` | Checks the TypeScript code for errors |
| `npm run sounds` | Regenerates the placeholder chat sounds (`public/sounds/*.wav`) |
| `npm run gif:placeholder` | Regenerates the placeholder GIFs (`public/gifs/cozy.gif`, `public/characters/ghost.gif`, `snowman.gif`) |

Rendered videos are 30 fps H.264 MP4 files with AAC audio. The `out/` folder is git-ignored.

---

## Lesson Studio (editor for lesson videos)

A local web app for building lesson videos without editing JSON by hand.

```bash
npm run editor
```

Then open **http://localhost:3210**. Press `Ctrl+C` in the terminal to stop it.

**What you can do:**
- **Pick or create a lesson** with the dropdown and **+ New lesson** at the top. Lessons are the same `lessons/*.json` files the render commands use, so anything you make here can also be rendered from the command line.
- **Edit slides.** Each slide has a **Question** and an **Answer**, and each of those has:
  - a **GIF**: upload one, or choose one you've already uploaded. A checkerboard behind the thumbnail shows transparency.
  - **GIF left / GIF right**: which side the picture stands on.
  - **English text** and **English audio** (upload, or choose existing, with a play button).
  - **Japanese text** and **Japanese audio**.
  - **GIF size & position** (optional): height, nudge out/in and down/up, and mirroring.
- **Manage slides:** add, duplicate, delete, and move them up or down. A new slide reuses the previous slide's GIFs and sides, so you only fill in text and audio.
- **Audio settings** for the whole lesson: which language plays first, how many times English and Japanese play, and the pause before the answer. They're saved inside the lesson file.
- **Live preview:** the real lesson video plays on the right, timed from your actual audio, so it matches the final render. **▶ Preview** on a slide jumps straight to it. Add `&frame=300` to the page URL to open the preview at a specific frame.
- **Save** with the button or `Ctrl+S`. Missing pieces (a line without a GIF or Japanese text) are listed in the preview, and rendering stays disabled until they're filled in.
- **Save & render MP4** renders `out/lessons/<name>.mp4` with a progress bar, then plays it, with a **Download** button.

**Where files go:** uploaded GIFs are saved to `public/uploads/gifs/` and audio to `public/uploads/audio/`, with a short random suffix so names never clash. The **Choose existing…** lists also include the files in `public/characters/`, `public/gifs/` and `public/audio/`.

Accepted files:
- **GIF:** `.gif` (transparent works), `.png`, `.webp`, `.svg`, `.jpg` and `.webm`.
- **Audio:** `.mp3`, `.wav`, `.m4a`, `.ogg` and `.aac`.

Only one video renders at a time.

**How it's built (for developers):**
- `editor/server.mjs` is an Express server. It serves the page through Vite, serves `public/`, and provides a small API: list/read/save lessons, upload, list files, measure audio lengths with Remotion's bundled ffprobe, render with `@remotion/renderer`, and download.
- `editor/src/` is the React app. The preview uses `@remotion/player` with the same `LessonVideo` component and timing code as the renderer.
- `src/lesson/theme-registry.ts` (webpack's `require.context`) is swapped for `editor/src/lesson-theme-registry.ts` (Vite's `import.meta.glob`) by `editor/vite.config.mjs`.

## Previewing in Remotion Studio

```bash
npm run studio
```

This opens a browser window. Pick **ChatVideo**, **LessonVideo** or **PhraseVideo** in the
left sidebar, then press play or scrub the timeline. Changes you save to code, themes or JSON
files update the preview straight away.

Each composition previews its sample file (`chats/chat1.json`, `lessons/lesson1.json` or
`phrases/phrase1.json`). To preview another file, either edit the props in the Studio's right
panel, or temporarily copy your file's contents into the sample.

You can also render from the Studio with the **Render** button.

---

## How-to guides

### Make a new phrase video (sentence learning)

1. Put your GIF in `public/gifs/`, e.g. `public/gifs/reading.gif`. Transparent GIFs work.
2. Optional: put voice clips in `public/audio/`, e.g. `public/audio/kanpeki.mp3`.
3. Create `phrases/my-video.json`:
   ```json
   {
     "theme": "default",
     "media": "gifs/reading.gif",
     "slides": [
       { "text": "完璧でなくても良いのです。", "translation": "It's okay not to be perfect.", "audio": "audio/kanpeki.mp3" },
       { "text": "少しずつでいい。", "translation": "Little by little is enough." }
     ]
   }
   ```
4. Render it:
   ```bash
   npx remotion render PhraseVideo out/phrases/my-video.mp4 --props=phrases/my-video.json
   ```

### Make a new lesson video (Q&A slides)

The easiest way is **Lesson Studio**: run `npm run editor`, click **+ New lesson**, fill in the slides, then click **Save & render MP4**. To do it by hand instead:


1. Put each line's GIF (or PNG/SVG) in `public/characters/`.
2. Put each line's Japanese clip and English clip in `public/audio/`.
3. Create `lessons/lesson3.json`. Copy `lessons/lesson1.json` as a starting point. Add one entry to `slides` per question, each with its question and answer in `lines`, and set `image`, `text`, `translation`, `audio` and `translationAudio` on every line.
4. Render it:
   ```bash
   npx remotion render LessonVideo out/lessons/lesson3.mp4 --props=lessons/lesson3.json
   ```

### Make a new chat video

1. Optional: put avatar pictures in `public/avatars/`, e.g. `mihir.png`.
2. Create `chats/chat4.json`. Copy `chats/chat1.json` and change the people and messages.
3. Pick a look with `"theme": "default"`, `"custom"` or `"doodle"`.
4. Render it:
   ```bash
   npx remotion render ChatVideo out/chat4.mp4 --props=chats/chat4.json
   ```

### Add your own voice recordings

- Save them as **mp3, wav, m4a or ogg** in `public/audio/`.
- Reference them **without** the `public/` prefix: `"audio": "audio/ohayou.mp3"`.
- You don't need to set any timing. Each line or slide automatically stays on screen at least as long as its audio. Use `"repeat": 2` to play a clip twice, which is handy for repeat-after-me practice.

### Change fonts, sizes and colors

Edit the theme file for that video type:
- Phrase videos: `phrase-themes/default.json`, under `text.main`, `text.translation` and `text.reading`.
- Lesson videos: `lesson-themes/default.json`, under `fonts` and `card`.
- Chat videos: `themes/<name>.json`, under `font`, `bubble` and `header`.

Font names are [Google Fonts](https://fonts.google.com) family names, e.g. `"Yomogi"`, `"Zen Maru Gothic"` or `"Klee One"`. They load automatically.

### Create a new theme without copying everything

Make a new file in the right themes folder, set `"extends"`, and include only what you want to change. For example, `phrase-themes/night.json`:

```json
{
  "extends": "default",
  "background": { "type": "solid", "color": "#1d1f2b" },
  "text": {
    "main": { "color": "#f4f1ea", "stroke": "#f4f1ea" },
    "translation": { "color": "#b9bdd0" }
  },
  "media": { "side": "right" }
}
```

Then use `"theme": "night"` in a phrase file, or render with `--theme=night`. New theme files are picked up automatically; no code changes are needed.

---

## Shared concepts (all video types)

### Files go in `public/`

Images, GIFs, audio, fonts and background videos must be inside `public/`. In JSON files, write
paths **relative to `public/`**: `"gifs/cozy.gif"`, not `"public/gifs/cozy.gif"`. Full
`https://` URLs also work.

| Folder | Use for |
|---|---|
| `public/audio/` | Voice clips for lessons and phrases |
| `public/gifs/` | GIFs / images / videos for phrase videos |
| `public/characters/` | GIFs / images for lesson lines |
| `public/avatars/` | Avatar pictures for chat videos |
| `public/backgrounds/` | Background images or videos |
| `public/sounds/` | Sound effects (pop, message sent and so on) |
| `public/fonts/` | Local font files (chat themes with `"source": "local"`) |

### Themes

- Every theme builds on its folder's `default.json`, which lists **every available option** with a working value. Read it to see what can be changed.
- `"extends": "<theme>"` lets a theme inherit from any other theme and override only some values.
- An input file chooses its theme with `"theme": "<name>"`. If it doesn't, it uses `default`. The batch scripts' `--theme` option overrides both.
- You can also put a whole theme object inline instead of a name, e.g. `"theme": { "extends": "doodle", "bubble": { "fontSize": 60 } }`.

### Video size

Each theme sets `video.format`: `"vertical"` (1080×1920, for Reels and Shorts) or
`"horizontal"` (1920×1080, for YouTube). An input file can override it with `"format": "horizontal"`,
and the batch scripts with `--format`. All videos are 30 fps unless the theme's `video.fps` says otherwise.

### Video length

You never set the total length. It's calculated from the content: message lengths and typing
speed for chats, and audio length plus animation and pause settings for lessons and phrases.

### Background

All three types share the same background options (in the theme, and as a per-file
`"background"` override for lessons and phrases):

```json
"background": { "type": "image", "src": "backgrounds/paper.png", "overlay": "rgba(0,0,0,0.1)", "blur": 0 }
```

| Option | Values |
|---|---|
| `type` | `solid`, `gradient`, `image`, `video` |
| `color` | Color used for `solid` |
| `gradient` | Any CSS gradient, used for `gradient` |
| `src` | The image or video (`image` / `video`) |
| `overlay` | Optional color drawn on top, e.g. to darken an image |
| `blur` | Blur amount in px |
| `panel` | Optional colored card on top. Used by the doodle chat theme; see [chat theme options](#chat-theme-options) |

---

## Chat videos

Two people texting. Before each message a typing indicator shows for a time based on the
message length, and the header says "typing…". Then the bubble pops in. New messages appear at
the bottom and push older ones up.

```bash
npx remotion render ChatVideo out/chat1.mp4 --props=chats/chat1.json
npm run render:all
```

### Chat file (`chats/*.json`)

```json
{
  "theme": "doodle",
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

| Field | Meaning |
|---|---|
| `people.A` | Right side, the sender |
| `people.B` | Left side. Their name and avatar appear in the header |
| `avatar` | File in `public/avatars/` (or `public/`), or a URL. A missing file shows the person's initials instead |
| `messages[].from` | `"A"` or `"B"` |
| `messages[].text` | The message. Messages of only 1–3 emoji are drawn large without a bubble (if the theme allows it) |
| `messages[].time` | Optional timestamp. If omitted, one is generated automatically |
| `messages[].delay` | Optional extra pause in seconds before this message |
| `messages[].typing` | Optional typing duration in seconds, overriding the automatic one |

### Included chat themes

| Theme | Look | Sample |
|---|---|---|
| `default` | Light WhatsApp style: green header, tails, timestamps, read ticks | `chats/chat1.json` |
| `custom` | Dark iMessage style in a phone frame: gradient glowing bubbles, slide-in animation | `chats/chat2.json` |
| `doodle` | White page with a wavy purple panel, hand-drawn wobbly pink and white bubbles with comic tails, an avatar under every bubble, and a logo-style header | `chats/chat3.json` |

### Chat theme options

| Section | What it controls |
|---|---|
| `video` | `format` (`vertical`/`horizontal`), `fps`, optional explicit `width`/`height` |
| `background` | `type`: `solid` / `gradient` / `image` / `video`, plus `color`, `gradient`, `src`, `overlay`, `blur`, and `panel`. The panel is a colored card on top with `color`, `inset`, `radius` and `wobble`; set `shape: "blob"` and a `waveLength` for a smooth wavy outline |
| `font` | `family`; `source`: `google` / `local` (`file` in `public/fonts/`) / `system`; `weights`; `emojiFont` (`"Noto Color Emoji"`, or `null` for system emoji) |
| `layout` | `anchor` (`bottom` = messages enter at the bottom and push older ones up; `top` = fill from the top first), `chatMaxWidth`, paddings, `messageGap`, `groupGap` (gap between messages from the same person), `bubbleMaxWidth`, `fadeTop` (soft fade where messages scroll under the header) |
| `header` | `show`; `variant`: `bar` (app header) or `logo` (floating avatar plus a big outlined title in `titleFont`, with `titleStroke`); `title`/`avatar` overrides, `showStatus`, height, colors, blur, sizes, `onlineText`, `typingText`, back arrow, call icons, `centered` |
| `phoneFrame` | `show`, bezel color and size, corner radius, margin, `notch`, shadow |
| `bubble` | `radius`, `groupRadius`, `minWidth`; `shape` (`rect`, or `blob` for a smooth hand-drawn wavy outline); `wobble` (how far the edge wanders, px); `waveLength` (blob wave size, px); `irregular` (0–1, lopsided corners per bubble); `tilt` (maximum degrees each bubble leans; the text stays straight); padding, font size and weight; `tail` (`curved`/`triangle`/`speech`/`none`, where `speech` is a comic spike under the bubble placed with `tailInset`); `tailPosition` (`first` = WhatsApp, `last` = iMessage); `shadow`; `backdropBlur`; emoji-only size. Per person (`A` / `B`): `background` (color, rgba or gradient), `textColor`, `glow`, `glowSize`, `opacity`, `border`, `metaColor`, `tailColor` |
| `typing` | `style` (`dots`/`pulse`/`wave`), `bubble` (`false` = bare dots next to the avatar), dot color/size/gap, background, `showForA`, `speed` |
| `avatars` | Small avatar under every bubble: `show`, `size`, `background`, `border`, `initialsColor`, `offsetY`, `offsetX` |
| `animation` | `entrance` (`pop`/`slide`/`fade`/`bounce`), scroll spring `scrollDamping` and `scrollDuration` |
| `timing` (seconds) | `startDelay`, `typingPerChar`, `minTyping`, `maxTyping`, `pauseBetween`, `endHold`, `readDelay` |
| `meta` | `timestamps`, `startTime`, `minutesPerMessage`, `clock` (`24h`/`12h`), `readTicks` and tick colors |
| `sounds` | `sent`, `received`, `typing` (looped while typing), `volume`. Files go in `public/sounds/`; `null` turns a sound off |
| `music` | Background `src` and `volume` |

---

## Lesson videos

Landscape Japanese **Q&A videos**. The video is a series of separate slides, each a
self-contained exchange (usually a question and its answer). Slides don't build on each
other: each one starts on a clean screen. For each slide:

1. The question line's picture (usually an animated GIF) pops in and its card grows out. The Japanese text and English translation appear, then its audio plays: the **English clip once, then the Japanese clip 3 times** (configurable).
2. There's a short thinking pause (`timing.answerDelay`) before the answer appears.
3. The answer line comes in the same way, with its own picture and audio.
4. The finished slide holds for a moment, then its cards animate away one after another (`transition`), and the next slide begins.

There's no title, no counter and no scrolling. Each slide's cards are centered on screen.
Every line has its own picture, and the pictures don't move on their own: any motion
comes from the GIF itself.

```bash
npx remotion render LessonVideo out/lessons/lesson1.mp4 --props=lessons/lesson1.json
npm run render:lessons
```

Samples: `lessons/lesson1.json` (greetings, 2 slides) and `lessons/lesson2.json` (introducing yourself, 4 slides).

### Lesson file (`lessons/*.json`)

```json
{
  "theme": "default",
  "background": { "type": "image", "src": "backgrounds/sky.png" },
  "slides": [
    {
      "lines": [
        { "image": "characters/ghost.gif", "side": "right", "height": 340,
          "text": "おはよう", "translation": "Good morning",
          "audio": "audio/ohayou.mp3", "translationAudio": "audio/en-good-morning.mp3", "pause": 2.5 },
        { "image": "characters/snowman.gif", "side": "left", "height": 380, "offsetX": 60, "offsetY": 10,
          "text": "おはよう！", "translation": "Morning!",
          "audio": "audio/ohayou-2.mp3", "translationAudio": "audio/en-morning.mp3" }
      ]
    },
    {
      "lines": [
        { "image": "characters/cat-thinking.gif", "side": "right",
          "text": "げんき？", "translation": "How are you?",
          "audio": "audio/genki.mp3", "translationAudio": "audio/en-how-are-you.mp3", "repeat": 2 },
        { "image": "characters/dog-happy.gif", "side": "left",
          "text": "うん、げんきです！", "translation": "Yeah, I'm good!",
          "audio": "audio/genki-desu.mp3", "translationAudio": "audio/en-im-good.mp3" }
      ]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `background` | Optional; overrides the theme background for this lesson only |
| `slides[]` | One entry per Q&A slide. Each slide is shown on its own and cleared before the next |
| `slides[].lines[]` | The cards on that slide, top to bottom: usually 2 (question, answer), but 1 or 3 also work |
| `lines[].image` | This line's picture: an animated GIF (transparent works), PNG, SVG or `.webm` in `public/`. Every line can use a different one, and a GIF starts from its first frame when it appears |
| `lines[].side` | `left` or `right`: which end of the card the picture stands at. The text aligns to the other end |
| `lines[].height` / `offsetX` / `offsetY` / `flip` | Picture size, nudge (positive `offsetX` = further outward) and horizontal mirroring. They default to the theme's `character` settings |
| `lines[].text` | Japanese text |
| `lines[].translation` | English, shown under the text and formatted by the theme's `translationFormat`, e.g. `(Good morning)` |
| `lines[].audio` | Japanese voice clip in `public/audio/`. Plays `audio.japaneseRepeat` times (3 by default) |
| `lines[].translationAudio` | English voice clip. Plays `audio.englishRepeat` times (1 by default) |
| `lines[].repeat` / `translationRepeat` | Override how many times this line's Japanese / English clip plays (`0` = skip it) |
| `lines[].pause` | Thinking time in seconds after this line before the next card on the same slide, overriding `timing.answerDelay` |
| `lines[].duration` | How long to hold a line that has no audio at all |
| `lines[].character` | Optional: name of a reusable preset from `characters` (see below) |

**Reusable presets (optional).** If the same picture settings repeat a lot, define them once
and reference them by name. Any field set on the line itself still wins:

```json
"characters": {
  "ghost": { "image": "characters/ghost.gif", "side": "right", "height": 340 }
},
"slides": [ { "lines": [ { "character": "ghost", "text": "おはよう", "image": "characters/ghost-wave.gif" } ] } ]
```

Presets can live in the lesson file or in a lesson theme's `characters` section, which shares them with every lesson using that theme.

Older files with a flat `"lines": [...]` list (no `slides`) still work. They're split into slides of `layout.linesPerSlide` lines (2 by default).

### Lesson theme options (`lesson-themes/*.json`)

`default.json` is the light-blue comic-card look.

| Section | What it controls |
|---|---|
| `video` | `format` (`horizontal` by default, or `vertical`), `fps` |
| `background` | See [Background](#background) |
| `fonts` | Google Fonts for the Japanese `text` and English `translation`, plus `emoji` |
| `layout` | `paddingX`, `top` / `bottom` (each slide's cards are centered between these), `cardGap`, `characterInset` (how far the card stops short on the picture's side), `linesPerSlide` (for older flat `lines` files) |
| `card` | Background, `border`, `radius`, hard offset `shadow`, paddings, `minHeight`, `align` (`auto` = away from the picture), text and translation sizes and colors, `translationFormat` (e.g. `"({t})"`), `entrance` (`grow`/`pop`/`slide`/`fade`), `textReveal` (`fade`/`typewriter`/`none`) |
| `character` | Default picture `height`, `offsetX`, `offsetY`; `entrance` (`pop`/`slide`/`drop`/`fade`/`none`), which is only how the picture appears; `fit` (`contain`/`cover`/`fill`); `speed` (GIF playback speed) |
| `characters` | Optional reusable picture presets shared by every lesson using this theme |
| `audio` | `japaneseRepeat` (3), `englishRepeat` (1), `order` (`english-first` by default, or `japanese-first`), `repeatGap` (between repeats of the same clip), `languageGap` (when switching language) |
| `transition` | How a finished slide leaves: `out` (`shrink`/`fade`/`rise`/`sink`/`slideLeft`), `duration`, `stagger` (delay between cards leaving), `outroLast` (animate the last slide out too) |
| `timing` (seconds) | `startDelay`; `characterLead` (picture before card); `textDelay`; `audioDelay`; `answerDelay` (thinking time between question and answer); `slideHold` (how long the finished slide stays); `slideGap` (pause before the next slide); `endHold`; `secondsPerChar` / `minLine` (lines with no audio) |
| `sounds` | `characterIn` / `cardIn` effects, `volume`, `voiceVolume` |
| `music` | Background `src` and `volume` |

---

## Phrase videos

YouTube-style sentence learning. There's no chat and no scrolling. For each slide:
1. The Japanese sentence writes itself in, character by character.
2. The English translation rises in below it, for viewers who don't understand the Japanese.
3. The voice clip plays. The slide stays up at least as long as the audio.
4. The sentence blurs out and the next one writes itself in.

An animated GIF (transparent works) plays beside the text the whole time.

```bash
npx remotion render PhraseVideo out/phrases/phrase1.mp4 --props=phrases/phrase1.json
npm run render:phrases
```

### Phrase file (`phrases/*.json`)

```json
{
  "theme": "default",
  "media": "gifs/cozy.gif",
  "background": { "type": "image", "src": "backgrounds/paper.png" },
  "slides": [
    { "text": "完璧でなくても良いのです。", "translation": "It's okay not to be perfect.",
      "reading": "kanpeki de nakute mo ii no desu.", "audio": "audio/p1-kanpeki.wav" },
    { "text": "少しずつでいい。", "translation": "Little by little is enough.",
      "duration": 5, "media": "gifs/walking.gif", "repeat": 2 }
  ]
}
```

| Field | Meaning |
|---|---|
| `media` | The GIF, image (PNG/WebP/SVG) or video (`.webm` with transparency, `.mp4`) shown beside the text. GIFs play frame-accurately and loop |
| `background` | Optional; overrides the theme background for this file only |
| `slides[].text` | Japanese sentence. Use `\n` to force a line break |
| `slides[].translation` | English shown under it |
| `slides[].reading` | Optional romaji line. It only shows if the theme has `text.showReading: true` |
| `slides[].audio` | Optional voice clip in `public/audio/` |
| `slides[].repeat` | Play the clip this many times |
| `slides[].duration` | Fixed number of seconds the slide stays fully visible, overriding the automatic length |
| `slides[].media` | A different GIF for this slide. It cross-fades from the previous one |

### Phrase theme options (`phrase-themes/*.json`)

`default.json` is the white, hand-written look.

| Section | What it controls |
|---|---|
| `video` | `format` (`horizontal` by default, or `vertical`), `fps` |
| `background` | See [Background](#background) |
| `media` | `show`; `side` (`left`/`right`); box `width`/`height` (fractions of the video, e.g. `0.42`); `anchor` (`top`/`center`/`bottom`); `offsetX`/`offsetY`; `fit` (`contain`/`cover`/`fill`); `speed` (GIF playback speed); `entrance` (`fade`/`rise`/`zoom`/`none`); `crossfade` |
| `text` | Position `x`/`y` (fractions; `x: null` = centered in the free side; `x` is written for the GIF on the left and mirrors automatically when `media.side` is `right`); `maxWidth`; `align`; separate `main`, `reading` and `translation` styles, each with `font` (Google Font), `weights`, `size`, `weight`, `color`, `lineHeight`, `letterSpacing`, `stroke`/`strokeWidth` (outline, also useful to thicken thin fonts) and `marginTop`. Also `translationFormat` (e.g. `"({t})"`), `showReading`, `showTranslation` |
| `animation` | `textIn`: `chars` (character by character), `typewriter`, `fade`, `rise`, `blur`, `zoom` or `none`; `textInDuration`; `charStagger` (seconds between characters); `translationIn` (same options) and `translationInDuration`; `textOut`: `blur`, `fade`, `rise`, `sink` or `none`; `textOutDuration`; `outroLast` (animate the last slide out too) |
| `timing` (seconds) | `startDelay`, `translationDelay` (English appears this long after the Japanese starts), `audioDelay`, `repeatGap`, `holdAfter` (extra time after the audio), `secondsPerChar` / `minSlide` (slides without audio), `gap` (between slides; a negative value makes the next slide start while the previous one is still leaving), `endHold` |
| `sounds` | `slideIn` effect, `volume`, `voiceVolume` |
| `music` | Background `src` and `volume` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not read audio "audio/x.mp3" (is it in public/?)` | The file isn't at `public/audio/x.mp3`. Check the spelling and leave `public/` out of the path |
| `Unknown theme "x"` / `Unknown lesson theme` / `Unknown phrase theme` | There's no `x.json` in that video type's themes folder. Each type has its own folder |
| `Line uses unknown character "x"` | The lesson line's `character` doesn't match any preset name in `characters` |
| `Line "…" has no "image"` | Every lesson line needs an `image` (on the line itself or in its `character` preset) |
| `remotion compositions --props=lessons/x.json` shows PhraseVideo as "Still" | Expected. That command gives every composition the same file, and the phrase video skips files that aren't phrase files |
| `Cannot use frame N … highest frame that can be rendered is M` | `remotion still --frame=N` is past the end of the video. Run `npx remotion compositions --props=...` to see the length |
| Fonts look wrong (plain system font) | Rendering needs internet to download Google Fonts. Also check the font name is spelled exactly as on fonts.google.com |
| An image or GIF doesn't show | Check that the file is inside `public/` and the path in the JSON is relative to `public/` |
| The first render is slow | Remotion downloads its own Chrome and ffmpeg the first time. Later renders are faster |
| Lesson Studio won't start: `EADDRINUSE` | Port 3210 is in use (maybe Lesson Studio is already running). Close it, or run with another port: `PORT=3300 npm run editor` (PowerShell: `$env:PORT=3300; npm run editor`) |
| Inline `--props='{...}'` JSON breaks on Windows | Put the props in a `.json` file and pass `--props=path/to/file.json` instead |

---

## Project layout

```
chats/              chat input files
lessons/            lesson input files
phrases/            phrase input files
themes/             chat themes            (default, custom, doodle)
lesson-themes/      lesson themes          (default)
phrase-themes/      phrase themes          (default)
public/             images, GIFs, audio, fonts (paths in JSON are relative to here)
  uploads/          files uploaded in Lesson Studio
editor/             Lesson Studio (npm run editor): server.mjs + React app in src/
scripts/
  render-all.mjs        batch render chats
  render-lessons.mjs    batch render lessons
  render-phrases.mjs    batch render phrases
  generate-sounds.mjs   makes the placeholder chat sounds
  placeholder-gif/      makes the placeholder GIF
src/
  Root.tsx              registers ChatVideo, LessonVideo, PhraseVideo and works out their size and length
  ChatVideo.tsx, components/, theme.ts, timing.ts   chat videos (plus shared pieces)
  lesson/               lesson videos
  phrase/               phrase videos
out/                rendered videos (git-ignored)
```

### How it works (for developers)

- `src/Root.tsx` registers the three compositions. Each `calculateMetadata` loads the theme, reads the audio lengths, and works out the video's size and duration before rendering.
- The timing files (`src/timing.ts`, `src/lesson/timing.ts`, `src/phrase/timing.ts`) work out the frame at which every element appears.
- The theme files (`src/theme.ts`, `src/lesson/theme.ts`, `src/phrase/theme.ts`) define the theme options, load every JSON file in their folder automatically, and handle `extends`.

### Placeholder assets

These are only for testing. Replace them with your own:
- `public/audio/*.wav`: "Japanese" clips are an English text-to-speech voice reading romaji (Windows has no Japanese voice installed); `en-*.wav` are English text-to-speech
- `public/characters/ghost.gif`, `snowman.gif` and `public/gifs/cozy.gif`: looping transparent GIFs made by `npm run gif:placeholder` (`scripts/placeholder-gif/`)
- `public/characters/ghost.svg`, `snowman.svg`: still versions of the characters
- `public/sounds/*.wav`: made by `npm run sounds`
