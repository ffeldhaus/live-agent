import {GeminiAvatar} from './gemini-avatar';
import {generateContent, updateBackground, applyTheme} from './demo-helpers';
import {showMessageModal} from './ui-helpers';
import {ensureValidToken} from './auth';

export async function handleImageGeneration(
  name: string,
  userPrompt: string,
  useChromaKey: boolean,
  keyColor: string,
  bgColor: string,
  project: string,
  location: string,
  token: string,
  customAvatars: Record<
    string,
    {image: string; type: 'custom'; palette?: string[]}
  >,
  avatar: GeminiAvatar,
  elements: {
    generateImageBtn: HTMLButtonElement;
    generatedImg: HTMLImageElement;
    generatedImageContainer: HTMLDivElement;
    customAvatarName: HTMLInputElement;
  },
  updateDropdown: (name: string) => void,
  onColorsDetected?: (colors: string[]) => void,
) {
  if (!name) {
    showMessageModal('Error', 'Please enter a name for the custom avatar.');
    return;
  }

  if (!userPrompt) {
    showMessageModal(
      'Error',
      'Please enter a prompt or use "I\'m feeling lucky".',
    );
    return;
  }

  try {
    elements.generateImageBtn.disabled = true;
    elements.generateImageBtn.textContent = 'Generating...';

    // Add background settings and resolution to prompt!
    // Add background settings to prompt!
    let finalPrompt = userPrompt;
    if (keyColor !== 'disabled') {
      let colorCode = '#00FF00';
      if (keyColor === 'blue') colorCode = '#0000FF';
      finalPrompt += `. Ensure the background is a solid uniform color with hex code ${colorCode} (pure ${keyColor}), suitable for chroma keying.`;
    } else {
      finalPrompt += '. Use a nice, unobtrusive uniform background.';
    }

    // 2. Generate image with gemini-3.1-flash-image-preview
    const generationConfig = {
      imageConfig: {
        aspectRatio: '9:16',
        imageSize: '1K',
      },
    };

    const data = await generateContent(
      'gemini-3.1-flash-image-preview',
      finalPrompt,
      project,
      location,
      token,
      undefined,
      'Avatar Image Generation',
      generationConfig,
    );

    console.log('Image Gen Response:', data);
    const part = data.candidates[0].content.parts.find(
      (p: any) => p.inlineData,
    );

    if (part && part.inlineData && part.inlineData.data) {
      const base64 = part.inlineData.data;
      const dataUrl = `data:${part.inlineData.mimeType};base64,${base64}`;

      // Load image to process
      const img = new Image();
      await new Promise(resolve => {
        img.onload = resolve;
        img.src = dataUrl;
      });

      // Step 1: Downscale to 706x1280
      const canvas1 = document.createElement('canvas');
      canvas1.width = 706;
      canvas1.height = 1280;
      const ctx1 = canvas1.getContext('2d');
      if (ctx1) {
        ctx1.drawImage(img, 0, 0, 706, 1280);
      }

      // Step 2: Crop to 704x1280 (center crop)
      const canvas2 = document.createElement('canvas');
      canvas2.width = 704;
      canvas2.height = 1280;
      const ctx2 = canvas2.getContext('2d');
      if (ctx2 && ctx1) {
        // Crop 1 pixel from left and right (source x=1, width=704)
        ctx2.drawImage(canvas1, 1, 0, 704, 1280, 0, 0, 704, 1280);
      }

      const finalUrl = canvas2.toDataURL('image/png');

      elements.generatedImg.src = finalUrl;
      elements.generatedImageContainer.style.display = 'block';

      const originalImgContainer = document.getElementById(
        'originalImgContainer',
      );
      const generatedImageLabel = document.getElementById(
        'generatedImageLabel',
      );
      if (originalImgContainer) originalImgContainer.style.display = 'none';
      if (generatedImageLabel)
        generatedImageLabel.textContent = 'Generated Image';

      if (elements.customAvatarName)
        elements.customAvatarName.dispatchEvent(new Event('input'));

      // Update background preview and detect palette
      updateBackground(
        finalUrl,
        (colors, speed) => {
          applyTheme(colors, speed);
          if (onColorsDetected) onColorsDetected(colors);
        },
        keyColor,
      );
    } else {
      showMessageModal(
        'Error',
        'Failed to generate image (no image data in response). See console.',
      );
    }
  } catch (e: any) {
    console.error('Image gen error:', e);
    showMessageModal('Error', `Failed to generate image: ${e.message}`);
  } finally {
    elements.generateImageBtn.disabled = false;
    elements.generateImageBtn.textContent = 'Generate';
  }
}

