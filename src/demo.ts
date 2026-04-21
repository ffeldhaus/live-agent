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

    // New Overhaul elements
    const enableTranscript = document.getElementById('enableTranscript') as HTMLInputElement;
    const enableChatInput = document.getElementById('enableChatInput') as HTMLInputElement;
    const customAvatarSection = document.getElementById('customAvatarSection') as HTMLDivElement;
    const cameraBtn = document.getElementById('cameraBtn') as HTMLButtonElement;
    const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;

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

    function validateForm() {
        const project = projectIdInput.value.trim();
        const loc = locationInput.value.trim();
        const token = tokenInput.value.trim();
        const oauth = oauthClientIdInput.value.trim();

        const isValid = project.length > 0 && loc.length > 0 && (token.length > 0 || oauth.length > 0);
        saveBtn.disabled = !isValid;

        if (!avatar.isConnected) {
            streamBtn.disabled = !isValid;
        }
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

    sizeSelect.onchange = () => avatar.setAttribute('size', sizeSelect.value);
    positionSelect.onchange = () => avatar.setAttribute('position', positionSelect.value);
    
    avatarNameSelect.onchange = () => {
        avatar.setPreview(avatarNameSelect.value);
        if (avatarNameSelect.value === 'Custom') {
            customAvatarSection.style.display = 'block';
        } else {
            customAvatarSection.style.display = 'none';
        }
    };
    
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

    avatar.addEventListener('avatar-connected', () => {
        streamBtn.disabled = false;
        streamBtn.textContent = 'Stop';
        streamBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // Start polling stats
        statsInterval = setInterval(updateStats, 1000);
    });

    let statsInterval: any = null;

    avatar.addEventListener('avatar-disconnected', () => {
        streamBtn.textContent = 'Start';
        streamBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        validateForm();
        
        // Stop polling stats
        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }
        updateStats(); // Final update
    });

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

        if (tokenInput.value) {
            localStorage.setItem('gemini_access_token', tokenInput.value);
            localStorage.setItem('gemini_token_time', new Date().getTime().toString());
        }

        alert('Configuration saved.');
    };

    let ffmpeg: any = null;

    async function getFFmpeg() {
        if (!ffmpeg) {
            const { FFmpeg } = await import('@ffmpeg/ffmpeg');
            const { toBlobURL } = await import('@ffmpeg/util');
            ffmpeg = new FFmpeg();
            
            // Add log listener
            ffmpeg.on('log', ({ message }: { message: string }) => {
                console.log('FFmpeg Log:', message);
            });

            console.log('Loading FFmpeg core from CDN...');
            
            const loadPromise = ffmpeg.load({
                coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
                wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
            });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('FFmpeg load timeout after 15 seconds')), 15000)
            );

            await Promise.race([loadPromise, timeoutPromise]);
            console.log('FFmpeg loaded successfully.');
        }
        return ffmpeg;
    }

    function downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    streamBtn.onclick = () => {
        if (avatar.isConnected) {
            avatar.stop();
            
            if (saveVideoToggle.checked) {
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

            if (avatarNameSelect.value === 'AudioOnly') {
                avatar.setAttribute('output-mode', 'audio');
            } else {
                avatar.setAttribute('output-mode', 'video');
            }

            avatar.start();
            avatar.unmute(); // Unmute by default on start
        }
    };

    // Copy HTML Feature
    if (copyHtmlBtn) {
        copyHtmlBtn.onclick = () => {
            const project = projectIdInput.value || 'YOUR_PROJECT_ID';
            const loc = locationInput.value || 'us-central1';
            const name = avatarNameSelect.value;
            const size = sizeSelect.value;
            const pos = positionSelect.value;
            const voice = voiceSelect.value;
            const lang = languageSelect.value;
            const chunkSize = audioChunkSizeSlider.value;
            const systemInstruction = systemInstructionInput.value;
            const defaultGreeting = defaultGreetingInput.value;
            
            const visibleControls = [];
            if (ctrlMic.checked) visibleControls.push('mic');
            if (ctrlCamera.checked) visibleControls.push('camera');
            if (ctrlScreen.checked) visibleControls.push('screen');
            if (ctrlMute.checked) visibleControls.push('mute');
            if (ctrlSnapshot.checked) visibleControls.push('snapshot');

            const htmlCode = `<gemini-avatar
    project-id="${project}"
    location="${loc}"
    avatar-name="${name}"
    size="${size}"
    position="${pos}"
    voice="${voice}"
    language="${lang}"
    mic-auto-request="${micAutoRequestToggle.checked}"
    visible-controls="${visibleControls.join(',')}"
    audio-chunk-size="${chunkSize}"
    system-instruction="${systemInstruction.replace(/"/g, '&quot;')}"
    default-greeting="${defaultGreeting.replace(/"/g, '&quot;')}"
    enable-chroma-key="${enableChromaKey.checked}"
    chroma-key-color="${chromaKeyColor.value}"
    background-color="${backgroundColor.value}"
    enable-transcript="${enableTranscript.checked}"
    enable-chat-input="${enableChatInput.checked}"
></gemini-avatar>`;

            navigator.clipboard.writeText(htmlCode).then(() => {
                alert('HTML code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy code. See console for details.');
            });
        };
    }

    // QA Walkthrough Logic
    const qaScenarios = [
        // ... (Same as before)
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
                toggleQaBtn.textContent = isVisible ? 'Open QA Walkthrough' : 'Close QA Walkthrough';
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
