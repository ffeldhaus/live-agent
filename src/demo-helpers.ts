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
    
    // Override location for models only available on global endpoint
    if (model === 'gemini-3.1-flash-image-preview' || model === 'gemini-3-flash-preview') {
        location = 'global';
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
export function updateBackground(
  imageUrl: string,
  onThemeApplied: (colors: string[], speed: string) => void,
  keyColor?: string
) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, 100, 100);

      // Read pixels from the bottom half (indicative of Avatar color)
      const imgData = ctx.getImageData(0, 50, 100, 50);
      const data = imgData.data;

      // Count color frequencies
      const colors: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (data[i + 3] < 128) continue; // Ignore transparent

        if (keyColor === 'green' && g > r && g > b) continue;
        if (keyColor === 'blue' && b > r && b > g) continue;

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colors[hex] = (colors[hex] || 0) + 1;
      }

      // Sort by frequency
      const sortedColors = Object.entries(colors).sort((a, b) => b[1] - a[1]);

      if (sortedColors.length > 0) {
        const color1 = sortedColors[0][0];
        const color2 = sortedColors[1] ? sortedColors[1][0] : color1;
        const color3 = sortedColors[2] ? sortedColors[2][0] : color2;

        console.log(
          "Dominant colors detected (bottom half):",
          color1,
          color2,
          color3,
        );

        onThemeApplied([color1, color2, color3], "15s");
      }
    }
  };
  img.src = imageUrl;
}

export function applyTheme(colors: string[], speed: string) {
    const body = document.body;
    
    // Only add animated-bg if no background image is set
    if (!body.style.backgroundImage || body.style.backgroundImage === 'none') {
        body.classList.add("animated-bg");
    }
    
    body.style.setProperty('--c1', colors[0] + '44'); // Low opacity
    body.style.setProperty('--c2', colors[1] ? colors[1] + '44' : colors[0] + '44');
    body.style.setProperty('--c3', colors[2] ? colors[2] + '44' : colors[0] + '44');
    body.style.setProperty('--c4', colors[2] ? colors[2] + '44' : colors[0] + '44'); // Repeat c3
    body.style.setProperty('--speed', speed);
}

export function applyAvatarTheme(
    avatarName: string,
    avatar: GeminiAvatar,
    customAvatars: Record<string, { image: string, type: 'custom', palette?: string[] }>,
    elements: {
        customAvatarName?: HTMLInputElement,
        generatedImg?: HTMLImageElement,
        generatedImageContainer?: HTMLDivElement,
        newCustomAvatarBtn?: HTMLButtonElement
    }
) {
    const keyColor = avatar.getAttribute('chroma-key-color') || 'green';
    const preset = (AVATAR_PRESETS as any)[avatarName];
    if (preset && preset.palette) {
        // Map mood to animation speed
        let speed = '15s';
        if (preset.mood.includes('Breezy') || preset.mood.includes('Vibrant')) speed = '10s';
        if (preset.mood.includes('Calm') || preset.mood.includes('Gentle')) speed = '25s';
        
        applyTheme(preset.palette, speed);
        avatar.setPreview(avatarName);
    } else if (customAvatars[avatarName]) {
        const customAvatar = customAvatars[avatarName];
        if (elements.customAvatarName)
          elements.customAvatarName.value = avatarName;
        if (elements.generatedImg)
          elements.generatedImg.src = customAvatar.image;
        if (elements.generatedImageContainer) elements.generatedImageContainer.style.display = 'block';
        avatar.setAttribute('custom-avatar-url', customAvatar.image);
        
        if (customAvatar.palette) {
            applyTheme(customAvatar.palette, '15s');
        } else {
            updateBackground(customAvatar.image, applyTheme, keyColor);
        }
        
        if (elements.customAvatarName) elements.customAvatarName.dispatchEvent(new Event('input'));
    } else {
        avatar.setPreview(avatarName);
        const pr = (AVATAR_PRESETS as any)[avatarName];
        if (pr && pr.image) {
            updateBackground(pr.image, applyTheme, keyColor);
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

export function updateStats(avatar: any, elements: any) {
    const stats = avatar.getStats();
    if (elements.statSetupDuration) elements.statSetupDuration.textContent = stats.setupDurationMs ? stats.setupDurationMs.toString() : '-';
    if (elements.statLatency) elements.statLatency.textContent = stats.setupToFirstFrameDurationMs ? stats.setupToFirstFrameDurationMs.toString() : '-';
    if (elements.statPacketsReceived) elements.statPacketsReceived.textContent = stats.packetsReceived.toString();
    if (elements.statAudioSent) elements.statAudioSent.textContent = stats.audioChunksSent.toString();
    if (elements.statVideoSent) elements.statVideoSent.textContent = stats.videoFramesSent.toString();
    if (elements.statVideoPackets) elements.statVideoPackets.textContent = stats.videoPacketsReceived.toString();
    if (elements.statTotalFrames) elements.statTotalFrames.textContent = stats.totalVideoFrames.toString();
    if (elements.statSessionDuration) elements.statSessionDuration.textContent = stats.sessionDurationMs ? (stats.sessionDurationMs / 1000).toFixed(1) : '-';
    if (elements.statFps) elements.statFps.textContent = stats.averageFps ? stats.averageFps.toString() : '-';
    if (elements.statDownlink) elements.statDownlink.textContent = stats.networkInfo?.downlink ? stats.networkInfo.downlink.toString() : '-';
    if (elements.statRtt) elements.statRtt.textContent = stats.networkInfo?.rtt ? stats.networkInfo.rtt.toString() : '-';
    if (elements.statConnType) elements.statConnType.textContent = stats.networkInfo?.type || '-';
    
    const setup = stats.setupDurationMs || 0;
    const latency = stats.setupToFirstFrameDurationMs || 0;
    const total = setup + latency;

    if (elements.statTotalLatency) elements.statTotalLatency.textContent = total.toString();

    if (elements.barSetup && elements.barLatency && total > 0) {
        const setupPct = (setup / total) * 100;
        const latencyPct = (latency / total) * 100;

        elements.barSetup.style.width = `${setupPct}%`;
        elements.barSetup.textContent = setup > 0 ? `${setup}ms` : "";

        elements.barLatency.style.width = `${latencyPct}%`;
        elements.barLatency.textContent = latency > 0 ? `${latency}ms` : "";
    }
}
