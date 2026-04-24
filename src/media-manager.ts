import mpegts from 'mpegts.js';

export class MediaManager {
    private videoEl: HTMLVideoElement;
    
    // Playback
    private mediaSource: MediaSource | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private videoChunkQueue: ArrayBuffer[] = [];
    private messageQueue: any[] = [];
    private processingQueue = false;
    private playbackAudioContext: AudioContext | null = null;
    private audioGainNode: GainNode | null = null;
    private nextPlaybackTime = 0;
    private audioDestination: MediaStreamAudioDestinationNode | null = null;
    private recordedChunks: Blob[] = [];
    private mpegtsPlayer: any = null;
    private customVideoLoader: any = null;
    private receivedBytes = 0;
    private feedVideoData: ((arrayBuffer: ArrayBuffer) => void) | null = null;

    // Input (Mic/Cam/Screen)
    private micStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: AudioWorkletNode | null = null;
    private mixer: GainNode | null = null;
    private extSource: MediaStreamAudioSourceNode | null = null;
    private micGain: GainNode | null = null;
    private videoInputStream: MediaStream | null = null;
    private videoInputInterval: any = null;
    private micRecorder: MediaRecorder | null = null;
    private micChunks: Blob[] = [];
    private silenceInterval: any = null;

    // State
    private isMuted = false;
    private isMicMuted = false;
    private isRecordingVideo = false;
    private isRecordingAudio = false;
    private isExternalMicStream = false;
    private isSetupComplete = false;
    private isWorkletModuleLoaded = false;
    private videoAudioSource: MediaElementAudioSourceNode | null = null;
    private outputProcessor: AudioWorkletNode | null = null;
    private pendingExternalStream: MediaStream | null = null;
    private receivedFirstVideoFrame = false;
    
    // Stats counters
    public audioChunksSent = 0;
    public videoFramesSent = 0;
    public videoFramesReceived = 0;
    public packetsReceived = 0; // To be updated by client

    // Callbacks
    onAudioChunk?: (base64Data: string) => void;
    onVideoFrame?: (base64Data: string) => void;
    onFirstFrame?: () => void;
    onLog?: (message: string, data?: any, isImportant?: boolean) => void;

    constructor(videoEl: HTMLVideoElement) {
        this.videoEl = videoEl;
    }

    private _log(message: string, data: any = null, isImportant = false) {
        if (this.onLog) {
            this.onLog(message, data, isImportant);
        }
    }

    public setRecordingVideo(value: boolean) {
        this.isRecordingVideo = value;
    }

    public setRecordingAudio(value: boolean) {
        this.isRecordingAudio = value;
    }

    public setSetupComplete(value: boolean) {
        this.isSetupComplete = value;
        if (value && this.micRecorder && this.micRecorder.state === 'inactive') {
            this.micRecorder.start();
            this._log("Microphone recording started (Setup Complete)");
        }
    }

    public setReceivedFirstVideoFrame(value: boolean) {
        this.receivedFirstVideoFrame = value;
    }

    public setMuted(value: boolean) {
        this.isMuted = value;
        if (this.audioGainNode) {
            this.audioGainNode.gain.value = value ? 0 : 1;
        }
        if (this.videoEl) {
            this.videoEl.muted = value;
        }
    }

    public setMicMuted(value: boolean) {
        this.isMicMuted = value;
        if (this.micGain) {
            this.micGain.gain.value = value ? 0 : 1;
        }
    }

    public init(useMpegts: boolean) {
        this.resetMediaSource();
        if (useMpegts) {
            this.initMpegts();
        }
    }

    public getAudioOutputStream(): MediaStream {
        if (!this.playbackAudioContext) {
            this.playbackAudioContext = this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            this.nextPlaybackTime = this.playbackAudioContext.currentTime;
        }
        if (!this.audioGainNode) {
            this.audioGainNode = this.playbackAudioContext.createGain();
            this.audioGainNode.connect(this.playbackAudioContext.destination);
        }
        if (this.playbackAudioContext.state === 'suspended') {
            this.playbackAudioContext.resume();
            this._log("Resumed playbackAudioContext in getAudioOutputStream");
        }
        if (!this.audioDestination) {
            this.audioDestination = this.playbackAudioContext.createMediaStreamDestination();
            this.audioGainNode.connect(this.audioDestination);
            
            try {
                this._log("Creating MediaElementSource from video element", null, true);
                this.videoAudioSource = this.playbackAudioContext.createMediaElementSource(this.videoEl);
                this.videoAudioSource.connect(this.playbackAudioContext.destination);
                this.videoAudioSource.connect(this.audioDestination);
            } catch (e: any) {
                console.error("Failed to create MediaElementSource:", e);
                this._log("Failed to create MediaElementSource", { error: e.message }, true);
            }
        }
        return this.audioDestination.stream;
    }

