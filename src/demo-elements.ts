import { GeminiAvatar } from './gemini-avatar';

export function queryElements() {
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
    
    const micAutoRequestToggle = document.getElementById('micAutoRequestToggle') as HTMLInputElement;
    const ctrlMic = document.getElementById('ctrlMic') as HTMLInputElement;
    const ctrlCamera = document.getElementById('ctrlCamera') as HTMLInputElement;
    const ctrlScreen = document.getElementById('ctrlScreen') as HTMLInputElement;
    const ctrlMute = document.getElementById('ctrlMute') as HTMLInputElement;
    const ctrlSnapshot = document.getElementById('ctrlSnapshot') as HTMLInputElement;
    const ctrlSettings = document.getElementById('ctrlSettings') as HTMLInputElement;
    
    const audioChunkSizeSlider = document.getElementById('audioChunkSize') as HTMLInputElement;
    const chunkSizeVal = document.getElementById('chunkSizeVal') as HTMLSpanElement;
    
    const statSetupDuration = document.getElementById('statSetupDuration') as HTMLSpanElement;
    const statLatency = document.getElementById('statLatency') as HTMLSpanElement;
    const statPacketsReceived = document.getElementById('statPacketsReceived') as HTMLSpanElement;
    const statAudioSent = document.getElementById('statAudioSent') as HTMLSpanElement;
    const statVideoSent = document.getElementById('statVideoSent') as HTMLSpanElement;
    const statVideoPackets = document.getElementById('statVideoPackets') as HTMLSpanElement;
    const statTotalFrames = document.getElementById('statTotalFrames') as HTMLSpanElement;
    const statSessionDuration = document.getElementById('statSessionDuration') as HTMLSpanElement;
    const statFps = document.getElementById('statFps') as HTMLSpanElement;
    const statDownlink = document.getElementById('statDownlink') as HTMLSpanElement;
    const statRtt = document.getElementById('statRtt') as HTMLSpanElement;
    const statConnType = document.getElementById('statConnType') as HTMLSpanElement;
    
    const systemInstructionInput = document.getElementById('systemInstruction') as HTMLTextAreaElement;
    const defaultGreetingInput = document.getElementById('defaultGreeting') as HTMLInputElement;
    const imagePromptInput = document.getElementById('imagePrompt') as HTMLInputElement;
    const luckyPersonaBtn = document.getElementById('luckyPersonaBtn') as HTMLButtonElement;
    const luckyGreetingBtn = document.getElementById('luckyGreetingBtn') as HTMLButtonElement;
    const luckyImageBtn = document.getElementById('luckyImageBtn') as HTMLButtonElement;
    const generateImageBtn = document.getElementById('generateImageBtn') as HTMLButtonElement;
    const generatedImageContainer = document.getElementById('generatedImageContainer') as HTMLDivElement;
    const generatedImg = document.getElementById('generatedImg') as HTMLImageElement;
    
    const enableChromaKey = document.getElementById('enableChromaKey') as HTMLInputElement;
    const chromaKeyColor = document.getElementById('chromaKeyColor') as HTMLSelectElement;
    const backgroundColor = document.getElementById("backgroundColor") as HTMLSelectElement;
    
    const qaContainer = document.getElementById("qaContainer") as HTMLDivElement;
    const qaList = document.getElementById("qaList") as HTMLDivElement;
    const toggleQaBtn = document.getElementById("toggleQaBtn") as HTMLButtonElement;
    
    const enableTranscript = document.getElementById("enableTranscript") as HTMLInputElement;
    const enableChatInput = document.getElementById("enableChatInput") as HTMLInputElement;
    const enableSessionResumption = document.getElementById("enableSessionResumption") as HTMLInputElement;
    const renderOutsideToggle = document.getElementById("renderOutsideToggle") as HTMLInputElement;
    const externalTranscriptSection = document.getElementById("externalTranscriptSection") as HTMLDivElement;
    const externalTranscript = document.getElementById("externalTranscript") as HTMLDivElement;
    const externalChatInput = document.getElementById("externalChatInput") as HTMLInputElement;
    const externalSendBtn = document.getElementById("externalSendBtn") as HTMLButtonElement;
    
    const barSetup = document.getElementById("barSetup") as HTMLDivElement;
    const barLatency = document.getElementById("barLatency") as HTMLDivElement;
    const statTotalLatency = document.getElementById("statTotalLatency") as HTMLSpanElement;
    const cameraBtn = document.getElementById("cameraBtn") as HTMLButtonElement;
    const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
    
    const enableGrounding = document.getElementById("enableGrounding") as HTMLInputElement;
    
    const cameraModal = document.getElementById("cameraModal") as HTMLDivElement;
    const cameraVideo = document.getElementById("cameraVideo") as HTMLVideoElement;
    const cameraVideoContainer = document.getElementById("cameraVideoContainer") as HTMLDivElement;
    const captureBtn = document.getElementById("captureBtn") as HTMLButtonElement;
    const closeCameraBtn = document.getElementById("closeCameraBtn") as HTMLButtonElement;
    
    const googleSignInBtn = document.getElementById("googleSignInBtn") as HTMLDivElement;
    const userProfile = document.getElementById("userProfile") as HTMLDivElement;
    const userAvatar = document.getElementById("userAvatar") as HTMLImageElement;
    const userName = document.getElementById("userName") as HTMLSpanElement;
    
    const customAvatarName = document.getElementById("customAvatarName") as HTMLInputElement;
    const newCustomAvatarBtn = document.getElementById("newCustomAvatarBtn") as HTMLButtonElement;
    const saveCustomAvatarBtn = document.getElementById("saveCustomAvatarBtn") as HTMLButtonElement;
    const toggleImageImprovement = document.getElementById("toggleImageImprovement") as HTMLInputElement;
    const imageProcessingMessage = document.getElementById("imageProcessingMessage") as HTMLParagraphElement;

    const bgImagePrompt = document.getElementById('bgImagePrompt') as HTMLInputElement;
    const luckyBgPromptBtn = document.getElementById('luckyBgPromptBtn') as HTMLButtonElement;
    const bgImageUrl = document.getElementById('bgImageUrl') as HTMLInputElement;
    const clearBgBtn = document.getElementById('clearBgBtn') as HTMLButtonElement;
    const bgImageUpload = document.getElementById('bgImageUpload') as HTMLInputElement;
    const uploadBgBtn = document.getElementById('uploadBgBtn') as HTMLButtonElement;
    const generateBgBtn = document.getElementById('generateBgBtn') as HTMLButtonElement;

    const elements = {
      avatar, tokenInput, userName, userAvatar, userProfile, googleSignInBtn,
      projectIdInput, locationInput, avatarNameSelect, sizeSelect, positionSelect,
      oauthClientIdInput, voiceSelect, languageSelect, saveVideoToggle, debugToggle,
      recordUserAudioCheckbox, micAutoRequestToggle, ctrlMic, ctrlCamera, ctrlScreen,
      ctrlMute, ctrlSnapshot, ctrlSettings, audioChunkSizeSlider, chunkSizeVal, systemInstructionInput,
      defaultGreetingInput, imagePromptInput, enableChromaKey, chromaKeyColor,
      backgroundColor, qaContainer, qaList, toggleQaBtn,
      enableTranscript, enableChatInput, renderOutsideToggle, externalTranscriptSection,
      externalTranscript, externalChatInput, externalSendBtn, barSetup, barLatency,
      statTotalLatency, cameraBtn, uploadBtn, enableGrounding, cameraModal,
      cameraVideo, cameraVideoContainer, captureBtn, closeCameraBtn,
      customAvatarName, generatedImg, generatedImageContainer, newCustomAvatarBtn,
      saveCustomAvatarBtn, toggleImageImprovement, imageProcessingMessage,
      luckyPersonaBtn, luckyGreetingBtn, luckyImageBtn, streamBtn,
      enableSessionResumption, bgImagePrompt, luckyBgPromptBtn, bgImageUrl,
      clearBgBtn, bgImageUpload, uploadBgBtn, generateBgBtn, saveBtn, sendBtn, textInput, copyHtmlBtn,
      statSetupDuration, statLatency, statPacketsReceived, statAudioSent, statVideoSent,
      statVideoPackets, statTotalFrames, statSessionDuration, statFps, statDownlink,
      statRtt, statConnType
    };

    return elements;
}
