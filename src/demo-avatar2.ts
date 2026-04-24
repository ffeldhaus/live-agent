import {GeminiAvatar} from './gemini-avatar';
import {AVATAR_PRESETS, VOICE_PRESETS} from './constants';

export function setupAvatar2(
  avatar2: GeminiAvatar | null,
  elements: any,
  customAvatars: any,
  avatar: GeminiAvatar,
  store: any,
) {
  if (!avatar2) return;

  const {positionSelect} = elements;

  if (elements.avatarName2) {
    elements.avatarName2.innerHTML = '';
    Object.values(AVATAR_PRESETS).forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = `${preset.displayName} (${preset.style})`;
      elements.avatarName2.appendChild(option);
    });
    const audioOnlyOption = document.createElement('option');
    audioOnlyOption.value = 'AudioOnly';
    audioOnlyOption.textContent = 'Audio Only';
    elements.avatarName2.appendChild(audioOnlyOption);

    Object.keys(customAvatars).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      elements.avatarName2.appendChild(option);
    });

    elements.avatarName2.value = 'Kira';
    avatar2.setPreview('Kira');
  }

  if (elements.voiceSelect2) {
    elements.voiceSelect2.innerHTML = '';
    Object.values(VOICE_PRESETS).forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = `${preset.displayName} (${preset.description})`;
      elements.voiceSelect2.appendChild(option);
    });
  }

  if (elements.size2)
    elements.size2.onchange = () =>
      avatar2?.setAttribute('size', elements.size2.value);

  if (elements.position2) {
    elements.position2.onchange = () => {
      const newPos = elements.position2.value;
      const oldPos2 = avatar2?.getAttribute('position') || 'top-left';
      const pos1 = avatar.getAttribute('position') || 'top-right';
      if (newPos === pos1) {
        avatar.setAttribute('position', oldPos2);
        if (positionSelect) positionSelect.value = oldPos2;
        store.position = oldPos2;
      }
      avatar2?.setAttribute('position', newPos);
    };
  }

  if (elements.avatarName2) {
    elements.avatarName2.onchange = () => {
      const val = elements.avatarName2.value;
      const isPreset = val in AVATAR_PRESETS;

      if (elements.enableChromaKey2) {
        elements.enableChromaKey2.disabled = isPreset;
        if (isPreset) {
          avatar2?.setAttribute('enable-chroma-key', 'false');
        } else {
          avatar2?.setAttribute(
            'enable-chroma-key',
            elements.enableChromaKey2.checked.toString(),
          );
        }
      }

      avatar2?.setAttribute('avatar-name', val);
      const preset = (AVATAR_PRESETS as any)[val];
      if (preset) {
        avatar2?.setPreview(val);
      } else if (customAvatars[val]) {
        avatar2?.setAttribute('custom-avatar-url', customAvatars[val].image);
      }
    };
  }

  if (elements.languageSelect2)
    elements.languageSelect2.onchange = () =>
      avatar2?.setAttribute('language', elements.languageSelect2.value);
  if (elements.enableChromaKey2)
    elements.enableChromaKey2.onchange = () =>
      avatar2?.setAttribute(
        'enable-chroma-key',
        elements.enableChromaKey2.checked.toString(),
      );
  if (elements.chromaKeyTolerance2) {
    elements.chromaKeyTolerance2.oninput = () => {
      if (elements.chromaKeyToleranceVal2)
        elements.chromaKeyToleranceVal2.textContent =
          elements.chromaKeyTolerance2.value;
      avatar2?.setAttribute(
        'chroma-key-tolerance',
        elements.chromaKeyTolerance2.value,
      );
    };
  }
  if (elements.enableTranscript2)
    elements.enableTranscript2.onchange = () =>
      avatar2?.setAttribute(
        'enable-transcript',
        elements.enableTranscript2.checked.toString(),
      );
  if (elements.enableChatInput2)
    elements.enableChatInput2.onchange = () =>
      avatar2?.setAttribute(
        'enable-chat-input',
        elements.enableChatInput2.checked.toString(),
      );
  if (elements.enableSessionResumption2)
    elements.enableSessionResumption2.onchange = () =>
      avatar2?.setAttribute(
        'enable-session-resumption',
        elements.enableSessionResumption2.checked.toString(),
      );
  if (elements.enableGrounding2)
    elements.enableGrounding2.onchange = () =>
      avatar2?.setAttribute(
        'enable-grounding',
        elements.enableGrounding2.checked.toString(),
      );

  // Initial state for transparency checkbox for Avatar 2
  if (elements.avatarName2) {
    const val = elements.avatarName2.value;
    const isPreset = val in AVATAR_PRESETS;
    if (elements.enableChromaKey2) {
      elements.enableChromaKey2.disabled = isPreset;
      if (isPreset) {
        avatar2?.setAttribute('enable-chroma-key', 'false');
      }
    }
  }
}
