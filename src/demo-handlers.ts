import { GeminiAvatar } from './gemini-avatar';
import { generateContent, updateBackground, applyTheme } from './demo-helpers';

export async function handleImageGeneration(
    name: string,
    userPrompt: string,
    useChromaKey: boolean,
    keyColor: string,
    bgColor: string,
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, string>,
    avatar: GeminiAvatar,
    elements: {
        generateImageBtn: HTMLButtonElement,
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement
    },
    updateDropdown: (name: string) => void
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
        let finalPrompt = enhancedPrompt + ", resolution 720x1280, aspect ratio 9:16";
        if (useChromaKey) {
            finalPrompt += ` with a solid ${keyColor} background.`;
        } else if (bgColor === 'white') {
            finalPrompt += ` with a solid white background.`;
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

            // Apply transparency via canvas if needed!
            if (useChromaKey && bgColor === 'transparent') {
                const img = new Image();
                img.onload = () => {
                    const canv = document.createElement('canvas');
                    canv.width = img.width;
                    canv.height = img.height;
                    const cx = canv.getContext('2d');
                    if (cx) {
                        cx.drawImage(img, 0, 0);
                        const imgData = cx.getImageData(0, 0, canv.width, canv.height);
                        const data = imgData.data;
                        
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i+1];
                            const b = data[i+2];
                            
                            if (keyColor === 'green' && g > r && g > b) {
                                data[i+3] = 0; // Transparent!
                            } else if (keyColor === 'blue' && b > r && b > g) {
                                data[i+3] = 0; // Transparent!
                            }
                        }
                        cx.putImageData(imgData, 0, 0);
                        finalUrl = canv.toDataURL('image/png');
                        elements.generatedImg.src = finalUrl;
                        
                        // Save and update
                        customAvatars[name] = finalUrl;
                        updateDropdown(name);
                        avatar.setAttribute('custom-avatar-url', finalUrl);
                        updateBackground(finalUrl, applyTheme);
                    }
                };
                img.src = elements.generatedImg.src;
            } else {
                // Save and update
                customAvatars[name] = finalUrl;
                updateDropdown(name);
                avatar.setAttribute('custom-avatar-url', finalUrl);
                updateBackground(finalUrl, applyTheme);
            }
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
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, string>,
    avatar: GeminiAvatar,
    elements: {
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement,
        captureBtn: HTMLButtonElement,
        cameraModal: HTMLDivElement
    },
    updateDropdown: (name: string) => void
) {
    const videoWidth = videoEl.videoWidth;
    const videoHeight = videoEl.videoHeight;
    
    // Target aspect ratio 9:16
    const targetRatio = 9 / 16;
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
    canvas.width = 720; // 1K resolution for 9:16
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
        try {
            elements.captureBtn.disabled = true;
            const originalText = elements.captureBtn.textContent;
            elements.captureBtn.textContent = 'Improving...';
            
            const base64Data = dataUrl.split(',')[1];
            let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 720x1280 with 9:16 aspect ratio. Do NOT modify the person's features (e.g., hair, face, eyes).";
            
            if (useChromaKey) {
                instruction += ` Replace the background with a solid ${keyColor} color.`;
            } else if (bgColor === 'white') {
                instruction += ` Replace the background with a solid white color.`;
            } else if (bgColor === 'transparent') {
                instruction += ` Remove the background and make it transparent.`;
            }
            
            const data = await generateContent('gemini-3.1-flash-image-preview', instruction, project, location, token, { mimeType: 'image/png', data: base64Data });
            
            console.log('Image Gen Response:', data);
            const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
            
            if (part && part.inlineData && part.inlineData.data) {
                const base64 = part.inlineData.data;
                const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                elements.generatedImg.src = improvedUrl;
                
                // Save and update
                customAvatars[name] = improvedUrl;
                updateDropdown(name);
                avatar.setAttribute('custom-avatar-url', improvedUrl);
                updateBackground(improvedUrl, applyTheme);
            } else {
                alert('Model did not return an image. See console.');
            }
        } catch (e: any) {
            console.error('Image improvement error:', e);
            alert('Failed to improve image: ' + e.message);
        } finally {
            elements.captureBtn.disabled = false;
            elements.captureBtn.textContent = originalText;
        }
    }
}

export async function handleUpload(
    file: File,
    name: string,
    useChromaKey: boolean,
    keyColor: string,
    bgColor: string,
    project: string,
    location: string,
    token: string,
    customAvatars: Record<string, string>,
    avatar: GeminiAvatar,
    elements: {
        generatedImg: HTMLImageElement,
        generatedImageContainer: HTMLDivElement,
        customAvatarName: HTMLInputElement,
        uploadBtn: HTMLButtonElement
    },
    updateDropdown: (name: string) => void
) {
    const reader = new FileReader();
    reader.onload = async (re: any) => {
        const dataUrl = re.target.result;
        elements.generatedImg.src = dataUrl;
        elements.generatedImageContainer.style.display = 'block';
        if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
        
        // Auto-improvement flow for upload too!
        try {
            elements.uploadBtn.disabled = true;
            const originalText = elements.uploadBtn.textContent;
            elements.uploadBtn.textContent = 'Improving...';
            
            const base64Data = dataUrl.split(',')[1];
            let instruction = "Improve this photo for a professional avatar profile picture. Follow best practices for lighting, clarity, and style. Output resolution must be 720x1280 with 9:16 aspect ratio. Do NOT modify the person's features (e.g., hair, face, eyes).";
            
            if (useChromaKey) {
                instruction += ` Replace the background with a solid ${keyColor} color.`;
            } else if (bgColor === 'white') {
                instruction += ` Replace the background with a solid white color.`;
            } else if (bgColor === 'transparent') {
                instruction += ` Remove the background and make it transparent.`;
            }
            
            const data = await generateContent('gemini-3.1-flash-image-preview', instruction, project, location, token, { mimeType: file.type, data: base64Data });
            
            console.log('Image Gen Response:', data);
            const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
            
            if (part && part.inlineData && part.inlineData.data) {
                const base64 = part.inlineData.data;
                const improvedUrl = `data:${part.inlineData.mimeType};base64,${base64}`;
                elements.generatedImg.src = improvedUrl;
                
                // Save and update
                customAvatars[name] = improvedUrl;
                updateDropdown(name);
                avatar.setAttribute('custom-avatar-url', improvedUrl);
                updateBackground(improvedUrl, applyTheme);
            } else {
                alert('Model did not return an image. See console.');
            }
        } catch (e: any) {
            console.error('Image improvement error:', e);
            alert('Failed to improve image: ' + e.message);
        } finally {
            elements.uploadBtn.disabled = false;
            elements.uploadBtn.textContent = originalText;
        }
    };
    reader.readAsDataURL(file);
}
