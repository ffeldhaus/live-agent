import { applyAvatarTheme, updateBackground, applyTheme } from './demo-helpers';
import { AVATAR_PRESETS } from './constants';
import { displayUserProfile } from './auth';

export function loadSettings(elements: any, store: any, customAvatars: Record<string, string>, avatar: any) {
    const savedToken = localStorage.getItem('gemini_access_token');
    const savedExpiry = localStorage.getItem('gemini_token_expiry');
    const savedUserName = localStorage.getItem('gemini_user_name');
    const savedUserAvatar = localStorage.getItem('gemini_user_avatar');

    if (savedToken) {
        const now = new Date().getTime();
        const expiry = savedExpiry ? parseInt(savedExpiry) : 0;
        
        if (now >= expiry) {
            localStorage.removeItem('gemini_access_token');
            localStorage.removeItem('gemini_token_expiry');
            localStorage.removeItem('gemini_token_time');
            localStorage.removeItem('gemini_user_name');
            localStorage.removeItem('gemini_user_avatar');
            store.accessToken = '';
        } else {
            store.accessToken = savedToken;
            elements.tokenInput.value = savedToken;
            store.tokenExpiry = expiry;
            
            if (savedUserName && savedUserAvatar) {
                store.userName = savedUserName;
                store.userAvatar = savedUserAvatar;
                displayUserProfile(savedUserName, savedUserAvatar, elements);
            }
        }
    }

    if (localStorage.getItem('gemini_project_id')) elements.projectIdInput.value = localStorage.getItem('gemini_project_id')!;
    if (localStorage.getItem('gemini_location')) elements.locationInput.value = localStorage.getItem('gemini_location')!;
    if (localStorage.getItem('gemini_oauth_client_id')) elements.oauthClientIdInput.value = localStorage.getItem('gemini_oauth_client_id')!;
    
    const savedCustomAvatars = localStorage.getItem('gemini_custom_avatars');
    if (savedCustomAvatars) {
        const data = JSON.parse(savedCustomAvatars);
        Object.keys(data).forEach(name => {
            const val = data[name];
            const imageUrl = typeof val === 'string' ? val : val.image;
            const type = typeof val === 'string' ? 'custom' : val.type;
            
            customAvatars[name] = {
              image: imageUrl,
              originalImage: typeof val === 'string' ? undefined : val.originalImage,
              type: type as "custom",
            };
            
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elements.avatarNameSelect.appendChild(option);
        });
    }

    if (localStorage.getItem('gemini_avatar_name')) {
        const name = localStorage.getItem('gemini_avatar_name')!;
        elements.avatarNameSelect.value = name;
        avatar.setAttribute('avatar-name', name);
        applyAvatarTheme(name, avatar, customAvatars, elements);
        
        const preset = (AVATAR_PRESETS as any)[name];
        if (preset && preset.defaultGreeting) {
            elements.defaultGreetingInput.value = preset.defaultGreeting;
        }
    } else {
        elements.avatarNameSelect.value = 'Kira';
        applyAvatarTheme('Kira', avatar, customAvatars, elements);
        
        const preset = (AVATAR_PRESETS as any)['Kira'];
        if (preset && preset.defaultGreeting) {
            elements.defaultGreetingInput.value = preset.defaultGreeting;
        }
    }
    
    if (localStorage.getItem('gemini_size')) {
        elements.sizeSelect.value = localStorage.getItem('gemini_size')!;
        avatar.setAttribute('size', elements.sizeSelect.value);
    }
    if (localStorage.getItem('gemini_position')) {
        elements.positionSelect.value = localStorage.getItem('gemini_position')!;
        avatar.setAttribute('position', elements.positionSelect.value);
    }
    if (localStorage.getItem('gemini_voice')) elements.voiceSelect.value = localStorage.getItem('gemini_voice')!;
    if (localStorage.getItem('gemini_language')) elements.languageSelect.value = localStorage.getItem('gemini_language')!;

    elements.saveVideoToggle.checked = localStorage.getItem('gemini_save_video') === 'true';
    elements.debugToggle.checked = localStorage.getItem('gemini_debug') === 'true';
    avatar.setAttribute('debug', elements.debugToggle.checked.toString());
    avatar.setAttribute('record-video', elements.saveVideoToggle.checked.toString());
    if (elements.recordUserAudioCheckbox) {
        elements.recordUserAudioCheckbox.checked = localStorage.getItem('gemini_record_user_audio') === 'true';
    }
    
    if (elements.micAutoRequestToggle) {
        elements.micAutoRequestToggle.checked = localStorage.getItem('gemini_mic_auto_request') !== 'false';
        avatar.setAttribute('mic-auto-request', elements.micAutoRequestToggle.checked.toString());
    }
    
    const loadCtrlState = (id: string, defaultValue: boolean) => {
        const saved = localStorage.getItem(`gemini_ctrl_${id}`);
        return saved !== null ? saved === 'true' : defaultValue;
    };
    
    elements.ctrlMic.checked = loadCtrlState('mic', true);
    elements.ctrlCamera.checked = loadCtrlState('camera', true);
    elements.ctrlScreen.checked = loadCtrlState('screen', true);
    elements.ctrlMute.checked = loadCtrlState('mute', true);
    elements.ctrlSnapshot.checked = loadCtrlState('snapshot', false);
    elements.ctrlSettings.checked = loadCtrlState('settings', true);

    if (localStorage.getItem('gemini_audio_chunk_size')) {
        elements.audioChunkSizeSlider.value = localStorage.getItem('gemini_audio_chunk_size')!;
        elements.chunkSizeVal.textContent = elements.audioChunkSizeSlider.value;
        avatar.setAttribute('audio-chunk-size', elements.audioChunkSizeSlider.value);
    }

    if (localStorage.getItem('gemini_system_instruction')) elements.systemInstructionInput.value = localStorage.getItem('gemini_system_instruction')!;
    if (localStorage.getItem('gemini_default_greeting')) elements.defaultGreetingInput.value = localStorage.getItem('gemini_default_greeting')!;
    if (localStorage.getItem('gemini_image_prompt')) elements.imagePromptInput.value = localStorage.getItem('gemini_image_prompt')!;

    elements.enableChromaKey.checked =
      localStorage.getItem("gemini_enable_chroma_key") === "true";
    if (localStorage.getItem("gemini_chroma_key_color"))
      elements.chromaKeyColor.value = localStorage.getItem(
        "gemini_chroma_key_color",
      )!;

    
    avatar.setAttribute(
      "enable-chroma-key",
      elements.enableChromaKey.checked.toString(),
    );
    avatar.setAttribute("chroma-key-color", elements.chromaKeyColor.value);
    avatar.setAttribute("background-color", "transparent");

    if (localStorage.getItem("gemini_chroma_key_tolerance")) {
      elements.chromaKeyTolerance.value = localStorage.getItem("gemini_chroma_key_tolerance")!;
      elements.chromaKeyToleranceVal.textContent = elements.chromaKeyTolerance.value;
      avatar.setAttribute("chroma-key-tolerance", elements.chromaKeyTolerance.value);
    } else {
      elements.chromaKeyTolerance.value = "50";
      elements.chromaKeyToleranceVal.textContent = "50";
      avatar.setAttribute("chroma-key-tolerance", "50");
    }

    elements.enableTranscript.checked = localStorage.getItem('gemini_enable_transcript') === 'true';
    elements.enableChatInput.checked = localStorage.getItem('gemini_enable_chat_input') === 'true';
    avatar.setAttribute('enable-transcript', elements.enableTranscript.checked.toString());
    avatar.setAttribute('enable-chat-input', elements.enableChatInput.checked.toString());
    
    const savedResumption = localStorage.getItem('gemini_enable_session_resumption');
    elements.enableSessionResumption.checked = savedResumption !== null ? savedResumption === 'true' : false;
    avatar.setAttribute('enable-session-resumption', elements.enableSessionResumption.checked.toString());
    
    elements.renderOutsideToggle.checked = localStorage.getItem('gemini_enable_transcript_outside') === 'true';
    avatar.setAttribute('render-transcript-outside', elements.renderOutsideToggle.checked.toString());
    if (elements.externalTranscriptSection) {
        elements.externalTranscriptSection.style.display = elements.renderOutsideToggle.checked ? 'block' : 'none';
    }

    const savedBg = localStorage.getItem('gemini_background_image');
    if (savedBg) {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const finalUrl = isLocal && savedBg.startsWith('http') ? `/proxy?url=${encodeURIComponent(savedBg)}` : savedBg;
        
        document.body.style.backgroundImage = `url(${finalUrl})`;
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundSize = 'cover';
        document.body.classList.remove('animated-bg');
        if (elements.bgImageUrl) elements.bgImageUrl.value = savedBg.startsWith('data:') ? "Stored Image" : savedBg;
    } else {
        document.body.classList.add('animated-bg');
    }

    if (elements.enableGrounding) {
        elements.enableGrounding.checked = localStorage.getItem('gemini_enable_grounding') === 'true';
        avatar.setAttribute('enable-grounding', elements.enableGrounding.checked.toString());
    }
}