    public setAudioContext(ctx: AudioContext) {
        this.audioContext = ctx;
        this.playbackAudioContext = ctx;
        this._log("Shared AudioContext set in MediaManager");
    }

    public resetMediaSource() {
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

        if (typeof this.mediaSource.addEventListener === 'function') {
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
        }

        this.recordedChunks = [];
        this.videoChunkQueue = [];
        this.messageQueue = [];
        this.processingQueue = false;
        this.nextPlaybackTime = 0;
        this.receivedFirstVideoFrame = false;
    }

    private initMpegts() {
        this._log("Initializing mpegts.js player");
        const instance = this;
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
                    instance.customVideoLoader = this;
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

    public async playAudioChunk(base64Data: string) {
        try {
            this._log("playAudioChunk called", { isMuted: this.isMuted, size: base64Data.length }, true);
            if (!this.playbackAudioContext) {
                this.playbackAudioContext = this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                this.nextPlaybackTime = this.playbackAudioContext.currentTime;
            }
            if (!this.audioGainNode) {
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

    public async handleVideoDataChunk(base64Data: string, mimeType: string) {
        try {
            this.checkFirstFrame();
            this.videoFramesReceived++;

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

    public async handleVideoChunk(blob: Blob) {
        if (this.isRecordingVideo) this.recordedChunks.push(blob);
        
        this.checkFirstFrame();
        this.videoFramesReceived++;

        const arrayBuffer = await blob.arrayBuffer();
        if (this.sourceBuffer) {
            this.videoChunkQueue.push(arrayBuffer);
            this.processVideoQueue();
        } else if (this.feedVideoData) {
            this.feedVideoData(arrayBuffer);
        }
    }

    private checkFirstFrame() {
        if (!this.receivedFirstVideoFrame) {
            this.receivedFirstVideoFrame = true;
            this._log("First video frame received!");
            if (this.onFirstFrame) this.onFirstFrame();
            
            if (!this.micStream && this.isRecordingVideo) {
                this.startSilencePadding();
            }
        }
    }

    public startSilencePadding() {
        this._log("Starting silence padding...");
        const sampleRate = 16000;
        const bufferSize = 2048;
        const intervalMs = (bufferSize / sampleRate) * 1000;
        
        this.silenceInterval = setInterval(() => {
            if (this.isRecordingVideo) {
                const pcmData = new Int16Array(bufferSize);
                this.accumulatedPcmData.push(pcmData);
            }
        }, intervalMs);
    }

    public stopSilencePadding() {
        if (this.silenceInterval) {
            clearInterval(this.silenceInterval);
            this.silenceInterval = null;
            this._log("Silence padding stopped");
        }
    }

    public async startMic(audioChunkSize: string = "2048", externalStream: MediaStream | null = null, micStream: MediaStream | null = null) {
        try {
            if (micStream) {
                this.micStream = micStream;
                this.isExternalMicStream = true;
                this._log("Using provided external mic stream");
            } else {
                this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.isExternalMicStream = false;
            }
            
            this.stopSilencePadding();

            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                this._log("Resumed audioContext in startMic");
            }
            
            this.mixer = this.audioContext.createGain();
            this.micGain = this.audioContext.createGain();
            const micSource = this.audioContext.createMediaStreamSource(this.micStream);
            micSource.connect(this.micGain);
            this.micGain.connect(this.mixer);
            this.micGain.gain.value = this.isMicMuted ? 0 : 1;
            
            if (externalStream) {
                this.extSource = this.audioContext.createMediaStreamSource(externalStream);
                this.extSource.connect(this.mixer);
            }
            
            if (this.pendingExternalStream) {
                this._log("Connecting pending external stream");
                this.extSource = this.audioContext.createMediaStreamSource(this.pendingExternalStream);
                this.extSource.connect(this.mixer);
                this.pendingExternalStream = null;
            }

            const bufferSize = parseInt(audioChunkSize);
            const workletCode = `
                class AudioProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this.buffer = new Float32Array(${bufferSize});
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
                                    this.buffer = new Float32Array(${bufferSize});
                                    this.offset = 0;
                                }
                            }
                        }
                        return true;
                    }
                }
                registerProcessor('audio-processor', AudioProcessor);
            `;

            const dataUri = 'data:text/javascript;base64,' + btoa(workletCode);
            const currentContext = this.audioContext;
            try {
                await this.audioContext.audioWorklet.addModule(dataUri);
                this.isWorkletModuleLoaded = true;
                this._log("AudioWorklet module added successfully");
            } catch (e) {
                console.error("Failed to add AudioWorklet module:", e);
                this._log("Failed to add AudioWorklet module", e, true);
                return false;
            }

            if (this.audioContext !== currentContext || !this.audioContext) {
                this._log("Mic start aborted (context changed or cleared)");
                return false;
            }

            this.processor = new AudioWorkletNode(this.audioContext, "audio-processor");
            this.mixer.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.processor.port.onmessage = (e) => {
                if (e.data && e.data.type === 'signal') {
                    return;
                }
                const inputData = e.data;
                const pcmData = this.float32ToInt16(inputData);
                
                const base64Data = this.arrayBufferToBase64(pcmData.buffer);

                if (this.isSetupComplete) {
                    if (this.onAudioChunk) this.onAudioChunk(base64Data);
                    this.audioChunksSent++;
                }
            };

            this._log("Microphone started");
            return true;
        } catch (e) {
            console.error("Failed to start mic:", e);
            this._log("Failed to start mic", e, true);
            return false;
        }
    }

    public updateExternalStream(stream: MediaStream | null) {
        this._log("updateExternalStream called", { hasStream: !!stream, hasContext: !!this.audioContext });
        if (!this.audioContext || !this.mixer) {
            this._log("updateExternalStream: mixer not ready, deferring connection", null, true);
            this.pendingExternalStream = stream;
            return;
        }
        
        if (this.extSource) {
            this.extSource.disconnect();
            this.extSource = null;
            this._log("Disconnected previous external source");
        }
        
        if (stream) {
            this.extSource = this.audioContext.createMediaStreamSource(stream);
            this.extSource.connect(this.mixer);
            this._log("Connected new external source to mixer");
        }
    }

    public setupMicRecorder() {
        if (this.isRecordingVideo && this.micStream) {
            this.micChunks = [];
            this.accumulatedPcmData = [];
            this.accumulatedOutputPcmData = [];
            this.micRecorder = new MediaRecorder(this.micStream);
            this.micRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.micChunks.push(e.data);
                }
            };
            
            if (this.isSetupComplete && this.micRecorder.state === 'inactive') {
                this.micRecorder.start();
                this._log("Microphone recording started (Setup Complete)");
            }
        }
    }

    public stopMic() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.mixer) {
            this.mixer.disconnect();
            this.mixer = null;
        }
        if (this.micGain) {
            this.micGain.disconnect();
            this.micGain = null;
        }
        if (this.extSource) {
            this.extSource.disconnect();
            this.extSource = null;
        }

        if (this.micStream) {
            if (!this.isExternalMicStream) {
                if (typeof this.micStream.getTracks === 'function') {
                    const tracks = this.micStream.getTracks();
                    if (Array.isArray(tracks)) {
                        tracks.forEach(track => track.stop());
                    }
                }
            }
            this.micStream = null;
        }
        this._log("Microphone stopped");
    }



    public startVideoStreaming(stream: MediaStream) {
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
                if (this.isSetupComplete) {
                    if (this.onVideoFrame) this.onVideoFrame(base64Data);
                    this.videoFramesSent++;
                }
            }
        }, 1000);
    }

    public stopVideoStreaming() {
        if (this.videoInputInterval) clearInterval(this.videoInputInterval);
        if (this.videoInputStream) this.videoInputStream.getTracks().forEach((track) => track.stop());
        this.videoInputStream = null;
        this._log("Video streaming stopped");
    }

    public getRecordedChunks() {
        return this.recordedChunks;
    }



    public getMicStream() {
        return this.micStream;
    }

    public setMicRecorder(recorder: MediaRecorder | null) {
        this.micRecorder = recorder;
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
}
