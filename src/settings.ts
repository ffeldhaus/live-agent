import {applyAvatarTheme} from './demo-helpers';
import {AVATAR_PRESETS} from './constants';
import {displayUserProfile} from './auth';

export function loadSettings(
  elements: any,
  store: any,
  customAvatars: Record<string, string>,
  avatar: any,
) {
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

  if (localStorage.getItem('gemini_project_id'))
    elements.projectIdInput.value = localStorage.getItem('gemini_project_id')!;
  if (localStorage.getItem('gemini_location'))
    elements.locationInput.value = localStorage.getItem('gemini_location')!;
  if (localStorage.getItem('gemini_oauth_client_id'))
    elements.oauthClientIdInput.value = localStorage.getItem(
      'gemini_oauth_client_id',
    )!;

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
        type: type as 'custom',
      };

      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      elements.avatarNameSelect.appendChild(option);
    });
  }

  // Avatar Configurations
  const avatarConfigs = [
    {
      num: 1,
      els: {
        avatarName: elements.avatarNameSelect,
        voice: elements.voiceSelect,
        size: elements.sizeSelect,
        position: elements.positionSelect,
        language: elements.languageSelect,
        saveVideo: elements.saveVideoToggle,
        enableChromaKey: elements.enableChromaKey,
        chromaKeyTolerance: elements.chromaKeyTolerance,
        chromaKeyToleranceVal: elements.chromaKeyToleranceVal,
        enableTranscript: elements.enableTranscript,
        enableChatInput: elements.enableChatInput,
        enableSessionResumption: elements.enableSessionResumption,
        enableGrounding: elements.enableGrounding,
        systemInstruction: elements.systemInstructionInput,
        defaultGreeting: elements.defaultGreetingInput,
      },
      comp: avatar,
    },
    {
      num: 2,
      els: {
        avatarName: elements.avatarName2,
        voice: elements.voiceSelect2,
        size: elements.size2,
        position: elements.position2,
        language: elements.languageSelect2,
        saveVideo: elements.saveVideoToggle2,
        enableChromaKey: elements.enableChromaKey2,
        chromaKeyTolerance: elements.chromaKeyTolerance2,
        chromaKeyToleranceVal: elements.chromaKeyToleranceVal2,
        enableTranscript: elements.enableTranscript2,
        enableChatInput: elements.enableChatInput2,
        enableSessionResumption: elements.enableSessionResumption2,
        enableGrounding: elements.enableGrounding2,
        systemInstruction: elements.systemInstruction2,
        defaultGreeting: elements.defaultGreeting2,
      },
      comp: null,
    },
  ];

  avatarConfigs.forEach(config => {
    const {num, els, comp} = config;
    const prefix = `gemini_avatar${num}_`;

    const getVal = (key: string, fallbackKey?: string) => {
      const val = localStorage.getItem(prefix + key);
      if (val !== null) return val;
      if (num === 1 && fallbackKey) return localStorage.getItem(fallbackKey);
      return null;
    };

    // Name
    const name =
      getVal('name', 'gemini_avatar_name') || (num === 1 ? 'Kira' : null);
    if (name && els.avatarName) {
      els.avatarName.value = name;
      if (comp) comp.setAttribute('avatar-name', name);
      if (num === 1) {
        applyAvatarTheme(name, comp, customAvatars, elements);
      }

      const preset = (AVATAR_PRESETS as any)[name];
      if (preset && preset.defaultGreeting && els.defaultGreeting) {
        els.defaultGreeting.value = preset.defaultGreeting;
      }
    }

    // Size
    const size = getVal('size', 'gemini_size');
    if (size && els.size) {
      els.size.value = size;
      if (comp) comp.setAttribute('size', size);
    }

    // Position
    const position = getVal('position', 'gemini_position');
    if (position && els.position) {
      els.position.value = position;
      if (comp) comp.setAttribute('position', position);
    }

    // Voice
    const voice = getVal('voice', 'gemini_voice');
    if (voice && els.voice) els.voice.value = voice;

    // Language
    const language = getVal('language', 'gemini_language');
    if (language && els.language) els.language.value = language;

    // Save Video
    const saveVideo = getVal('save_video', 'gemini_save_video');
    if (els.saveVideo) {
      els.saveVideo.checked = saveVideo === 'true';
      if (comp)
        comp.setAttribute('record-video', els.saveVideo.checked.toString());
    }

    // Chroma Key
    const enableChromaKey = getVal(
      'enable_chroma_key',
      'gemini_enable_chroma_key',
    );
    if (els.enableChromaKey) {
      els.enableChromaKey.checked = enableChromaKey === 'true';
      if (comp)
        comp.setAttribute(
          'enable-chroma-key',
          els.enableChromaKey.checked.toString(),
        );
    }

    const tolerance =
      getVal('chroma_key_tolerance', 'gemini_chroma_key_tolerance') || '50';
    if (els.chromaKeyTolerance) {
      els.chromaKeyTolerance.value = tolerance;
      if (els.chromaKeyToleranceVal)
        els.chromaKeyToleranceVal.textContent = tolerance;
      if (comp) comp.setAttribute('chroma-key-tolerance', tolerance);
    }

    // Transcript
    const transcript = getVal('enable_transcript', 'gemini_enable_transcript');
    if (els.enableTranscript) {
      els.enableTranscript.checked = transcript === 'true';
      if (comp)
        comp.setAttribute(
          'enable-transcript',
          els.enableTranscript.checked.toString(),
        );
    }

    // Chat Input
    const chatInput = getVal('enable_chat_input', 'gemini_enable_chat_input');
    if (els.enableChatInput) {
      els.enableChatInput.checked = chatInput === 'true';
      if (comp)
        comp.setAttribute(
          'enable-chat-input',
          els.enableChatInput.checked.toString(),
        );
    }

    // Session Resumption
    const resumption = getVal(
      'enable_session_resumption',
      'gemini_enable_session_resumption',
    );
    if (els.enableSessionResumption) {
      els.enableSessionResumption.checked = resumption === 'true';
      if (comp)
        comp.setAttribute(
          'enable-session-resumption',
          els.enableSessionResumption.checked.toString(),
        );
    }

    // Grounding
    const grounding = getVal('enable_grounding', 'gemini_enable_grounding');
    if (els.enableGrounding) {
      els.enableGrounding.checked = grounding === 'true';
      if (comp)
        comp.setAttribute(
          'enable-grounding',
          els.enableGrounding.checked.toString(),
        );
    }

    // System Instruction
    const systemInstruction = getVal(
      'system_instruction',
      'gemini_system_instruction',
    );
    if (systemInstruction && els.systemInstruction)
      els.systemInstruction.value = systemInstruction;

    // Default Greeting
    const defaultGreeting = getVal(
      'default_greeting',
      'gemini_default_greeting',
    );
    if (defaultGreeting && els.defaultGreeting)
      els.defaultGreeting.value = defaultGreeting;
  });

  // Global Settings (preserved from original code)
  elements.debugToggle.checked =
    localStorage.getItem('gemini_debug') === 'true';
  avatar.setAttribute('debug', elements.debugToggle.checked.toString());

  if (elements.recordUserAudioCheckbox) {
    elements.recordUserAudioCheckbox.checked =
      localStorage.getItem('gemini_record_user_audio') === 'true';
  }

  if (elements.micAutoRequestToggle) {
    elements.micAutoRequestToggle.checked =
      localStorage.getItem('gemini_mic_auto_request') !== 'false';
    avatar.setAttribute(
      'mic-auto-request',
      elements.micAutoRequestToggle.checked.toString(),
    );
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
    elements.audioChunkSizeSlider.value = localStorage.getItem(
      'gemini_audio_chunk_size',
    )!;
    elements.chunkSizeVal.textContent = elements.audioChunkSizeSlider.value;
    avatar.setAttribute(
      'audio-chunk-size',
      elements.audioChunkSizeSlider.value,
    );
  }

  if (localStorage.getItem('gemini_image_prompt'))
    elements.imagePromptInput.value = localStorage.getItem(
      'gemini_image_prompt',
    )!;

  // Background Image (preserved from original code)
  const savedBg = localStorage.getItem('gemini_background_image');
  if (savedBg) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const finalUrl =
      isLocal && savedBg.startsWith('http')
        ? `/proxy?url=${encodeURIComponent(savedBg)}`
        : savedBg;

    document.body.style.backgroundImage = `url(${finalUrl})`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.classList.remove('animated-bg');
    if (elements.bgImageUrl)
      elements.bgImageUrl.value = savedBg.startsWith('data:')
        ? 'Stored Image'
        : savedBg;
  } else {
    const defaultBg =
      'https://storage.googleapis.com/gweb-cloudblog-publish/images/GCN26_102_BlogHeader_2436x1200_Opt_4_Dark.max-2500x2500.jpg';
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const finalUrl = isLocal
      ? `/proxy?url=${encodeURIComponent(defaultBg)}`
      : defaultBg;

    document.body.style.backgroundImage = `url(${finalUrl})`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.classList.remove('animated-bg');
    if (elements.bgImageUrl) elements.bgImageUrl.value = defaultBg;
  }
}

