import { GeminiAvatar } from './gemini-avatar';
import { generateContent, updateBackground, applyTheme } from './demo-helpers';
import { ensureValidToken } from './auth';
import { AVATAR_PRESETS } from './constants';


export async function handleImageGeneration(
    name: string,
    userPrompt: string,
    useChromaKey: boolean,
    keyColor: string,
    bgColor: string,
    tolerance: number,
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, { image: string, type: 'custom', palette?: string[] }>,
    avatar: GeminiAvatar,
    elements: {
        generateImageBtn: HTMLButtonElement,
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement
    },
    updateDropdown: (name: string) => void,
    onColorsDetected?: (colors: string[]) => void
) {
    if (!name) {
        alert('Please enter a name for the custom avatar.');
        return;
    }

    if (!userPrompt) {
        alert('Please enter a prompt or use "I\'m feeling lucky".');
        return;
    }
    
    try {
        elements.generateImageBtn.disabled = true;
        elements.generateImageBtn.textContent = 'Enhancing...';
        
        // 1. Enhance prompt with gemini-3-flash-preview
        const enhancePrompt = `Enhance this image generation prompt to follow best practices (add details, style, lighting, etc.): "${userPrompt}". Return only the enhanced prompt text.`;
        const enhanceData = await generateContent('gemini-3-flash-preview', enhancePrompt, project, location, token);
        const enhancedPrompt = enhanceData.candidates[0].content.parts[0].text.trim();
        console.log('Enhanced Prompt:', enhancedPrompt);
        
        elements.generateImageBtn.textContent = 'Generating...';
        
        // Add background settings and resolution to prompt!
        let finalPrompt = enhancedPrompt + ", resolution 704x1280 in PNG format";
        if (useChromaKey) {
            const colorDesc = keyColor === 'green' ? 'bright green (#00b140)' : (keyColor === 'blue' ? 'blue (#0047bb)' : keyColor);
            finalPrompt += ` with a solid ${colorDesc} background.`;
        } else {
            finalPrompt += ` with a nice, unobtrusive uniform background.`;
        }
        
        // 2. Generate image with gemini-3.1-flash-image-preview
        const data = await generateContent('gemini-3.1-flash-image-preview', finalPrompt, project, location, token);
        
        console.log('Image Gen Response:', data);
        const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
        
        if (part && part.inlineData && part.inlineData.data) {
            const base64 = part.inlineData.data;
            elements.generatedImg.src = `data:${part.inlineData.mimeType};base64,${base64}`;
            elements.generatedImageContainer.style.display = 'block';
            if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
            
            let finalUrl = elements.generatedImg.src;


            
            // Update background preview and detect palette
            updateBackground(finalUrl, keyColor, tolerance, (colors, speed) => {
                applyTheme(colors, speed);
                if (onColorsDetected) onColorsDetected(colors);
            });
        } else {
            alert('Failed to generate image (no image data in response). See console.');
        }
    } catch (e: any) {
        console.error('Image gen error:', e);
        alert(`Failed to generate image: ${e.message}`);
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
    tolerance: number,
    useImageImprovement: boolean,
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, { image: string, type: 'custom', palette?: string[] }>,
    avatar: GeminiAvatar,
    elements: {
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement,
        captureBtn: HTMLButtonElement,
        cameraModal: HTMLDivElement,
        imageProcessingMessage?: HTMLParagraphElement
    },
    updateDropdown: (name: string) => void,
    onColorsDetected?: (colors: string[]) => void
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
        ctx.drawImage(videoEl, startX, startY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        
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
        elements.generatedImg.src = dataUrl;
        elements.generatedImageContainer.style.display = 'block';
        if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
        
        // Auto-improvement flow!
        if (useImageImprovement) {
            try {
                elements.captureBtn.disabled = true;
                const originalText = elements.captureBtn.textContent;
                elements.captureBtn.textContent = 'Improving...';
                if (elements.imageProcessingMessage) elements.imageProcessingMessage.classList.remove('hidden');
                
                const base64Data = dataUrl.split(',')[1];
                let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 704x1280 in PNG format. Do NOT modify the person's features (e.g., hair, face, eyes).";
                
                if (useChromaKey) {
                    const colorDesc = keyColor === 'green' ? 'bright green (#00b140)' : (keyColor === 'blue' ? 'blue (#0047bb)' : keyColor);
                    instruction += ` Replace the background with a solid ${colorDesc} color.`;
                } else {
                    instruction += ` Use a nice, unobtrusive uniform background.`;
                }
                
                const data = await generateContent('gemini-3.1-flash-image-preview', instruction, project, location, token, { mimeType: 'image/png', data: base64Data });
                
                console.log('Image Gen Response:', data);
                const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
                
                if (part && part.inlineData && part.inlineData.data) {
                    const base64 = part.inlineData.data;
                    const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                    
                    elements.generatedImg.src = improvedUrl;
                    
                    // Update background preview and detect palette
                    updateBackground(improvedUrl, keyColor, tolerance, (colors, speed) => {
                        applyTheme(colors, speed);
                        if (onColorsDetected) onColorsDetected(colors);
                    });
                } else {
                    alert('Model did not return an image. See console.');
                }
            } catch (e: any) {
                console.error('Image improvement error:', e);
                alert('Failed to improve image: ' + e.message);
            } finally {
                elements.captureBtn.disabled = false;
                elements.captureBtn.textContent = originalText;
                if (elements.imageProcessingMessage) elements.imageProcessingMessage.classList.add('hidden');
            }
        } else {
            // Update background preview and detect palette
            updateBackground(dataUrl, keyColor, tolerance, (colors, speed) => {
                applyTheme(colors, speed);
                if (onColorsDetected) onColorsDetected(colors);
            });
        }
    }
}

export async function handleUpload(
    file: File,
    name: string,
    useChromaKey: boolean,
    keyColor: string,
    bgColor: string,
    tolerance: number,
    useImageImprovement: boolean,
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, { image: string, type: 'custom', palette?: string[] }>,
    avatar: GeminiAvatar,
    elements: {
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement,
        uploadBtn: HTMLButtonElement,
        imageProcessingMessage?: HTMLParagraphElement
    },
    updateDropdown: (name: string) => void,
    onColorsDetected?: (colors: string[]) => void
) {
    const reader = new FileReader();
    reader.onload = async (re: any) => {
        const dataUrl = re.target.result;
        
        elements.generatedImg.src = dataUrl;
        elements.generatedImageContainer.style.display = 'block';
        if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
        
        // Auto-improvement flow for upload too!
        if (useImageImprovement) {
            try {
                elements.uploadBtn.disabled = true;
                const originalText = elements.uploadBtn.textContent;
                elements.uploadBtn.textContent = 'Improving...';
                if (elements.imageProcessingMessage) elements.imageProcessingMessage.classList.remove('hidden');
                
                const base64Data = dataUrl.split(',')[1];
                let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 704x1280 in PNG format. Do NOT modify the person's features (e.g., hair, face, eyes).";
                
                if (useChromaKey) {
                    const colorDesc = keyColor === 'green' ? 'bright green (#00b140)' : (keyColor === 'blue' ? 'blue (#0047bb)' : keyColor);
                    instruction += ` Replace the background with a solid ${colorDesc} color.`;
                } else {
                    instruction += ` Use a nice, unobtrusive uniform background.`;
                }
                
                const data = await generateContent('gemini-3.1-flash-image-preview', instruction, project, location, token, { mimeType: file.type, data: base64Data });
                
                console.log('Image Gen Response:', data);
                const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
                
                if (part && part.inlineData && part.inlineData.data) {
                    const base64 = part.inlineData.data;
                    const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                    
                    elements.generatedImg.src = improvedUrl;
                    
                    // Update background preview and detect palette
                    updateBackground(improvedUrl, keyColor, tolerance, (colors, speed) => {
                        applyTheme(colors, speed);
                        if (onColorsDetected) onColorsDetected(colors);
                    });
                } else {
                    alert('Model did not return an image. See console.');
                }
            } catch (e: any) {
                console.error('Image improvement error:', e);
                alert('Failed to improve image: ' + e.message);
            } finally {
                elements.uploadBtn.disabled = false;
                elements.uploadBtn.textContent = originalText;
                if (elements.imageProcessingMessage) elements.imageProcessingMessage.classList.add('hidden');
            }
        } else {
            // Resize/crop to 704x1280 and convert to PNG
            const img = new Image();
            await new Promise((resolve) => {
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
                
                ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
                const processedUrl = canvas.toDataURL('image/png');
                
                // Update preview with processed image
                elements.generatedImg.src = processedUrl;
                
                // Update background preview and detect palette
                updateBackground(processedUrl, keyColor, tolerance, (colors, speed) => {
                    applyTheme(colors, speed);
                    if (onColorsDetected) onColorsDetected(colors);
                });
            }
        }
    };
    reader.readAsDataURL(file);
}

export async function handleLuckyPersona(store: any, tokenClient: any, elements: any) {
    if (!await ensureValidToken(store, tokenClient, elements)) return;
    const name = elements.avatarNameSelect.value;
    const voice = elements.voiceSelect.value;
    const preset = (AVATAR_PRESETS as any)[name];
    let texture = preset ? preset.texture : 'nice and random';
    let mood = preset ? preset.mood : 'pleasant and engaging';
    
    const prompt = `Generate a nice, funny, earnest random persona for an AI avatar named ${name} with voice ${voice}. The avatar has style ${preset ? preset.style : 'custom'}, visual texture "${texture}" and mood "${mood}". Return only the persona description.`;
    
    try {
        elements.luckyPersonaBtn.disabled = true;
        const originalText = elements.luckyPersonaBtn.textContent;
        elements.luckyPersonaBtn.textContent = 'Thinking...';
        const data = await generateContent('gemini-3-flash-preview', prompt, elements.projectIdInput.value, elements.locationInput.value || 'us-central1', elements.tokenInput.value);
        const text = data.candidates[0].content.parts[0].text;
        elements.systemInstructionInput.value = text.trim();
        elements.luckyPersonaBtn.textContent = originalText;
    } catch (e: any) {
        alert(`Failed to generate persona: ${e.message}`);
        elements.luckyPersonaBtn.textContent = "I'm feeling lucky";
    } finally {
        elements.luckyPersonaBtn.disabled = false;
    }
}

export async function handleLuckyGreeting(store: any, tokenClient: any, elements: any) {
    if (!await ensureValidToken(store, tokenClient, elements)) return;
    const persona = elements.systemInstructionInput.value;
    const name = elements.avatarNameSelect.value;
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
        elements.luckyGreetingBtn.disabled = true;
        const originalText = elements.luckyGreetingBtn.textContent;
        elements.luckyGreetingBtn.textContent = 'Thinking...';
        const data = await generateContent('gemini-3-flash-preview', prompt, elements.projectIdInput.value, elements.locationInput.value || 'us-central1', elements.tokenInput.value);
        const text = data.candidates[0].content.parts[0].text;
        elements.defaultGreetingInput.value = text.trim();
        elements.luckyGreetingBtn.textContent = originalText;
    } catch (e: any) {
        alert(`Failed to generate greeting: ${e.message}`);
        elements.luckyGreetingBtn.textContent = "I'm feeling lucky";
    } finally {
        elements.luckyGreetingBtn.disabled = false;
    }
}

export async function handleLuckyImage(store: any, tokenClient: any, elements: any) {
    if (!await ensureValidToken(store, tokenClient, elements)) return;
    const persona = elements.systemInstructionInput.value;
    const name = elements.avatarNameSelect.value;
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
        elements.luckyImageBtn.disabled = true;
        const originalText = elements.luckyImageBtn.textContent;
        elements.luckyImageBtn.textContent = 'Thinking...';
        const data = await generateContent('gemini-3-flash-preview', prompt, elements.projectIdInput.value, elements.locationInput.value || 'us-central1', elements.tokenInput.value);
        const text = data.candidates[0].content.parts[0].text;
        elements.imagePromptInput.value = text.trim();
        elements.luckyImageBtn.textContent = originalText;
    } catch (e: any) {
        alert(`Failed to generate image prompt: ${e.message}`);
        elements.luckyImageBtn.textContent = "I'm feeling lucky";
    } finally {
        elements.luckyImageBtn.disabled = false;
    }
}
