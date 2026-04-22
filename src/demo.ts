import { GeminiAvatar } from './gemini-avatar';
import { AVATAR_PRESETS, VOICE_PRESETS } from './constants';
import { qaScenarios } from './walkthrough-data';
import { generateContent, updateBackground, applyTheme, applyAvatarTheme, downloadBlob } from './demo-helpers';
import { handleImageGeneration, handleCameraCapture, handleUpload } from './demo-handlers';
import { setupWalkthrough } from './demo-walkthrough';
import { verifyToken, fetchUserProfile, ensureValidToken, displayUserProfile } from './auth';
import { loadSettings, saveSettings } from './settings';

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
    const cameraVideoContainer = document.getElementById('cameraVideoContainer') as HTMLDivElement;
    const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
    const closeCameraBtn = document.getElementById('closeCameraBtn') as HTMLButtonElement;

    const updateVideoContainerWidth = () => {
        if (cameraVideoContainer && cameraModal.classList.contains('active')) {
            const height = cameraVideoContainer.offsetHeight;
            const width = height * (704 / 1280);
            cameraVideoContainer.style.width = `${width}px`;
        }
    };

    window.addEventListener('resize', updateVideoContainerWidth);

    const googleSignInBtn = document.getElementById('googleSignInBtn') as HTMLDivElement;
    const userProfile = document.getElementById('userProfile') as HTMLDivElement;
    const userAvatar = document.getElementById('userAvatar') as HTMLImageElement;
    const userName = document.getElementById('userName') as HTMLSpanElement;

    // New Custom Avatar Name
    const customAvatarName = document.getElementById('customAvatarName') as HTMLInputElement;
    const newCustomAvatarBtn = document.getElementById('newCustomAvatarBtn') as HTMLButtonElement;
    const saveCustomAvatarBtn = document.getElementById('saveCustomAvatarBtn') as HTMLButtonElement;
    const toggleImageImprovement = document.getElementById('toggleImageImprovement') as HTMLInputElement;
    const imageProcessingMessage = document.getElementById('imageProcessingMessage') as HTMLParagraphElement;

    // Map to store custom avatars (name -> dataUrl)
    const customAvatars: Record<string, { image: string, type: 'custom', palette?: string[] }> = {};
    let detectedPalette: string[] = [];

    const elements = {
        tokenInput, userName, userAvatar, userProfile, googleSignInBtn,
        projectIdInput, locationInput, avatarNameSelect, sizeSelect, positionSelect,
        oauthClientIdInput, voiceSelect, languageSelect, saveVideoToggle, debugToggle,
        recordUserAudioCheckbox, micAutoRequestToggle, ctrlMic, ctrlCamera, ctrlScreen,
        ctrlMute, ctrlSnapshot, audioChunkSizeSlider, chunkSizeVal, systemInstructionInput,
        defaultGreetingInput, imagePromptInput, enableChromaKey, chromaKeyColor, backgroundColor,
        enableTranscript, enableChatInput, renderOutsideToggle, externalTranscriptSection,
        enableGrounding, customAvatarName, generatedImg, generatedImageContainer, newCustomAvatarBtn,
        saveCustomAvatarBtn, toggleImageImprovement, imageProcessingMessage, captureBtn, uploadBtn, generateImageBtn, luckyPersonaBtn, luckyGreetingBtn, luckyImageBtn, streamBtn
    };

    // Reactive State Store
    const appState = {
        projectId: '',
        location: 'us-central1',
        accessToken: '',
        oauthClientId: '',
        avatarName: 'Kira',
        voice: 'kore',
        language: 'en-US',
        size: '300px',
        position: 'top-right',
        saveVideo: false,
        debug: false,
        recordUserAudio: false,
        micAutoRequest: true,
        ctrlMic: true,
        ctrlCamera: true,
        ctrlScreen: true,
        ctrlMute: true,
        ctrlSnapshot: false,
        audioChunkSize: '2048',
        systemInstruction: '',
        defaultGreeting: '',
        imagePrompt: '',
        enableChromaKey: false,
        chromaKeyColor: 'green',
        backgroundColor: 'white',
        enableTranscript: false,
        enableChatInput: false,
        renderTranscriptOutside: false,
        enableGrounding: false,
        customAvatarName: '',
        tokenExpiry: 0,
        userAvatar: '',
        userName: ''
    };

    const store = new Proxy(appState as any, {
        set(target: any, property: string, value: any) {
            target[property] = value;
            // Trigger UI updates and validation!
            if (typeof validateForm === 'function') validateForm();
            return true;
        }
    });

    let tokenClient: any = null;



    function initGoogleAuth() {
        const clientId = oauthClientIdInput.value.trim();
        if (!clientId) return;

        try {
            // @ts-ignore
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                callback: async (response: any) => {
                    console.log('OAuth callback received', response);
                    if (response.error !== undefined) {
                        alert('OAuth Error: ' + response.error);
                        return;
                    }
                    store.accessToken = response.access_token;
                    const now = new Date().getTime();
                    store.tokenExpiry = now + (response.expires_in * 1000);
                    
                    localStorage.setItem('gemini_access_token', response.access_token);
                    localStorage.setItem('gemini_token_time', now.toString());
                    localStorage.setItem('gemini_token_expiry', store.tokenExpiry.toString());
                    
                    tokenInput.value = response.access_token;
                    
                    // Fetch user profile
                    await fetchUserProfile(response.access_token, elements, store);
                    
                    validateForm();
                },
            });

            // Add click listener to button
            if (googleSignInBtn) {
                googleSignInBtn.onclick = () => {
                    console.log('Google Sign-in button clicked');
                    tokenClient.requestAccessToken();
                };
            }
        } catch (e) {
            console.error('Failed to init Google Auth:', e);
        }
    }



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
    loadSettings(elements, store, customAvatars, avatar);
    if (localStorage.getItem('gemini_oauth_client_id')) {
        initGoogleAuth();
    }

    function validateForm() {
        const project = store.projectId.trim();
        const loc = store.location.trim();
        const token = store.accessToken.trim();
        const oauth = store.oauthClientId.trim();

        // Show/hide Google Sign-in button based on OAuth Client ID availability
        if (googleSignInBtn) {
            googleSignInBtn.classList.toggle('hidden', oauth.length === 0);
        }

        const isValid = project.length > 0 && loc.length > 0 && (token.length > 0 || oauth.length > 0);

        if (!avatar.isConnected && streamBtn) {
            streamBtn.disabled = !isValid;
        }
        
        // Lucky buttons require project, location, and token!
        const isLuckyValid = project.length > 0 && loc.length > 0 && token.length > 0;
        if (luckyPersonaBtn) luckyPersonaBtn.disabled = !isLuckyValid;
        if (luckyGreetingBtn) luckyGreetingBtn.disabled = !isLuckyValid;
        
        // Custom Avatar validation!
        const customName = store.customAvatarName.trim();
        const isCustomValid = customName.length > 0;
        
        const isValidForCustom = isLuckyValid && isCustomValid;
        
        if (cameraBtn) cameraBtn.disabled = !isValidForCustom;
        if (uploadBtn) uploadBtn.disabled = !isValidForCustom;
        if (generateImageBtn) generateImageBtn.disabled = !isValidForCustom;
        
        // Lucky image button only requires project, location, and token!
        if (luckyImageBtn) luckyImageBtn.disabled = !isLuckyValid;
        
        // Update tooltips
        const missingGeneral = [];
        if (project.length === 0) missingGeneral.push('Project ID');
        if (loc.length === 0) missingGeneral.push('Location');
        if (token.length === 0 && oauth.length === 0) missingGeneral.push('Access Token or OAuth Client ID');
        
        const generalMissingStr = missingGeneral.length > 0 ? ` (Missing: ${missingGeneral.join(', ')})` : '';

        const missingLucky = [];
        if (project.length === 0) missingLucky.push('Project ID');
        if (loc.length === 0) missingLucky.push('Location');
        if (token.length === 0) missingLucky.push('Access Token');
        
        const missingCustom = [...missingLucky];
        if (customName.length === 0) missingCustom.push('Avatar Name');
        
        const luckyMissingStr = missingLucky.length > 0 ? ` (Missing: ${missingLucky.join(', ')})` : '';
        const customMissingStr = missingCustom.length > 0 ? ` (Missing: ${missingCustom.join(', ')})` : '';
        
        if (saveBtn) saveBtn.setAttribute('data-tooltip', "Save configuration to local storage." + generalMissingStr);
        if (streamBtn) {
            if (avatar.isConnected) {
                streamBtn.setAttribute('data-tooltip', "Stop the avatar session.");
            } else {
                streamBtn.setAttribute('data-tooltip', "Start the avatar session." + generalMissingStr);
            }
        }

        if (luckyPersonaBtn) luckyPersonaBtn.setAttribute('data-tooltip', "Generate a random persona." + luckyMissingStr);
        if (luckyGreetingBtn) luckyGreetingBtn.setAttribute('data-tooltip', "Generate a default greeting." + luckyMissingStr);
        
        if (cameraBtn) cameraBtn.setAttribute('data-tooltip', "Take a photo with your camera to create a custom avatar." + customMissingStr);
        if (uploadBtn) uploadBtn.setAttribute('data-tooltip', "Upload an image to create a custom avatar." + customMissingStr);
        if (luckyImageBtn) luckyImageBtn.setAttribute('data-tooltip', "Generate a prompt for the avatar image." + luckyMissingStr);
        if (generateImageBtn) generateImageBtn.setAttribute('data-tooltip', "Generate an avatar image from prompt." + customMissingStr);
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



    // Listeners
    projectIdInput.addEventListener('input', () => store.projectId = projectIdInput.value);
    locationInput.addEventListener('input', () => store.location = locationInput.value);
    tokenInput.addEventListener('input', () => store.accessToken = tokenInput.value);
    tokenInput.addEventListener('change', async () => {
        const token = tokenInput.value.trim();
        if (token) {
            const data = await verifyToken(token);
            if (data && data.expires_in) {
                const now = new Date().getTime();
                store.tokenExpiry = now + (parseInt(data.expires_in) * 1000);
                console.log('Token verified, set expiry to:', store.tokenExpiry);
                
                const fallbackName = data.email || 'User';
                
                // Fetch user profile when manual token is valid
                await fetchUserProfile(token, elements, store);
                
                // If name was not set by fetchUserProfile, use email as fallback
                if (!store.userName) {
                    store.userName = fallbackName;
                    displayUserProfile(fallbackName, store.userAvatar || '', elements);
                }
            } else {
                alert('Invalid token or failed to verify.');
            }
        }
    });
    oauthClientIdInput.addEventListener('input', () => store.oauthClientId = oauthClientIdInput.value);
    oauthClientIdInput.addEventListener('change', () => initGoogleAuth());

    if (saveBtn) {
        saveBtn.onclick = () => {
            saveSettings(elements, store, customAvatars);
            
            alert('Configuration saved.');
        };
    }

    avatar.addEventListener('avatar-disconnected', () => {
        if (streamBtn) {
            streamBtn.textContent = 'Start';
            streamBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
            streamBtn.disabled = false;
        }
        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }
        validateForm();
    });

    avatar.addEventListener('avatar-setup-error', (e: any) => {
        const userName = store.userName || 'The current user';
        const projectName = store.projectId || 'the project';
        alert(`Something went wrong. Likely causes: User ${userName} has no permission to use the Gemini Live model in project ${projectName}.`);
    });

    function pollValidation() {
        validateForm();
        setTimeout(pollValidation, 500);
    }
    pollValidation();
    
    if (customAvatarName) {
        customAvatarName.addEventListener('input', () => {
            store.customAvatarName = customAvatarName.value;
            
            const newName = customAvatarName.value.trim();
            const oldName = avatarNameSelect.value;
            const hasImage = generatedImageContainer && generatedImageContainer.style.display !== 'none';
            
            // Show/hide New Custom Avatar and Save buttons
            if (newCustomAvatarBtn) {
                newCustomAvatarBtn.style.display = (newName && hasImage) ? 'inline-block' : 'none';
            }
            if (saveCustomAvatarBtn) {
                saveCustomAvatarBtn.style.display = (newName && hasImage) ? 'inline-block' : 'none';
            }
            
            // Rename custom avatar if conditions are met
            if (newName && oldName && customAvatars[oldName] && newName !== oldName && hasImage) {
                const imageData = customAvatars[oldName];
                delete customAvatars[oldName];
                customAvatars[newName] = imageData;
                
                // Update dropdown option
                for (let i = 0; i < avatarNameSelect.options.length; i++) {
                    if (avatarNameSelect.options[i].value === oldName) {
                        avatarNameSelect.options[i].value = newName;
                        avatarNameSelect.options[i].textContent = newName;
                        break;
                    }
                }
                avatarNameSelect.value = newName;
            }
        });
    }

    if (newCustomAvatarBtn) {
        newCustomAvatarBtn.onclick = () => {
            if (customAvatarName) customAvatarName.value = '';
            if (generatedImg) generatedImg.src = '';
            if (generatedImageContainer) generatedImageContainer.style.display = 'none';
            newCustomAvatarBtn.style.display = 'none';
            if (saveCustomAvatarBtn) saveCustomAvatarBtn.style.display = 'none';
            validateForm();
        };
    }

    if (saveCustomAvatarBtn) {
        saveCustomAvatarBtn.onclick = () => {
            const name = customAvatarName.value.trim();
            const imageUrl = generatedImg.src;
            if (name && imageUrl) {
                customAvatars[name] = { image: imageUrl, type: 'custom', palette: detectedPalette };
                updateDropdown(name);
                avatar.setAttribute('custom-avatar-url', imageUrl);
                localStorage.setItem('gemini_custom_avatars', JSON.stringify(customAvatars));
                alert(`Custom avatar "${name}" saved.`);
            }
        };
    }

    if (sizeSelect) sizeSelect.onchange = () => avatar.setAttribute('size', sizeSelect.value);
    if (positionSelect) positionSelect.onchange = () => avatar.setAttribute('position', positionSelect.value);
    
    if (avatarNameSelect) {
        avatarNameSelect.onchange = () => {
            const val = avatarNameSelect.value;
            applyAvatarTheme(val, avatar, customAvatars, { customAvatarName, generatedImg, generatedImageContainer, newCustomAvatarBtn });
            
            const preset = (AVATAR_PRESETS as any)[val];
            if (preset && preset.defaultGreeting) {
                defaultGreetingInput.value = preset.defaultGreeting;
            } else if (val === 'Custom') {
                defaultGreetingInput.value = 'Hi';
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
            if (!await ensureValidToken(store, tokenClient)) return;
            const name = avatarNameSelect.value;
            const voice = voiceSelect.value;
            const preset = (AVATAR_PRESETS as any)[name];
            let texture = preset ? preset.texture : 'nice and random';
            let mood = preset ? preset.mood : 'pleasant and engaging';
            
            const prompt = `Generate a nice, funny, earnest random persona for an AI avatar named ${name} with voice ${voice}. The avatar has style ${preset ? preset.style : 'custom'}, visual texture "${texture}" and mood "${mood}". Return only the persona description.`;
            
            try {
                luckyPersonaBtn.disabled = true;
                const originalText = luckyPersonaBtn.textContent;
                luckyPersonaBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt, projectIdInput.value, locationInput.value || 'us-central1', tokenInput.value);
                const text = data.candidates[0].content.parts[0].text;
                systemInstructionInput.value = text.trim();
                luckyPersonaBtn.textContent = originalText;
            } catch (e: any) {
                alert(`Failed to generate persona: ${e.message}`);
                luckyPersonaBtn.textContent = "I'm feeling lucky";
            } finally {
                luckyPersonaBtn.disabled = false;
            }
        };
    }

    if (luckyGreetingBtn) {
        luckyGreetingBtn.onclick = async () => {
            if (!await ensureValidToken(store, tokenClient)) return;
            const persona = systemInstructionInput.value;
            const name = avatarNameSelect.value;
            const preset = (AVATAR_PRESETS as any)[name];
            let texture = preset ? preset.texture : 'custom';
            let mood = preset ? preset.mood : 'pleasant';
            
            let prompt = '';
            if (persona) {
                prompt = `Generate a default greeting for an AI avatar with this persona: "${persona}". Return only the greeting text.`;
            } else {
                prompt = `Generate a default greeting for an AI avatar named ${name} with visual texture "${texture}" and mood "${mood}". Return only the greeting text.`;
            }
            
            try {
                luckyGreetingBtn.disabled = true;
                const originalText = luckyGreetingBtn.textContent;
                luckyGreetingBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt, projectIdInput.value, locationInput.value || 'us-central1', tokenInput.value);
                const text = data.candidates[0].content.parts[0].text;
                defaultGreetingInput.value = text.trim();
                luckyGreetingBtn.textContent = originalText;
            } catch (e: any) {
                alert(`Failed to generate greeting: ${e.message}`);
                luckyGreetingBtn.textContent = "I'm feeling lucky";
            } finally {
                luckyGreetingBtn.disabled = false;
            }
        };
    }

    if (luckyImageBtn) {
        luckyImageBtn.onclick = async () => {
            if (!await ensureValidToken(store, tokenClient)) return;
            const persona = systemInstructionInput.value;
            const name = avatarNameSelect.value;
            const preset = (AVATAR_PRESETS as any)[name];
            let texture = preset ? preset.texture : 'custom';
            let mood = preset ? preset.mood : 'pleasant';
            
            let prompt = '';
            if (persona) {
                prompt = `Generate an image generation prompt for a profile picture of an AI avatar with this persona: "${persona}". Return only the prompt text.`;
            } else {
                prompt = `Generate an image generation prompt for a profile picture of an AI avatar named ${name} with style ${preset ? preset.style : 'custom'}, visual texture "${texture}" and mood "${mood}". Return only the prompt text.`;
            }
            
            try {
                luckyImageBtn.disabled = true;
                const originalText = luckyImageBtn.textContent;
                luckyImageBtn.textContent = 'Thinking...';
                const data = await generateContent('gemini-3-flash-preview', prompt, projectIdInput.value, locationInput.value || 'us-central1', tokenInput.value);
                const text = data.candidates[0].content.parts[0].text;
                imagePromptInput.value = text.trim();
                luckyImageBtn.textContent = originalText;
            } catch (e: any) {
                alert(`Failed to generate image prompt: ${e.message}`);
                luckyImageBtn.textContent = "I'm feeling lucky";
            } finally {
                luckyImageBtn.disabled = false;
            }
        };
    }

    if (generateImageBtn) {
        generateImageBtn.onclick = async () => {
            if (!await ensureValidToken(store, tokenClient)) return;
            await handleImageGeneration(
                customAvatarName.value.trim(),
                imagePromptInput.value,
                enableChromaKey.checked,
                chromaKeyColor.value,
                backgroundColor.value,
                projectIdInput.value,
                locationInput.value || 'us-central1',
                tokenInput.value,
                customAvatars,
                avatar,
                { generateImageBtn, generatedImg, generatedImageContainer, customAvatarName },
                updateDropdown,
                (colors) => { detectedPalette = colors; }
            );
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
                // Wait for layout to finish before reading offsetHeight
                setTimeout(updateVideoContainerWidth, 0);
                
                const cameraSelect = document.getElementById('cameraSelect') as HTMLSelectElement;
                const cameraSelectContainer = document.getElementById('cameraSelectContainer') as HTMLDivElement;
                
                const populateCameras = async (currentDeviceId?: string) => {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(d => d.kind === 'videoinput');
                    
                    if (cameraSelectContainer) {
                        cameraSelectContainer.style.display = videoDevices.length > 1 ? 'block' : 'none';
                    }
                    
                    if (cameraSelect) {
                        cameraSelect.innerHTML = '';
                        videoDevices.forEach(d => {
                            const opt = document.createElement('option');
                            opt.value = d.deviceId;
                            opt.textContent = d.label || `Camera ${cameraSelect.options.length + 1}`;
                            cameraSelect.appendChild(opt);
                        });
                        
                        if (currentDeviceId) {
                            cameraSelect.value = currentDeviceId;
                        }
                        
                        cameraSelect.onchange = async () => {
                            const stream = cameraVideo.srcObject as MediaStream;
                            if (stream) {
                                stream.getTracks().forEach(track => track.stop());
                            }
                            await startStream(cameraSelect.value);
                        };
                    }
                };

                const startStream = async (deviceId?: string) => {
                    try {
                        const constraints: MediaStreamConstraints = {
                            video: {
                                width: { ideal: 704 },
                                height: { ideal: 1280 },
                                aspectRatio: 704/1280
                            }
                        };
                        if (deviceId) {
                            (constraints.video as any).deviceId = { exact: deviceId };
                        } else {
                            (constraints.video as any).facingMode = 'user';
                        }
                        
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        cameraVideo.srcObject = stream;
                        
                        // Labels might only be available AFTER getUserMedia!
                        const actualDeviceId = deviceId || stream.getVideoTracks()[0]?.getSettings().deviceId;
                        await populateCameras(actualDeviceId);
                    } catch (e) {
                        console.error('Camera access error:', e);
                        // Fallback
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                            cameraVideo.srcObject = stream;
                        } catch (e2) {
                            alert('Failed to access camera: ' + e2);
                            cameraModal.classList.remove('active');
                        }
                    }
                };

                await startStream();
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
            if (!await ensureValidToken(store, tokenClient)) return;
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }
            await handleCameraCapture(
                cameraVideo,
                name,
                enableChromaKey.checked,
                chromaKeyColor.value,
                backgroundColor.value,
                toggleImageImprovement.checked,
                projectIdInput.value,
                locationInput.value || 'us-central1',
                tokenInput.value,
                customAvatars,
                avatar,
                { generatedImg, generatedImageContainer, customAvatarName, captureBtn, cameraModal, imageProcessingMessage },
                updateDropdown,
                (colors) => { detectedPalette = colors; }
            );
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
                if (!await ensureValidToken(store, tokenClient)) return;
                const file = e.target.files[0];
                if (file) {
                    await handleUpload(
                        file,
                        name,
                        enableChromaKey.checked,
                        chromaKeyColor.value,
                        backgroundColor.value,
                        toggleImageImprovement.checked,
                        projectIdInput.value,
                        locationInput.value || 'us-central1',
                        tokenInput.value,
                        customAvatars,
                        avatar,
                        { generatedImg, generatedImageContainer, customAvatarName, uploadBtn, imageProcessingMessage },
                        updateDropdown,
                        (colors) => { detectedPalette = colors; }
                    );
                }
            };
            input.click();
        };
    }

    // Feature Walkthrough Logic
    setupWalkthrough(qaScenarios, qaContainer, qaList, toggleQaBtn, avatar);

    if (copyHtmlBtn) copyHtmlBtn.setAttribute('data-tooltip', "Copy the HTML embed code for this avatar.");
    if (toggleQaBtn) toggleQaBtn.setAttribute('data-tooltip', "Open or close the Feature Walkthrough panel.");
    if (externalSendBtn) externalSendBtn.setAttribute('data-tooltip', "Send message to the avatar.");
    if (newCustomAvatarBtn) newCustomAvatarBtn.setAttribute('data-tooltip', "Clear inputs to create another custom avatar.");
    if (saveCustomAvatarBtn) saveCustomAvatarBtn.setAttribute('data-tooltip', "Save current custom avatar to presets.");
    if (captureBtn) captureBtn.setAttribute('data-tooltip', "Capture photo from camera.");
    if (closeCameraBtn) closeCameraBtn.setAttribute('data-tooltip', "Close camera modal.");

    // Sync store with loaded values
    store.projectId = projectIdInput.value;
    store.location = locationInput.value;
    store.accessToken = tokenInput.value;
    store.oauthClientId = oauthClientIdInput.value;
    store.avatarName = avatarNameSelect.value;
    store.voice = voiceSelect.value;
    store.language = languageSelect.value;
    store.size = sizeSelect.value;
    store.position = positionSelect.value;
    store.saveVideo = saveVideoToggle.checked;
    store.debug = debugToggle.checked;
    if (recordUserAudioCheckbox) store.recordUserAudio = recordUserAudioCheckbox.checked;
    if (micAutoRequestToggle) store.micAutoRequest = micAutoRequestToggle.checked;
    store.ctrlMic = ctrlMic.checked;
    store.ctrlCamera = ctrlCamera.checked;
    store.ctrlScreen = ctrlScreen.checked;
    store.ctrlMute = ctrlMute.checked;
    store.ctrlSnapshot = ctrlSnapshot.checked;
    store.audioChunkSize = audioChunkSizeSlider.value;
    store.systemInstruction = systemInstructionInput.value;
    store.defaultGreeting = defaultGreetingInput.value;
    store.imagePrompt = imagePromptInput.value;
    store.enableChromaKey = enableChromaKey.checked;
    store.chromaKeyColor = chromaKeyColor.value;
    store.backgroundColor = backgroundColor.value;
    store.enableTranscript = enableTranscript.checked;
    store.enableChatInput = enableChatInput.checked;
    store.renderTranscriptOutside = renderOutsideToggle.checked;
    if (enableGrounding) store.enableGrounding = enableGrounding.checked;
    if (customAvatarName) store.customAvatarName = customAvatarName.value;
    
    // Initial apply
    updateVisibleControls();
    validateForm();
    
    // Restore Start button listener!
    if (streamBtn) {
        streamBtn.onclick = async () => {
            if (avatar.isConnected) {
                const savingVideo = saveVideoToggle.checked;
                if (savingVideo) {
                    streamBtn.textContent = 'Processing video...';
                    streamBtn.disabled = true;
                }
                await avatar.stop();
                streamBtn.textContent = 'Start';
                streamBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; // Green!
                streamBtn.disabled = false;
                if (statsInterval) {
                    clearInterval(statsInterval);
                    statsInterval = null;
                }
            } else {
                if (!await ensureValidToken(store, tokenClient)) return;
                // Update attributes!
                avatar.setAttribute('access-token', tokenInput.value);
                avatar.setAttribute('project-id', projectIdInput.value);
                avatar.setAttribute('location', locationInput.value || 'us-central1');
                avatar.setAttribute('avatar-name', avatarNameSelect.value);
                avatar.setAttribute('voice', voiceSelect.value);
                avatar.setAttribute('language', languageSelect.value);
                avatar.setAttribute('system-instruction', systemInstructionInput.value);
                avatar.setAttribute('default-greeting', defaultGreetingInput.value);
                avatar.setAttribute('save-video', saveVideoToggle.checked.toString());
                avatar.setAttribute('debug', debugToggle.checked.toString());
                if (recordUserAudioCheckbox) {
                    avatar.setAttribute('record-user-audio', recordUserAudioCheckbox.checked.toString());
                }
                
                try {
                    streamBtn.disabled = true;
                    streamBtn.textContent = 'Connecting...';
                    
                    await avatar.start();
                    
                    streamBtn.textContent = 'Stop';
                    streamBtn.style.background = '#ea4335'; // Red!
                    streamBtn.disabled = false;
                    
                    // Start stats interval
                    statsInterval = setInterval(updateStats, 1000);
                } catch (e: any) {
                    alert('Failed to start session: ' + e.message);
                    streamBtn.textContent = 'Start';
                    streamBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    streamBtn.disabled = false;
                }
            }
        };
    }
});


let statsInterval: any = null;
