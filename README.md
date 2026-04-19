# Gemini Live Avatar Web Component

A reusable web component to embed the Gemini Live Avatar feature from Vertex AI directly into any website. This component handles the real-time bidirectional communication (audio/video/text) with the Gemini Multimodal Live API.

## Features

-   **Direct Connection**: Connects to Vertex AI Live API via WebSocket from the browser.
-   **Google Sign-in**: Supports OAuth flow for acquiring access tokens.
-   **Testing Mode**: Allows passing a direct access token to bypass OAuth.
-   **Customizable**: Configure size, position, avatar preset, voice, and language.
-   **Transparent Overlay**: Designed to overlay on top of page content.
-   **MediaSource Decoding**: Uses native `MediaSource` and `SourceBuffer` for high-performance fragmented MP4 decoding (Gemini 3.1+).
-   **Fallback Player**: Retains support for `mpegts.js` via `use-mpegts="true"` attribute if needed.
-   **Bi-directional Interaction**: Supports microphone streaming using modern `AudioWorkletNode` and text messages.
-   **Premium UI**: Glassmorphic design, custom modals, and a dedicated audio-only animation mode.
-   **Audio Only Mode**: Toggle to audio-only mode with a beautiful CSS ripple animation.

## Usage

### 1. Include the Component

You can include the component script in your HTML:

```html
<script type="module" src="./gemini-avatar.js"></script>
```

By default, the component uses the browser's native `MediaSource` API to decode fragmented MP4 streams sent by Gemini 3.1+.

If you need to use `mpegts.js` as a fallback (e.g., for older streams), you can include it and set `use-mpegts="true"`:

```html
<script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.8.0/dist/mpegts.min.js"></script>
```

### 2. Add the Tag

Add the `<gemini-avatar>` tag to your page:

```html
<gemini-avatar
    id="my-avatar"
    project-id="your-google-cloud-project-id"
    location="global"
    avatar-name="Kira"
    size="300px"
    position="top-right">
</gemini-avatar>
```

### Attributes

| Attribute | Description | Required |
| :--- | :--- | :--- |
| `project-id` | Your Google Cloud Project ID | Yes |
| `location` | Vertex AI location (default: `us-central1`) | Yes |
| `avatar-name` | Preset name (e.g., `Kira`, `Piper`) (default: `Kira`) | No |
| `size` | Width/Height (e.g., `300px`) | No |
| `position` | Position on screen (e.g., `top-right`) | No |
| `oauth-client-id` | Google OAuth Client ID for Sign-in | Conditional (1) |
| `access-token` | Direct access token for testing | Conditional (1) |
| `record-video` | Set to `"true"` to save session recording | No |
| `debug` | Set to `"true"` to enable verbose console logs | No |
| `voice` | Prebuilt voice name (default: `kore`) | No |
| `language` | BCP-47 language code (default: `en-US`) | No |
| `output-mode` | `"video"` or `"audio"` (default: `"video"`) | No |

*(1) At least one of `access-token` or `oauth-client-id` must be provided.*

## Interactive Controls

The component exposes methods that can be called from external scripts:

-   `disconnect()`: Stops the current session, closes the WebSocket, and stops the microphone.
-   `sendMessage(text)`: Sends a text message to the Gemini session.

In the demo application, these are mapped to the "Stop" button and "Send Message" input.

## Observability and Debugging

By default, the component only logs critical system events (Setup, WebSocket connections, and errors) to the Developer Console.

To enable verbose logging (including individual chunk processing and MP4 box analysis):
1.  Set the `debug="true"` attribute on the component.
2.  Or check the "Enable debug logging" box in the demo UI.

## Testing Locally

1.  Open `index.html` in a browser (or serve it using a local dev server like Vite or Live Server).
2.  Generate an access token using gcloud:
    ```bash
    gcloud auth print-access-token
    ```
3.  Paste the token into the "Access Token" field in the demo app.
4.  Fill in your Project ID and Location.
5.  Click "Save Configuration".
6.  Click "Start" to begin the session.

## License

MIT
