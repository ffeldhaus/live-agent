import mpegts from 'mpegts.js';
// @ts-ignore
import styles from './styles/gemini-avatar.css?inline';

// Asset URLs
const assets: Record<string, string> = {
  Kira: new URL('./assets/kira.webp', import.meta.url).href,
  Ingrid: new URL('./assets/ingrid.webp', import.meta.url).href,
  Vera: new URL('./assets/vera.webp', import.meta.url).href,
  Jay: new URL('./assets/jay.webp', import.meta.url).href,
  Paul: new URL('./assets/paul.webp', import.meta.url).href,
  Sam: new URL('./assets/sam.webp', import.meta.url).href,
  Piper: new URL('./assets/piper.webp', import.meta.url).href,
  Carmen: new URL('./assets/carmen.webp', import.meta.url).href,
  Kai: new URL('./assets/kai.webp', import.meta.url).href,
  Leo: new URL('./assets/leo.webp', import.meta.url).href,
  Ben: new URL('./assets/ben.webp', import.meta.url).href,
};

export class GeminiAvatar extends HTMLElement {
  private accessToken: string | null = null;
  private ws: WebSocket | null = null;
  private player: any = null; // For mpegts.js
  private mpegtsPlayer: any = null;
  private customVideoLoader: any = null;
  private receivedBytes = 0;
  private feedVideoData: ((arrayBuffer: ArrayBuffer) => void) | null = null;

  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private videoChunkQueue: ArrayBuffer[] = [];
  private messageQueue: any[] = [];
  private processingQueue = false;
  private isSetupComplete = false;
  private playbackAudioContext: AudioContext | null = null;
  private audioGainNode: GainNode | null = null;
  private nextPlaybackTime = 0;
  private recordedChunks: Blob[] = [];

  // State
  private isRecordingVideo = false;
  private isMuted = true;
  private isPlaying = false;
  private isRecording = false; // For mic

  // UI Elements
  private container!: HTMLDivElement;
  private videoEl!: HTMLVideoElement;
  private previewImg!: HTMLImageElement;
  private audioAnim!: HTMLDivElement;
  private micBtn!: HTMLButtonElement;
  private camBtn!: HTMLButtonElement;
  private screenBtn!: HTMLButtonElement;
  private muteBtn!: HTMLButtonElement;
  private snapshotBtn!: HTMLButtonElement;

  // Media streams
  private micStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private videoInputStream: MediaStream | null = null;
  private videoInputInterval: any = null;
  private micRecorder: MediaRecorder | null = null;
  private micChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private processor: AudioWorkletNode | null = null;
  private isStreamingCamera = false;
  private isStreamingScreen = false;

