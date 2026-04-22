export interface GeminiLiveClientOptions {
    projectId: string;
    location?: string;
    accessToken: string;
    avatarName?: string;
    voice?: string;
    language?: string;
    systemInstruction?: string;
    enableGrounding?: boolean;
    enableTranscript?: boolean;
    outputMode?: 'audio' | 'video';
    customAvatar?: { image_data: string; image_mime_type: string } | null;
    defaultGreeting?: string;
    debug?: boolean;
}

export class GeminiLiveClient {
    private ws: WebSocket | null = null;
    private messageQueue: any[] = [];
    private processingQueue = false;
    private isSetupComplete = false;
    private options: GeminiLiveClientOptions;
    private sessionHandle: string | null = null;
    private receivedFirstResponse = false;

    // Callbacks
    onConnected?: () => void;
    onDisconnected?: () => void;
    onSetupComplete?: () => void;
    onUserTranscript?: (text: string) => void;
    onModelTranscript?: (text: string) => void;
    onAudioData?: (base64Data: string) => void;
    onVideoData?: (base64Data: string, mimeType: string) => void;
    onVideoChunk?: (blob: Blob) => void;
    onLog?: (message: string, data?: any, isImportant?: boolean) => void;
    onSetupError?: (error: any) => void;

    constructor(options: GeminiLiveClientOptions) {
        this.options = options;
    }

    private _log(message: string, data: any = null, isImportant = false) {
        if (this.options.debug || isImportant) {
            if (this.onLog) {
                this.onLog(message, data, isImportant);
            } else {
                console.log(message, data);
            }
        }
    }

    public connect() {
        if (this.ws) return;

        const location = this.options.location || "us-central1";
        const project = this.options.projectId;

        if (!project) {
            console.error("project-id is required");
            return;
        }

        const host = location === "global" ? "autopush-aiplatform.sandbox.googleapis.com" : `${location}-aiplatform.googleapis.com`;
        const url = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${this.options.accessToken}`;

        this._log("Connecting to WebSocket...", { url }, true);

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this._log("WebSocket Connected", null, true);
                this.sendSetup();
                if (this.onConnected) this.onConnected();
            };

            this.ws.onmessage = (event) => this.handleMessage(event);

            this.ws.onerror = (error) => {
                console.error("WebSocket Error:", error);
                this._log("WebSocket Error", error, true);
            };

            this.ws.onclose = () => {
                this._log("WebSocket Closed", null, true);
                this.ws = null;
                
                if (!this.isSetupComplete) {
                    this._log("WebSocket closed before setup completion", null, true);
                    if (this.onSetupError) this.onSetupError(new Error("WebSocket closed before setup completion"));
                }

                if (this.shouldResume()) {
                    this.reconnect();
                } else {
                    if (this.onDisconnected) this.onDisconnected();
                }
            };
        } catch (e) {
            console.error("Failed to create WebSocket:", e);
            this._log("Failed to create WebSocket", e, true);
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isSetupComplete = false;
    }

    private sendSetup() {
        const project = this.options.projectId;
        const location = this.options.location || "us-central1";
        const modelName = this.options.avatarName || "Kira";
        const voice = this.options.voice || "kore";
        const language = this.options.language || "en-US";
        const systemInstruction = this.options.systemInstruction;
        const enableGrounding = this.options.enableGrounding;
        const enableTranscript = this.options.enableTranscript;

        const setupMessage = {
            setup: {
                model: `projects/${project}/locations/${location}/publishers/google/models/gemini-3.1-flash-live-preview-04-2026`,
                avatar_config: (modelName === 'Custom' && this.options.customAvatar) ? {
                    customized_avatar: this.options.customAvatar
                } : {
                    avatar_name: modelName,
                },
                generation_config: {
                    response_modalities: this.options.outputMode === "audio" ? ["AUDIO"] : ["VIDEO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: { voice_name: voice },
                        },
                        language_code: language,
                    },
                },
                sessionResumption: {
                    handle: this.sessionHandle,
                    transparent: true
                },
                ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
                ...(enableGrounding ? { tools: [{ google_search: {} }] } : {}),
                ...(enableTranscript ? {
                    input_audio_transcription: {},
                    output_audio_transcription: {}
                } : {})
            },
        };

        this._log("Sending setup", setupMessage, true);
        this.ws?.send(JSON.stringify(setupMessage));
    }

    public sendText(text: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const message = {
            realtime_input: {
                text: text,
            },
        };
        this.ws.send(JSON.stringify(message));
    }

    public sendAudio(base64Data: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const message = { realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: base64Data } } };
        this.ws.send(JSON.stringify(message));
    }

    public sendVideo(base64Data: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const message = { realtimeInput: { video: { mimeType: "image/jpeg", data: base64Data } } };
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
        if (data instanceof Blob) {
            try {
                const text = await data.text();
                const response = JSON.parse(text);
                this.handleJsonResponse(response);
            } catch (e) {
                // Assume video chunk
                if (this.onVideoChunk) this.onVideoChunk(data);
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
        if (response.sessionResumptionUpdate) {
            const update = response.sessionResumptionUpdate;
            if (update.resumable && update.newHandle) {
                this.sessionHandle = update.newHandle;
                this._log("Received session handle", this.sessionHandle, true);
            }
        }

        if (response.goAway) {
            this._log("Received goAway", response.goAway, true);
            if (this.shouldResume()) {
                this._log("Closing connection to trigger resumption", null, true);
                this.ws?.close();
            }
        }

        if (response.serverContent && !this.receivedFirstResponse) {
            this.receivedFirstResponse = true;
            this._log("Received first response, session eligible for resumption", null, true);
        }

        if (response.setupComplete) {
            this._log("Setup complete received", response.setupComplete, true);
            this.isSetupComplete = true;
            if (this.onSetupComplete) this.onSetupComplete();
            
            if (this.options.defaultGreeting) {
                this._log("Sending default greeting:", this.options.defaultGreeting);
                this.sendText(this.options.defaultGreeting);
            }
        }

        if (response.serverContent && response.serverContent.userTurn) {
            const parts = response.serverContent.userTurn.parts;
            for (const part of parts) {
                if (part.text) {
                    this._log("Received user transcript in JSON", part.text);
                    if (this.onUserTranscript) this.onUserTranscript(part.text);
                }
            }
        }

        if (response.serverContent && response.serverContent.modelTurn) {
            const parts = response.serverContent.modelTurn.parts;
            for (const part of parts) {
                if (part.text) {
                    this._log("Received text data in JSON", part.text);
                    if (this.onModelTranscript) this.onModelTranscript(part.text);
                }
                if (part.inlineData && part.inlineData.mimeType.startsWith("audio/")) {
                    this._log("Received audio data in JSON", {
                        size: part.inlineData.data.length,
                    });
                    if (this.onAudioData) this.onAudioData(part.inlineData.data);
                }
                if (part.inlineData && part.inlineData.mimeType.startsWith("video/")) {
                    this._log("Received video data in JSON", {
                        size: part.inlineData.data.length,
                        mimeType: part.inlineData.mimeType,
                    });
                    if (this.onVideoData) this.onVideoData(part.inlineData.data, part.inlineData.mimeType);
                }
            }
        }
    }

    public get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    private shouldResume(): boolean {
        return this.isSetupComplete && this.receivedFirstResponse && this.sessionHandle !== null;
    }

    private reconnect() {
        this._log("Attempting to reconnect for session resumption...", null, true);
        this.isSetupComplete = false;
        this.connect();
    }
}
