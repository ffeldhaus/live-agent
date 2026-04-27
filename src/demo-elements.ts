import {GeminiAvatar} from './gemini-avatar';

export function queryElements() {
  const avatar = document.getElementById('my-avatar') as GeminiAvatar;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const resetAvatarBtn = document.getElementById(
    'resetAvatarBtn',
  ) as HTMLButtonElement;
  const tokenInput = document.getElementById('accessToken') as HTMLInputElement;
  const saveVideoToggle = document.getElementById(
    'saveVideoToggle',
  ) as HTMLInputElement;
  const saveVideoToggle2 = document.getElementById(
    'saveVideoToggle2',
  ) as HTMLInputElement;
  const debugToggle = document.getElementById(
    'debugToggle',
  ) as HTMLInputElement;
  const projectIdInput = document.getElementById(
    'projectId',
  ) as HTMLInputElement;
  const locationInput = document.getElementById('location') as HTMLInputElement;
  const avatarNameSelect = document.getElementById(
    'avatarName',
  ) as HTMLSelectElement;
  const voiceSelect = document.getElementById(
    'voiceSelect',
  ) as HTMLSelectElement;
  const languageSelect = document.getElementById(
    'languageSelect',
  ) as HTMLSelectElement;
  const sizeSelect = document.getElementById('size') as HTMLSelectElement;
  const positionSelect = document.getElementById(
    'position',
  ) as HTMLSelectElement;
  const oauthClientIdInput = document.getElementById(
    'oauthClientId',
  ) as HTMLInputElement;
  const streamBtn = document.getElementById('streamBtn') as HTMLButtonElement;
  const sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
  const textInput = document.getElementById('textInput') as HTMLInputElement;
  const copyHtmlBtn = document.getElementById(
    'copyHtmlBtn',
  ) as HTMLButtonElement;
  const recordUserAudioCheckbox = document.getElementById(
    'recordUserAudio',
  ) as HTMLInputElement;

  const expandBtn = document.getElementById('expandBtn') as HTMLButtonElement;
  const configContainer = document.getElementById(
    'configContainer',
  ) as HTMLDivElement;

  const micAutoRequestToggle = document.getElementById(
    'micAutoRequestToggle',
  ) as HTMLInputElement;
  const ctrlMic = document.getElementById('ctrlMic') as HTMLInputElement;
  const ctrlCamera = document.getElementById('ctrlCamera') as HTMLInputElement;
  const ctrlScreen = document.getElementById('ctrlScreen') as HTMLInputElement;
  const ctrlMute = document.getElementById('ctrlMute') as HTMLInputElement;
  const ctrlSnapshot = document.getElementById(
    'ctrlSnapshot',
  ) as HTMLInputElement;
  const ctrlSettings = document.getElementById(
    'ctrlSettings',
  ) as HTMLInputElement;

  const audioChunkSizeSlider = document.getElementById(
    'audioChunkSize',
  ) as HTMLInputElement;
  const chunkSizeVal = document.getElementById(
    'chunkSizeVal',
  ) as HTMLSpanElement;

  const statSetupDuration = document.getElementById(
    'statSetupDuration',
  ) as HTMLSpanElement;
  const statLatency = document.getElementById('statLatency') as HTMLSpanElement;
  const statPacketsReceived = document.getElementById(
    'statPacketsReceived',
  ) as HTMLSpanElement;
  const statAudioSent = document.getElementById(
    'statAudioSent',
  ) as HTMLSpanElement;
  const statVideoSent = document.getElementById(
    'statVideoSent',
  ) as HTMLSpanElement;
  const statVideoPackets = document.getElementById(
    'statVideoPackets',
  ) as HTMLSpanElement;
  const statTotalFrames = document.getElementById(
    'statTotalFrames',
  ) as HTMLSpanElement;
  const statSessionDuration = document.getElementById(
    'statSessionDuration',
  ) as HTMLSpanElement;
  const statFps = document.getElementById('statFps') as HTMLSpanElement;
  const statChromaKeyDuration = document.getElementById(
    'statChromaKeyDuration',
  ) as HTMLSpanElement;
  const statDownlink = document.getElementById(
    'statDownlink',
  ) as HTMLSpanElement;
  const statRtt = document.getElementById('statRtt') as HTMLSpanElement;
  const statConnType = document.getElementById(
    'statConnType',
  ) as HTMLSpanElement;

  const systemInstructionInput = document.getElementById(
    'systemInstruction',
  ) as HTMLTextAreaElement;
  const defaultGreetingInput = document.getElementById(
    'defaultGreeting',
  ) as HTMLInputElement;
  const imagePromptInput = document.getElementById(
    'imagePrompt',
  ) as HTMLInputElement;
  const luckyPersonaBtn = document.getElementById(
    'luckyPersonaBtn',
  ) as HTMLButtonElement;
  const luckyGreetingBtn = document.getElementById(
    'luckyGreetingBtn',
  ) as HTMLButtonElement;
  const luckyImageBtn = document.getElementById(
    'luckyImageBtn',
  ) as HTMLButtonElement;
  const generateImageBtn = document.getElementById(
    'generateImageBtn',
  ) as HTMLButtonElement;
  const generatedImageContainer = document.getElementById(
    'generatedImageContainer',
  ) as HTMLDivElement;
  const generatedImg = document.getElementById(
    'generatedImg',
  ) as HTMLImageElement;
  const originalImg = document.getElementById(
    'originalImg',
  ) as HTMLImageElement;
  const redoImprovementBtn = document.getElementById(
    'redoImprovementBtn',
  ) as HTMLButtonElement;

  const enableChromaKey = document.getElementById(
    'enableChromaKey',
  ) as HTMLInputElement;
  const chromaKeyColor = document.getElementById(
    'chromaKeyColor',
  ) as HTMLSelectElement;

  const chromaKeyTolerance = document.getElementById(
    'chromaKeyTolerance',
  ) as HTMLInputElement;
  const chromaKeyToleranceVal = document.getElementById(
    'chromaKeyToleranceVal',
  ) as HTMLSpanElement;

  const qaContainer = document.getElementById('qaContainer') as HTMLDivElement;
  const qaList = document.getElementById('qaList') as HTMLDivElement;
  const toggleQaBtn = document.getElementById(
    'toggleQaBtn',
  ) as HTMLButtonElement;

  const enableTranscript = document.getElementById(
    'enableTranscript',
  ) as HTMLInputElement;
  const enableChatInput = document.getElementById(
    'enableChatInput',
  ) as HTMLInputElement;
  const enableSessionResumption = document.getElementById(
    'enableSessionResumption',
  ) as HTMLInputElement;

  const barSetup = document.getElementById('barSetup') as HTMLDivElement;
  const barLatency = document.getElementById('barLatency') as HTMLDivElement;
  const statTotalLatency = document.getElementById(
    'statTotalLatency',
  ) as HTMLSpanElement;
  const cameraBtn = document.getElementById('cameraBtn') as HTMLButtonElement;
  const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;

  const enableGrounding = document.getElementById(
    'enableGrounding',
  ) as HTMLInputElement;

  const cameraModal = document.getElementById('cameraModal') as HTMLDivElement;
  const cameraVideo = document.getElementById(
    'cameraVideo',
  ) as HTMLVideoElement;
  const cameraVideoContainer = document.getElementById(
    'cameraVideoContainer',
  ) as HTMLDivElement;
  const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
  const closeCameraBtn = document.getElementById(
    'closeCameraBtn',
  ) as HTMLButtonElement;

  const tokenErrorModal = document.getElementById(
    'tokenErrorModal',
  ) as HTMLDivElement;
  const tokenErrorMsg = document.getElementById(
    'tokenErrorMsg',
  ) as HTMLParagraphElement;
  const tokenErrorDetails = document.getElementById(
    'tokenErrorDetails',
  ) as HTMLDivElement;
  const closeTokenErrorBtn = document.getElementById(
    'closeTokenErrorBtn',
  ) as HTMLButtonElement;

  const googleSignInBtn = document.getElementById(
    'googleSignInBtn',
  ) as HTMLDivElement;
  const userProfile = document.getElementById('userProfile') as HTMLDivElement;
  const userAvatar = document.getElementById('userAvatar') as HTMLImageElement;
  const userName = document.getElementById('userName') as HTMLSpanElement;

  const customAvatarName = document.getElementById(
    'customAvatarName',
  ) as HTMLInputElement;
  const newCustomAvatarBtn = document.getElementById(
    'newCustomAvatarBtn',
  ) as HTMLButtonElement;
  const saveCustomAvatarBtn = document.getElementById(
    'saveCustomAvatarBtn',
  ) as HTMLButtonElement;
  const toggleImageImprovement = document.getElementById(
    'toggleImageImprovement',
  ) as HTMLInputElement;
  const imageProcessingMessage = document.getElementById(
    'imageProcessingMessage',
  ) as HTMLParagraphElement;

  const bgImagePrompt = document.getElementById(
    'bgImagePrompt',
  ) as HTMLInputElement;
  const luckyBgPromptBtn = document.getElementById(
    'luckyBgPromptBtn',
  ) as HTMLButtonElement;
  const bgImageUrl = document.getElementById('bgImageUrl') as HTMLInputElement;
  const clearBgBtn = document.getElementById('clearBgBtn') as HTMLButtonElement;
  const bgImageUpload = document.getElementById(
    'bgImageUpload',
  ) as HTMLInputElement;
  const uploadBgBtn = document.getElementById(
    'uploadBgBtn',
  ) as HTMLButtonElement;
  const generateBgBtn = document.getElementById(
    'generateBgBtn',
  ) as HTMLButtonElement;

  const addAvatarBtn = document.getElementById(
    'addAvatarBtn',
  ) as HTMLButtonElement;
  const avatar2Config = document.getElementById(
    'avatar2Config',
  ) as HTMLDetailsElement;
  const avatarName2 = document.getElementById(
    'avatarName2',
  ) as HTMLSelectElement;
  const voiceSelect2 = document.getElementById(
    'voiceSelect2',
  ) as HTMLSelectElement;
  const size2 = document.getElementById('size2') as HTMLSelectElement;
  const position2 = document.getElementById('position2') as HTMLSelectElement;
  const languageSelect2 = document.getElementById(
    'languageSelect2',
  ) as HTMLSelectElement;
  const enableChromaKey2 = document.getElementById(
    'enableChromaKey2',
  ) as HTMLInputElement;
  const chromaKeyTolerance2 = document.getElementById(
    'chromaKeyTolerance2',
  ) as HTMLInputElement;
  const chromaKeyToleranceVal2 = document.getElementById(
    'chromaKeyToleranceVal2',
  ) as HTMLSpanElement;
  const enableTranscript2 = document.getElementById(
    'enableTranscript2',
  ) as HTMLInputElement;

  const enableChatInput2 = document.getElementById(
    'enableChatInput2',
  ) as HTMLInputElement;
  const enableSessionResumption2 = document.getElementById(
    'enableSessionResumption2',
  ) as HTMLInputElement;
  const enableGrounding2 = document.getElementById(
    'enableGrounding2',
  ) as HTMLInputElement;
  const systemInstruction2 = document.getElementById(
    'systemInstruction2',
  ) as HTMLTextAreaElement;
  const luckyPersonaBtn2 = document.getElementById(
    'luckyPersonaBtn2',
  ) as HTMLButtonElement;
  const defaultGreeting2 = document.getElementById(
    'defaultGreeting2',
  ) as HTMLInputElement;
  const luckyGreetingBtn2 = document.getElementById(
    'luckyGreetingBtn2',
  ) as HTMLButtonElement;

  const statPacketsReceived2 = document.getElementById(
    'statPacketsReceived2',
  ) as HTMLSpanElement;
  const statAudioSent2 = document.getElementById(
    'statAudioSent2',
  ) as HTMLSpanElement;
  const statVideoSent2 = document.getElementById(
    'statVideoSent2',
  ) as HTMLSpanElement;
  const statVideoPackets2 = document.getElementById(
    'statVideoPackets2',
  ) as HTMLSpanElement;
  const statTotalFrames2 = document.getElementById(
    'statTotalFrames2',
  ) as HTMLSpanElement;
  const statSessionDuration2 = document.getElementById(
    'statSessionDuration2',
  ) as HTMLSpanElement;
  const statFps2 = document.getElementById('statFps2') as HTMLSpanElement;
  const statChromaKeyDuration2 = document.getElementById(
    'statChromaKeyDuration2',
  ) as HTMLSpanElement;
  const statCpuPressure = document.getElementById(
    'statCpuPressure',
  ) as HTMLSpanElement;

  const elements = {
    avatar,
    tokenInput,
    userName,
    userAvatar,
    userProfile,
    googleSignInBtn,
    projectIdInput,
    locationInput,
    avatarNameSelect,
    sizeSelect,
    positionSelect,
    oauthClientIdInput,
    voiceSelect,
    languageSelect,
    saveVideoToggle,
    saveVideoToggle2,
    debugToggle,
    recordUserAudioCheckbox,
    micAutoRequestToggle,
    ctrlMic,
    ctrlCamera,
    ctrlScreen,
    ctrlMute,
    ctrlSnapshot,
    ctrlSettings,
    audioChunkSizeSlider,
    chunkSizeVal,
    systemInstructionInput,
    defaultGreetingInput,
    imagePromptInput,
    enableChromaKey,
    chromaKeyColor,
    chromaKeyTolerance,
    chromaKeyToleranceVal,
    qaContainer,
    qaList,
    toggleQaBtn,
    enableTranscript,
    enableChatInput,
    barSetup,
    barLatency,
    statTotalLatency,
    cameraBtn,
    uploadBtn,
    enableGrounding,
    cameraModal,
    cameraVideo,
    cameraVideoContainer,
    captureBtn,
    closeCameraBtn,
    tokenErrorModal,
    tokenErrorMsg,
    tokenErrorDetails,
    closeTokenErrorBtn,
    customAvatarName,
    generatedImg,
    originalImg,
    generatedImageContainer,
    newCustomAvatarBtn,
    saveCustomAvatarBtn,
    toggleImageImprovement,
    imageProcessingMessage,
    redoImprovementBtn,
    luckyPersonaBtn,
    luckyGreetingBtn,
    luckyImageBtn,
    generateImageBtn,
    streamBtn,
    enableSessionResumption,
    bgImagePrompt,
    luckyBgPromptBtn,
    bgImageUrl,
    clearBgBtn,
    bgImageUpload,
    uploadBgBtn,
    generateBgBtn,
    saveBtn,
    resetAvatarBtn,
    sendBtn,
    textInput,
    copyHtmlBtn,
    expandBtn,
    configContainer,
    statSetupDuration,
    statLatency,
    statPacketsReceived,
    statAudioSent,
    statVideoSent,
    statVideoPackets,
    statTotalFrames,
    statSessionDuration,
    statFps,
    statChromaKeyDuration,
    statDownlink,
    statRtt,
    statConnType,
    addAvatarBtn,
    avatar2Config,
    avatarName2,
    voiceSelect2,
    size2,
    position2,
    languageSelect2,
    enableChromaKey2,
    chromaKeyTolerance2,
    chromaKeyToleranceVal2,
    enableTranscript2,
    enableChatInput2,
    enableSessionResumption2,
    enableGrounding2,
    systemInstruction2,
    luckyPersonaBtn2,
    defaultGreeting2,
    luckyGreetingBtn2,
    statPacketsReceived2,
    statAudioSent2,
    statVideoSent2,
    statVideoPackets2,
    statTotalFrames2,
    statSessionDuration2,
    statFps2,
    statChromaKeyDuration2,
    statCpuPressure,
  };

  return elements;
}
