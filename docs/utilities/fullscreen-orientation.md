---
title: Fullscreen and Orientation
description: Handle the Android Back button and lock screen orientation while an element is fullscreen.
---

# Fullscreen and Orientation

Two small modules help plugins that show content in the browser's **fullscreen mode** (for example a video, canvas or game):

- `fullscreen` decides what the Android **Back** button does while something is fullscreen.
- `orientation` temporarily locks the screen to portrait or landscape during that session.

```js
const fullscreen = acode.require("fullscreen");
const orientation = acode.require("orientation");
```

Neither module enters fullscreen for you. Call the standard `element.requestFullscreen()` first.

## `fullscreen.setBackHandler(callback)`

By default, Back exits fullscreen. Claim Back to run your own code instead, or release it by passing `null`.

```ts
fullscreen.setBackHandler(callback: (() => void | Promise<void>) | null): Promise<void>
```

- `callback` runs when the user presses Back. It must call `document.exitFullscreen()` itself if you want to leave fullscreen. Acode will not do it for you.
- If `callback` throws or its promise rejects, Acode exits fullscreen so the user is never stuck.
- `null` releases Back, restoring the default behavior.
- The returned promise resolves when the native side has accepted the change.

**Rules**

- A callback can only be set **while an element is fullscreen**. Otherwise the promise rejects with `Back handler requires fullscreen.`
- The handler belongs to the current fullscreen session. When the fullscreen element changes or fullscreen ends, it is released automatically. Set it again for the next session.
- Passing anything other than a function or `null` throws a `TypeError`.

```js
await video.requestFullscreen();

await fullscreen.setBackHandler(async () => {
  if (isPlayerMenuOpen()) {
    closePlayerMenu(); // first Back closes the menu
  } else {
    await document.exitFullscreen(); // second Back leaves fullscreen
  }
});
```

## `orientation.lock(mode)`

Locks the screen orientation for the current fullscreen session.

```ts
orientation.lock(mode: "landscape" | "portrait"): Promise<void>
```

Any other `mode` throws a `TypeError`. The promise rejects with an `Error` if the native request fails.

## `orientation.unlock()`

Restores the orientation policy that was in effect before `lock`.

```ts
orientation.unlock(): Promise<void>
```

Always unlock when you leave fullscreen, or the screen may stay locked.

## Example: landscape video player

```js
async function enterPlayer(video) {
  await video.requestFullscreen();
  await orientation.lock("landscape");
  await fullscreen.setBackHandler(exitPlayer);
}

async function exitPlayer() {
  await orientation.unlock();
  await fullscreen.setBackHandler(null);
  await document.exitFullscreen();
}

document.addEventListener("fullscreenchange", () => {
  // Also covers the user leaving fullscreen by other means
  if (!document.fullscreenElement) orientation.unlock().catch(() => {});
});
```

::: tip
Wrap the calls in `try`/`catch`. They can fail if the WebView refuses the fullscreen request or the fullscreen session ends while a request is in flight.
:::
