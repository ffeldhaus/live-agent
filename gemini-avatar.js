class GeminiAvatar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.accessToken = null;
    this.ws = null;
    this.player = null; // For mpegts.js

    // Default styles
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./gemini-avatar.css";
    this.shadowRoot.appendChild(link);

    const container = document.createElement("div");
    container.id = "container";

    const video = document.createElement("video");
    video.id = "avatar-video";
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // Mute to allow autoplay
    container.appendChild(video);

    const previewImg = document.createElement("img");
    previewImg.id = "preview-image";
    previewImg.style.display = "none"; // Hide by default
    container.appendChild(previewImg);

    const audioAnim = document.createElement("div");
    audioAnim.className = "audio-animation";
    audioAnim.innerHTML = `
      <div class="waves">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
        <svg viewBox="0 0 24 24" style="width: 40px; height: 40px; fill: #38bdf8; z-index: 2;"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
      </div>
    `;
    container.appendChild(audioAnim);

    // Debug events
    video.onplaying = () => {
      this._log("Video element playing");
      const previewImg = this.shadowRoot.getElementById('preview-image');
      if (previewImg) previewImg.style.display = 'none';
    };
    video.onpause = () => this._log("Video element paused");
    video.onerror = () =>
      this._log("Video element error", { error: video.error }, true);
    video.onwaiting = () => this._log("Video element waiting");

    const controls = document.createElement("div");
    controls.className = "controls";

    this.micBtn = document.createElement("button");
    this.micBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
    this.micBtn.title = "Toggle Microphone";
    this.micBtn.classList.add("off"); // Start off
    this.micBtn.onclick = () => this.toggleMic();
    controls.appendChild(this.micBtn);

    this.camBtn = document.createElement("button");
    this.camBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`;
    this.camBtn.title = "Toggle Camera";
    this.camBtn.classList.add("off"); // Start off
    this.camBtn.onclick = () => this.toggleCamera();
    controls.appendChild(this.camBtn);

    this.screenBtn = document.createElement("button");
    this.screenBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/><path d="M12 9l-4 4h3v3h2v-3h3z"/></svg>`;
    this.screenBtn.title = "Toggle Screen Share";
    this.screenBtn.classList.add("off"); // Start off
    this.screenBtn.onclick = () => this.toggleScreenShare();
    controls.appendChild(this.screenBtn);

    this.muteBtn = document.createElement("button");
    this.muteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.03z"/></svg>`;
    this.muteBtn.title = "Toggle Mute";
    this.muteBtn.classList.add("off"); // Start muted
    this.muteBtn.onclick = () => this.toggleMute();
    controls.appendChild(this.muteBtn);

    this.snapshotBtn = document.createElement("button");
    this.snapshotBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 19H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.17l1.83-2h6l1.83 2H21c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2zm-9-2c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>`;
    this.snapshotBtn.title = "Save Frame as WebP";
    this.snapshotBtn.onclick = () => this.saveFrame();
    controls.appendChild(this.snapshotBtn);

    container.appendChild(controls);
    this.shadowRoot.appendChild(container);

    this.resetMediaSource();

    this.isRecordingVideo = false;
    this.recordedChunks = [];
    this.videoChunkQueue = [];
    this.messageQueue = [];
    this.processingQueue = false;
    this.isStreamingCamera = false;
    this.isSetupComplete = false;
    this.playbackAudioContext = null;
    this.nextPlaybackTime = 0;
    this.isMuted = true; // Start muted as requested
    this.isStreamingScreen = false;
    this.isPlaying = false;

    // Initialize mpegts.js if requested (legacy)
    const useMpegts = this.getAttribute("use-mpegts") === "true";
    if (typeof mpegts !== "undefined" && useMpegts) {
      this._log("Initializing mpegts.js player");

      const avatarInstance = this;
      this.mpegtsPlayer = mpegts.createPlayer(
        {
          type: "mpegts",
          isLive: true,
          url: "custom",
        },
        {
          customLoader: function (url, config) {
            this.open = (url, range) => {};
            this.close = () => {};
            avatarInstance.customVideoLoader = this;
          },
        },
      );

      this.mpegtsPlayer.attachMediaElement(video);

      // Add event listeners for debugging
      this.mpegtsPlayer.on("error", (type, detail, info) => {
        this._log("mpegts error", { type, detail, info });
      });

      this.mpegtsPlayer.on("media_info", (info) => {
        this._log("mpegts media info", info);
      });

      this.mpegtsPlayer.load();

      this.receivedBytes = 0;
      this.feedVideoData = (arrayBuffer) => {
        if (this.customVideoLoader && this.customVideoLoader.onData) {
          this.customVideoLoader.onData(arrayBuffer, this.receivedBytes);
          this.receivedBytes += arrayBuffer.byteLength;
        }
      };
    } else {
      this._log(
        "mpegts.js not found, video playback might fail in non-Safari browsers.",
      );
    }
  }

  _log(message, data = null, isImportant = false) {
    const debug = this.getAttribute("debug") === "true";
    if (debug || isImportant) {
      console.log(message, data);
      this.dispatchEvent(
        new CustomEvent("avatar-log", {
          detail: { message, data, timestamp: new Date().toISOString() },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  static get observedAttributes() {
    return [
      "oauth-client-id",
      "project-id",
      "location",
      "avatar-name",
      "size",
      "position",
      "access-token",
      "record-video",
      "debug",
      "voice",
      "language",
      "output-mode",
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "debug":
        this._log(
          `Debug logging ${newValue === "true" ? "enabled" : "disabled"}`,
          null,
          true,
        );
        break;
      case "record-video":
        this.isRecordingVideo = newValue === "true";
        this._log(
          `Video recording ${this.isRecordingVideo ? "enabled" : "disabled"}`,
        );
        break;
      case "access-token":
        this.accessToken = newValue;
        break;
      case "size":
        this.updateSize(newValue);
        break;
      case "position":
        this.updatePosition(newValue);
        break;
      case "project-id":
      case "location":
      case "avatar-name":
        if (this.ws) {
          console.log(`${name} changed, but not reconnecting automatically.`);
        }
        break;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopMic();
    this.stopVideoStreaming();

    if (this.isRecordingVideo) {
      this.downloadVideo();
    }
    
    const previewImg = this.shadowRoot.getElementById('preview-image');
    if (previewImg) {
      const avatarName = this.getAttribute('avatar-name');
      if (avatarName && avatarName !== 'AudioOnly') {
        previewImg.style.display = 'block';
      }
    }
  }

  connectedCallback() {
    // Do not auto-connect, wait for explicit Start call
    this.loadGoogleIdentityServices();

    // Enable Microphone Input by default if permission granted
    this.checkMicPermission().then((state) => {
      if (state === "granted") {
        this.startMic();
      } else {
        // Ensure UI reflects disabled state if not granted
        this.isRecording = false;
        if (this.micBtn) this.micBtn.classList.add("off");
      }
    });
  }

  updateSize(size) {
    this.style.width = size;
    if (size.endsWith("px")) {
      const width = parseFloat(size);
      const height = Math.round((width * 1280) / 704);
      this.style.height = `${height}px`;
    } else {
      this.style.height = size;
    }
  }

  updatePosition(pos) {
    const parts = pos.split("-");
    this.style.top = parts.includes("top") ? "20px" : "auto";
    this.style.bottom = parts.includes("bottom") ? "20px" : "auto";
    this.style.left = parts.includes("left") ? "20px" : "auto";
    this.style.right = parts.includes("right") ? "20px" : "auto";
  }

  loadGoogleIdentityServices() {
    if (this.accessToken) return;
    if (document.getElementById("gsi-client-script")) return;

    const script = document.createElement("script");
    script.id = "gsi-client-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleAuth();
    document.head.appendChild(script);
  }

  initGoogleAuth() {
    const clientId = this.getAttribute("oauth-client-id");
    if (!clientId) {
      console.log("No oauth-client-id provided, waiting for manual token.");
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      callback: (response) => {
        if (response.error !== undefined) {
          console.error("OAuth Error:", response);
          return;
        }
        console.log("Access token acquired");
        this.accessToken = response.access_token;
        this.tryConnect();
      },
    });

    // Trigger sign in automatically if needed, or add a button
    // For now, let's trigger it.
    this.tokenClient.requestAccessToken({ prompt: "none" }); // Try to get silently
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  resetMediaSource() {
    const video = this.shadowRoot.getElementById('avatar-video');
    if (!video) return;
    
    this._log("Resetting MediaSource");
    
    if (this.mediaSource && this.mediaSource.readyState === "open") {
      try {
        this.mediaSource.endOfStream();
      } catch (e) {}
    }
    
    this.mediaSource = new MediaSource();
    this.sourceBuffer = null;
    video.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener("sourceopen", () => {
      this._log("MediaSource opened");
      try {
        const types = [
          'video/mp4; codecs="avc1.42C01E, mp4a.40.2"',
          'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
          'video/mp4; codecs="avc1.64001E, mp4a.40.2"',
          'video/mp4; codecs="avc1.42C01E"',
          'video/mp4; codecs="avc1.42E01E"',
          'video/mp4; codecs="avc1.64001E"',
          "video/mp4",
        ];
        let added = false;
        for (const type of types) {
          if (MediaSource.isTypeSupported(type)) {
            this.sourceBuffer = this.mediaSource.addSourceBuffer(type);
            this._log("SourceBuffer added successfully", { type });
            added = true;
            break;
          }
        }
        if (!added) {
          throw new Error(
            "None of the common video/mp4 codecs are supported by this browser.",
          );
        }
        this.sourceBuffer.addEventListener("updateend", () => {
          this.processVideoQueue();
        });
      } catch (e) {
        console.error("Failed to add SourceBuffer:", e);
        this._log("Failed to add SourceBuffer", { error: e.message }, true);
      }
    });

    this.recordedChunks = [];
    this.videoChunkQueue = [];
    this.messageQueue = [];
    this.processingQueue = false;
    this.isPlaying = false;
    this.nextPlaybackTime = 0;
  }

  async tryConnect() {
    if (!this.accessToken) return;
    if (this.ws) return;

    this.resetMediaSource();

    const location = this.getAttribute("location") || "us-central1";
    const project = this.getAttribute("project-id");

    if (!project) {
      console.error("project-id is required");
      return;
    }

    const host =
      location === "global"
        ? "autopush-aiplatform.sandbox.googleapis.com"
        : `${location}-aiplatform.googleapis.com`;
    const url = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${this.accessToken}`;

    this._log("Connecting to WebSocket...", { url }, true);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._log("WebSocket Connected", null, true);
        this.sendSetup();
        this.dispatchEvent(new CustomEvent("avatar-connected"));
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      this.ws.onclose = () => {
        this._log("WebSocket Closed", null, true);
        this.ws = null;
        this.dispatchEvent(new CustomEvent("avatar-disconnected"));
      };
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
    }
  }

  sendSetup() {
    const project = this.getAttribute("project-id");
    const location = this.getAttribute("location") || "us-central1";
    const modelName = this.getAttribute("avatar-name") || "Kira";

    const voice = this.getAttribute("voice") || "kore";
    const language = this.getAttribute("language") || "en-US";

    const setupMessage = {
      setup: {
        model: `projects/${project}/locations/${location}/publishers/google/models/gemini-3.1-flash-live-preview-04-2026`,
        avatar_config: this.customAvatar ? {
          customized_avatar: this.customAvatar
        } : {
          avatar_name: modelName,
        },
        generation_config: {
          response_modalities:
            this.getAttribute("output-mode") === "audio"
              ? ["AUDIO"]
              : ["VIDEO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: { voice_name: voice },
            },
            language_code: language,
          },
        },
      },
    };

    this._log("Sending setup", setupMessage, true);
    this.ws.send(JSON.stringify(setupMessage));
  }

  sendText(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this._log("Cannot send text: WebSocket not connected");
      return;
    }
    if (!this.isSetupComplete) {
      this._log("Cannot send text: Setup not complete");
      return;
    }

    const message = {
      realtime_input: {
        text: text,
      },
    };

    this._log("Sending text content", message);
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(event) {
    this.messageQueue.push(event.data);
    this.processQueue();
  }

  async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      await this.processMessageData(data);
    }
    this.processingQueue = false;
  }

  async processMessageData(data) {
    this._log("Processing message data", {
      type: typeof data,
      isBlob: data instanceof Blob,
    });
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const response = JSON.parse(text);
        this._log("Received JSON response (as Blob)", response);
        this.handleJsonResponse(response);
      } catch (e) {
        // Not JSON, assume video chunk
        await this.handleVideoChunk(data);
      }
    } else {
      try {
        const response = JSON.parse(data);
        this._log("Received JSON response", response);
        this.handleJsonResponse(response);
      } catch (e) {
        this._log("Received raw text response", data);
      }
    }
  }

  handleJsonResponse(response) {
    if (response.setupComplete) {
      this._log("Setup complete received", response.setupComplete, true);
      this.isSetupComplete = true;
    }

    if (response.serverContent && response.serverContent.modelTurn) {
      const parts = response.serverContent.modelTurn.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
          this._log("Received audio data in JSON", {
            size: part.inlineData.data.length,
          });

          const outputMode = this.getAttribute("output-mode") || "video";
          if (outputMode === "audio") {
            this.playAudioChunk(part.inlineData.data);
          }
        }
        if (part.inlineData && part.inlineData.mimeType.startsWith("video/")) {
          this._log("Received video data in JSON", {
            size: part.inlineData.data.length,
            mimeType: part.inlineData.mimeType,
          });

          const outputMode = this.getAttribute("output-mode") || "video";
          if (outputMode === "video") {
            this.handleVideoDataChunk(
              part.inlineData.data,
              part.inlineData.mimeType,
            );
          }
        }
      }
    }
  }

  async playAudioChunk(base64Data) {
    try {
      if (!this.playbackAudioContext) {
        this.playbackAudioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        this.nextPlaybackTime = this.playbackAudioContext.currentTime;
        this.audioGainNode = this.playbackAudioContext.createGain();
        this.audioGainNode.connect(this.playbackAudioContext.destination);
        this.audioGainNode.gain.value = this.isMuted ? 0 : 1;
      }

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const arrayBuffer = bytes.buffer;
      const pcmData = new Int16Array(arrayBuffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }

      const buffer = this.playbackAudioContext.createBuffer(
        1,
        floatData.length,
        24000,
      ); // Output is 24kHz
      buffer.copyToChannel(floatData, 0);

      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioGainNode); // Connect to gain node

      const startTime = Math.max(
        this.playbackAudioContext.currentTime,
        this.nextPlaybackTime,
      );
      source.start(startTime);
      this.nextPlaybackTime = startTime + buffer.duration;
    } catch (e) {
      console.error("Failed to play audio chunk:", e);
      this._log("Failed to play audio chunk", { error: e.message }, true);
    }
  }

  async handleVideoDataChunk(base64Data, mimeType) {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const arrayBuffer = bytes.buffer;

      // Log MP4 box type for debugging
      if (arrayBuffer.byteLength >= 8) {
        const view = new DataView(arrayBuffer);
        const type = String.fromCharCode(
          view.getUint8(4),
          view.getUint8(5),
          view.getUint8(6),
          view.getUint8(7),
        );
        this._log("Video chunk box type (from JSON)", {
          type,
          size: arrayBuffer.byteLength,
        });
      }

      if (this.isRecordingVideo) {
        this.recordedChunks.push(bytes); // Save the binary chunk
      }

      if (this.sourceBuffer) {
        this.videoChunkQueue.push(arrayBuffer);
        this.processVideoQueue();
      } else if (this.feedVideoData) {
        this._log("Feeding video data to mpegts player", {
          bufferSize: arrayBuffer.byteLength,
        });
        this.feedVideoData(arrayBuffer);
      }
    } catch (e) {
      console.error("Failed to handle video data chunk:", e);
      this._log(
        "Failed to handle video data chunk",
        { error: e.message },
        true,
      );
    }
  }

  processVideoQueue() {
    if (
      !this.sourceBuffer ||
      this.sourceBuffer.updating ||
      this.videoChunkQueue.length === 0
    ) {
      return;
    }
    if (this.mediaSource.readyState !== "open") {
      this._log("MediaSource not open, skipping append", {
        readyState: this.mediaSource.readyState,
      });
      return;
    }
    const chunk = this.videoChunkQueue.shift();
    try {
      this.sourceBuffer.appendBuffer(chunk);
      this._log("Appended buffer to SourceBuffer", {
        remaining: this.videoChunkQueue.length,
      });

      // Ensure video is playing
      const video = this.shadowRoot.querySelector("video");
      if (video && video.paused) {
        video
          .play()
          .catch((e) =>
            this._log("Auto-play prevented or failed", { error: e.message }),
          );
      }
    } catch (e) {
      console.error("Failed to append buffer:", e);
      this._log("Failed to append buffer", { error: e.message }, true);
    }
  }

  async handleVideoChunk(blob) {
    this._log("Processing video chunk", { size: blob.size });

    if (this.isRecordingVideo) {
      this.recordedChunks.push(blob);
    }

    const arrayBuffer = await blob.arrayBuffer();

    // Log MP4 box type for debugging
    if (arrayBuffer.byteLength >= 8) {
      const view = new DataView(arrayBuffer);
      const type = String.fromCharCode(
        view.getUint8(4),
        view.getUint8(5),
        view.getUint8(6),
        view.getUint8(7),
      );
      this._log("Video chunk box type", { type, size: arrayBuffer.byteLength });
    }

    if (this.sourceBuffer) {
      this.videoChunkQueue.push(arrayBuffer);
      this.processVideoQueue();
    } else if (this.feedVideoData) {
      this._log("Feeding video data to mpegts player", {
        bufferSize: arrayBuffer.byteLength,
      });
      this.feedVideoData(arrayBuffer);
    }
  }

  downloadVideo() {
    if (this.recordedChunks.length === 0) {
      this._log("No video chunks recorded.");
      return;
    }
    this._log(`Downloading video with ${this.recordedChunks.length} chunks`);
    const blob = new Blob(this.recordedChunks, { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Replace colons with hyphens to avoid filename issues on some OS
    const filename = `avatar_session_${new Date().toISOString().replace(/:/g, "-")}.mp4`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.recordedChunks = [];
  }

  startVideoStreaming(stream) {
    this.videoInputStream = stream;
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    this.videoInputInterval = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const maxDim = 768;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];

        if (
          this.isSetupComplete &&
          this.ws &&
          this.ws.readyState === WebSocket.OPEN
        ) {
          const message = {
            realtime_input: {
              video: {
                mime_type: "image/jpeg",
                data: base64Data,
              },
            },
          };
          this.ws.send(JSON.stringify(message));
          this._log("Sent video frame");
        }
      }
    }, 1000);
  }

  stopVideoStreaming() {
    if (this.videoInputInterval) {
      clearInterval(this.videoInputInterval);
      this.videoInputInterval = null;
    }
    if (this.videoInputStream) {
      this.videoInputStream.getTracks().forEach((track) => track.stop());
      this.videoInputStream = null;
    }
    this._log("Video streaming stopped");
  }

  async toggleCamera() {
    if (this.isStreamingCamera) {
      this.stopVideoStreaming();
      this.isStreamingCamera = false;
      this.camBtn.classList.add("off");
      return;
    }
    if (this.isStreamingScreen) {
      await this.toggleScreenShare();
    }
    try {
      this._log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.startVideoStreaming(stream);
      this.isStreamingCamera = true;
      this.camBtn.classList.remove("off");
      this._log("Camera streaming started");
    } catch (err) {
      console.error("Failed to get camera:", err);
      this._log("Camera access denied or failed");
    }
  }

  async toggleScreenShare() {
    if (this.isStreamingScreen) {
      this.stopVideoStreaming();
      this.isStreamingScreen = false;
      this.screenBtn.classList.add("off");
      return;
    }
    if (this.isStreamingCamera) {
      await this.toggleCamera();
    }
    try {
      this._log("Requesting screen share access...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      this.startVideoStreaming(stream);
      this.isStreamingScreen = true;
      this.screenBtn.classList.remove("off");
      this._log("Screen sharing started");

      stream.getVideoTracks()[0].onended = () => {
        this.stopVideoStreaming();
        this.isStreamingScreen = false;
      };
    } catch (err) {
      console.error("Failed to get screen share:", err);
      this._log("Screen share access denied or failed");
    }
  }

  setPreview(avatarName) {
    const previewImg = this.shadowRoot.getElementById('preview-image');
    if (!previewImg) return;
    
    if (avatarName === 'AudioOnly' || !avatarName) {
      previewImg.style.display = 'none';
      return;
    }
    
    const filename = avatarName.toLowerCase() + '.webp';
    previewImg.src = `./${filename}`;
    previewImg.style.display = 'block';
    this._log("Set preview for " + avatarName);
  }

  saveFrame() {
    const video = this.shadowRoot.getElementById('avatar-video');
    if (!video || video.readyState < 2) {
      this._log("Video not ready for snapshot", {}, true);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const dataURL = canvas.toDataURL('image/webp', 0.8);
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `avatar_frame_${new Date().toISOString()}.webp`;
      a.click();
      this._log("Frame saved as WebP");
    } catch (e) {
      console.error("Failed to save frame:", e);
      this._log("Failed to save frame", { error: e.message }, true);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.muteBtn.classList.toggle("off", this.isMuted);
    this._log(this.isMuted ? "Audio muted" : "Audio unmuted");

    const video = this.shadowRoot.querySelector("video");
    if (video) {
      video.muted = this.isMuted;
    }

    if (!this.playbackAudioContext) {
      this.playbackAudioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      this.nextPlaybackTime = this.playbackAudioContext.currentTime;
      this.audioGainNode = this.playbackAudioContext.createGain();
      this.audioGainNode.connect(this.playbackAudioContext.destination);
    }

    this.audioGainNode.gain.value = this.isMuted ? 0 : 1;

    if (
      !this.isMuted &&
      this.playbackAudioContext &&
      this.playbackAudioContext.state === "suspended"
    ) {
      this.playbackAudioContext.resume();
    }
  }

  async checkMicPermission() {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone",
      });
      return permissionStatus.state;
    } catch (e) {
      // Firefox might not support 'microphone' in permissions.query
      return "prompt";
    }
  }

  async toggleMic() {
    if (this.isRecording) {
      this.stopMic();
    } else {
      await this.startMic();
    }
  }

  async startMic() {
    try {
      this._log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create AudioContext with target sample rate of 16kHz
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);

      // Use AudioWorklet instead of deprecated ScriptProcessor
      const workletCode = `
        class AudioProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = new Float32Array(2048);
            this.offset = 0;
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input[0]) {
              const inputChannel = input[0];
              for (let i = 0; i < inputChannel.length; i++) {
                this.buffer[this.offset++] = inputChannel[i];
                if (this.offset >= this.buffer.length) {
                  this.port.postMessage(this.buffer);
                  this.buffer = new Float32Array(2048);
                  this.offset = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor('audio-processor', AudioProcessor);
      `;

      const blob = new Blob([workletCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);

      this.processor = new AudioWorkletNode(
        this.audioContext,
        "audio-processor",
      );

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.port.onmessage = (e) => {
        const inputData = e.data;
        const pcmData = this.float32ToInt16(inputData);
        const base64Data = this.arrayBufferToBase64(pcmData.buffer);

        if (
          this.isSetupComplete &&
          this.ws &&
          this.ws.readyState === WebSocket.OPEN
        ) {
          const message = {
            realtimeInput: {
              audio: {
                mimeType: "audio/pcm;rate=16000",
                data: base64Data,
              },
            },
          };
          this.ws.send(JSON.stringify(message));
        }
      };

      this.isRecording = true;
      this.micBtn.classList.remove("off");
      this._log("Microphone recording started");
      this.micStream = stream;
    } catch (err) {
      console.error("Failed to get microphone:", err);
      this._log("Microphone access denied or failed");
      this.micBtn.classList.add("off");
      this.isRecording = false;
    }
  }

  stopMic() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.isRecording = false;
    this.micBtn.classList.add("off");
    this._log("Microphone recording stopped");
  }

  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

customElements.define("gemini-avatar", GeminiAvatar);