export function saveSettings(
  elements: any,
  store: any,
  customAvatars: Record<string, string>,
) {
  const setOrRemove = (key: string, value: string, defaultValue: string) => {
    if (value === defaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  };

  localStorage.setItem('gemini_project_id', elements.projectIdInput.value);
  localStorage.setItem('gemini_location', elements.locationInput.value);
  localStorage.setItem(
    'gemini_oauth_client_id',
    elements.oauthClientIdInput.value,
  );

  // Global Settings (preserved from original code)
  const bgUrl = elements.bgImageUrl.value;
  const defaultBg =
    'https://storage.googleapis.com/gweb-cloudblog-publish/images/GCN26_102_BlogHeader_2436x1200_Opt_4_Dark.max-2500x2500.jpg';
  if (bgUrl === defaultBg) {
    localStorage.removeItem('gemini_background_image');
  } else if (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('data:'))) {
    localStorage.setItem('gemini_background_image', bgUrl);
  }

  const token = elements.tokenInput.value;
  const now = new Date().getTime();
  const isTokenValid = token.length > 0 && store.tokenExpiry > now;

  if (isTokenValid) {
    localStorage.setItem('gemini_access_token', token);
    localStorage.setItem('gemini_token_time', new Date().getTime().toString());
    localStorage.setItem('gemini_token_expiry', store.tokenExpiry.toString());
    localStorage.setItem('gemini_user_name', store.userName);
    localStorage.setItem('gemini_user_avatar', store.userAvatar);
  } else {
    localStorage.removeItem('gemini_access_token');
    localStorage.removeItem('gemini_token_time');
    localStorage.removeItem('gemini_token_expiry');
    localStorage.removeItem('gemini_user_name');
    localStorage.removeItem('gemini_user_avatar');
  }

  setOrRemove('gemini_debug', elements.debugToggle.checked.toString(), 'false');

  if (elements.recordUserAudioCheckbox) {
    setOrRemove(
      'gemini_record_user_audio',
      elements.recordUserAudioCheckbox.checked.toString(),
      'false',
    );
  }
  if (elements.micAutoRequestToggle) {
    setOrRemove(
      'gemini_mic_auto_request',
      elements.micAutoRequestToggle.checked.toString(),
      'true',
    );
  }

  setOrRemove('gemini_ctrl_mic', elements.ctrlMic.checked.toString(), 'true');
  setOrRemove(
    'gemini_ctrl_camera',
    elements.ctrlCamera.checked.toString(),
    'true',
  );
  setOrRemove(
    'gemini_ctrl_screen',
    elements.ctrlScreen.checked.toString(),
    'true',
  );
  setOrRemove('gemini_ctrl_mute', elements.ctrlMute.checked.toString(), 'true');
  setOrRemove(
    'gemini_ctrl_snapshot',
    elements.ctrlSnapshot.checked.toString(),
    'false',
  );
  setOrRemove(
    'gemini_ctrl_settings',
    elements.ctrlSettings.checked.toString(),
    'true',
  );

  setOrRemove(
    'gemini_audio_chunk_size',
    elements.audioChunkSizeSlider.value,
    '2048',
  );

  setOrRemove('gemini_image_prompt', elements.imagePromptInput.value, '');

  // Avatar Configurations (Per-Avatar)
  const avatarConfigs = [
    {
      num: 1,
      els: {
        avatarName: elements.avatarNameSelect,
        voice: elements.voiceSelect,
        size: elements.sizeSelect,
        position: elements.positionSelect,
        language: elements.languageSelect,
        saveVideo: elements.saveVideoToggle,
        enableChromaKey: elements.enableChromaKey,
        chromaKeyTolerance: elements.chromaKeyTolerance,
        enableTranscript: elements.enableTranscript,
        enableChatInput: elements.enableChatInput,
        enableSessionResumption: elements.enableSessionResumption,
        enableGrounding: elements.enableGrounding,
        systemInstruction: elements.systemInstructionInput,
        defaultGreeting: elements.defaultGreetingInput,
      },
    },
    {
      num: 2,
      els: {
        avatarName: elements.avatarName2,
        voice: elements.voiceSelect2,
        size: elements.size2,
        position: elements.position2,
        language: elements.languageSelect2,
        saveVideo: elements.saveVideoToggle2,
        enableChromaKey: elements.enableChromaKey2,
        chromaKeyTolerance: elements.chromaKeyTolerance2,
        enableTranscript: elements.enableTranscript2,
        enableChatInput: elements.enableChatInput2,
        enableSessionResumption: elements.enableSessionResumption2,
        enableGrounding: elements.enableGrounding2,
        systemInstruction: elements.systemInstruction2,
        defaultGreeting: elements.defaultGreeting2,
      },
    },
  ];

  avatarConfigs.forEach(config => {
    const {num, els} = config;
    const prefix = `gemini_avatar${num}_`;

    const saveVal = (key: string, value: string, defaultValue: string) => {
      setOrRemove(prefix + key, value, defaultValue);
    };

    if (els.avatarName) saveVal('name', els.avatarName.value, 'Kira');
    if (els.size) saveVal('size', els.size.value, '300px');
    if (els.position)
      saveVal(
        'position',
        els.position.value,
        num === 1 ? 'top-right' : 'top-left',
      );
    if (els.voice) saveVal('voice', els.voice.value, 'kore');
    if (els.language) saveVal('language', els.language.value, 'en-US');

    if (els.saveVideo)
      saveVal('save_video', els.saveVideo.checked.toString(), 'false');
    if (els.enableChromaKey)
      saveVal(
        'enable_chroma_key',
        els.enableChromaKey.checked.toString(),
        'false',
      );
    if (els.chromaKeyTolerance)
      saveVal('chroma_key_tolerance', els.chromaKeyTolerance.value, '50');

    if (els.enableTranscript)
      saveVal(
        'enable_transcript',
        els.enableTranscript.checked.toString(),
        'false',
      );
    if (els.enableChatInput)
      saveVal(
        'enable_chat_input',
        els.enableChatInput.checked.toString(),
        'false',
      );
    if (els.enableSessionResumption)
      saveVal(
        'enable_session_resumption',
        els.enableSessionResumption.checked.toString(),
        'false',
      );

    if (els.enableGrounding)
      saveVal(
        'enable_grounding',
        els.enableGrounding.checked.toString(),
        'false',
      );

    if (els.systemInstruction)
      saveVal('system_instruction', els.systemInstruction.value, '');

    const presetName = els.avatarName ? els.avatarName.value : 'Kira';
    const preset = (AVATAR_PRESETS as any)[presetName];
    const defaultGreeting = preset ? preset.defaultGreeting : '';
    if (els.defaultGreeting)
      saveVal('default_greeting', els.defaultGreeting.value, defaultGreeting);
  });

  localStorage.setItem('gemini_custom_avatars', JSON.stringify(customAvatars));
}
