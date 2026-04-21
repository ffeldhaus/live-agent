// @ts-ignore
import styles from './styles/gemini-avatar.css?inline';
import { AVATAR_PRESETS } from './constants';
import { GeminiLiveClient } from './gemini-live-client';
import { MediaManager } from './media-manager';

export class GeminiAvatar extends HTMLElement {
  private client: GeminiLiveClient | null = null;
  private mediaManager: MediaManager | null = null;
  private tokenClient: any = null;

  private accessToken: string | null = null;

  // State
  private isRecordingVideo = false;
  private isMuted = false;
  private isPlaying = false;
  private isRecording = false; // For mic
  private isMicMuted = false;
  private selectedAudioDeviceId = '';
  private selectedVideoDeviceId = '';
  private receivedFirstVideoFrame = false;
  private chromaKeyLoopId: number | null = null;
  
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
  private settingsBtn!: HTMLButtonElement;
  private settingsModal!: HTMLDivElement;
  private displayCanvas: HTMLCanvasElement | null = null;
  private transcriptArea: HTMLDivElement | null = null;
  private chatContainer: HTMLDivElement | null = null;
  private chatInput: HTMLInputElement | null = null;

  // Statistics
  private startTime: number | null = null;
  private setupCompleteTime: number | null = null;
  private firstFrameTime: number | null = null;
  private packetsReceived = 0;
  private audioChunksSent = 0;
  private videoFramesSent = 0;
  private videoFramesReceived = 0;
  
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
    const autoRequest = this.getAttribute("mic-auto-request") !== "false";
    if (autoRequest) {
      this.checkMicPermission().then((state) => {
        if (state === "granted") {
          const audioChunkSize = this.getAttribute("audio-chunk-size") || "2048";
          this.mediaManager?.startMic(audioChunkSize).then(started => {
              if (started) this.isRecording = true;
          });
        } else {
          this.isRecording = false;
          if (this.micBtn) this.micBtn.classList.add("off");
        }
      });
    } else {
      this.isMicMuted = true;
      if (this.micBtn) this.micBtn.classList.add("off");
    }
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
    this.videoEl.muted = false; // Unmuted by default

    this.displayCanvas = document.createElement("canvas");
    this.displayCanvas.id = "avatar-canvas";
    this.displayCanvas.style.display = "none"; // Hidden by default
    this.container.appendChild(this.displayCanvas);
    this.container.appendChild(this.videoEl);

    this.transcriptArea = document.createElement("div");
    this.transcriptArea.id = "transcript-area";
    this.transcriptArea.style.display = "none"; // Hidden by default
    this.container.appendChild(this.transcriptArea);

    this.chatContainer = document.createElement("div");
    this.chatContainer.id = "chat-container";
    this.chatContainer.style.display = "none"; // Hidden by default
    
