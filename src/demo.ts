import { GeminiAvatar } from './gemini-avatar';

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

    // Listeners
    [projectIdInput, locationInput, tokenInput, oauthClientIdInput].forEach(el => {
        el.addEventListener('input', validateForm);
    });

    sizeSelect.onchange = () => avatar.setAttribute('size', sizeSelect.value);
    positionSelect.onchange = () => avatar.setAttribute('position', positionSelect.value);
    avatarNameSelect.onchange = () => avatar.setPreview(avatarNameSelect.value);

    avatar.addEventListener('avatar-connected', () => {
        streamBtn.disabled = false;
        streamBtn.textContent = 'Stop';
        streamBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    });

    avatar.addEventListener('avatar-disconnected', () => {
        streamBtn.textContent = 'Start';
        streamBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        validateForm();
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
                        await ffmpeg.writeFile('audio.webm', await fetchFile(audioBlob));
                        
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
                            '-i', 'audio.webm', 
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
            }, 1000);
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

            if (avatarNameSelect.value === 'AudioOnly') {
                avatar.setAttribute('output-mode', 'audio');
            } else {
                avatar.setAttribute('output-mode', 'video');
            }

            avatar.start();
            avatar.unmute(); // Unmute by default on start
        }
    };

    sendBtn.onclick = () => {
        const text = textInput.value;
        if (text) {
            avatar.sendMessage(text);
            textInput.value = '';
        }
    };

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

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

            const htmlCode = `<gemini-avatar
    project-id="${project}"
    location="${loc}"
    avatar-name="${name}"
    size="${size}"
    position="${pos}"
    voice="${voice}"
    language="${lang}"
></gemini-avatar>`;

            navigator.clipboard.writeText(htmlCode).then(() => {
                alert('HTML code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy code. See console for details.');
            });
        };
    }

    validateForm();
});
