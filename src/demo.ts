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

    const customAvatarSection = document.getElementById('customAvatarSection') as HTMLDivElement;
    const cameraBtn = document.getElementById('cameraBtn') as HTMLButtonElement;
    const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;

    // New Grounding element
    const enableGrounding = document.getElementById('enableGrounding') as HTMLInputElement;

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
    if (localStorage.getItem('gemini_avatar_name')) {
        avatarNameSelect.value = localStorage.getItem('gemini_avatar_name')!;
        avatar.setPreview(avatarNameSelect.value);
        if (avatarNameSelect.value === 'Custom') {
            customAvatarSection.style.display = 'block';
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
    async function generateContent(model: string, prompt: string) {
        const project = projectIdInput.value;
        const location = locationInput.value || 'us-central1';
        const token = tokenInput.value;
        
        if (!project || !token) {
            throw new Error('Project ID and Access Token are required for AI generation features.');
        }
        
        const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
        const url = `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        if (!response.ok) {
            const err = await response.text();
            console.error(`API Error (${model}):`, err);
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }

    // Listeners
    [projectIdInput, locationInput, tokenInput, oauthClientIdInput].forEach(el => {
        el?.addEventListener('input', validateForm);
    });

    if (sizeSelect) sizeSelect.onchange = () => avatar.setAttribute('size', sizeSelect.value);
    if (positionSelect) positionSelect.onchange = () => avatar.setAttribute('position', positionSelect.value);
    
    if (avatarNameSelect) {
        avatarNameSelect.onchange = () => {
            avatar.setPreview(avatarNameSelect.value);
            if (avatarNameSelect.value === 'Custom') {
                customAvatarSection.style.display = 'block';
            } else {
                customAvatarSection.style.display = 'none';
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
                
                // 2. Generate image with gemini-3.1-flash-image-preview
                const data = await generateContent('gemini-3.1-flash-image-preview', enhancedPrompt);
                
                console.log('Image Gen Response:', data);
                const part = data.candidates[0].content.parts[0];
                
                if (part.inlineData && part.inlineData.data) {
                    const base64 = part.inlineData.data;
                    generatedImg.src = `data:${part.inlineData.mimeType};base64,${base64}`;
                    generatedImageContainer.style.display = 'block';
                    avatar.setAttribute('custom-avatar-url', generatedImg.src);
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

    // Custom Avatar Buttons (Placeholders for now)
    if (cameraBtn) {
        cameraBtn.onclick = () => alert('Camera capture feature not implemented yet.');
    }
    if (uploadBtn) {
        uploadBtn.onclick = () => alert('Upload image feature not implemented yet.');
    }

    // Listen for transcript items from component
    avatar.addEventListener('transcript-item', (e: any) => {
        if (renderOutsideToggle.checked && externalTranscript) {
            const { sender, text } = e.detail;
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
            
            externalTranscript.appendChild(p);
        }
    });

    // External Chat Input
    if (externalSendBtn) {
        externalSendBtn.onclick = () => {
            const text = externalChatInput.value;
            if (text) {
                avatar.sendMessage(text);
                externalChatInput.value = '';
            }
        };
    }
    if (externalChatInput) {
        externalChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                externalSendBtn.click();
            }
        });
    }

    let isProcessingVideo = false;

    if (streamBtn) {
        streamBtn.onclick = () => {
            if (avatar.isConnected) {
                avatar.stop();
                
                if (saveVideoToggle.checked) {
                    isProcessingVideo = true;
                    streamBtn.textContent = 'Processing video...';
                    streamBtn.disabled = true;
                    streamBtn.style.opacity = '0.5';
                    streamBtn.style.cursor = 'not-allowed';
                    
                    // Wait a bit for streams to close and finalize
                    setTimeout(async () => {
                        const { videoBlob, audioBlob } = avatar.getSessionFiles();
                        const recordUserAudio = recordUserAudioCheckbox?.checked;
                        
                        if (recordUserAudio && audioBlob.size > 0) {
                            console.log('Starting FFmpeg muxing...');
                            try {
                                console.log('Loading FFmpeg...');
                                const ffmpeg = await getFFmpeg();
                                const { fetchFile } = await import('@ffmpeg/util');
                                
                                console.log('Writing files to FFmpeg FS...');
                                await ffmpeg.writeFile('video.mp4', await fetchFile(videoBlob));
                                await ffmpeg.writeFile('audio.pcm', await fetchFile(audioBlob));
                                
                                const pos = avatar.getAttribute('position') || 'top-right';
                                const avatarOnRight = pos.includes('right');
                                
                                // amerge=inputs=2 will combine two mono channels into a stereo channel
                                // The order determines which goes to Left and which to Right.
                                // Channel 0 is Left, Channel 1 is Right.
                                let filterComplex = '';
                                if (avatarOnRight) {
                                    // User audio (Input 1) -> Left, Avatar audio (Input 0) -> Right
                                    filterComplex = "[1:a][0:a]amerge=inputs=2[a]";
                                } else {
                                    // Avatar audio (Input 0) -> Left, User audio (Input 1) -> Right
                                    filterComplex = "[0:a][1:a]amerge=inputs=2[a]";
                                }

                                console.log('Executing FFmpeg command with filter:', filterComplex);
                                await ffmpeg.exec([
                                    '-i', 'video.mp4', 
                                    '-f', 's16le', 
                                    '-ar', '16000', 
                                    '-ac', '1', 
                                    '-i', 'audio.pcm', 
                                    '-filter_complex', filterComplex, 
                                    '-map', '0:v', 
                                    '-map', '[a]', 
                                    '-c:v', 'copy', 
                                    '-c:a', 'aac', 
                                    'output.mp4'
                                ]);
                                
                                console.log('Reading output file...');
                                const data = await ffmpeg.readFile('output.mp4');
                                const combinedBlob = new Blob([data], { type: 'video/mp4' });
                                
                                downloadBlob(combinedBlob, `avatar_session_combined_${new Date().toISOString().replace(/:/g, '-')}.mp4`);
                                console.log('FFmpeg muxing completed.');
                            } catch (error) {
                                console.error('FFmpeg error:', error);
                                alert('Failed to combine video and audio with FFmpeg. Downloading separate files instead.');
                                downloadBlob(videoBlob, `avatar_session_${new Date().toISOString().replace(/:/g, '-')}.mp4`);
                                downloadBlob(audioBlob, `user_audio_${new Date().toISOString().replace(/:/g, '-')}.webm`);
                            }
                        } else {
                            downloadBlob(videoBlob, `avatar_session_${new Date().toISOString().replace(/:/g, '-')}.mp4`);
                        }
                        
                        // Reset button state
                        isProcessingVideo = false;
                        streamBtn.textContent = 'Start';
                        streamBtn.disabled = false;
                        streamBtn.style.opacity = '1';
                        streamBtn.style.cursor = 'pointer';
                        streamBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        validateForm();
                    }, 1000);
                }
            } else {
                // Apply settings
                avatar.setAttribute('project-id', projectIdInput.value);
                avatar.setAttribute('location', locationInput.value);
                avatar.setAttribute('avatar-name', avatarNameSelect.value);
                avatar.setAttribute('size', sizeSelect.value);
                avatar.setAttribute('position', positionSelect.value);
                avatar.setAttribute('oauth-client-id', oauthClientIdInput.value);
                avatar.setAttribute('access-token', tokenInput.value);
                avatar.setAttribute('voice', voiceSelect.value);
                avatar.setAttribute('language', languageSelect.value);
                avatar.setAttribute('record-video', saveVideoToggle.checked ? 'true' : 'false');
                avatar.setAttribute('debug', debugToggle.checked ? 'true' : 'false');
                avatar.setAttribute('audio-chunk-size', audioChunkSizeSlider.value);
                
                // Apply advanced settings
                avatar.setAttribute('system-instruction', systemInstructionInput.value);
                avatar.setAttribute('default-greeting', defaultGreetingInput.value);
                
                // Apply Chroma Key settings
                avatar.setAttribute('enable-chroma-key', enableChromaKey.checked.toString());
                avatar.setAttribute('chroma-key-color', chromaKeyColor.value);
                avatar.setAttribute('background-color', backgroundColor.value);

                // Apply toggle states
                avatar.setAttribute('enable-transcript', enableTranscript.checked.toString());
                avatar.setAttribute('enable-chat-input', enableChatInput.checked.toString());
                avatar.setAttribute('render-transcript-outside', renderOutsideToggle.checked.toString());

                // Apply grounding setting
                avatar.setAttribute('enable-grounding', enableGrounding.checked.toString());

                if (avatarNameSelect.value === 'AudioOnly') {
                    avatar.setAttribute('output-mode', 'audio');
                } else {
                    avatar.setAttribute('output-mode', 'video');
                }

                if (externalTranscript) {
                    externalTranscript.innerHTML = '';
                }

                avatar.start();
                avatar.unmute(); // Unmute by default on start
            }
        };
    }

    avatar.addEventListener('avatar-connected', () => {
        if (streamBtn) {
            streamBtn.disabled = false;
            streamBtn.textContent = 'Stop';
            streamBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
        
        // Start polling stats
        statsInterval = setInterval(updateStats, 1000);
    });

    avatar.addEventListener('avatar-disconnected', () => {
        if (!isProcessingVideo) {
            if (streamBtn) {
                streamBtn.textContent = 'Start';
                streamBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }
            validateForm();
        }
        
        // Stop polling stats
        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }
        updateStats(); // Final update
    });

    if (saveBtn) {
        saveBtn.onclick = () => {
            localStorage.setItem('gemini_project_id', projectIdInput.value);
            localStorage.setItem('gemini_location', locationInput.value);
            localStorage.setItem('gemini_avatar_name', avatarNameSelect.value);
            localStorage.setItem('gemini_size', sizeSelect.value);
            localStorage.setItem('gemini_position', positionSelect.value);
            localStorage.setItem('gemini_oauth_client_id', oauthClientIdInput.value);
            localStorage.setItem('gemini_voice', voiceSelect.value);
            localStorage.setItem('gemini_language', languageSelect.value);

            // Save checkbox states
            localStorage.setItem('gemini_save_video', saveVideoToggle.checked.toString());
            localStorage.setItem('gemini_debug', debugToggle.checked.toString());
            if (recordUserAudioCheckbox) {
                localStorage.setItem('gemini_record_user_audio', recordUserAudioCheckbox.checked.toString());
            }
            
            localStorage.setItem('gemini_mic_auto_request', micAutoRequestToggle.checked.toString());
            localStorage.setItem('gemini_ctrl_mic', ctrlMic.checked.toString());
            localStorage.setItem('gemini_ctrl_camera', ctrlCamera.checked.toString());
            localStorage.setItem('gemini_ctrl_screen', ctrlScreen.checked.toString());
            localStorage.setItem('gemini_ctrl_mute', ctrlMute.checked.toString());
            localStorage.setItem('gemini_ctrl_snapshot', ctrlSnapshot.checked.toString());
            
            localStorage.setItem('gemini_audio_chunk_size', audioChunkSizeSlider.value);
            
            // Save advanced settings
            localStorage.setItem('gemini_system_instruction', systemInstructionInput.value);
            localStorage.setItem('gemini_default_greeting', defaultGreetingInput.value);
            localStorage.setItem('gemini_image_prompt', imagePromptInput.value);
            
            // Save Chroma Key settings
            localStorage.setItem('gemini_enable_chroma_key', enableChromaKey.checked.toString());
            localStorage.setItem('gemini_chroma_key_color', chromaKeyColor.value);
            localStorage.setItem('gemini_background_color', backgroundColor.value);

            // Save toggle states
            localStorage.setItem('gemini_enable_transcript', enableTranscript.checked.toString());
            localStorage.setItem('gemini_enable_chat_input', enableChatInput.checked.toString());
            localStorage.setItem('gemini_enable_transcript_outside', renderOutsideToggle.checked.toString());

            // Save grounding setting
            localStorage.setItem('gemini_enable_grounding', enableGrounding.checked.toString());

            if (tokenInput.value) {
                localStorage.setItem('gemini_access_token', tokenInput.value);
                localStorage.setItem('gemini_token_time', new Date().getTime().toString());
            }

            alert('Configuration saved.');
        };
    }

    // Initial apply
    updateVisibleControls();
    validateForm();
});