export async function handleCameraCapture(
  videoEl: HTMLVideoElement,
  name: string,
  useChromaKey: boolean,
  keyColor: string,
  bgColor: string,
  useImageImprovement: boolean,
  project: string,
  location: string,
  token: string,
  customAvatars: Record<
    string,
    {image: string; originalImage?: string; type: 'custom'; palette?: string[]}
  >,
  avatar: GeminiAvatar,
  elements: {
    generatedImg: HTMLImageElement;
    originalImg: HTMLImageElement;
    generatedImageContainer: HTMLDivElement;
    customAvatarName: HTMLInputElement;
    captureBtn: HTMLButtonElement;
    cameraModal: HTMLDivElement;
    imageProcessingMessage?: HTMLParagraphElement;
  },
  updateDropdown: (name: string) => void,
  onColorsDetected?: (colors: string[]) => void,
) {
  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;

  // Target aspect ratio 704:1280
  const targetRatio = 704 / 1280;
  const currentRatio = videoWidth / videoHeight;

  let cropWidth = videoWidth;
  let cropHeight = videoHeight;
  let startX = 0;
  let startY = 0;

  if (currentRatio > targetRatio) {
    // Too wide
    cropWidth = videoHeight * targetRatio;
    startX = (videoWidth - cropWidth) / 2;
  } else {
    // Too tall
    cropHeight = videoWidth / targetRatio;
    startY = (videoHeight - cropHeight) / 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 704;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Mirror the image!
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw cropped region!
    ctx.drawImage(
      videoEl,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Stop camera
    const stream = videoEl.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    videoEl.srcObject = null;
    elements.cameraModal.classList.remove('active');

    // Get image data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Show preview
    if (elements.originalImg) elements.originalImg.src = dataUrl;
    elements.generatedImg.src = dataUrl;
    elements.generatedImageContainer.style.display = 'block';
    const originalImgContainer = document.getElementById(
      'originalImgContainer',
    );
    const generatedImageLabel = document.getElementById('generatedImageLabel');
    if (originalImgContainer) originalImgContainer.style.display = 'block';
    if (generatedImageLabel) generatedImageLabel.textContent = 'Improved';

    if (elements.customAvatarName)
      elements.customAvatarName.dispatchEvent(new Event('input'));

    // Auto-improvement flow!
    let originalText = '';
    if (useImageImprovement) {
      try {
        elements.captureBtn.disabled = true;
        originalText = elements.captureBtn.textContent || '';
        elements.captureBtn.textContent = 'Improving...';
        if (elements.imageProcessingMessage)
          elements.imageProcessingMessage.style.display = 'block';

        const base64Data = dataUrl.split(',')[1];
        let instruction =
          "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 704x1280 in PNG format. Do NOT modify the person's features (e.g., hair, face, eyes).";

        if (keyColor !== 'disabled') {
          let colorCode = '#00FF00';
          if (keyColor === 'blue') colorCode = '#0000FF';
          instruction += `. Replace the background with a solid uniform color with hex code ${colorCode} (pure ${keyColor}), suitable for chroma keying.`;
        } else {
          instruction += ' Use a nice, unobtrusive uniform background.';
        }

        const data = await generateContent(
          'gemini-3.1-flash-image-preview',
          instruction,
          project,
          location,
          token,
          {mimeType: 'image/png', data: base64Data},
          'Camera Image Improvement',
        );

        console.log('Image Gen Response:', data);
        const part = data.candidates[0].content.parts.find(
          (p: any) => p.inlineData,
        );

        if (part && part.inlineData && part.inlineData.data) {
          const base64 = part.inlineData.data;
          const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
          elements.generatedImg.src = improvedUrl;

          // Update background preview and detect palette
          updateBackground(
            improvedUrl,
            (colors, speed) => {
              applyTheme(colors, speed);
              if (onColorsDetected) onColorsDetected(colors);
            },
            keyColor,
          );
        } else {
          showMessageModal(
            'Error',
            'Model did not return an image. See console.',
          );
        }
      } catch (e: any) {
        console.error('Image improvement error:', e);
        showMessageModal('Error', 'Failed to improve image: ' + e.message);
      } finally {
        elements.captureBtn.disabled = false;
        elements.captureBtn.textContent = originalText;
        if (elements.imageProcessingMessage)
          elements.imageProcessingMessage.style.display = 'none';
      }
    } else {
      // Update background preview and detect palette
      updateBackground(
        dataUrl,
        (colors, speed) => {
          applyTheme(colors, speed);
          if (onColorsDetected) onColorsDetected(colors);
        },
        keyColor,
      );
    }
  }
}

export async function handleUpload(
  file: File,
  name: string,
  useChromaKey: boolean,
  keyColor: string,
  bgColor: string,
  useImageImprovement: boolean,
  project: string,
  location: string,
  token: string,
  customAvatars: Record<
    string,
    {image: string; originalImage?: string; type: 'custom'; palette?: string[]}
  >,
  avatar: GeminiAvatar,
  elements: {
    generatedImg: HTMLImageElement;
    originalImg: HTMLImageElement;
    generatedImageContainer: HTMLDivElement;
    customAvatarName: HTMLInputElement;
    uploadBtn: HTMLButtonElement;
    imageProcessingMessage?: HTMLParagraphElement;
  },
  updateDropdown: (name: string) => void,
  onColorsDetected?: (colors: string[]) => void,
) {
  const reader = new FileReader();
  reader.onload = async (re: any) => {
    const dataUrl = re.target.result;
    if (elements.originalImg) elements.originalImg.src = dataUrl;
    elements.generatedImg.src = dataUrl;
    elements.generatedImageContainer.style.display = 'block';
    const originalImgContainer = document.getElementById(
      'originalImgContainer',
    );
    const generatedImageLabel = document.getElementById('generatedImageLabel');
    if (originalImgContainer) originalImgContainer.style.display = 'block';
    if (generatedImageLabel) generatedImageLabel.textContent = 'Improved';

    if (elements.customAvatarName)
      elements.customAvatarName.dispatchEvent(new Event('input'));

    // Auto-improvement flow for upload too!
    let originalText = '';
    if (useImageImprovement) {
      try {
        elements.uploadBtn.disabled = true;
        originalText = elements.uploadBtn.textContent || '';
        elements.uploadBtn.textContent = 'Improving...';
        if (elements.imageProcessingMessage)
          elements.imageProcessingMessage.style.display = 'block';

        const base64Data = dataUrl.split(',')[1];
        let instruction =
          "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 704x1280 in PNG format. Do NOT modify the person's features (e.g., hair, face, eyes).";

        if (keyColor !== 'disabled') {
          let colorCode = '#00FF00';
          if (keyColor === 'blue') colorCode = '#0000FF';
          instruction += `. Replace the background with a solid uniform color with hex code ${colorCode} (pure ${keyColor}), suitable for chroma keying.`;
        } else {
          instruction += ' Use a nice, unobtrusive uniform background.';
        }

        const data = await generateContent(
          'gemini-3.1-flash-image-preview',
          instruction,
          project,
          location,
          token,
          {mimeType: file.type, data: base64Data},
          'Uploaded Image Improvement',
        );

        console.log('Image Gen Response:', data);
        const part = data.candidates[0].content.parts.find(
          (p: any) => p.inlineData,
        );

        if (part && part.inlineData && part.inlineData.data) {
          const base64 = part.inlineData.data;
          const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
          elements.generatedImg.src = improvedUrl;

          // Update background preview and detect palette
          updateBackground(
            improvedUrl,
            (colors, speed) => {
              applyTheme(colors, speed);
              if (onColorsDetected) onColorsDetected(colors);
            },
            keyColor,
          );
        } else {
          showMessageModal(
            'Error',
            'Model did not return an image. See console.',
          );
        }
      } catch (e: any) {
        console.error('Image improvement error:', e);
        showMessageModal('Error', 'Failed to improve image: ' + e.message);
      } finally {
        elements.uploadBtn.disabled = false;
        elements.uploadBtn.textContent = originalText;
        if (elements.imageProcessingMessage)
          elements.imageProcessingMessage.style.display = 'none';
      }
    } else {
      // Resize/crop to 704x1280 and convert to PNG
      const img = new Image();
      await new Promise(resolve => {
        img.onload = resolve;
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 704;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const targetRatio = 704 / 1280;
        const currentRatio = img.width / img.height;
        let cropWidth = img.width;
        let cropHeight = img.height;
        let startX = 0;
        let startY = 0;

        if (currentRatio > targetRatio) {
          cropWidth = img.height * targetRatio;
          startX = (img.width - cropWidth) / 2;
        } else {
          cropHeight = img.width / targetRatio;
          startY = (img.height - cropHeight) / 2;
        }

        ctx.drawImage(
          img,
          startX,
          startY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const processedUrl = canvas.toDataURL('image/png');

        // Update preview with processed image
        elements.generatedImg.src = processedUrl;

        // Update background preview and detect palette
        updateBackground(
          processedUrl,
          (colors, speed) => {
            applyTheme(colors, speed);
            if (onColorsDetected) onColorsDetected(colors);
          },
          keyColor,
        );
      }
    }
  };
  reader.readAsDataURL(file);
}

export async function handleImageImprovement(
  originalDataUrl: string,
  useChromaKey: boolean,
  keyColor: string,
  project: string,
  location: string,
  token: string,
  elements: {
    generatedImg: HTMLImageElement;
    imageProcessingMessage?: HTMLParagraphElement;
    redoImprovementBtn?: HTMLButtonElement;
  },
  onColorsDetected?: (colors: string[]) => void,
) {
  try {
    if (elements.redoImprovementBtn)
      elements.redoImprovementBtn.disabled = true;
    if (elements.imageProcessingMessage)
      elements.imageProcessingMessage.style.display = 'block';

    const base64Data = originalDataUrl.split(',')[1];
    const mimeType = originalDataUrl.split(';')[0].split(':')[1];

    let instruction =
      "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 704x1280 in PNG format. Do NOT modify the person's features (e.g., hair, face, eyes).";

    if (keyColor !== 'disabled') {
      let colorCode = '#00FF00';
      if (keyColor === 'blue') colorCode = '#0000FF';
      instruction += `. Replace the background with a solid uniform color with hex code ${colorCode} (pure ${keyColor}), suitable for chroma keying.`;
    } else {
      instruction += ' Use a nice, unobtrusive uniform background.';
    }

    const data = await generateContent(
      'gemini-3.1-flash-image-preview',
      instruction,
      project,
      location,
      token,
      {mimeType: mimeType, data: base64Data},
      'Image Improvement',
    );

    console.log('Image Gen Response:', data);
    const part = data.candidates[0].content.parts.find(
      (p: any) => p.inlineData,
    );

    if (part && part.inlineData && part.inlineData.data) {
      const base64 = part.inlineData.data;
      const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
      elements.generatedImg.src = improvedUrl;

      updateBackground(
        improvedUrl,
        (colors, speed) => {
          applyTheme(colors, speed);
          if (onColorsDetected) onColorsDetected(colors);
        },
        keyColor,
      );
    } else {
      showMessageModal('Error', 'Model did not return an image. See console.');
    }
  } catch (e: any) {
    console.error('Image improvement error:', e);
    showMessageModal('Error', 'Failed to improve image: ' + e.message);
  } finally {
    if (elements.redoImprovementBtn)
      elements.redoImprovementBtn.disabled = false;
    if (elements.imageProcessingMessage)
      elements.imageProcessingMessage.style.display = 'none';
  }
}

export async function handleBackgroundGeneration(
  userPrompt: string,
  project: string,
  location: string,
  token: string,
  elements: {
    generateBgBtn: HTMLButtonElement;
    bgImageUrl: HTMLInputElement;
  },
) {
  if (!userPrompt) {
    showMessageModal('Error', 'Please enter a prompt for the background.');
    return;
  }

  try {
    elements.generateBgBtn.disabled = true;
    elements.generateBgBtn.textContent = 'Generating...';

    const data = await generateContent(
      'gemini-3.1-flash-image-preview',
      userPrompt,
      project,
      location,
      token,
      undefined,
      'Background Image Generation',
    );
    const part = data.candidates[0].content.parts.find(
      (p: any) => p.inlineData,
    );

    if (part && part.inlineData && part.inlineData.data) {
      const base64 = part.inlineData.data;
      const url = `data:${part.inlineData.mimeType};base64,${base64}`;

      document.body.style.background = `url(${url}) no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
      document.body.classList.remove('animated-bg');

      localStorage.setItem('gemini_background_image', url);
      elements.bgImageUrl.value = 'Generated Image';
    } else {
      showMessageModal('Error', 'Failed to generate background image.');
    }
  } catch (e: any) {
    showMessageModal('Error', `Failed to generate background: ${e.message}`);
  } finally {
    elements.generateBgBtn.disabled = false;
    elements.generateBgBtn.textContent = 'Lucky Generate';
  }
}

export function handleBackgroundUpload(
  file: File,
  elements: {bgImageUrl: HTMLInputElement},
) {
  const reader = new FileReader();
  reader.onload = e => {
    const url = e.target?.result as string;
    if (url) {
      document.body.style.background = `url(${url}) no-repeat center center fixed`;
      document.body.style.backgroundSize = 'cover';
      document.body.classList.remove('animated-bg');

      localStorage.setItem('gemini_background_image', url);
      elements.bgImageUrl.value = 'Uploaded Image';
    }
  };
  reader.readAsDataURL(file);
}

export async function handleLuckyBgPrompt(
  store: any,
  tokenClient: any,
  elements: any,
) {
  if (!(await ensureValidToken(store, tokenClient, elements))) return;

  const persona = elements.systemInstructionInput.value;
  const name = elements.avatarNameSelect.value;

  let prompt = '';
  if (persona) {
    prompt = `Generate a creative image generation prompt for a background that fits an AI avatar with this persona: "${persona}". The background should be visually appealing but not distract from the avatar. Return only the prompt text.`;
  } else {
    prompt = `Generate a creative image generation prompt for a background for an AI avatar named ${name}. Return only the prompt text.`;
  }

  try {
    elements.luckyBgPromptBtn.disabled = true;
    const originalText = elements.luckyBgPromptBtn.textContent;
    elements.luckyBgPromptBtn.textContent = 'Generating...';
    const data = await generateContent(
      'gemini-3-flash-preview',
      prompt,
      elements.projectIdInput.value,
      elements.locationInput.value || 'us-central1',
      elements.tokenInput.value,
      undefined,
      'Lucky Background Prompt Generation',
    );
    const text = data.candidates[0].content.parts[0].text;
    elements.bgImagePrompt.value = text.trim();
    elements.luckyBgPromptBtn.textContent = originalText;
  } catch (e: any) {
    showMessageModal(
      'Error',
      `Failed to generate background prompt: ${e.message}`,
    );
    elements.luckyBgPromptBtn.textContent = "I'm feeling lucky";
  } finally {
    elements.luckyBgPromptBtn.disabled = false;
  }
}
