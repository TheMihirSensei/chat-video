# Project: Chat Bubble Animation Video Generator

## Goal
Build an automated tool that turns a chat conversation (JSON) into a realistic
animated MP4 video of two people texting, with typing indicators and the chat
scrolling upward like a real messaging app.

## Tech stack
- Remotion (React-based video rendering) with TypeScript
- Render to MP4 via the Remotion CLI
- Batch rendering script for multiple chat files

## Input: chat file (e.g. `chats/chat1.json`)
```json
{
  "people": {
    "A": { "name": "Mihir", "avatar": "mihir.png" },
    "B": { "name": "Riya",  "avatar": "riya.png" }
  },
  "messages": [
    { "from": "B", "text": "Did you watch the new episode?" },
    { "from": "A", "text": "Not yet 😭 no spoilers!!" },
    { "from": "B", "text": "😏" }
  ]
}
```
Person "A" = right side (sender), person "B" = left side (receiver).

## Input: theme file (e.g. `themes/default.json`)
Keep ALL visual styling in a separate theme file so themes can be swapped
without touching code. The theme should control:
- Background (solid / gradient / image / video)
- Bubble colors per person, shape, border radius, tail style, shadow, glow, transparency
- Fonts (Google Fonts or local font files), sizes, text colors
- Header bar (avatar, name, "online" / "typing…" status), optional phone frame
- Typing indicator style
- Bubble entrance animation (pop / slide / fade / bounce)
- Timing: typing speed per character, min/max typing duration, pause between messages
- Optional: timestamps, read ticks, sound effects, background music

## Animation behaviour
1. Before each message, show a typing indicator for a duration based on text length.
2. Header status shows "typing…" while the indicator is visible.
3. Bubble appears with a spring/pop animation.
4. As messages accumulate, the chat column smoothly scrolls upward so the newest
   message stays near the bottom.
5. Short pause, then the next message.
6. Total video duration is calculated automatically from the messages.

## Output
- Default format: 1080x1920 vertical (Reels/Shorts); also support 1920x1080 via a setting
- 30 fps MP4
- Command for one video:
  `npx remotion render ChatVideo out/chat1.mp4 --props=chats/chat1.json`
- Script to batch-render every file in `chats/` using a chosen theme

## My custom theme
<!-- Describe your theme here: colors, mood, background, bubble style, fonts,
     reference apps or images. Put any reference images / fonts / avatars in
     an `assets/` folder and mention them here. -->

## Steps for Claude Code
1. Scaffold the Remotion project.
2. Build the chat components, typing indicator, scroll logic and timing calculator.
3. Create a default theme plus my custom theme (section above).
4. Add a sample chat and render a test video.
5. Add the batch render script and a short README on how to use it.
