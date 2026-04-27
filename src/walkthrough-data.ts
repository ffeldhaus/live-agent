export const qaScenarios = [
  {
    id: '1.1',
    title: 'Direct Access Token',
    description: 'Verify connection using a direct access token.',
    isDetailed: true,
    steps: [
      'Enter a valid Access Token in the input.',
      'Click the "Verify Token" button that appears (or change focus of the input).',
    ],
    verification: [
      'User information is loaded and displayed right beside Settings.',
      'Buttons like "Generate Avatar Image", "I\'m feeling lucky", "Generate Background Image", and "Start" are enabled.',
    ],
  },
  {
    id: '1.2',
    title: 'Invalid Direct Access Token',
    description: 'Verify error handling for invalid tokens.',
    isDetailed: true,
    steps: [
      'Enter an invalid Access Token in the input.',
      'Click the "Verify Token" button that appears (or change focus of the input).',
    ],
    verification: [
      'A modal appears with the title "Token Verification Failed".',
      'The modal displays the error message and details from the API response.',
    ],
  },
  {
    id: '1.3',
    title: 'OAuth Sign-in',
    description: 'Verify authentication via Google OAuth.',
    isDetailed: true,
    steps: [
      'Enter a valid OAuth Client ID in the form.',
      'Observe that the "Sign in with Google" button appears immediately.',
      'Click the "Sign in with Google" button.',
      'Complete the sign-in flow in the popup.',
      'Verify that your user avatar and name appear.',
      'Click "Start".',
    ],
    verification: [
      'A Google sign-in popup appears.',
      'User avatar and name are displayed upon successful sign-in.',
      'Component connects successfully after acquiring token.',
    ],
  },
  {
    id: '1.4',
    title: 'Removing Access Token',
    description: 'Verify UI state when token is removed.',
    isDetailed: true,
    steps: [
      'Enter a valid Access Token and verify buttons are enabled.',
      'Clear the Access Token input.',
      'Observe that the button text reverts to "Sign in with Google" and lucky buttons are disabled immediately.',
      'Change focus of the input to complete clearing profile.',
    ],
    verification: [
      'User information is removed from the display.',
      'Buttons requiring token are disabled.',
    ],
  },
  {
    id: '1.5',
    title: 'Removing Project ID',
    description: 'Verify UI state when Project ID is removed.',
    isDetailed: true,
    steps: [
      'Ensure a valid token is present.',
      'Clear the Project ID input.',
      'Observe that buttons requiring Project ID are disabled immediately.',
    ],
    verification: ['Buttons requiring Project ID are disabled.'],
  },
  {
    id: '2.1',
    title: 'Avatar with Default Settings',
    description: 'Verify operation with default settings.',
    steps: [
      'Click the "Reset to Default" button on the Avatar section.',
      'Verify that all settings are reset to their default values.',
      'Click "Save Configuration".',
      'Reload the page.',
      'Verify that defaults are still applied.',
      'Click "Start".',
    ],
    verification: [
      'Component connects successfully.',
      'Avatar uses default preset (Kira).',
      'No avatar related values are stored in local storage if they match defaults.',
    ],
  },
  {
    id: '2.2',
    title: 'Recording an Avatar Session',
    description: 'Verify recording and downloading the session video.',
    steps: [
      'Enable "Save and download video session" in the Avatar section.',
      'Start session, speak, and wait for avatar response.',
      'Stop session.',
    ],
    verification: [
      'Button shows "Processing video..." and is disabled.',
      'A `.mp4` file is downloaded containing all audio streams.',
    ],
  },
  {
    id: '2.3',
    title: 'Microphone Mute & Silence Padding',
    description: 'Verify mic muting and timeline alignment.',
    steps: [
      'Start a session.',
      'Click the Microphone button on the component to mute.',
      'Speak into the microphone.',
      'Unmute and speak.',
      'Stop session.',
    ],
    verification: [
      'The Avatar does not respond when muted.',
      'The Avatar responds when unmuted.',
      'The recorded user audio has silence in the muted segment, maintaining alignment.',
    ],
  },
  {
    id: '2.4',
    title: 'Camera & Screen Sharing',
    description: 'Verify camera and screen sharing activation.',
    steps: [
      'Start a session.',
      'Click the Camera or Screen Share button on the component.',
    ],
    verification: [
      'Permissions are requested if not already granted.',
      'Button changes state to active.',
    ],
  },
  {
    id: '3.1',
    title: '2 Agents Interaction',
    description:
      "Verify that two agents work together (e.g., one agent's greeting triggers the other).",
    steps: [
      'Start session with both avatars enabled.',
      'Avatar 1 speaks greeting.',
    ],
    verification: ['Avatar 2 responds to Avatar 1.'],
  },
  {
    id: '3.2',
    title: 'Avatar 2 Video Download',
    description: 'Verify downloading Avatar 2 video.',
    steps: [
      'Enable "Save and download video session" in Avatar 2 section.',
      'Start session and interact.',
      'Stop session.',
    ],
    verification: ['A `.mp4` file is downloaded for Avatar 2.'],
  },
  {
    id: '3.3',
    title: 'Avatar 2 Microphone Mute & Silence Padding',
    description: 'Verify mic muting and timeline alignment for Avatar 2.',
    steps: [
      'Start a session.',
      'Click the Microphone button on Avatar 2 to mute.',
      'Speak into the microphone.',
      'Unmute and speak.',
      'Stop session.',
    ],
    verification: [
      'Avatar 2 does not respond when muted.',
      'Avatar 2 responds when unmuted.',
      'The recorded user audio has silence in the muted segment, maintaining alignment.',
    ],
  },
  {
    id: '3.4',
    title: 'Avatar 2 Camera & Screen Sharing',
    description: 'Verify camera and screen sharing activation for Avatar 2.',
    steps: [
      'Start a session.',
      'Click the Camera or Screen Share button on Avatar 2.',
    ],
    verification: [
      'Permissions are requested if not already granted.',
      'Button changes state to active.',
    ],
  },
  {
    id: '4.1',
    title: 'Persistence across page reload',
    description: 'Verify settings are saved and restored.',
    steps: [
      'Change settings in the form (Size, Position, Voice).',
      'Click "Save Configuration".',
      'Reload the page.',
    ],
    verification: ['All settings are restored to the UI controls.'],
  },
  {
    id: '4.2',
    title: 'Dynamic Size & Position',
    description: 'Verify immediate update of size and position.',
    steps: ['Change Size or Position in the form while session is active.'],
    verification: [
      'The component updates its size and position on screen immediately.',
    ],
  },
  {
    id: '4.3',
    title: 'Session Resumption',
    description: 'Verify session resumption behavior.',
    steps: [
      'Ensure "Enable Session Resumption" is checked in settings.',
      'Start a session.',
      'Simulate a connection drop or check logs to verify resumption is enabled.',
    ],
    verification: [
      'The session can resume after a drop if supported by the backend.',
    ],
  },
  {
    id: '5.1',
    title: 'Combined Video & Audio Download',
    description: 'Verify FFmpeg muxing and panned audio.',
    steps: [
      'Enable "Save and download video session".',
      'Enable "Include user audio in download".',
      'Start session, speak, and wait for avatar response.',
      'Stop session.',
    ],
    verification: [
      'Button shows "Processing video..." and is disabled.',
      'A `.mp4` file is downloaded containing both tracks.',
      "Audio is panned (Left/Right) based on Avatar's position.",
    ],
  },
  {
    id: '5.2',
    title: 'Fallback on Failure',
    description: 'Verify fallback behavior when FFmpeg fails.',
    steps: [
      'Simulate a failure (e.g., block unpkg.com).',
      'Stop session with recording enabled.',
    ],
    verification: [
      'Alert appears.',
      'Two separate files (.mp4 and .webm) are downloaded.',
    ],
  },
  {
    id: '6.1',
    title: 'System Instructions (Persona)',
    description: 'Verify custom persona behavior.',
    steps: [
      'Enter a persona: "You are a pirate. Respond to everything with \'Ahoy!\'".',
      'Click "Start".',
      'Speak to the Avatar.',
    ],
    verification: ['Avatar responds in character.'],
  },
  {
    id: '6.2',
    title: 'Default Greeting',
    description: 'Verify automatic greeting on start.',
    steps: ['Enter a greeting: "Welcome aboard!".', 'Click "Start".'],
    verification: [
      'Avatar speaks "Welcome aboard!" immediately after connection.',
    ],
  },
  {
    id: '6.3',
    title: '"I\'m feeling lucky" Generation',
    description: 'Verify AI generation of persona and greeting.',
    steps: ['Click "I\'m feeling lucky" next to Persona or Greeting.'],
    verification: ['Field is populated with generated text.'],
  },
  {
    id: '6.4',
    title: 'Image Generation',
    description: 'Verify custom avatar image generation.',
    steps: [
      'Enter an image prompt or use "I\'m feeling lucky".',
      'Click "Generate".',
    ],
    verification: [
      'An image appears in the container.',
      'Applied to the avatar preview.',
    ],
  },
  {
    id: '6.5',
    title: 'Custom Avatar Creation',
    description: 'Verify camera capture and auto-improvement.',
    steps: [
      'Select "Custom" in Avatar Preset.',
      'Click "Camera".',
      'Align face and click "Capture".',
    ],
    verification: [
      'Image is captured and analyzed.',
      'New avatar image is generated and applied.',
    ],
  },
  {
    id: '7.1',
    title: 'Real-time Stats',
    description: 'Verify statistics display.',
    steps: ['Start a session.', 'Watch the "Session Statistics" panel.'],
    verification: [
      'Packets and frames counters increase.',
      'Setup duration and latency show realistic values.',
      'Average FPS is close to 24.',
    ],
  },
  {
    id: '7.2',
    title: 'Latency Visualizer',
    description: 'Verify visual latency bar.',
    steps: ['Start a session.', 'Watch the latency bar in Statistics.'],
    verification: [
      'Bar shows blue and green segments.',
      'Values are displayed inside or total on the right.',
    ],
  },
  {
    id: '8.1',
    title: 'Background Removal',
    description: 'Verify Chroma Keying.',
    steps: [
      'Use a custom avatar with solid green background.',
      'Enable Chroma Keying.',
      'Select "Green Key" and "Make Transparent".',
    ],
    verification: ['The green background disappears.'],
  },
  {
    id: '9.1',
    title: 'Google Search Grounding',
    description: 'Verify enabling search grounding.',
    steps: [
      'Enable "Enable Google Search Grounding" in Avatar settings.',
      'Start session.',
      'Ask a question that requires recent info.',
    ],
    verification: ['Avatar provides accurate, grounded answer.'],
  },
  {
    id: '10.1',
    title: 'Audio Only Mode',
    description: 'Verify operation in audio-only mode.',
    steps: [
      'Select "Audio Only" in Avatar Preset.',
      'Click "Start".',
      'Speak to the Avatar.',
    ],
    verification: [
      'Component connects successfully.',
      'Preview image is hidden.',
      'Audio animation (ripple) is visible when speaking/listening.',
      'Avatar responds with audio.',
    ],
  },
];
