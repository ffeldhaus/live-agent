import { GeminiAvatar, AVATAR_PRESETS, VOICE_PRESETS } from './gemini-avatar';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Demo script started');
    const avatar = document.getElementById('my-avatar') as GeminiAvatar;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    const tokenInput = document.getElementById('accessToken') as HTMLInputElement;
    const saveVideoToggle = document.getElementById('saveVideoToggle') as HTMLInputElement;
    const debugToggle = document.getElementById('debugToggle') as HTMLInputElement;
    const projectIdInput = document.getElementById('projectId') as HTMLInputElement;
    const locationInput = document.getElementById('location') as HTMLInputElement;
    const avatarNameSelect = document.getElementById('avatarName') as HTMLSelectElement;
    const voiceSelect = document.getElementById('voiceSelect') as HTMLSelectElement;
    const languageSelect = document.getElementById('languageSelect') as HTMLSelectElement;
    const sizeSelect = document.getElementById('size') as HTMLSelectElement;
    const positionSelect = document.getElementById('position') as HTMLSelectElement;
    const oauthClientIdInput = document.getElementById('oauthClientId') as HTMLInputElement;
    const streamBtn = document.getElementById('streamBtn') as HTMLButtonElement;
    const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    const textInput = document.getElementById('textInput') as HTMLInputElement;
    const copyHtmlBtn = document.getElementById('copyHtmlBtn') as HTMLButtonElement;
    const recordUserAudioCheckbox = document.getElementById('recordUserAudio') as HTMLInputElement;
    
    // New controls
    const micAutoRequestToggle = document.getElementById('micAutoRequestToggle') as HTMLInputElement;
    const ctrlMic = document.getElementById('ctrlMic') as HTMLInputElement;
    const ctrlCamera = document.getElementById('ctrlCamera') as HTMLInputElement;
    const ctrlScreen = document.getElementById('ctrlScreen') as HTMLInputElement;
    const ctrlMute = document.getElementById('ctrlMute') as HTMLInputElement;
    const ctrlSnapshot = document.getElementById('ctrlSnapshot') as HTMLInputElement;
    
    // Slider
    const audioChunkSizeSlider = document.getElementById('audioChunkSize') as HTMLInputElement;
    const chunkSizeVal = document.getElementById('chunkSizeVal') as HTMLSpanElement;

    // Stats elements
    const statSetupDuration = document.getElementById('statSetupDuration') as HTMLSpanElement;
    const statLatency = document.getElementById('statLatency') as HTMLSpanElement;
    const statPacketsReceived = document.getElementById('statPacketsReceived') as HTMLSpanElement;
    const statAudioSent = document.getElementById('statAudioSent') as HTMLSpanElement;
    const statVideoSent = document.getElementById('statVideoSent') as HTMLSpanElement;
    const statVideoPackets = document.getElementById('statVideoPackets') as HTMLSpanElement;
    const statTotalFrames = document.getElementById('statTotalFrames') as HTMLSpanElement;
    const statSessionDuration = document.getElementById('statSessionDuration') as HTMLSpanElement;
    const statFps = document.getElementById('statFps') as HTMLSpanElement;
    const statDownlink = document.getElementById('statDownlink') as HTMLSpanElement;
    const statRtt = document.getElementById('statRtt') as HTMLSpanElement;
    const statConnType = document.getElementById('statConnType') as HTMLSpanElement;

    // Advanced Customization elements
    const systemInstructionInput = document.getElementById('systemInstruction') as HTMLTextAreaElement;
    const defaultGreetingInput = document.getElementById('defaultGreeting') as HTMLInputElement;
    const imagePromptInput = document.getElementById('imagePrompt') as HTMLInputElement;
    
    const luckyPersonaBtn = document.getElementById('luckyPersonaBtn') as HTMLButtonElement;
    const luckyGreetingBtn = document.getElementById('luckyGreetingBtn') as HTMLButtonElement;
    const luckyImageBtn = document.getElementById('luckyImageBtn') as HTMLButtonElement;
    const generateImageBtn = document.getElementById('generateImageBtn') as HTMLButtonElement;
    
    const generatedImageContainer = document.getElementById('generatedImageContainer') as HTMLDivElement;
    const generatedImg = document.getElementById('generatedImg') as HTMLImageElement;

    // Chroma Keying elements
    const enableChromaKey = document.getElementById('enableChromaKey') as HTMLInputElement;
    const chromaKeyColor = document.getElementById('chromaKeyColor') as HTMLSelectElement;
    const backgroundColor = document.getElementById('backgroundColor') as HTMLSelectElement;

    // QA elements
    const qaContainer = document.getElementById('qaContainer') as HTMLDivElement;
    const qaList = document.getElementById('qaList') as HTMLDivElement;
    const toggleQaBtn = document.getElementById('toggleQaBtn') as HTMLButtonElement;

    // UI Overhaul Part 2 elements
    const enableTranscript = document.getElementById('enableTranscript') as HTMLInputElement;
    const enableChatInput = document.getElementById('enableChatInput') as HTMLInputElement;
    const renderOutsideToggle = document.getElementById('renderOutsideToggle') as HTMLInputElement;
    const externalTranscriptSection = document.getElementById('externalTranscriptSection') as HTMLDivElement;
    const externalTranscript = document.getElementById('externalTranscript') as HTMLDivElement;
    const externalChatInput = document.getElementById('externalChatInput') as HTMLInputElement;
    const externalSendBtn = document.getElementById('externalSendBtn') as HTMLButtonElement;
    
    const barSetup = document.getElementById('barSetup') as HTMLDivElement;
    const barLatency = document.getElementById('barLatency') as HTMLDivElement;
    const statTotalLatency = document.getElementById('statTotalLatency') as HTMLSpanElement;

    const cameraBtn = document.getElementById('cameraBtn') as HTMLButtonElement;
    const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;

    // New Grounding element
    const enableGrounding = document.getElementById('enableGrounding') as HTMLInputElement;

    // Camera Modal elements
    const cameraModal = document.getElementById('cameraModal') as HTMLDivElement;
    const cameraVideo = document.getElementById('cameraVideo') as HTMLVideoElement;
    const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
    const closeCameraBtn = document.getElementById('closeCameraBtn') as HTMLButtonElement;

    // New Custom Avatar Name
    const customAvatarName = document.getElementById('customAvatarName') as HTMLInputElement;

    // Map to store custom avatars (name -> dataUrl)
    const customAvatars: Record<string, string> = {};

    // Populate Avatar Select
    avatarNameSelect.innerHTML = '';
    Object.values(AVATAR_PRESETS).forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = `${preset.displayName} (${preset.style})`;
        avatarNameSelect.appendChild(option);
    });
    // Add AudioOnly option
    const audioOnlyOption = document.createElement('option');
    audioOnlyOption.value = 'AudioOnly';
    audioOnlyOption.textContent = 'Audio Only';
    avatarNameSelect.appendChild(audioOnlyOption);

    // Populate Voice Select
    voiceSelect.innerHTML = '';
    Object.values(VOICE_PRESETS).forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = `${preset.displayName} (${preset.description})`;
        voiceSelect.appendChild(option);
    });

    // Show connection type on load
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn && statConnType) {
        statConnType.textContent = conn.type || '-';
    }

    // Load from localStorage
    const savedToken = localStorage.getItem('gemini_access_token');
    const savedTime = localStorage.getItem('gemini_token_time');

    if (savedToken && savedTime) {
        const now = new Date().getTime();
        const oneHour = 60 * 60 * 1000;
        if (now - parseInt(savedTime) < oneHour) {
            tokenInput.value = savedToken;
        } else {
            localStorage.removeItem('gemini_access_token');
            localStorage.removeItem('gemini_token_time');
        }
    }

    // Load other settings
    if (localStorage.getItem('gemini_project_id')) projectIdInput.value = localStorage.getItem('gemini_project_id')!;
    if (localStorage.getItem('gemini_location')) locationInput.value = localStorage.getItem('gemini_location')!;
    
    // Load custom avatars first!
    const savedCustomAvatars = localStorage.getItem('gemini_custom_avatars');
    if (savedCustomAvatars) {
        Object.assign(customAvatars, JSON.parse(savedCustomAvatars));
        Object.keys(customAvatars).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            avatarNameSelect.appendChild(option);
        });
    }

    if (localStorage.getItem('gemini_avatar_name')) {
        const name = localStorage.getItem('gemini_avatar_name')!;
        avatarNameSelect.value = name;
        if (customAvatars[name]) {
            avatar.setAttribute('custom-avatar-url', customAvatars[name]);
            updateBackground(customAvatars[name]);
            if (customAvatarName) customAvatarName.value = name;
        } else {
            avatar.setPreview(name);
            const preset = (AVATAR_PRESETS as any)[name];
            if (preset && preset.image) {
                updateBackground(preset.image);
            }
        }
    }
    
    if (localStorage.getItem('gemini_size')) {
        sizeSelect.value = localStorage.getItem('gemini_size')!;
        avatar.setAttribute('size', sizeSelect.value);
    }
    if (localStorage.getItem('gemini_position')) {
        positionSelect.value = localStorage.getItem('gemini_position')!;
        avatar.setAttribute('position', positionSelect.value);
    }
    if (localStorage.getItem('gemini_oauth_client_id')) oauthClientIdInput.value = localStorage.getItem('gemini_oauth_client_id')!;
    if (localStorage.getItem('gemini_voice')) voiceSelect.value = localStorage.getItem('gemini_voice')!;
    if (localStorage.getItem('gemini_language')) languageSelect.value = localStorage.getItem('gemini_language')!;

    // Load checkbox states
    saveVideoToggle.checked = localStorage.getItem('gemini_save_video') === 'true';
    debugToggle.checked = localStorage.getItem('gemini_debug') === 'true';
    if (recordUserAudioCheckbox) {
        recordUserAudioCheckbox.checked = localStorage.getItem('gemini_record_user_audio') === 'true';
    }
    
    if (micAutoRequestToggle) {
        micAutoRequestToggle.checked = localStorage.getItem('gemini_mic_auto_request') !== 'false'; // Default true
        avatar.setAttribute('mic-auto-request', micAutoRequestToggle.checked.toString());
    }
    
    const loadCtrlState = (id: string, defaultValue: boolean) => {
        const saved = localStorage.getItem(`gemini_ctrl_${id}`);
        return saved !== null ? saved === 'true' : defaultValue;
    };
    
    ctrlMic.checked = loadCtrlState('mic', true);
    ctrlCamera.checked = loadCtrlState('camera', true);
    ctrlScreen.checked = loadCtrlState('screen', true);
    ctrlMute.checked = loadCtrlState('mute', true);
    ctrlSnapshot.checked = loadCtrlState('snapshot', false); // Default false

    if (localStorage.getItem('gemini_audio_chunk_size')) {
        audioChunkSizeSlider.value = localStorage.getItem('gemini_audio_chunk_size')!;
        chunkSizeVal.textContent = audioChunkSizeSlider.value;
        avatar.setAttribute('audio-chunk-size', audioChunkSizeSlider.value);
    }

    // Load advanced settings
    if (localStorage.getItem('gemini_system_instruction')) systemInstructionInput.value = localStorage.getItem('gemini_system_instruction')!;
    if (localStorage.getItem('gemini_default_greeting')) defaultGreetingInput.value = localStorage.getItem('gemini_default_greeting')!;
    if (localStorage.getItem('gemini_image_prompt')) imagePromptInput.value = localStorage.getItem('gemini_image_prompt')!;

    // Load Chroma Key settings
    enableChromaKey.checked = localStorage.getItem('gemini_enable_chroma_key') === 'true';
    if (localStorage.getItem('gemini_chroma_key_color')) chromaKeyColor.value = localStorage.getItem('gemini_chroma_key_color')!;
    if (localStorage.getItem('gemini_background_color')) backgroundColor.value = localStorage.getItem('gemini_background_color')!;
    
    avatar.setAttribute('enable-chroma-key', enableChromaKey.checked.toString());
    avatar.setAttribute('chroma-key-color', chromaKeyColor.value);
    avatar.setAttribute('background-color', backgroundColor.value);

    // Load toggle states
    enableTranscript.checked = localStorage.getItem('gemini_enable_transcript') === 'true';
    enableChatInput.checked = localStorage.getItem('gemini_enable_chat_input') === 'true';
    
    renderOutsideToggle.checked = localStorage.getItem('gemini_enable_transcript_outside') === 'true';
    avatar.setAttribute('render-transcript-outside', renderOutsideToggle.checked.toString());
    if (externalTranscriptSection) {
        externalTranscriptSection.style.display = renderOutsideToggle.checked ? 'block' : 'none';
    }

    // Load grounding setting
    if (enableGrounding) {
        enableGrounding.checked = localStorage.getItem('gemini_enable_grounding') === 'true';
        avatar.setAttribute('enable-grounding', enableGrounding.checked.toString());
    }

    function validateForm() {
        const project = projectIdInput.value.trim();
        const loc = locationInput.value.trim();
        const token = tokenInput.value.trim();
        const oauth = oauthClientIdInput.value.trim();

        const isValid = project.length > 0 && loc.length > 0 && (token.length > 0 || oauth.length > 0);
        if (saveBtn) saveBtn.disabled = !isValid;

        if (!avatar.isConnected && streamBtn) {
            streamBtn.disabled = !isValid;
        }
        
        // Lucky buttons require project, location, and token!
        const isLuckyValid = project.length > 0 && loc.length > 0 && token.length > 0;
        if (luckyPersonaBtn) luckyPersonaBtn.disabled = !isLuckyValid;
        if (luckyGreetingBtn) luckyGreetingBtn.disabled = !isLuckyValid;
        if (luckyImageBtn) luckyImageBtn.disabled = !isLuckyValid;
    }

    const updateVisibleControls = () => {
        const list = [];
        if (ctrlMic.checked) list.push('mic');
        if (ctrlCamera.checked) list.push('camera');
        if (ctrlScreen.checked) list.push('screen');
        if (ctrlMute.checked) list.push('mute');
        if (ctrlSnapshot.checked) list.push('snapshot');
        avatar.setAttribute('visible-controls', list.join(','));
    };

    const updateStats = () => {
        const stats = avatar.getStats();
        if (statSetupDuration) statSetupDuration.textContent = stats.setupDurationMs ? stats.setupDurationMs.toString() : '-';
        if (statLatency) statLatency.textContent = stats.setupToFirstFrameDurationMs ? stats.setupToFirstFrameDurationMs.toString() : '-';
        if (statPacketsReceived) statPacketsReceived.textContent = stats.packetsReceived.toString();
        if (statAudioSent) statAudioSent.textContent = stats.audioChunksSent.toString();
        if (statVideoSent) statVideoSent.textContent = stats.videoFramesSent.toString();
        if (statVideoPackets) statVideoPackets.textContent = stats.videoPacketsReceived.toString();
        if (statTotalFrames) statTotalFrames.textContent = stats.totalVideoFrames.toString();
        if (statSessionDuration) statSessionDuration.textContent = stats.sessionDurationMs ? (stats.sessionDurationMs / 1000).toFixed(1) : '-';
        if (statFps) statFps.textContent = stats.averageFps ? stats.averageFps.toString() : '-';
        if (statDownlink) statDownlink.textContent = stats.networkInfo?.downlink ? stats.networkInfo.downlink.toString() : '-';
        if (statRtt) statRtt.textContent = stats.networkInfo?.rtt ? stats.networkInfo.rtt.toString() : '-';
        if (statConnType) statConnType.textContent = stats.networkInfo?.type ? stats.networkInfo.type : '-';
        
        // Update Latency Bar
        const setup = stats.setupDurationMs || 0;
        const latency = stats.setupToFirstFrameDurationMs || 0;
        const total = setup + latency;
        
        if (statTotalLatency) statTotalLatency.textContent = total.toString();
        
        if (barSetup && barLatency && total > 0) {
            const setupPct = (setup / total) * 100;
            const latencyPct = (latency / total) * 100;
            
            barSetup.style.width = `${setupPct}%`;
            barSetup.textContent = setup > 0 ? `${setup}ms` : '';
            
            barLatency.style.width = `${latencyPct}%`;
            barLatency.textContent = latency > 0 ? `${latency}ms` : '';
        }
    };

    // REST API Helper
    async function generateContent(model: string, prompt: string, inlineData?: { mimeType: string, data: string }) {
        const project = projectIdInput.value;
        const location = locationInput.value || 'us-central1';
        const token = tokenInput.value;
        
        if (!project || !token) {
            throw new Error('Project ID and Access Token are required for AI generation features.');
        }
        
        const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
        const url = `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
        
        const parts: any[] = [{ text: prompt }];
        if (inlineData) {
            parts.push({ inlineData });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts }]
            })
        });
        
        if (!response.ok) {
            const err = await response.text();
            console.error(`API Error (${model}):`, err);
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }

    // Background Color Adaptation
    function updateBackground(imageUrl: string) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, 100, 100);
                
                // Read pixels from the bottom half (indicative of Avatar color)
                const imgData = ctx.getImageData(0, 50, 100, 50);
                const data = imgData.data;
                
                // Count color frequencies
                const colors: Record<string, number> = {};
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    
                    if (data[i+3] < 128) continue; // Ignore transparent
                    
                    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    colors[hex] = (colors[hex] || 0) + 1;
                }
                
                // Sort by frequency
                const sortedColors = Object.entries(colors).sort((a, b) => b[1] - a[1]);
                
                if (sortedColors.length > 0) {
                    const color1 = sortedColors[0][0];
                    const color2 = sortedColors[1] ? sortedColors[1][0] : color1;
                    const color3 = sortedColors[2] ? sortedColors[2][0] : color2;
                    const color4 = sortedColors[3] ? sortedColors[3][0] : color3;
                    
                    console.log('Dominant colors detected (bottom half):', color1, color2, color3, color4);
                    
                    // Apply to background with low opacity to keep it dark
                    document.body.style.background = `linear-gradient(135deg, ${color1}33 0%, ${color2}33 33%, ${color3}33 66%, ${color4}33 100%), #0f172a`;
                }
            }
        };
        img.src = imageUrl;
    }

    // Listeners
    [projectIdInput, locationInput, tokenInput, oauthClientIdInput].forEach(el => {
        el?.addEventListener('input', validateForm);
    });

    if (sizeSelect) sizeSelect.onchange = () => avatar.setAttribute('size', sizeSelect.value);
    if (positionSelect) positionSelect.onchange = () => avatar.setAttribute('position', positionSelect.value);
    
    if (avatarNameSelect) {
        avatarNameSelect.onchange = () => {
            const val = avatarNameSelect.value;
            if (customAvatars[val]) {
                if (customAvatarName) customAvatarName.value = val;
                avatar.setAttribute('custom-avatar-url', customAvatars[val]);
                updateBackground(customAvatars[val]);
            } else {
                avatar.setPreview(val);
                const preset = (AVATAR_PRESETS as any)[val];
                if (preset && preset.image) {
                    updateBackground(preset.image);
                }
            }
        };
    }
    
    if (micAutoRequestToggle) {
        micAutoRequestToggle.onchange = () => avatar.setAttribute('mic-auto-request', micAutoRequestToggle.checked.toString());
    }
    
    [ctrlMic, ctrlCamera, ctrlScreen, ctrlMute, ctrlSnapshot].forEach(el => {
        if (el) el.onchange = updateVisibleControls;
    });

    if (audioChunkSizeSlider) {
        audioChunkSizeSlider.oninput = () => {
            chunkSizeVal.textContent = audioChunkSizeSlider.value;
            avatar.setAttribute('audio-chunk-size', audioChunkSizeSlider.value);
        };
    }

    // Chroma Key Listeners
    if (enableChromaKey) enableChromaKey.onchange = () => avatar.setAttribute('enable-chroma-key', enableChromaKey.checked.toString());
    if (chromaKeyColor) chromaKeyColor.onchange = () => avatar.setAttribute('chroma-key-color', chromaKeyColor.value);
    if (backgroundColor) backgroundColor.onchange = () => avatar.setAttribute('background-color', backgroundColor.value);

    // Toggle Listeners
    if (enableTranscript) enableTranscript.onchange = () => avatar.setAttribute('enable-transcript', enableTranscript.checked.toString());
    if (enableChatInput) enableChatInput.onchange = () => avatar.setAttribute('enable-chat-input', enableChatInput.checked.toString());
    
    if (renderOutsideToggle) {
        renderOutsideToggle.onchange = () => {
            avatar.setAttribute('render-transcript-outside', renderOutsideToggle.checked.toString());
            if (externalTranscriptSection) {
                externalTranscriptSection.style.display = renderOutsideToggle.checked ? 'block' : 'none';
            }
        };
    }

    // Grounding Listener
    if (enableGrounding) {
        enableGrounding.onchange = () => avatar.setAttribute('enable-grounding', enableGrounding.checked.toString());
    }

    // Lucky buttons
    if (luckyPersonaBtn) {
        luckyPersonaBtn.onclick = async () => {
            const name = avatarNameSelect.value;
            const voice = voiceSelect.value;
            const prompt = `Generate a nice, funny, earnest random persona for an AI avatar named ${name} with voice ${voice}. Return only the persona description.`;
            
            try {
                luckyPersonaBtn.disabled = true;
                luckyPersonaBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt);
                const text = data.candidates[0].content.parts[0].text;
                systemInstructionInput.value = text.trim();
            } catch (e: any) {
                alert(`Failed to generate persona: ${e.message}`);
            } finally {
                luckyPersonaBtn.disabled = false;
                luckyPersonaBtn.textContent = "I'm feeling lucky";
            }
        };
    }

    if (luckyGreetingBtn) {
        luckyGreetingBtn.onclick = async () => {
            const persona = systemInstructionInput.value;
            if (!persona) {
                alert('Please generate or enter a persona first.');
                return;
            }
            const prompt = `Generate a default greeting for an AI avatar with this persona: "${persona}". Return only the greeting text.`;
            
            try {
                luckyGreetingBtn.disabled = true;
                luckyGreetingBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt);
                const text = data.candidates[0].content.parts[0].text;
                defaultGreetingInput.value = text.trim();
            } catch (e: any) {
                alert(`Failed to generate greeting: ${e.message}`);
            } finally {
                luckyGreetingBtn.disabled = false;
                luckyGreetingBtn.textContent = "I'm feeling lucky";
            }
        };
    }

    if (luckyImageBtn) {
        luckyImageBtn.onclick = async () => {
            const persona = systemInstructionInput.value;
            if (!persona) {
                alert('Please generate or enter a persona first.');
                return;
            }
            const prompt = `Generate an image generation prompt for a profile picture of an AI avatar with this persona: "${persona}". Return only the prompt text.`;
            
            try {
                luckyImageBtn.disabled = true;
                luckyImageBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt);
                const text = data.candidates[0].content.parts[0].text;
                imagePromptInput.value = text.trim();
            } catch (e: any) {
                alert(`Failed to generate image prompt: ${e.message}`);
            } finally {
                luckyImageBtn.disabled = false;
                luckyImageBtn.textContent = "I'm feeling lucky";
            }
        };
    }

    if (generateImageBtn) {
        generateImageBtn.onclick = async () => {
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }

            const userPrompt = imagePromptInput.value;
            if (!userPrompt) {
                alert('Please enter a prompt or use "I\'m feeling lucky".');
                return;
            }
            
            try {
                generateImageBtn.disabled = true;
                generateImageBtn.textContent = 'Enhancing...';
                
                // 1. Enhance prompt with gemini-3-flash
                const enhancePrompt = `Enhance this image generation prompt to follow best practices (add details, style, lighting, etc.): "${userPrompt}". Return only the enhanced prompt text.`;
                const enhanceData = await generateContent('gemini-3-flash', enhancePrompt);
                const enhancedPrompt = enhanceData.candidates[0].content.parts[0].text.trim();
                console.log('Enhanced Prompt:', enhancedPrompt);
                
                generateImageBtn.textContent = 'Generating...';
                
                // Add background settings to prompt!
                let finalPrompt = enhancedPrompt;
                if (enableChromaKey.checked) {
                    const color = chromaKeyColor.value;
                    finalPrompt += ` with a solid ${color} background.`;
                } else if (backgroundColor.value === 'white') {
                    finalPrompt += ` with a solid white background.`;
                }
                
                // 2. Generate image with gemini-3.1-flash-image-preview
                const data = await generateContent('gemini-3.1-flash-image-preview', finalPrompt);
                
                console.log('Image Gen Response:', data);
                const part = data.candidates[0].content.parts[0];
                
                if (part.inlineData && part.inlineData.data) {
                    const base64 = part.inlineData.data;
                    generatedImg.src = `data:${part.inlineData.mimeType};base64,${base64}`;
                    generatedImageContainer.style.display = 'block';
                    
                    let finalUrl = generatedImg.src;

                    // Apply transparency via canvas if needed!
                    if (enableChromaKey.checked && backgroundColor.value === 'transparent') {
                        const img = new Image();
                        img.onload = () => {
                            const canv = document.createElement('canvas');
                            canv.width = img.width;
                            canv.height = img.height;
                            const cx = canv.getContext('2d');
                            if (cx) {
                                cx.drawImage(img, 0, 0);
                                const imgData = cx.getImageData(0, 0, canv.width, canv.height);
                                const data = imgData.data;
                                
                                const keyColor = chromaKeyColor.value;
                                for (let i = 0; i < data.length; i += 4) {
                                    const r = data[i];
                                    const g = data[i+1];
                                    const b = data[i+2];
                                    
                                    if (keyColor === 'green' && g > r && g > b) {
                                        data[i+3] = 0; // Transparent!
                                    } else if (keyColor === 'blue' && b > r && b > g) {
                                        data[i+3] = 0; // Transparent!
                                    }
                                }
                                cx.putImageData(imgData, 0, 0);
                                finalUrl = canv.toDataURL('image/png');
                                generatedImg.src = finalUrl;
                                
                                // Save and update
                                customAvatars[name] = finalUrl;
                                updateDropdown(name);
                                avatar.setAttribute('custom-avatar-url', finalUrl);
                                updateBackground(finalUrl);
                            }
                        };
                        img.src = generatedImg.src;
                    } else {
                        // Save and update
                        customAvatars[name] = finalUrl;
                        updateDropdown(name);
                        avatar.setAttribute('custom-avatar-url', finalUrl);
                        updateBackground(finalUrl);
                    }
                } else if (part.text) {
                    console.log('Generated Content Text:', part.text);
                    alert('Model returned text instead of an image. See console for details.');
                } else {
                    alert('Failed to generate image (unknown response structure). See console.');
                }
            } catch (e: any) {
                console.error('Image gen error:', e);
                alert(`Failed to generate image: ${e.message}`);
            } finally {
                generateImageBtn.disabled = false;
                generateImageBtn.textContent = 'Generate';
            }
        };
    }

    function updateDropdown(name: string) {
        let optionExists = false;
        for (let i = 0; i < avatarNameSelect.options.length; i++) {
            if (avatarNameSelect.options[i].value === name) {
                optionExists = true;
                break;
            }
        }
        
        if (!optionExists) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            avatarNameSelect.appendChild(option);
        }
        
        avatarNameSelect.value = name;
    }

    // Custom Avatar Buttons (Camera & Upload)
    if (cameraBtn) {
        cameraBtn.onclick = async () => {
            if (cameraModal && cameraVideo) {
                cameraModal.classList.add('active');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                    cameraVideo.srcObject = stream;
                } catch (e) {
                    console.error('Camera access error:', e);
                    alert('Failed to access camera: ' + e);
                    cameraModal.classList.remove('active');
                }
            }
        };
    }

    if (closeCameraBtn) {
        closeCameraBtn.onclick = () => {
            if (cameraModal && cameraVideo) {
                const stream = cameraVideo.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                cameraVideo.srcObject = null;
                cameraModal.classList.remove('active');
            }
        };
    }

    if (captureBtn) {
        captureBtn.onclick = async () => {
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }

            if (cameraVideo) {
                const canvas = document.createElement('canvas');
                canvas.width = cameraVideo.videoWidth;
                canvas.height = cameraVideo.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Mirror the image!
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                    
                    ctx.drawImage(cameraVideo, 0, 0);
                    
                    // Reset transform
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    
                    // Stop camera
                    const stream = cameraVideo.srcObject as MediaStream;
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                    cameraVideo.srcObject = null;
                    cameraModal.classList.remove('active');
                    
                    // Get image data URL
                    const dataUrl = canvas.toDataURL('image/png');
                    
                    // Show preview
                    generatedImg.src = dataUrl;
                    generatedImageContainer.style.display = 'block';
                    
                    // Auto-improvement flow!
                    try {
                        generateImageBtn.disabled = true;
                        generateImageBtn.textContent = 'Improving...';
                        
                        const base64Data = dataUrl.split(',')[1];
                        let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style.";
                        
                        if (enableChromaKey.checked) {
                            const color = chromaKeyColor.value;
                            instruction += ` Replace the background with a solid ${color} color.`;
                        } else if (backgroundColor.value === 'white') {
                            instruction += ` Replace the background with a solid white color.`;
                        } else if (backgroundColor.value === 'transparent') {
                            instruction += ` Remove the background and make it transparent.`;
                        }
                        
                        const data = await generateContent('gemini-3.1-flash-image-preview', instruction, { mimeType: 'image/png', data: base64Data });
                        
                        console.log('Image Gen Response:', data);
                        const part = data.candidates[0].content.parts[0];
                        
                        if (part.inlineData && part.inlineData.data) {
                            const base64 = part.inlineData.data;
                            const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                            generatedImg.src = improvedUrl;
                            
                            // Save and update
                            customAvatars[name] = improvedUrl;
                            updateDropdown(name);
                            avatar.setAttribute('custom-avatar-url', improvedUrl);
                            updateBackground(improvedUrl);
                        } else {
                            alert('Model did not return an image. See console.');
                        }
                    } catch (e: any) {
                        console.error('Image improvement error:', e);
                        alert('Failed to improve image: ' + e.message);
                    } finally {
                        generateImageBtn.disabled = false;
                        generateImageBtn.textContent = 'Generate';
                    }
                }
            }
        };
    }

    if (uploadBtn) {
        uploadBtn.onclick = () => {
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (re: any) => {
                        const dataUrl = re.target.result;
                        generatedImg.src = dataUrl;
                        generatedImageContainer.style.display = 'block';
                        
                        // Auto-improvement flow for upload too!
                        try {
                            generateImageBtn.disabled = true;
                            generateImageBtn.textContent = 'Improving...';
                            
                            const base64Data = dataUrl.split(',')[1];
                            let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style.";
                            
                            if (enableChromaKey.checked) {
                                const color = chromaKeyColor.value;
                                instruction += ` Replace the background with a solid ${color} color.`;
                            } else if (backgroundColor.value === 'white') {
                                instruction += ` Replace the background with a solid white color.`;
                            } else if (backgroundColor.value === 'transparent') {
                                instruction += ` Remove the background and make it transparent.`;
                            }
                            
                            const data = await generateContent('gemini-3.1-flash-image-preview', instruction, { mimeType: file.type, data: base64Data });
                            
                            console.log('Image Gen Response:', data);
                            const part = data.candidates[0].content.parts[0];
                            
                            if (part.inlineData && part.inlineData.data) {
                                const base64 = part.inlineData.data;
                                const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                                generatedImg.src = improvedUrl;
                                
                                // Save and update
                                customAvatars[name] = improvedUrl;
                                updateDropdown(name);
                                avatar.setAttribute('custom-avatar-url', improvedUrl);
                                updateBackground(improvedUrl);
                            } else {
                                alert('Model did not return an image. See console.');
                            }
                        } catch (e: any) {
                            console.error('Image improvement error:', e);
                            alert('Failed to improve image: ' + e.message);
                        } finally {
                            generateImageBtn.disabled = false;
                            generateImageBtn.textContent = 'Generate';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };
    }

    // Feature Walkthrough Logic
    const qaScenarios = [
        {
            id: '1.1',
            title: 'Direct Access Token',
            description: 'Verify connection using a direct access token.',
            steps: [
                'Enter a valid Access Token in the form.',
                'Click "Save Configuration".',
                'Click "Start".'
            ],
            verification: [
                'Component connects to WebSocket.',
                'Button changes to "Stop".',
                'Video starts playing.'
            ]
        },
        {
            id: '1.2',
            title: 'OAuth Sign-in',
            description: 'Verify authentication via Google OAuth.',
            steps: [
                'Enter a valid OAuth Client ID (leave Access Token empty).',
                'Click "Save Configuration".',
                'Click "Start".',
                'Complete sign-in if prompted.'
            ],
            verification: [
                'A Google sign-in popup appears (if not already authorized).',
                'Component connects successfully after acquiring token.'
            ]
        },
        {
            id: '2.1',
            title: 'Microphone Mute & Silence Padding',
            description: 'Verify mic muting and timeline alignment.',
            steps: [
                'Start a session.',
                'Click the Microphone button on the component to mute.',
                'Speak into the microphone.',
                'Unmute and speak.',
                'Stop session and download video (with user audio enabled).'
            ],
            verification: [
                'The Avatar does not respond when muted.',
                'The Avatar responds when unmuted.',
                'The recorded user audio has silence in the muted segment, maintaining alignment.'
            ]
        },
        {
            id: '2.3',
            title: 'Camera & Screen Sharing',
            description: 'Verify camera and screen sharing activation.',
            steps: [
                'Start a session.',
                'Click the Camera or Screen Share button on the component.'
            ],
            verification: [
                'Permissions are requested if not already granted.',
                'Button changes state to active.'
            ]
        },
        {
            id: '3.1',
            title: 'Persistence across page reload',
            description: 'Verify settings are saved and restored.',
            steps: [
                'Change settings in the form (Size, Position, Voice).',
                'Click "Save Configuration".',
                'Reload the page.'
            ],
            verification: [
                'All settings are restored to the UI controls.'
            ]
        },
        {
            id: '3.2',
            title: 'Dynamic Size & Position',
            description: 'Verify immediate update of size and position.',
            steps: [
                'Change Size or Position in the form while session is active.'
            ],
            verification: [
                'The component updates its size and position on screen immediately.'
            ]
        },
        {
            id: '4.1',
            title: 'Combined Video & Audio Download',
            description: 'Verify FFmpeg muxing and panned audio.',
            steps: [
                'Enable "Save and download video session".',
                'Enable "Include user audio in download".',
                'Start session, speak, and wait for avatar response.',
                'Stop session.'
            ],
            verification: [
                'Button shows "Processing video..." and is disabled.',
                'A `.mp4` file is downloaded containing both tracks.',
                'Audio is panned (Left/Right) based on Avatar\'s position.'
            ]
        },
        {
            id: '4.2',
            title: 'Fallback on Failure',
            description: 'Verify fallback behavior when FFmpeg fails.',
            steps: [
                'Simulate a failure (e.g., block unpkg.com).',
                'Stop session with recording enabled.'
            ],
            verification: [
                'Alert appears.',
                'Two separate files (.mp4 and .webm) are downloaded.'
            ]
        },
        {
            id: '5.1',
            title: 'System Instructions (Persona)',
            description: 'Verify custom persona behavior.',
            steps: [
                'Enter a persona: "You are a pirate. Respond to everything with \'Ahoy!\'".',
                'Click "Start".',
                'Speak to the Avatar.'
            ],
            verification: [
                'Avatar responds in character.'
            ]
        },
        {
            id: '5.2',
            title: 'Default Greeting',
            description: 'Verify automatic greeting on start.',
            steps: [
                'Enter a greeting: "Welcome aboard!".',
                'Click "Start".'
            ],
            verification: [
                'Avatar speaks "Welcome aboard!" immediately after connection.'
            ]
        },
        {
            id: '5.3',
            title: '"I\'m feeling lucky" Generation',
            description: 'Verify AI generation of persona and greeting.',
            steps: [
                'Click "I\'m feeling lucky" next to Persona or Greeting.'
            ],
            verification: [
                'Field is populated with generated text.'
            ]
        },
        {
            id: '5.4',
            title: 'Image Generation',
            description: 'Verify custom avatar image generation.',
            steps: [
                'Enter an image prompt or use "I\'m feeling lucky".',
                'Click "Generate".'
            ],
            verification: [
                'An image appears in the container.',
                'Applied to the avatar preview.'
            ]
        },
        {
            id: '5.5',
            title: 'Custom Avatar Creation',
            description: 'Verify camera capture and auto-improvement.',
            steps: [
                'Select "Custom" in Avatar Preset.',
                'Click "Camera".',
                'Align face and click "Capture".'
            ],
            verification: [
                'Image is captured and analyzed.',
                'New avatar image is generated and applied.'
            ]
        },
        {
            id: '6.1',
            title: 'Real-time Stats',
            description: 'Verify statistics display.',
            steps: [
                'Start a session.',
                'Watch the "Session Statistics" panel.'
            ],
            verification: [
                'Packets and frames counters increase.',
                'Setup duration and latency show realistic values.',
                'Average FPS is close to 24.'
            ]
        },
        {
            id: '6.2',
            title: 'Latency Visualizer',
            description: 'Verify visual latency bar.',
            steps: [
                'Start a session.',
                'Watch the latency bar in Statistics.'
            ],
            verification: [
                'Bar shows blue and green segments.',
                'Values are displayed inside or total on the right.'
            ]
        },
        {
            id: '7.1',
            title: 'Background Removal',
            description: 'Verify Chroma Keying.',
            steps: [
                'Use a custom avatar with solid green background.',
                'Enable Chroma Keying.',
                'Select "Green Key" and "Make Transparent".'
            ],
            verification: [
                'The green background disappears.'
            ]
        },
        {
            id: '8.1',
            title: 'External Transcript',
            description: 'Verify rendering transcript outside the component.',
            steps: [
                'Enable "Render Transcript Outside Component" in Avatar settings.',
                'Start session.',
                'Speak or send message.'
            ],
            verification: [
                'Transcript appears in the section above Settings.',
                'Internal transcript in component is hidden.'
            ]
        },
        {
            id: '9.1',
            title: 'Google Search Grounding',
            description: 'Verify enabling search grounding.',
            steps: [
                'Enable "Enable Google Search Grounding" in Avatar settings.',
                'Start session.',
                'Ask a question that requires recent info.'
            ],
            verification: [
                'Avatar provides accurate, grounded answer.'
            ]
        }
    ];

    const renderQA = () => {
        if (!qaList) return;
        qaList.innerHTML = '';
        qaScenarios.forEach(scenario => {
            const div = document.createElement('div');
            div.className = 'qa-scenario';
            div.style.marginBottom = '15px';
            div.style.padding = '15px';
            div.style.background = '#1e293b';
            div.style.borderRadius = '8px';
            
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.gap = '8px';
            header.style.fontWeight = 'bold';
            header.style.color = '#f8fafc';
            header.style.marginBottom = '5px';
            header.style.fontSize = '1.1rem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.width = 'auto';
            const savedState = localStorage.getItem(`gemini_qa_${scenario.id}`);
            checkbox.checked = savedState === 'true';
            
            checkbox.onchange = () => {
                localStorage.setItem(`gemini_qa_${scenario.id}`, checkbox.checked.toString());
            };
            
            header.appendChild(checkbox);
            const titleSpan = document.createElement('span');
            titleSpan.textContent = `${scenario.id}: ${scenario.title}`;
            header.appendChild(titleSpan);
            
            div.appendChild(header);
            
            if (scenario.description) {
                const desc = document.createElement('p');
                desc.style.fontSize = '0.95rem';
                desc.style.color = '#94a3b8';
                desc.style.margin = '0 0 10px 25px';
                desc.textContent = scenario.description;
                div.appendChild(desc);
            }
            
            const stepsTitle = document.createElement('div');
            stepsTitle.style.fontSize = '0.95rem';
            stepsTitle.style.fontWeight = 'bold';
            stepsTitle.style.color = '#cbd5e1';
            stepsTitle.style.margin = '0 0 5px 25px';
            stepsTitle.textContent = 'Steps:';
            div.appendChild(stepsTitle);
            
            const ul = document.createElement('ul');
            ul.style.margin = '0 0 10px 45px';
            ul.style.fontSize = '0.95rem';
            ul.style.color = '#cbd5e1';
            scenario.steps.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                ul.appendChild(li);
            });
            div.appendChild(ul);
            
            const verifTitle = document.createElement('div');
            verifTitle.style.fontSize = '0.95rem';
            verifTitle.style.fontWeight = 'bold';
            verifTitle.style.color = '#cbd5e1';
            verifTitle.style.margin = '0 0 5px 25px';
            verifTitle.textContent = 'Verification:';
            div.appendChild(verifTitle);
            
            const ulVerif = document.createElement('ul');
            ulVerif.style.margin = '0 0 0 45px';
            ulVerif.style.fontSize = '0.95rem';
            ulVerif.style.color = '#cbd5e1';
            scenario.verification.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                ulVerif.appendChild(li);
            });
            div.appendChild(ulVerif);
            
            qaList.appendChild(div);
        });
    };

    const updateQaPosition = () => {
        if (!qaContainer) return;
        const pos = avatar.getAttribute('position') || 'top-right';
        
        qaContainer.style.top = '0';
        qaContainer.style.bottom = '0';
        qaContainer.style.height = '100vh';
        qaContainer.style.width = 'min(570px, 40vw)';
        
        if (pos.includes('right')) {
            qaContainer.style.left = '0';
            qaContainer.style.right = 'auto';
            qaContainer.style.borderRight = '1px solid #334155';
            qaContainer.style.borderLeft = 'none';
        } else {
            qaContainer.style.right = '0';
            qaContainer.style.left = 'auto';
            qaContainer.style.borderLeft = '1px solid #334155';
            qaContainer.style.borderRight = 'none';
        }
    };

    if (toggleQaBtn) {
        toggleQaBtn.onclick = () => {
            if (qaContainer) {
                const isVisible = qaContainer.style.display !== 'none';
                qaContainer.style.display = isVisible ? 'none' : 'block';
                toggleQaBtn.textContent = isVisible ? 'Open Feature Walkthrough' : 'Close Feature Walkthrough';
                if (!isVisible) {
                    updateQaPosition();
                    renderQA();
                }
            }
        };
    }

    // Listen for position changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'position') {
                updateQaPosition();
            }
        });
    });
    observer.observe(avatar, { attributes: true });

    // Initial apply
    updateVisibleControls();
    validateForm();
});

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

let statsInterval: any = null;