    this.chatInput = document.createElement("input");
    this.chatInput.id = "chat-input";
    this.chatInput.placeholder = "Type a message...";
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = this.chatInput!.value;
        if (text) {
          this.sendMessage(text);
          this.chatInput!.value = '';
        }
      }
    });
    
    this.chatContainer.appendChild(this.chatInput);
    this.container.appendChild(this.chatContainer);

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
    controls.appendChild(this.muteBtn);

    this.snapshotBtn = this.createButton("Save Frame as WebP", `<svg viewBox="0 0 24 24"><path d="M21 19H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4.17l1.83-2h6l1.83 2H21c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2zm-9-2c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/></svg>`, () => this.saveFrame());
    controls.appendChild(this.snapshotBtn);
    
    this.settingsBtn = this.createButton("Settings", `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84a.483.483 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`, () => this.toggleSettings());
    controls.appendChild(this.settingsBtn);
    
    this.settingsModal = document.createElement("div");
    this.settingsModal.className = "settings-modal";
    this.settingsModal.innerHTML = `
      <button class="close-btn">&times;</button>
      <h3>Device Settings</h3>
      <label for="audioDeviceSelect">Microphone</label>
      <select id="audioDeviceSelect"></select>
      <label for="videoDeviceSelect">Camera</label>
      <select id="videoDeviceSelect"></select>
    `;
    this.container.appendChild(this.settingsModal);
    
    const closeBtn = this.settingsModal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleSettings());
    }
    
    this.updateControlsVisibility(this.getAttribute("visible-controls") || "mic,camera,screen,mute,settings");

    this.container.appendChild(controls);
    this.shadowRoot.appendChild(this.container);

    this.mediaManager = new MediaManager(this.videoEl);
    this.mediaManager.onAudioChunk = (base64) => this.client?.sendAudio(base64);
    this.mediaManager.onVideoFrame = (base64) => this.client?.sendVideo(base64);
    this.mediaManager.onFirstFrame = () => {
        this.receivedFirstVideoFrame = true;
        this.firstFrameTime = new Date().getTime();
        this.previewImg.style.display = 'none';
    };
    this.mediaManager.onLog = (msg, data, imp) => this._log(msg, data, imp);
    
    const useMpegts = this.getAttribute("use-mpegts") === "true";
    this.mediaManager.init(useMpegts);
  }

  private updateControlsVisibility(visibleControls: string) {
    const list = visibleControls.split(',').map(s => s.trim());
    if (this.micBtn) this.micBtn.style.display = list.includes('mic') ? 'flex' : 'none';
    if (this.camBtn) this.camBtn.style.display = list.includes('camera') ? 'flex' : 'none';
    if (this.screenBtn) this.screenBtn.style.display = list.includes('screen') ? 'flex' : 'none';
    if (this.muteBtn) this.muteBtn.style.display = list.includes('mute') ? 'flex' : 'none';
    if (this.snapshotBtn) this.snapshotBtn.style.display = list.includes('snapshot') ? 'flex' : 'none';
    if (this.settingsBtn) this.settingsBtn.style.display = list.includes('settings') ? 'flex' : 'none';
  }

  private createButton(title: string, iconSVG: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.innerHTML = iconSVG;
    btn.title = title;
    btn.onclick = onClick;
    return btn;
  }

  private toggleSettings() {
    const isActive = this.settingsModal.classList.toggle('active');
    if (isActive) {
        this.populateDevices();
    }
  }
  
  private async populateDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioSelect = this.settingsModal.querySelector('#audioDeviceSelect') as HTMLSelectElement;
      const videoSelect = this.settingsModal.querySelector('#videoDeviceSelect') as HTMLSelectElement;
      
      if (audioSelect) {
          audioSelect.innerHTML = '';
          devices.filter(d => d.kind === 'audioinput').forEach(d => {
              const opt = document.createElement('option');
              opt.value = d.deviceId;
              opt.textContent = d.label || `Mic ${audioSelect.options.length + 1}`;
              audioSelect.appendChild(opt);
          });
          audioSelect.value = this.selectedAudioDeviceId;
          audioSelect.onchange = () => {
              this.selectedAudioDeviceId = audioSelect.value;
          };
      }
      
      if (videoSelect) {
          videoSelect.innerHTML = '';
          devices.filter(d => d.kind === 'videoinput').forEach(d => {
              const opt = document.createElement('option');
              opt.value = d.deviceId;
              opt.textContent = d.label || `Camera ${videoSelect.options.length + 1}`;
              videoSelect.appendChild(opt);
          });
          videoSelect.value = this.selectedVideoDeviceId;
          videoSelect.onchange = () => {
              this.selectedVideoDeviceId = videoSelect.value;
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
      "mic-auto-request",
      "visible-controls",
      "audio-chunk-size",
      "system-instruction",
      "default-greeting",
      "custom-avatar-url",
      "chroma-key-color",
      "enable-chroma-key",
      "background-color",
      "enable-transcript",
      "enable-chat-input",
      "render-transcript-outside",
      "enable-grounding",
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
      case "custom-avatar-url":
        this.setPreview(this.getAttribute("avatar-name") || "Kira");
        break;
      case "visible-controls":
        this.updateControlsVisibility(newValue);
        break;
      case "mic-auto-request":
        if (newValue === "true" && !this.isRecording) {
          const audioChunkSize = this.getAttribute("audio-chunk-size") || "2048";
          this.mediaManager?.startMic(audioChunkSize).then(started => {
              if (started) this.isRecording = true;
          });
        }
        break;
      case "enable-transcript":
        const showTranscript = newValue === "true";
        const renderOutside = this.getAttribute("render-transcript-outside") === "true";
        if (this.transcriptArea) this.transcriptArea.style.display = (showTranscript && !renderOutside) ? 'flex' : 'none';
        break;
      case "enable-chat-input":
        const showChat = newValue === "true";
        const renderOutsideChat = this.getAttribute("render-transcript-outside") === "true";
        if (this.chatContainer) this.chatContainer.style.display = (showChat && !renderOutsideChat) ? 'flex' : 'none';
        break;
      case "render-transcript-outside":
        const outside = newValue === "true";
        const showT = this.getAttribute("enable-transcript") === "true";
        const showC = this.getAttribute("enable-chat-input") === "true";
        if (this.transcriptArea) this.transcriptArea.style.display = (showT && !outside) ? 'flex' : 'none';
        if (this.chatContainer) this.chatContainer.style.display = (showC && !outside) ? 'flex' : 'none';
        break;
      case "enable-chroma-key":
        const enabled = newValue === "true";
        if (this.displayCanvas) this.displayCanvas.style.display = enabled ? 'block' : 'none';
        if (this.videoEl) this.videoEl.style.display = enabled ? 'none' : 'block';
        
        if (enabled) {
          this.startChromaKeyLoop();
        } else {
          this.stopChromaKeyLoop();
        }
        break;
    }
  }

  public setPreview(avatarName: string) {
    if (!this.previewImg) return;
    
    const customUrl = this.getAttribute("custom-avatar-url");
    if (customUrl) {
      this.previewImg.src = customUrl;
      this.previewImg.style.display = 'block';
      return;
    }

    if (avatarName === 'AudioOnly' || avatarName === 'Custom') {
      this.previewImg.style.display = 'none';
      return;
    }

    const preset = (AVATAR_PRESETS as any)[avatarName];
    const url = preset ? preset.image : null;
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
    
    // Reset mic mute state based on attribute
    const autoRequest = this.getAttribute("mic-auto-request") !== "false";
    if (autoRequest) {
      this.isMicMuted = false;
      if (this.micBtn) this.micBtn.classList.remove("off");
      if (!this.isRecording) {
        const audioChunkSize = this.getAttribute("audio-chunk-size") || "2048";
        const started = await this.mediaManager?.startMic(audioChunkSize);
        if (started) {
            this.isRecording = true;
        }
      }
    } else {
      this.isMicMuted = true;
      if (this.micBtn) this.micBtn.classList.add("off");
    }

    this.mediaManager?.setRecordingVideo(this.isRecordingVideo);
    this.mediaManager?.setupMicRecorder();
    
    if (!this.accessToken) {
      const clientId = this.getAttribute("oauth-client-id");
      if (clientId) {
        this._log("No access token available. Attempting to acquire via OAuth...");
        // @ts-ignore
        if (window.google?.accounts?.oauth2?.initTokenClient) {
          if (!this.tokenClient) {
            this.initGoogleAuth();
          }
          this._log("Requesting access token with prompt...");
          this.tokenClient.requestAccessToken({ prompt: "select_account" });
          return; // Wait for callback to call tryConnect
        } else {
          this._log("Google Identity Services not loaded yet or failed to load.", null, true);
          return;
        }
      }
    }
    
    await this.tryConnect();
  }

  public stop() {
    this._log("Stopping session...");
    if (this.silenceInterval) {
      clearInterval(this.silenceInterval);
      this.silenceInterval = null;
      this._log("Silence padding stopped");
    }
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
    this.client?.sendText(text);
    this.appendTranscript('User', text);
  }

  public getSessionFiles() {
    const recordedChunks = this.mediaManager?.getRecordedChunks() || [];
    const accumulatedPcmData = this.mediaManager?.getAccumulatedPcmData() || [];
    
    const videoBlob = new Blob(recordedChunks, { type: "video/mp4" });
    
    const totalLength = accumulatedPcmData.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of accumulatedPcmData) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    const audioBlob = new Blob([result.buffer], { type: "application/octet-stream" });
    return { videoBlob, audioBlob };
  }

  public getStats() {
    const now = new Date().getTime();
    const setupDurationMs = this.setupCompleteTime && this.startTime ? this.setupCompleteTime - this.startTime : null;
    const setupToFirstFrameDurationMs = this.firstFrameTime && this.setupCompleteTime ? this.firstFrameTime - this.setupCompleteTime : null;
    const sessionDurationMs = this.firstFrameTime ? now - this.firstFrameTime : null;
    
    // Get actual frames from video element if supported
    const totalFrames = this.videoEl && 'getVideoPlaybackQuality' in this.videoEl
      ? (this.videoEl as any).getVideoPlaybackQuality().totalVideoFrames
      : 0;

    const averageFps = sessionDurationMs && sessionDurationMs > 0 && totalFrames > 0
      ? (totalFrames / (sessionDurationMs / 1000))
      : null;

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const networkInfo = conn ? {
      downlink: conn.downlink,
      rtt: conn.rtt,
      type: conn.type
    } : null;

    return {
      setupDurationMs,
      setupToFirstFrameDurationMs,
      packetsReceived: this.packetsReceived,
      audioChunksSent: this.audioChunksSent,
      videoFramesSent: this.videoFramesSent,
      videoPacketsReceived: this.videoFramesReceived,
      totalVideoFrames: totalFrames,
      sessionDurationMs,
      averageFps: averageFps ? parseFloat(averageFps.toFixed(1)) : null,
      networkInfo
    };
  }

  public get isConnected(): boolean {
    return this.client !== null && this.client.isConnected;
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


  private toggleMic() {
    if (!this.isRecording) {
      const audioChunkSize = this.getAttribute("audio-chunk-size") || "2048";
      this.mediaManager?.startMic(audioChunkSize).then(started => {
          if (started) this.isRecording = true;
      });
    } else {
      this.isMicMuted = !this.isMicMuted;
      this.mediaManager?.setMicMuted(this.isMicMuted);
      if (this.micBtn) this.micBtn.classList.toggle("off", this.isMicMuted);
      this._log(this.isMicMuted ? "Microphone muted" : "Microphone unmuted");
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
          this.videoFramesSent++;
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
    this._log("initGoogleAuth called", { clientId });
    if (!clientId) {
      this._log("No oauth-client-id attribute found.");
      return;
    }

    try {
      // @ts-ignore
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        callback: (response: any) => {
          this._log("OAuth callback received", { error: response.error });
          if (response.error !== undefined) {
            console.error("OAuth Error:", response);
            return;
          }
          this._log("Access token acquired");
          this.accessToken = response.access_token;
          this.tryConnect();
        },
      });

      this._log("Requesting silent token...");
      // @ts-ignore
      this.tokenClient.requestAccessToken({ prompt: "none" });
    } catch (e: any) {
      console.error("Failed to init Google Auth:", e);
      this._log("Failed to init Google Auth", { error: e.message }, true);
    }
  }

  private async tryConnect() {
    if (!this.accessToken) {
      this._log("No access token available. Cannot connect.", null, true);
      return;
    }
    if (this.client) return;

    this.mediaManager?.resetMediaSource();
    
    this.packetsReceived = 0;
    this.audioChunksSent = 0;
    this.videoFramesSent = 0;
    this.videoFramesReceived = 0;
    this.startTime = null;
    this.setupCompleteTime = null;
    this.firstFrameTime = null;
    this.receivedFirstVideoFrame = false;
    
    if (this.transcriptArea) {
      this.transcriptArea.innerHTML = '';
    }

    const location = this.getAttribute("location") || "us-central1";
    const project = this.getAttribute("project-id");

    if (!project) {
      console.error("project-id is required");
      return;
    }

    this.startTime = new Date().getTime();

    this.client = new GeminiLiveClient({
        projectId: project,
        location: location,
        accessToken: this.accessToken,
        avatarName: this.getAttribute("avatar-name") || "Kira",
        voice: this.getAttribute("voice") || "kore",
        language: this.getAttribute("language") || "en-US",
        systemInstruction: this.getAttribute("system-instruction"),
        enableGrounding: this.getAttribute("enable-grounding") === "true",
        enableTranscript: this.getAttribute("enable-transcript") === "true",
        outputMode: (this.getAttribute("output-mode") as 'audio' | 'video') || "video",
        customAvatar: this.customAvatar,
        defaultGreeting: this.getAttribute("default-greeting"),
        debug: this.getAttribute("debug") === "true"
    });

    this.client.onConnected = () => {
        this.dispatchEvent(new CustomEvent("avatar-connected"));
    };
    this.client.onDisconnected = () => {
        this.client = null;
        this.dispatchEvent(new CustomEvent("avatar-disconnected"));
    };
    this.client.onSetupComplete = () => {
        this.setupCompleteTime = new Date().getTime();
        this.mediaManager?.setSetupComplete(true);
    };
    this.client.onUserTranscript = (text) => this.appendTranscript('User', text);
    this.client.onModelTranscript = (text) => this.appendTranscript('Agent', text);
    this.client.onAudioData = (base64) => this.mediaManager?.playAudioChunk(base64);
    this.client.onVideoData = (base64, mime) => this.mediaManager?.handleVideoDataChunk(base64, mime);
    this.client.onVideoChunk = (blob) => this.mediaManager?.handleVideoChunk(blob);
    this.client.onLog = (msg, data, imp) => this._log(msg, data, imp);

    this.client.connect();
  }

  private disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
    this.mediaManager?.stopMic();
    this.mediaManager?.stopVideoStreaming();
  }


  private startChromaKeyLoop() {
    if (this.chromaKeyLoopId) return;
    
    const loop = () => {
      this.computeFrame();
      this.chromaKeyLoopId = requestAnimationFrame(loop);
    };
    this.chromaKeyLoopId = requestAnimationFrame(loop);
    this._log("Chroma Key loop started");
  }

  private stopChromaKeyLoop() {
    if (this.chromaKeyLoopId) {
      cancelAnimationFrame(this.chromaKeyLoopId);
      this.chromaKeyLoopId = null;
      this._log("Chroma Key loop stopped");
    }
  }

  private computeFrame() {
    if (!this.videoEl || !this.displayCanvas) return;
    
    const ctx = this.displayCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    if (this.displayCanvas.width !== this.videoEl.videoWidth) {
      this.displayCanvas.width = this.videoEl.videoWidth;
      this.displayCanvas.height = this.videoEl.videoHeight;
    }

    ctx.drawImage(this.videoEl, 0, 0, this.displayCanvas.width, this.displayCanvas.height);
    
    const frame = ctx.getImageData(0, 0, this.displayCanvas.width, this.displayCanvas.height);
    const l = frame.data.length / 4;

    const chromaKeyColor = this.getAttribute("chroma-key-color") || "green";
    const bgColor = this.getAttribute("background-color") || "white";

    // Parse target color
    let targetR = 0, targetG = 255, targetB = 0; // Default green
    if (chromaKeyColor === "blue") {
      targetR = 0; targetG = 0; targetB = 255;
    }

    const tolerance = 30;

    for (let i = 0; i < l; i++) {
      const r = frame.data[i * 4 + 0];
      const g = frame.data[i * 4 + 1];
      const b = frame.data[i * 4 + 2];
      
      if (Math.abs(r - targetR) < tolerance &&
          Math.abs(g - targetG) < tolerance &&
          Math.abs(b - targetB) < tolerance) {
        
        if (bgColor === "white") {
          frame.data[i * 4 + 0] = 255;
          frame.data[i * 4 + 1] = 255;
          frame.data[i * 4 + 2] = 255;
        } else if (bgColor === "transparent") {
          frame.data[i * 4 + 3] = 0;
        }
      }
    }
    ctx.putImageData(frame, 0, 0);
  }

  private appendTranscript(sender: string, text: string) {
    // Always fire event for external rendering
    this.dispatchEvent(new CustomEvent('transcript-item', { detail: { sender, text } }));

    if (!this.transcriptArea) return;
    
    const p = document.createElement('p');
    p.style.margin = '5px 0';
    p.style.fontSize = '0.95rem';
    p.style.padding = '5px 10px';
    p.style.borderRadius = '8px';
    p.style.maxWidth = '80%';
    p.style.wordBreak = 'break-word';
    
    const isUser = sender === 'User';
    const icon = isUser ? '👤' : '🤖';
    
    p.innerHTML = `<span>${icon}</span> ${text}`;
    
    if (isUser) {
      p.style.alignSelf = 'flex-end';
      p.style.background = 'rgba(99, 102, 241, 0.3)';
      p.style.marginLeft = 'auto';
      p.style.color = '#f8fafc';
    } else {
      p.style.alignSelf = 'flex-start';
      p.style.background = 'rgba(255, 255, 255, 0.1)';
      p.style.marginRight = 'auto';
      p.style.color = '#cbd5e1';
    }
    
    this.transcriptArea.appendChild(p);
  }

}

customElements.define('gemini-avatar', GeminiAvatar);
