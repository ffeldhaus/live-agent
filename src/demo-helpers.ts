import { AVATAR_PRESETS } from './constants';
import { GeminiAvatar } from './gemini-avatar';

// REST API Helper
export async function generateContent(
    model: string, 
    prompt: string, 
    project: string,
    location: string,
    token: string,
    inlineData?: { mimeType: string, data: string }
) {
    if (!project || !token) {
        throw new Error('Project ID and Access Token are required for AI generation features.');
    }
    
    const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
    
    const parts: any[] = [{ text: prompt }];
    if (inlineData) {
        parts.push({ inlineData });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts }]
        })
    });
    
    if (!response.ok) {
        const err = await response.text();
        console.error(`API Error (${model}):`, err);
        throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
}

// Background Color Adaptation
export function updateBackground(imageUrl: string, onThemeApplied: (colors: string[], speed: string) => void) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, 100, 100);
            
            // Read pixels from the bottom half (indicative of Avatar color)
            const imgData = ctx.getImageData(0, 50, 100, 50);
            const data = imgData.data;
            
            // Count color frequencies
            const colors: Record<string, number> = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                
                if (data[i+3] < 128) continue; // Ignore transparent
                
                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                colors[hex] = (colors[hex] || 0) + 1;
            }
            
            // Sort by frequency
            const sortedColors = Object.entries(colors).sort((a, b) => b[1] - a[1]);
            
            if (sortedColors.length > 0) {
                const color1 = sortedColors[0][0];
                const color2 = sortedColors[1] ? sortedColors[1][0] : color1;
                const color3 = sortedColors[2] ? sortedColors[2][0] : color2;
                const color4 = sortedColors[3] ? sortedColors[3][0] : color3;
                
                console.log('Dominant colors detected (bottom half):', color1, color2, color3, color4);
                
                onThemeApplied([color1, color2, color3, color4], '15s');
            }
        }
    };
    img.src = imageUrl;
}

export function applyTheme(colors: string[], speed: string) {
    const body = document.body;
    body.classList.add('animated-bg');
    body.style.setProperty('--c1', colors[0] + '44'); // Low opacity
    body.style.setProperty('--c2', colors[1] ? colors[1] + '44' : colors[0] + '44');
    body.style.setProperty('--c3', colors[2] ? colors[2] + '44' : colors[0] + '44');
    body.style.setProperty('--c4', colors[3] ? colors[3] + '44' : colors[0] + '44');
    body.style.setProperty('--speed', speed);
}

export function applyAvatarTheme(
    avatarName: string,
    avatar: GeminiAvatar,
    customAvatars: Record<string, string>,
    elements: {
        customAvatarName?: HTMLInputElement,
        generatedImg?: HTMLImageElement,
        generatedImageContainer?: HTMLDivElement,
        newCustomAvatarBtn?: HTMLButtonElement
    }
) {
    const preset = (AVATAR_PRESETS as any)[avatarName];
    if (preset && preset.palette) {
        // Map mood to animation speed
        let speed = '15s';
        if (preset.mood.includes('Breezy') || preset.mood.includes('Vibrant')) speed = '10s';
        if (preset.mood.includes('Calm') || preset.mood.includes('Gentle')) speed = '25s';
        
        applyTheme(preset.palette, speed);
        avatar.setPreview(avatarName);
    } else if (customAvatars[avatarName]) {
        if (elements.customAvatarName) elements.customAvatarName.value = avatarName;
        if (elements.generatedImg) elements.generatedImg.src = customAvatars[avatarName];
        if (elements.generatedImageContainer) elements.generatedImageContainer.style.display = 'block';
        avatar.setAttribute('custom-avatar-url', customAvatars[avatarName]);
        updateBackground(customAvatars[avatarName], applyTheme);
        if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
    } else {
        avatar.setPreview(avatarName);
        const pr = (AVATAR_PRESETS as any)[avatarName];
        if (pr && pr.image) {
            updateBackground(pr.image, applyTheme);
        }
    }
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
