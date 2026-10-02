# Chat & Japanese Learning Video Generator

Turn simple JSON files into finished MP4 videos. Built with [Remotion](https://remotion.dev)
(React-based video rendering) and TypeScript.

There are three kinds of video. Each one has its own input folder, its own themes and its own render commands:

| Video type | Composition | What it looks like | Input folder | Themes folder | Default size |
|---|---|---|---|---|---|
| **Chat** | `ChatVideo` | Two people texting: typing indicators, pop-in bubbles, the chat building up from the bottom like a real messaging app | `chats/` | `themes/` | 1080×1920 (vertical) |
| **Lesson** | `LessonVideo` | A Japanese dialogue: characters pop in beside comic-style cards showing the Japanese text and its translation, with voice audio | `lessons/` | `lesson-themes/` | 1920×1080 (landscape) |
| **Phrase** | `PhraseVideo` | YouTube-style sentence learning: one sentence at a time writes itself in, the English appears below, and an animated GIF plays beside it | `phrases/` | `phrase-themes/` | 1920×1080 (landscape) |

All styling (colors, fonts, sizes, animations, timing) lives in theme JSON files, so you can
change the look without touching code.

---

## Contents

1. [Setup](#setup)
2. [Command cheat sheet](#command-cheat-sheet)
3. [Previewing in Remotion Studio](#previewing-in-remotion-studio)
4. [How-to guides](#how-to-guides)
5. [Shared concepts](#shared-concepts-all-video-types)
6. [Chat videos](#chat-videos)
7. [Lesson videos](#lesson-videos)
8. [Phrase videos](#phrase-videos)
9. [Troubleshooting](#troubleshooting)
10. [Project layout](#project-layout)

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
| `npm run studio` | Opens Remotion Studio, a live preview in your browser ([details](#previewing-in-remotion-studio)) |
| `npx remotion still PhraseVideo out/frame.png --frame=120 --props=phrases/phrase1.json` | Renders one frame as a PNG, a quick way to check a look without rendering the whole video |
| `npx remotion compositions --props=lessons/lesson1.json` | Prints each composition's size and length in frames and seconds |
| `npx remotion render ... --frames=0-150` | Renders only part of a video (frames 0–150) |
| `npm run typecheck` | Checks the TypeScript code for errors |
| `npm run sounds` | Regenerates the placeholder chat sounds (`public/sounds/*.wav`) |
| `npm run gif:placeholder` | Regenerates the placeholder GIF (`public/gifs/cozy.gif`) |

Rendered videos are 30 fps H.264 MP4 files with AAC audio. The `out/` folder is git-ignored.

---

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

### Make a new lesson video (character dialogue)

1. Put character images (transparent PNG or SVG) in `public/characters/`.
2. Optional: put one voice clip per line in `public/audio/`.
3. Create `lessons/lesson3.json`. Copy `lessons/lesson1.json` as a starting point and change the title, characters and lines.
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
| `public/characters/` | Character art for lesson videos |
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

Landscape Japanese dialogues. For each line:
1. The character pops in.
2. Its card grows out of the character.
3. The Japanese text appears, followed by the reading and translation.
4. The voice clip plays. The line stays on screen as long as the audio lasts.
5. There's a pause, then the next character.

A grey placeholder card marks where the next line will go. When the screen fills up,
everything scrolls up smoothly.

```bash
npx remotion render LessonVideo out/lessons/lesson1.mp4 --props=lessons/lesson1.json
npm run render:lessons
```

Samples: `lessons/lesson1.json` (greetings) and `lessons/lesson2.json` (introducing yourself).

### Lesson file (`lessons/*.json`)

```json
{
  "theme": "default",
  "title": "Japanese Greetings",
  "subtitle": "Lesson 1",
  "background": { "type": "image", "src": "backgrounds/sky.png" },
  "characters": {
    "ghost":   { "image": "characters/ghost.svg",   "side": "right", "height": 340 },
    "snowman": { "image": "characters/snowman.svg", "side": "left",  "height": 380, "offsetX": 60, "offsetY": 10 }
  },
  "lines": [
    { "character": "ghost",   "text": "おはよう",   "translation": "Good morning", "audio": "audio/ohayou-1.wav" },
    { "character": "snowman", "text": "おはよう！", "translation": "Morning!",     "audio": "audio/ohayou-2.wav",
      "reading": "ohayou!", "repeat": 2, "pause": 2.0 }
  ]
}
```

| Field | Meaning |
|---|---|
| `title` / `subtitle` | The text at the top. Leave it out for no title |
| `background` | Optional; overrides the theme background for this lesson only |
| `characters.<id>.image` | Transparent PNG or SVG in `public/characters/` |
| `characters.<id>.side` | `left` or `right`: which end of the card the character stands at. The text aligns to the other end |
| `characters.<id>.height` / `offsetX` / `offsetY` / `flip` | Size, nudge (positive `offsetX` = further outward) and horizontal mirroring |
| `lines[].character` | Which character says the line (an id from `characters`) |
| `lines[].text` | Japanese text |
| `lines[].translation` | Shown under the text, formatted by the theme's `translationFormat`, e.g. `(Good morning)` |
| `lines[].reading` | Optional romaji/furigana line |
| `lines[].audio` | Optional voice clip in `public/audio/` |
| `lines[].repeat` | Play the clip this many times |
| `lines[].pause` | Seconds to wait before the next line, overriding the theme |
| `lines[].duration` | How long to hold a line that has no audio |

Tip: define characters once in a lesson theme's `characters` section, and every lesson using that theme can use them.

### Lesson theme options (`lesson-themes/*.json`)

`default.json` is the light-blue comic-card look.

| Section | What it controls |
|---|---|
| `video` | `format` (`horizontal` by default, or `vertical`), `fps` |
| `background` | See [Background](#background) |
| `fonts` | Google Fonts for `text`, `translation`, `reading` and `title`, plus `emoji` |
| `title` | Size, weight, color, outline, subtitle style, `top`, `align`, `scroll` (`true` = scrolls away with the cards; `false` = stays fixed and the cards fade out under it) |
| `layout` | `paddingX`, `top` (where the first card starts), `bottom`, `cardGap`, `characterInset` (how far the card stops short on the character's side), `peek` (how much of the next card stays in view) |
| `card` | Background, `border`, `radius`, hard offset `shadow`, paddings, `minHeight`, `align` (`auto` = away from the character), text/reading/translation sizes and colors, `translationFormat` (e.g. `"({t})"`), `entrance` (`grow`/`pop`/`slide`/`fade`), `textReveal` (`fade`/`typewriter`/`none`) |
| `placeholder` | The grey "next card": `show`, `background`, `radius` |
| `character` | Default `height`, `offsetX`, `offsetY`, `entrance` (`pop`/`slide`/`drop`/`fade`), `idle` (`bob` = gentle floating), `talk` (`bounce` while the character's audio plays) |
| `characters` | Characters shared by every lesson using this theme |
| `timing` (seconds) | `startDelay`, `characterLead` (character before card), `textDelay`, `audioDelay`, `pauseBetween` (between two lines), `repeatGap`, `endHold`, `secondsPerChar` / `minLine` (lines without audio) |
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
| `Line uses unknown character "x"` | The lesson line's `character` doesn't match any id in `characters` |
| `Cannot use frame N … highest frame that can be rendered is M` | `remotion still --frame=N` is past the end of the video. Run `npx remotion compositions --props=...` to see the length |
| Fonts look wrong (plain system font) | Rendering needs internet to download Google Fonts. Also check the font name is spelled exactly as on fonts.google.com |
| An image or GIF doesn't show | Check that the file is inside `public/` and the path in the JSON is relative to `public/` |
| The first render is slow | Remotion downloads its own Chrome and ffmpeg the first time. Later renders are faster |
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
- `public/audio/*.wav`: an English text-to-speech voice reading romaji (Windows has no Japanese voice installed)
- `public/characters/ghost.svg`, `snowman.svg`: simple drawn placeholder characters
- `public/gifs/cozy.gif`: made by `npm run gif:placeholder`
- `public/sounds/*.wav`: made by `npm run sounds`
