document.addEventListener('DOMContentLoaded', () => {
    console.log('Script started');
    const avatar = document.getElementById('my-avatar');
    const saveBtn = document.getElementById('saveBtn');
    const tokenInput = document.getElementById('accessToken');
    const saveVideoToggle = document.getElementById('saveVideoToggle');
    const debugToggle = document.getElementById('debugToggle');
    const projectIdInput = document.getElementById('projectId');
    const locationInput = document.getElementById('location');
    const avatarNameSelect = document.getElementById('avatarName');
    const voiceSelect = document.getElementById('voiceSelect');
    const languageSelect = document.getElementById('languageSelect');
    const sizeSelect = document.getElementById('size');
    const positionSelect = document.getElementById('position');
    const oauthClientIdInput = document.getElementById('oauthClientId');
    
    // Load from localStorage
    const savedToken = localStorage.getItem('gemini_access_token');
    const savedTime = localStorage.getItem('gemini_token_time');
    
    if (savedToken && savedTime) {
        const now = new Date().getTime();
        const oneHour = 60 * 60 * 1000;
        if (now - savedTime < oneHour) {
            tokenInput.value = savedToken;
            console.log('Loaded token from localStorage');
        } else {
            console.log('Saved token expired');
            localStorage.removeItem('gemini_access_token');
            localStorage.removeItem('gemini_token_time');
        }
    }
    
    // Load other settings
    if (localStorage.getItem('gemini_project_id')) projectIdInput.value = localStorage.getItem('gemini_project_id');
    if (localStorage.getItem('gemini_location')) locationInput.value = localStorage.getItem('gemini_location');
    if (localStorage.getItem('gemini_avatar_name')) {
        avatarNameSelect.value = localStorage.getItem('gemini_avatar_name');
        avatar.setPreview(avatarNameSelect.value);
    }
    if (localStorage.getItem('gemini_size')) {
        sizeSelect.value = localStorage.getItem('gemini_size');
        avatar.setAttribute('size', sizeSelect.value);
    }
    if (localStorage.getItem('gemini_position')) {
        positionSelect.value = localStorage.getItem('gemini_position');
        avatar.setAttribute('position', positionSelect.value);
    }
    if (localStorage.getItem('gemini_oauth_client_id')) oauthClientIdInput.value = localStorage.getItem('gemini_oauth_client_id');
    if (localStorage.getItem('gemini_voice')) voiceSelect.value = localStorage.getItem('gemini_voice');
    if (localStorage.getItem('gemini_language')) languageSelect.value = localStorage.getItem('gemini_language');
    
    avatarNameSelect.onchange = () => {
        avatar.setPreview(avatarNameSelect.value);
        const customControls = document.getElementById('customAvatarControls');
        if (avatarNameSelect.value === 'Custom') {
            customControls.style.display = 'block';
        } else {
            customControls.style.display = 'none';
        }
    };
    
    // Handle initial state
    const customControls = document.getElementById('customAvatarControls');
    if (avatarNameSelect.value === 'Custom') {
        customControls.style.display = 'block';
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreviewContainer = document.getElementById('avatarPreviewContainer');
    const customAvatarPreview = document.getElementById('customAvatarPreview');
    
    uploadBtn.onclick = () => avatarUpload.click();
    
    avatarUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 720;
                canvas.height = 1280;
                const ctx = canvas.getContext('2d');
                
                // Draw image covering the canvas
                const imgRatio = img.width / img.height;
                const targetRatio = 720 / 1280;
                
                let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
                
                if (imgRatio > targetRatio) {
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    sourceHeight = img.width / targetRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }
                
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 720, 1280);
                
                const dataURL = canvas.toDataURL('image/png');
                const base64Data = dataURL.split(',')[1];
                
                avatar.customAvatar = {
                    image_data: base64Data,
                    image_mime_type: 'png'
                };
                
                customAvatarPreview.src = dataURL;
                avatarPreviewContainer.style.display = 'block';
                
                // Hide component preview when custom is selected and loaded
                avatar.setPreview('AudioOnly'); // This hides it
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    
    const cameraModal = document.getElementById('cameraModal');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('captureBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    let cameraStream = null;
    
    cameraBtn.onclick = async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', aspectRatio: 9/16 } });
            cameraVideo.srcObject = cameraStream;
            cameraModal.classList.add('active');
        } catch (err) {
            console.error("Failed to access camera:", err);
            alert("Failed to access camera. Please ensure permissions are granted.");
        }
    };
    
    captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d');
        
        // Draw video frame covering the canvas
        const videoRatio = cameraVideo.videoWidth / cameraVideo.videoHeight;
        const targetRatio = 720 / 1280;
        
        let sourceX = 0, sourceY = 0, sourceWidth = cameraVideo.videoWidth, sourceHeight = cameraVideo.videoHeight;
        
        if (videoRatio > targetRatio) {
            sourceWidth = cameraVideo.videoHeight * targetRatio;
            sourceX = (cameraVideo.videoWidth - sourceWidth) / 2;
        } else {
            sourceHeight = cameraVideo.videoWidth / targetRatio;
            sourceY = (cameraVideo.videoHeight - sourceHeight) / 2;
        }
        
        ctx.drawImage(cameraVideo, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 720, 1280);
        
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        
        avatar.customAvatar = {
            image_data: base64Data,
            image_mime_type: 'png'
        };
        
        customAvatarPreview.src = dataURL;
        avatarPreviewContainer.style.display = 'block';
        
        // Hide component preview
        avatar.setPreview('AudioOnly');
        
        closeCamera();
    };
    
    closeCameraBtn.onclick = () => closeCamera();
    
    function closeCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraVideo.srcObject = null;
        cameraModal.classList.remove('active');
    }
    
    const savedSaveVideo = localStorage.getItem('gemini_save_video_option');
    if (savedSaveVideo !== null) {
        saveVideoToggle.checked = savedSaveVideo === 'true';
    }
    
    const savedDebug = localStorage.getItem('gemini_debug_option');
    if (savedDebug !== null) {
        debugToggle.checked = savedDebug === 'true';
    }
    
    const tokenMandatory = document.querySelector('.token-mandatory');
    const oauthMandatory = document.querySelector('.oauth-mandatory');
    const streamBtn = document.getElementById('streamBtn');
    
    // Disable stream button by default
    streamBtn.disabled = true;
    streamBtn.style.opacity = '0.5';
    streamBtn.style.cursor = 'not-allowed';
    streamBtn.style.background = '#475569';
    
    function validateForm() {
        const project = projectIdInput.value.trim();
        const loc = locationInput.value.trim();
        const token = tokenInput.value.trim();
        const oauth = oauthClientIdInput.value.trim();
        
        const hasProject = project.length > 0;
        const hasLoc = loc.length > 0;
        const hasToken = token.length > 0;
        const hasOauth = oauth.length > 0;
        
        // Conditional mandatory flags
        if (hasToken || hasOauth) {
            if (tokenMandatory) tokenMandatory.style.display = 'none';
            if (oauthMandatory) oauthMandatory.style.display = 'none';
        } else {
            if (tokenMandatory) tokenMandatory.style.display = 'inline';
            if (oauthMandatory) oauthMandatory.style.display = 'inline';
        }
        
        const isValid = hasProject && hasLoc && (hasToken || hasOauth);
        saveBtn.disabled = !isValid;
        
        // Style button based on state
        if (saveBtn.disabled) {
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.style.background = '#475569';
        } else {
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            saveBtn.style.background = 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)';
        }
        
        // Also handle streamBtn if not connected
        if (avatar && !avatar.isConnected) {
            streamBtn.disabled = !isValid;
            if (streamBtn.disabled) {
                streamBtn.style.opacity = '0.5';
                streamBtn.style.cursor = 'not-allowed';
                streamBtn.style.background = '#475569';
            } else {
                streamBtn.style.opacity = '1';
                streamBtn.style.cursor = 'pointer';
                streamBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Green for Start
            }
        }
        
    }
    
    // Add event listeners
    projectIdInput.addEventListener('input', validateForm);
    locationInput.addEventListener('input', validateForm);
    tokenInput.addEventListener('input', validateForm);
    oauthClientIdInput.addEventListener('input', validateForm);
    
    projectIdInput.addEventListener('change', validateForm);
    locationInput.addEventListener('change', validateForm);
    tokenInput.addEventListener('change', validateForm);
    oauthClientIdInput.addEventListener('change', validateForm);
    
    projectIdInput.addEventListener('keyup', validateForm);
    locationInput.addEventListener('keyup', validateForm);
    tokenInput.addEventListener('keyup', validateForm);
    oauthClientIdInput.addEventListener('keyup', validateForm);
    
    // Immediate application for size and position
    if (sizeSelect) {
        sizeSelect.onchange = () => {
            const size = sizeSelect.value;
            if (size) avatar.setAttribute('size', size);
        };
    }
    
    if (positionSelect) {
        positionSelect.onchange = () => {
            const pos = positionSelect.value;
            if (pos) avatar.setAttribute('position', pos);
        };
    }
    
    // Listen for connection events to toggle Stream button
    avatar.addEventListener('avatar-connected', () => {
        streamBtn.disabled = false;
        streamBtn.style.opacity = '1';
        streamBtn.style.cursor = 'pointer';
        streamBtn.textContent = 'Stop';
        streamBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // Red for Stop
    });
    
    avatar.addEventListener('avatar-disconnected', () => {
        streamBtn.textContent = 'Start';
        validateForm(); // Restore green or disabled state
    });
    
    console.log('Listeners added');
    // Polling validation as fallback for event issues
    function pollValidation() {
        validateForm();
        setTimeout(pollValidation, 500); // Poll every 500ms
    }
    pollValidation();
    
    saveBtn.onclick = () => {
        console.log('saveBtn clicked');
        const token = tokenInput.value;
        const project = projectIdInput.value;
        const loc = locationInput.value;
        const name = avatarNameSelect.value;
        const size = sizeSelect.value;
        const pos = positionSelect.value;
        const clientId = oauthClientIdInput.value;
        
        // Persist settings
        localStorage.setItem('gemini_project_id', project);
        localStorage.setItem('gemini_location', loc);
        localStorage.setItem('gemini_avatar_name', name);
        localStorage.setItem('gemini_size', size);
        localStorage.setItem('gemini_position', pos);
        localStorage.setItem('gemini_oauth_client_id', clientId);
        localStorage.setItem('gemini_voice', voiceSelect.value);
        localStorage.setItem('gemini_language', languageSelect.value);
        
        // Persist token if specified
        if (token) {
            localStorage.setItem('gemini_access_token', token);
            localStorage.setItem('gemini_token_time', new Date().getTime());
        } else {
            localStorage.removeItem('gemini_access_token');
            localStorage.removeItem('gemini_token_time');
        }
        
        localStorage.setItem('gemini_save_video_option', saveVideoToggle.checked);
        localStorage.setItem('gemini_debug_option', debugToggle.checked);
        
        showModal('Info', 'Configuration saved.');
    };
    
    streamBtn.onclick = () => {
        if (avatar.isConnected) {
            avatar.disconnect();
        } else {
            // Apply current input values to component before connecting
            const token = tokenInput.value;
            const project = projectIdInput.value;
            const loc = locationInput.value;
            const name = avatarNameSelect.value;
            const size = sizeSelect.value;
            const pos = positionSelect.value;
            const clientId = oauthClientIdInput.value;
            
            if (project) avatar.setAttribute('project-id', project);
            if (loc) avatar.setAttribute('location', loc);
            
            if (name === 'AudioOnly') {
                avatar.setAttribute('output-mode', 'audio');
            } else {
                avatar.setAttribute('output-mode', 'video');
                if (name) avatar.setAttribute('avatar-name', name);
            }
            
            if (size) avatar.setAttribute('size', size);
            if (pos) avatar.setAttribute('position', pos);
            if (clientId) avatar.setAttribute('oauth-client-id', clientId);
            if (token) avatar.setAttribute('access-token', token);
            
            const voice = voiceSelect.value;
            const language = languageSelect.value;
            if (voice) avatar.setAttribute('voice', voice);
            if (language) avatar.setAttribute('language', language);
            
            avatar.setAttribute('record-video', saveVideoToggle ? saveVideoToggle.checked : false);
            avatar.setAttribute('debug', debugToggle ? debugToggle.checked : false);

            avatar.tryConnect();
            
            // Unmute by default in demo app (user gesture)
            avatar.toggleMute();
        }
    };
    
    const sendBtn = document.getElementById('sendBtn');
    const textInput = document.getElementById('textInput');
    
    sendBtn.onclick = () => {
        const text = textInput.value;
        if (text) {
            if (typeof avatar.sendText === 'function') {
                avatar.sendText(text);
                textInput.value = '';
            } else {
                showModal('Error', 'Avatar component not ready or sendText method missing.');
            }
        }
    };

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
    

    
    // Modal Logic
    const customModal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    function showModal(title, text) {
        console.log('showModal called', { title, text });
        modalTitle.textContent = title;
        modalText.textContent = text;
        customModal.classList.add('active');
    }
    
    modalCloseBtn.onclick = () => {
        customModal.classList.remove('active');
    };
    
    window.onclick = (event) => {
        if (event.target === customModal) {
            customModal.classList.remove('active');
        }
    };
});