  public customAvatar: { image_data: string; image_mime_type: string } | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.loadGoogleIdentityServices();
    this.checkMicPermission().then((state) => {
      if (state === "granted") {
        this.startMic();
      } else {
        this.isRecording = false;
        if (this.micBtn) this.micBtn.classList.add("off");
      }
    });
    this.updateSize(this.getAttribute("size") || "300px");
    this.updatePosition(this.getAttribute("position") || "top-right");
    this.setPreview(this.getAttribute("avatar-name") || "Kira");
  }

  disconnectedCallback() {
    this.stop();
  }

  private render() {
    if (!this.shadowRoot) return;

    // Inject styles
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    this.shadowRoot.appendChild(styleEl);

    this.container = document.createElement("div");
    this.container.id = "container";

    this.videoEl = document.createElement("video");
    this.videoEl.id = "avatar-video";
    this.videoEl.autoplay = true;
    this.videoEl.playsInline = true;
    this.videoEl.muted = true; // Mute to allow autoplay
    this.container.appendChild(this.videoEl);

    this.previewImg = document.createElement("img");
    this.previewImg.id = "preview-image";
    this.container.appendChild(this.previewImg);

    this.audioAnim = document.createElement("div");
    this.audioAnim.className = "audio-animation";
    this.audioAnim.innerHTML = `
      <div class="waves">
        <div class="wave"></div>
        <div class="wave"></div>
        <div class="wave"></div>
        <svg viewBox="0 0 24 24" style="width: 40px; height: 40px; fill: #38bdf8; z-index: 2;"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
      </div>
    `;
    this.container.appendChild(this.audioAnim);

    // Debug events
    this.videoEl.onplaying = () => {
      this._log("Video element playing");
      this.previewImg.style.display = 'none';
    };
    this.videoEl.onpause = () => this._log("Video element paused");
    this.videoEl.onerror = () => this._log("Video element error", { error: this.videoEl.error }, true);
    this.videoEl.onwaiting = () => this._log("Video element waiting");

    const controls = document.createElement("div");
    controls.className = "controls";

    this.micBtn = this.createButton("Toggle Microphone", `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`, () => this.toggleMic());
    this.micBtn.classList.add("off");
    controls.appendChild(this.micBtn);

    this.camBtn = this.createButton("Toggle Camera", `<svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>`, () => this.toggleCamera());
    this.camBtn.classList.add("off");
    controls.appendChild(this.camBtn);

    this.screenBtn = this.createButton("Toggle Screen Share", `<svg viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/><path d="M12 9l-4 4h3v3h2v-3h3z"/></svg>`, () => this.toggleScreenShare());
    this.screenBtn.classList.add("off");
    controls.appendChild(this.screenBtn);

    this.muteBtn = this.createButton("Toggle Mute", `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.03z"/></svg>`, () => this.toggleMute());
    this.muteBtn.classList.add("off");
    controls.appendChild(this.muteBtn);

    this.snapshotBtn = this.createButton("Save Frame as WebP", `<svg viewBox="0 0 24 24"><path d="M21 19H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.17l1.83-2h6l1.83 2H21c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2zm-9-2c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>`, () => this.saveFrame());
    controls.appendChild(this.snapshotBtn);

    this.container.appendChild(controls);
    this.shadowRoot.appendChild(this.container);

    this.resetMediaSource();
    this.initMpegts();
  }

  private createButton(title: string, iconSVG: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = iconSVG;
    btn.title = title;
    btn.onclick = onClick;
    return btn;
  }

  private initMpegts() {
    const useMpegts = this.getAttribute("use-mpegts") === "true";
    if (useMpegts) {
      this._log("Initializing mpegts.js player");
      const avatarInstance = this;
      this.mpegtsPlayer = mpegts.createPlayer(
        {
          type: "mpegts",
          isLive: true,
          url: "custom",
        },
        {
          customLoader: function (url: any, config: any) {
            this.open = (url: any, range: any) => {};
            this.close = () => {};
            avatarInstance.customVideoLoader = this;
          },
        },
      );

      this.mpegtsPlayer.attachMediaElement(this.videoEl);
      this.mpegtsPlayer.on("error", (type: any, detail: any, info: any) => {
        this._log("mpegts error", { type, detail, info });
      });
      this.mpegtsPlayer.load();

      this.receivedBytes = 0;
      this.feedVideoData = (arrayBuffer: ArrayBuffer) => {
        if (this.customVideoLoader && this.customVideoLoader.onData) {
          this.customVideoLoader.onData(arrayBuffer, this.receivedBytes);
          this.receivedBytes += arrayBuffer.byteLength;
        }
      };
    }
  }

  private _log(message: string, data: any = null, isImportant = false) {
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

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case "debug":
        this._log(`Debug logging ${newValue === "true" ? "enabled" : "disabled"}`, null, true);
        break;
      case "record-video":
        this.isRecordingVideo = newValue === "true";
        this._log(`Video recording ${this.isRecordingVideo ? "enabled" : "disabled"}`);
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
      case "avatar-name":
        this.setPreview(newValue);
        break;
    }
  }

  public setPreview(avatarName: string) {
    if (!this.previewImg) return;
    
    if (avatarName === 'AudioOnly' || avatarName === 'Custom') {
      this.previewImg.style.display = 'none';
      return;
    }

    const url = assets[avatarName];
    if (url) {
      this.previewImg.src = url;
      this.previewImg.style.display = 'block';
    } else {
      this.previewImg.style.display = 'none';
    }
  }

  private updateSize(size: string) {
    if (!this.container) return;
    this.style.width = size;
    if (size.endsWith("px")) {
      const width = parseFloat(size);
      const height = Math.round((width * 1280) / 704);
      this.style.height = `${height}px`;
    } else {
      this.style.height = size;
    }
  }

  private updatePosition(pos: string) {
    const parts = pos.split("-");
    this.style.top = parts.includes("top") ? "20px" : "auto";
    this.style.bottom = parts.includes("bottom") ? "20px" : "auto";
    this.style.left = parts.includes("left") ? "20px" : "auto";
    this.style.right = parts.includes("right") ? "20px" : "auto";
  }

  // Public API
  public async start() {
    this._log("Starting session...");
    
    if (this.isRecordingVideo && this.micStream) {
      this.micChunks = [];
      this.micRecorder = new MediaRecorder(this.micStream);
      this.micRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.micChunks.push(e.data);
        }
      };
      this.micRecorder.start();
      this._log("Microphone recording started");
    }
    
    await this.tryConnect();
  }

  public stop() {
    this._log("Stopping session...");
    if (this.micRecorder && this.micRecorder.state !== 'inactive') {
      this.micRecorder.stop();
      this._log("Microphone recording stopped");
    }
    this.disconnect();
  }

  public mute() {
    this.isMuted = true;
    if (this.audioGainNode) {
      this.audioGainNode.gain.value = 0;
    }
    if (this.videoEl) {
      this.videoEl.muted = true;
    }
    if (this.muteBtn) this.muteBtn.classList.add("off");
  }

  public unmute() {
    this.isMuted = false;
    if (!this.playbackAudioContext) {
      this.playbackAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.nextPlaybackTime = this.playbackAudioContext.currentTime;
      this.audioGainNode = this.playbackAudioContext.createGain();
      this.audioGainNode.connect(this.playbackAudioContext.destination);
    }
    this.audioGainNode.gain.value = 1;
    if (this.playbackAudioContext.state === "suspended") {
      this.playbackAudioContext.resume();
    }
    if (this.videoEl) {
      this.videoEl.muted = false;
    }
    if (this.muteBtn) this.muteBtn.classList.remove("off");
  }

  public sendMessage(text: string) {
    this.sendText(text);
  }

  public getSessionFiles() {
    const videoBlob = new Blob(this.recordedChunks, { type: "video/mp4" });
    const audioBlob = new Blob(this.micChunks, { type: "audio/webm" });
    return { videoBlob, audioBlob };
  }

  public get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Internal implementation details (adapted from original JS)

  private async checkMicPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (e) {
      return 'prompt';
    }
  }

  private async startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.micStream);

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

      this.processor = new AudioWorkletNode(this.audioContext, "audio-processor");
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.port.onmessage = (e) => {
        const inputData = e.data;
        const pcmData = this.float32ToInt16(inputData);
        const base64Data = this.arrayBufferToBase64(pcmData.buffer);

        if (this.isSetupComplete && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const message = { realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: base64Data } } };
          this.ws.send(JSON.stringify(message));
        }
      };

      this.isRecording = true;
      if (this.micBtn) this.micBtn.classList.remove("off");
      this._log("Microphone started");
      

    } catch (e) {
      console.error("Failed to start mic:", e);
      this.isRecording = false;
      if (this.micBtn) this.micBtn.classList.add("off");
    }
  }

  private stopMic() {
    if (this.processor) this.processor.disconnect();
    if (this.audioContext) this.audioContext.close();

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.isRecording = false;
    if (this.micBtn) this.micBtn.classList.add("off");
  }

  private toggleMic() {
    if (this.isRecording) {
      this.stopMic();
    } else {
      this.startMic();
    }
  }

  private toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  private startVideoStreaming(stream: MediaStream) {
    this.videoInputStream = stream;
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    this.videoInputInterval = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && ctx) {
        canvas.width = Math.min(video.videoWidth, 768);
        canvas.height = (canvas.width * video.videoHeight) / video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
        if (this.isSetupComplete && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const message = { realtimeInput: { video: { mimeType: "image/jpeg", data: base64Data } } };
          this.ws.send(JSON.stringify(message));
        }
      }
    }, 1000);
  }

  private stopVideoStreaming() {
    if (this.videoInputInterval) clearInterval(this.videoInputInterval);
    if (this.videoInputStream) this.videoInputStream.getTracks().forEach((track) => track.stop());
    this.videoInputStream = null;
    this._log("Video streaming stopped");
  }

  private async toggleCamera() {
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

  private async toggleScreenShare() {
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
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
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

  private saveFrame() {
    if (!this.videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = this.videoEl.videoWidth;
    canvas.height = this.videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(this.videoEl, 0, 0);
      const dataURL = canvas.toDataURL('image/webp');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `avatar_snapshot_${new Date().toISOString()}.webp`;
      a.click();
    }
  }

  private loadGoogleIdentityServices() {
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

  private initGoogleAuth() {
    const clientId = this.getAttribute("oauth-client-id");
    if (!clientId) return;

    // @ts-ignore
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      callback: (response: any) => {
        if (response.error !== undefined) {
          console.error("OAuth Error:", response);
          return;
        }
        this.accessToken = response.access_token;
        this.tryConnect();
      },
    });

    // @ts-ignore
    this.tokenClient.requestAccessToken({ prompt: "none" });
  }

  private resetMediaSource() {
    if (!this.videoEl) return;
    this._log("Resetting MediaSource");
    
    if (this.mediaSource && this.mediaSource.readyState === "open") {
      try {
        this.mediaSource.endOfStream();
      } catch (e) {}
    }
    
    this.mediaSource = new MediaSource();
    this.sourceBuffer = null;
    this.videoEl.src = URL.createObjectURL(this.mediaSource);

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
            this.sourceBuffer = this.mediaSource!.addSourceBuffer(type);
            this._log("SourceBuffer added successfully", { type });
            added = true;
            break;
          }
        }
        if (!added) {
          throw new Error("None of the common video/mp4 codecs are supported by this browser.");
        }
        this.sourceBuffer!.addEventListener("updateend", () => this.processVideoQueue());
      } catch (e) {
        console.error("Failed to add SourceBuffer:", e);
      }
    });

    this.recordedChunks = [];
    this.videoChunkQueue = [];
    this.messageQueue = [];
    this.processingQueue = false;
    this.isPlaying = false;
    this.nextPlaybackTime = 0;
  }

  private async tryConnect() {
    if (!this.accessToken) {
      this._log("No access token available. Cannot connect.", null, true);
      return;
    }
    if (this.ws) return;

    this.resetMediaSource();

    const location = this.getAttribute("location") || "us-central1";
    const project = this.getAttribute("project-id");

    if (!project) {
      console.error("project-id is required");
      return;
    }

    const host = location === "global" ? "autopush-aiplatform.sandbox.googleapis.com" : `${location}-aiplatform.googleapis.com`;
    const url = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${this.accessToken}`;

    this._log("Connecting to WebSocket...", { url }, true);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._log("WebSocket Connected", null, true);
        this.sendSetup();
        this.dispatchEvent(new CustomEvent("avatar-connected"));
      };

      this.ws.onmessage = (event) => this.handleMessage(event);

      this.ws.onerror = (error) => console.error("WebSocket Error:", error);

      this.ws.onclose = () => {
        this._log("WebSocket Closed", null, true);
        this.ws = null;
        this.dispatchEvent(new CustomEvent("avatar-disconnected"));
      };
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
    }
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopMic();
    // Stop other streams...
  }

  private sendSetup() {
    const project = this.getAttribute("project-id");
    const location = this.getAttribute("location") || "us-central1";
    const modelName = this.getAttribute("avatar-name") || "Kira";
    const voice = this.getAttribute("voice") || "kore";
    const language = this.getAttribute("language") || "en-US";

    const setupMessage = {
      setup: {
        model: `projects/${project}/locations/${location}/publishers/google/models/gemini-3.1-flash-live-preview-04-2026`,
        avatar_config: (modelName === 'Custom' && this.customAvatar) ? {
          customized_avatar: this.customAvatar
        } : {
          avatar_name: modelName,
        },
        generation_config: {
          response_modalities: this.getAttribute("output-mode") === "audio" ? ["AUDIO"] : ["VIDEO"],
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
    this.ws?.send(JSON.stringify(setupMessage));
  }

  private sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const message = {
      realtime_input: {
        text: text,
      },
    };
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(event: MessageEvent) {
    this.messageQueue.push(event.data);
    this.processQueue();
  }

  private async processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      await this.processMessageData(data);
    }
    this.processingQueue = false;
  }

  private async processMessageData(data: any) {
    if (!this.isConnected) {
      this._log("Ignoring message, not connected");
      return;
    }
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const response = JSON.parse(text);
        this.handleJsonResponse(response);
      } catch (e) {
        // Assume video chunk
        await this.handleVideoChunk(data);
      }
    } else {
      try {
        const response = JSON.parse(data);
        this.handleJsonResponse(response);
      } catch (e) {
        this._log("Received raw text response", data);
      }
    }
  }

  private handleJsonResponse(response: any) {
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

  private async playAudioChunk(base64Data: string) {
    try {
      this._log("playAudioChunk called", { isMuted: this.isMuted, size: base64Data.length });
      if (!this.playbackAudioContext) {
        this.playbackAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.nextPlaybackTime = this.playbackAudioContext.currentTime;
        this.audioGainNode = this.playbackAudioContext.createGain();
        this.audioGainNode.connect(this.playbackAudioContext.destination);
      }

      this.audioGainNode.gain.value = this.isMuted ? 0 : 1;
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      const arrayBuffer = bytes.buffer;
      const pcmData = new Int16Array(arrayBuffer);
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768.0;

      const buffer = this.playbackAudioContext.createBuffer(1, floatData.length, 24000);
      buffer.copyToChannel(floatData, 0);

      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioGainNode);

      const startTime = Math.max(this.playbackAudioContext.currentTime, this.nextPlaybackTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + buffer.duration;
    } catch (e: any) {
      console.error("Failed to play audio chunk:", e);
      this._log("Failed to play audio chunk", { error: e.message }, true);
    }
  }

  private async handleVideoDataChunk(base64Data: string, mimeType: string) {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      const arrayBuffer = bytes.buffer;
      if (this.isRecordingVideo) this.recordedChunks.push(new Blob([arrayBuffer], { type: mimeType }));

      if (this.sourceBuffer) {
        this.videoChunkQueue.push(arrayBuffer);
        this.processVideoQueue();
      } else if (this.feedVideoData) {
        this.feedVideoData(arrayBuffer);
      }
    } catch (e: any) {
      console.error("Failed to handle video data chunk:", e);
      this._log("Failed to handle video data chunk", { error: e.message }, true);
    }
  }

  private async handleVideoChunk(blob: Blob) {
    if (this.isRecordingVideo) this.recordedChunks.push(blob);
    const arrayBuffer = await blob.arrayBuffer();
    if (this.sourceBuffer) {
      this.videoChunkQueue.push(arrayBuffer);
      this.processVideoQueue();
    } else if (this.feedVideoData) {
      this.feedVideoData(arrayBuffer);
    }
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  }

  private processVideoQueue() {
    if (!this.sourceBuffer || this.sourceBuffer.updating || this.videoChunkQueue.length === 0) return;
    if (this.mediaSource?.readyState !== "open") {
      this._log("MediaSource not open, skipping append", { readyState: this.mediaSource?.readyState });
      return;
    }
    const chunk = this.videoChunkQueue.shift();
    if (chunk) {
      try {
        this.sourceBuffer.appendBuffer(chunk);
        if (this.videoEl && this.videoEl.paused) {
          this.videoEl.play().catch((e) => this._log("Auto-play prevented or failed", { error: e.message }));
        }
      } catch (e) {
        console.error("Failed to append buffer:", e);
      }
    }
  }
}

customElements.define('gemini-avatar', GeminiAvatar);
