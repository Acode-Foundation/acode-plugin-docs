---
description: Build a small HTML, CSS and JavaScript site in Acode and preview it on your phone with the built-in server, console and live reload.
---

# Build and Preview a Website

Acode has a built-in web server and preview, so you can write a site and see it on your phone without any other app. This tutorial creates a small HTML, CSS and JavaScript page and previews it.

## Step 1: Create a Project Folder

1. Open the menu (⋮) and tap **Files**, or open the sidebar's file tree.
2. Pick a location, such as **Terminal Public** or a folder in your storage, and create a folder named `my-site`.
3. Open the folder so it shows in the sidebar.

## Step 2: Add the Files

Create three files in `my-site`.

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Site</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello from Acode</h1>
    <button id="count">Clicked 0 times</button>
    <script src="script.js"></script>
  </body>
</html>
```

`style.css`:

```css
body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #12141a;
  color: #f1f2f4;
}

button {
  padding: 12px 20px;
  border: 0;
  border-radius: 10px;
  font-size: 1rem;
}
```

`script.js`:

```js
const button = document.getElementById("count");
let clicks = 0;

button.addEventListener("click", () => {
  clicks += 1;
  button.textContent = `Clicked ${clicks} times`;
  console.log("clicks:", clicks);
});
```

## Step 3: Run the Preview

With any file of the project open, tap the **Run** (▶) button in the header or press **`F5`**.

Acode starts a local server for the folder and opens `index.html`. It serves the whole folder, so links, images, CSS and scripts load like on a real web server, including clean URLs such as `/about` for `about.html`.

You can also run a single HTML, Markdown, SVG or JavaScript file. Turn on **Use Current File** in [Preview Settings](/user-guide/settings/preview-settings) to preview the open file instead of `index.html`.

## Step 4: Debug with the Console

Turn on **Show Console Toggler** in **Settings** > **Preview Settings**. The preview then has a button that opens a JavaScript console where `console.log` output and errors appear. Tap the button in the page and you'll see `clicks: 1`.

For a fuller console with DOM and network tabs, set **Console** to **Eruda** in [App Settings](/user-guide/settings/app-settings).

## Step 5: In-App or Browser

**Preview Mode** in Preview Settings chooses where the page opens:

- **In-App** opens it inside Acode, next to your code.
- **Browser** opens it in your phone's browser, which is useful for testing how the page behaves there.

## Using a Dev Server Instead

For projects with a build tool such as Vite, run its dev server in the [terminal](/user-guide/terminal), for example `npm run dev`. Then in **Preview Settings**, set **Preview Port** to the dev server's port (such as `5173`). When **Preview Port** differs from **Server Port**, Acode doesn't start its own server and opens your dev server instead.

## Next Steps

- Get autocomplete and error checking for HTML, CSS and JavaScript from the built-in [language servers](/user-guide/language-servers). They work out of the box.
- Ask the [Acode AI Agent](./ai-agent) to build features for you.
- Publish the site from the terminal with `git`, or upload it over [FTP/SFTP](/user-guide/remote-access).