export function saveSettings(elements: any, store: any, customAvatars: Record<string, string>) {
    localStorage.setItem('gemini_project_id', elements.projectIdInput.value);
    localStorage.setItem('gemini_location', elements.locationInput.value);
    localStorage.setItem('gemini_avatar_name', elements.avatarNameSelect.value);
    localStorage.setItem('gemini_size', elements.sizeSelect.value);
    localStorage.setItem('gemini_position', elements.positionSelect.value);
    localStorage.setItem('gemini_oauth_client_id', elements.oauthClientIdInput.value);
    localStorage.setItem('gemini_voice', elements.voiceSelect.value);
    localStorage.setItem('gemini_language', elements.languageSelect.value);
    
    const bgUrl = elements.bgImageUrl.value;
    if (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('data:'))) {
        localStorage.setItem('gemini_background_image', bgUrl);
    }
    
    const token = elements.tokenInput.value;
    if (token) {
      localStorage.setItem("gemini_access_token", token);
      localStorage.setItem(
        "gemini_token_time",
        new Date().getTime().toString(),
      );
      localStorage.setItem("gemini_token_expiry", store.tokenExpiry.toString());
      localStorage.setItem("gemini_user_name", store.userName);
      localStorage.setItem("gemini_user_avatar", store.userAvatar);
    } else {
      localStorage.removeItem("gemini_access_token");
      localStorage.removeItem("gemini_token_time");
      localStorage.removeItem("gemini_token_expiry");
      localStorage.removeItem("gemini_user_name");
      localStorage.removeItem("gemini_user_avatar");
    }

    localStorage.setItem(
      "gemini_save_video",
      elements.saveVideoToggle.checked.toString(),
    );
    localStorage.setItem(
      "gemini_debug",
      elements.debugToggle.checked.toString(),
    );
    if (elements.recordUserAudioCheckbox) {
      localStorage.setItem(
        "gemini_record_user_audio",
        elements.recordUserAudioCheckbox.checked.toString(),
      );
    }
    if (elements.micAutoRequestToggle) {
      localStorage.setItem(
        "gemini_mic_auto_request",
        elements.micAutoRequestToggle.checked.toString(),
      );
    }

    localStorage.setItem(
      "gemini_ctrl_mic",
      elements.ctrlMic.checked.toString(),
    );
    localStorage.setItem(
      "gemini_ctrl_camera",
      elements.ctrlCamera.checked.toString(),
    );
    localStorage.setItem(
      "gemini_ctrl_screen",
      elements.ctrlScreen.checked.toString(),
    );
    localStorage.setItem(
      "gemini_ctrl_mute",
      elements.ctrlMute.checked.toString(),
    );
    localStorage.setItem(
      "gemini_ctrl_snapshot",
      elements.ctrlSnapshot.checked.toString(),
    );
    localStorage.setItem(
      "gemini_ctrl_settings",
      elements.ctrlSettings.checked.toString(),
    );

    localStorage.setItem(
      "gemini_audio_chunk_size",
      elements.audioChunkSizeSlider.value,
    );
    localStorage.setItem(
      "gemini_system_instruction",
      elements.systemInstructionInput.value,
    );
    localStorage.setItem(
      "gemini_default_greeting",
      elements.defaultGreetingInput.value,
    );
    localStorage.setItem(
      "gemini_image_prompt",
      elements.imagePromptInput.value,
    );

    localStorage.setItem(
      "gemini_enable_chroma_key",
      elements.enableChromaKey.checked.toString(),
    );
    localStorage.setItem(
      "gemini_chroma_key_color",
      elements.chromaKeyColor.value,
    );

    localStorage.setItem(
      "gemini_chroma_key_tolerance",
      elements.chromaKeyTolerance.value,
    );
    
    localStorage.setItem('gemini_enable_transcript', elements.enableTranscript.checked.toString());
    localStorage.setItem('gemini_enable_chat_input', elements.enableChatInput.checked.toString());
    localStorage.setItem('gemini_enable_session_resumption', elements.enableSessionResumption.checked.toString());
    localStorage.setItem('gemini_enable_transcript_outside', elements.renderOutsideToggle.checked.toString());
    if (elements.enableGrounding) {
        localStorage.setItem('gemini_enable_grounding', elements.enableGrounding.checked.toString());
    }
    
    localStorage.setItem('gemini_custom_avatars', JSON.stringify(customAvatars));
}
