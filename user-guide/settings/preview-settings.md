# Preview Settings

Configure the in-app web preview for HTML, Markdown, and other files.

## General

| Setting                    | Description                                                                                  |
| :------------------------- | :------------------------------------------------------------------------------------------- |
| **Preview Mode**           | **In-App**: Opens in the built-in browser. **Browser**: Opens in the system default browser. |
| **Use Current File**       | Use the currently open file for preview instead of the default (`index.html`).               |
| **Disable In-App Caching** | Disable browser caching in the in-app preview for fresh content on each refresh.             |
| **Show Console Toggler**   | Show a button to toggle the JavaScript console in the preview.                               |

## Server Configuration

| Setting          | Description                                                |
| :--------------- | :--------------------------------------------------------- |
| **Host**         | Hostname/IP for the preview server (default: `localhost`). |
| **Server Port**  | Port number for the local preview server.                  |
| **Preview Port** | Port number used when opening the preview.                 |

::: warning Different Ports
If **Preview Port** and **Server Port** are different, Acode will **not** start its own server. Instead, it will open the preview directly in the browser or in-app browser.

This is useful when you are running a server manually (e.g., React dev server, Vite, etc.) in the terminal.
:::
