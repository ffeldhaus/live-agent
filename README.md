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
-   **TypeScript**: Written in TypeScript for better maintainability and type safety.
-   **Unit Tested**: High code coverage with Vitest.

## Installation from npm

```bash
npm install gemini-avatar
```

Then import it in your project:

```javascript
import 'gemini-avatar';
```

## Usage

### 1. Include the Component

If not using a bundler, you can include the component script in your HTML (after building):

```html
<script type="module" src="./dist/gemini-avatar.es.js"></script>
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

-   `start()`: Starts the session and connects to the WebSocket.
-   `stop()`: Stops the session and closes the connection.
-   `mute()`: Mutes the avatar audio.
-   `unmute()`: Unmutes the avatar audio.
-   `sendMessage(text)`: Sends a text message to the Gemini session.

## Publishing to npm

To publish the component to npm:

1.  Ensure you have built the project:
    ```bash
    npm run build
    ```
2.  Login to npm if needed:
    ```bash
    npm login
    ```
3.  Publish the package:
    ```bash
    npm publish
    ```

The package includes the `dist` directory with the bundled files and the `src/assets` directory with the preview images.

## Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run dev server:
    ```bash
    npm run dev
    ```
3.  Run tests:
    ```bash
    npm test
    ```

## License

MIT
