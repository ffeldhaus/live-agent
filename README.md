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
    position="top-right"
    access-token="your-access-token">
</gemini-avatar>
```

*Note: You must provide either `access-token` or `oauth-client-id` for authentication. See the [Authentication](#authentication) section for details.*

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
| `mic-auto-request` | Auto-request mic permission on load (default: `"true"`) | No |
| `visible-controls` | Controls to show (default: `"mic,camera,screen,mute"`) | No |
| `audio-chunk-size` | Audio buffer size in samples (default: `2048`) | No |

*(1) At least one of `access-token` or `oauth-client-id` must be provided.*

## Authentication

The web component handles authentication internally. You must provide either an access token or an OAuth client ID.

### Option 1: Using an Access Token (Testing/Development)
If you already have an access token (e.g., generated via `gcloud auth print-access-token`), you can pass it directly to the component. This is useful for quick testing but not recommended for production as tokens expire.

```html
<gemini-avatar
    project-id="your-project-id"
    access-token="your-access-token">
</gemini-avatar>
```

### Option 2: Using Google OAuth Client ID (Production)
For production, you should provide an `oauth-client-id`. The component will automatically load the Google Identity Services script and handle the OAuth flow to acquire an access token for the user.

```html
<gemini-avatar
    project-id="your-project-id"
    oauth-client-id="your-oauth-client-id">
</gemini-avatar>
```

The component will attempt to acquire a token silently. If user interaction is required, it will handle the prompt.

## Interactive Controls

The component exposes methods that can be called from external scripts:

-   `start()`: Starts the session and connects to the WebSocket.
-   `stop()`: Stops the session and closes the connection.
-   `mute()`: Mutes the avatar audio.
-   `unmute()`: Unmutes the avatar audio.
-   `sendMessage(text)`: Sends a text message to the Gemini session.
-   `getStats()`: Returns an object with session statistics (latency, packets, fps, etc.).

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

## Compiling and Deploying the Demo App

If you want to deploy the demo app (e.g., for internal testing or demonstration) separately from the component library:

### 1. Compile the Demo App
Run the dedicated build script for the demo:
```bash
npm run build:demo
```
This will create a `dist-demo` directory containing the compiled `index.html`, `demo.ts` (as JS), and all necessary assets.

### 2. Deploy to a Web Server (e.g., Google Cloud Storage)
You can upload the contents of the `dist-demo` directory to any static web server.

**Example: Deploying to Google Cloud Storage (GCS)**
1.  Create a bucket and configure it for static website hosting:
    ```bash
    gcloud storage buckets create gs://your-demo-bucket --location=us-central1
    gcloud storage buckets update gs://your-demo-bucket --web-main-page-suffix=index.html
    ```
2.  Upload the files:
    ```bash
    gcloud storage cp -r dist-demo/* gs://your-demo-bucket/
    ```
3.  Make the files public:
    ```bash
    gcloud storage buckets add-iam-policy-binding gs://your-demo-bucket --member=allUsers --role=roles/storage.objectViewer
    ```
4.  Access your demo at `https://storage.googleapis.com/your-demo-bucket/index.html`.

> [!IMPORTANT]
> Ensure that the bucket or server is configured to serve the necessary security headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`) if you want FFmpeg features to work in the demo.

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
