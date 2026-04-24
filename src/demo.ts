import { GeminiAvatar } from './gemini-avatar';
import { AVATAR_PRESETS, VOICE_PRESETS } from './constants';
import { qaScenarios } from './walkthrough-data';
import { generateContent, updateBackground, applyTheme, applyAvatarTheme, downloadBlob, updateStats } from './demo-helpers';
import {
  handleImageGeneration,
  handleCameraCapture,
  handleUpload,
  handleImageImprovement,
  handleBackgroundGeneration,
  handleBackgroundUpload,
  handleLuckyBgPrompt
} from "./demo-handlers";
import { setupWalkthrough } from './demo-walkthrough';
import { verifyToken, fetchUserProfile, ensureValidToken, displayUserProfile } from './auth';
import { loadSettings, saveSettings } from './settings';
import { queryElements } from './demo-elements';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Demo script started');
    const elements = queryElements();
    const customAvatars: Record<string, { image: string; originalImage?: string; type: "custom"; palette?: string[] }> = {};
    const {
      avatar, tokenInput, userName, userAvatar, userProfile, googleSignInBtn,
      projectIdInput, locationInput, avatarNameSelect, sizeSelect, positionSelect,
      oauthClientIdInput, voiceSelect, languageSelect, saveVideoToggle, debugToggle,
      recordUserAudioCheckbox, micAutoRequestToggle, ctrlMic, ctrlCamera, ctrlScreen,
      ctrlMute, ctrlSnapshot, ctrlSettings, audioChunkSizeSlider, chunkSizeVal, systemInstructionInput,
      defaultGreetingInput, imagePromptInput, enableChromaKey, chromaKeyColor, chromaKeyTolerance, chromaKeyToleranceVal,
      qaContainer, qaList, toggleQaBtn,
      enableTranscript, enableChatInput, renderOutsideToggle, externalTranscriptSection,
      externalTranscript, externalChatInput, externalSendBtn, barSetup, barLatency,
      statTotalLatency, cameraBtn, uploadBtn, enableGrounding, cameraModal,
      cameraVideo, cameraVideoContainer, captureBtn, closeCameraBtn,
      customAvatarName, generatedImg, generatedImageContainer, newCustomAvatarBtn,
      saveCustomAvatarBtn, toggleImageImprovement, imageProcessingMessage,
      luckyPersonaBtn, luckyGreetingBtn, luckyImageBtn, streamBtn,
      enableSessionResumption, bgImagePrompt, luckyBgPromptBtn, bgImageUrl,
      clearBgBtn, bgImageUpload, uploadBgBtn, generateBgBtn, generateImageBtn, saveBtn, sendBtn, textInput, copyHtmlBtn,
      expandBtn, configContainer
    } = elements;

    let avatar2: GeminiAvatar | null = null;
    let isAvatar2Active = false;

    const sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    avatar.setAudioContext(sharedAudioContext);

    // CPU Pressure Observer
    if ('PressureObserver' in window) {
        const observer = new (window as any).PressureObserver((records: any[]) => {
            const lastRecord = records[records.length - 1];
            if (elements.statCpuPressure) {
                elements.statCpuPressure.textContent = lastRecord.state;
                if (lastRecord.state === 'nominal') elements.statCpuPressure.style.color = '#22c55e';
                else if (lastRecord.state === 'fair') elements.statCpuPressure.style.color = '#eab308';
                else if (lastRecord.state === 'serious') elements.statCpuPressure.style.color = '#f97316';
                else if (lastRecord.state === 'critical') elements.statCpuPressure.style.color = '#ef4444';
            }
        }, { sampleInterval: 1000 });
        
        try {
            observer.observe('cpu');
        } catch (e) {
            console.error("Failed to observe CPU pressure:", e);
            if (elements.statCpuPressure) elements.statCpuPressure.textContent = 'Error';
        }
    } else {
        if (elements.statCpuPressure) elements.statCpuPressure.textContent = 'Not supported';
    }

    // Reactive State Store
    const appState = {
      projectId: "",
      location: "us-central1",
      accessToken: "",
      oauthClientId: "",
      avatarName: "Kira",
      voice: "kore",
      language: "en-US",
      size: "300px",
      position: "top-right",
      saveVideo: false,
      debug: false,
      recordUserAudio: false,
      micAutoRequest: true,
      ctrlMic: true,
      ctrlCamera: true,
      ctrlScreen: true,
      ctrlMute: true,
      ctrlSnapshot: false,
      audioChunkSize: "2048",
      systemInstruction: "",
      defaultGreeting: "",
      imagePrompt: "",
      enableChromaKey: false,
      chromaKeyColor: "green",
      backgroundColor: "transparent",
      enableTranscript: false,
      enableChatInput: false,
      enableSessionResumption: false,
      renderTranscriptOutside: false,
      enableGrounding: false,
      customAvatarName: "",
      tokenExpiry: 0,
      userAvatar: "",
      userName: "",
    };

    const store = new Proxy(appState as any, {
      set(target: any, property: string, value: any) {
        target[property] = value;
        // Trigger UI updates and validation!
        if (typeof validateForm === "function") validateForm();
        return true;
      },
    });
    let tokenClient: any = null;
    function initGoogleAuth() {
      const clientId = oauthClientIdInput.value.trim();
      if (!clientId) return;
      try {
        // @ts-ignore
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope:
            "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (response: any) => {
            console.log("OAuth callback received", response);
            if (response.error !== undefined) {
              alert("OAuth Error: " + response.error);
              return;
            }
            store.accessToken = response.access_token;
            const now = new Date().getTime();
            store.tokenExpiry = now + response.expires_in * 1000;

            localStorage.setItem("gemini_access_token", response.access_token);
            localStorage.setItem("gemini_token_time", now.toString());
            localStorage.setItem(
              "gemini_token_expiry",
              store.tokenExpiry.toString(),
            );

            tokenInput.value = response.access_token;

            // Fetch user profile
            await fetchUserProfile(response.access_token, elements, store);

            validateForm();
          },
        });

        // Add click listener to button
        if (googleSignInBtn) {
          googleSignInBtn.onclick = () => {
            console.log("Google Sign-in button clicked");
            tokenClient.requestAccessToken();
          };
        }
      } catch (e) {
        console.error("Failed to init Google Auth:", e);
      }
    }
    // Populate Avatar Select
    avatarNameSelect.innerHTML = "";
    Object.values(AVATAR_PRESETS).forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.displayName} (${preset.style})`;
      avatarNameSelect.appendChild(option);
    });
    // Add AudioOnly option
    const audioOnlyOption = document.createElement("option");
    audioOnlyOption.value = "AudioOnly";
    audioOnlyOption.textContent = "Audio Only";
    avatarNameSelect.appendChild(audioOnlyOption);
    // Populate Voice Select
    voiceSelect.innerHTML = "";
    Object.values(VOICE_PRESETS).forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = `${preset.displayName} (${preset.description})`;
      voiceSelect.appendChild(option);
    });
    // Show connection type on load
    const conn =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (conn && statConnType) {
      statConnType.textContent = conn.type || "-";
    }
    // Load from localStorage
    loadSettings(elements, store, customAvatars, avatar);
    if (localStorage.getItem("gemini_oauth_client_id")) {
      initGoogleAuth();
    }

    // Initial state for transparency checkbox
    const initialVal = avatarNameSelect.value;
    const isPreset = initialVal in AVATAR_PRESETS;
    if (enableChromaKey) {
        enableChromaKey.disabled = isPreset;
        if (isPreset) {
            avatar.setAttribute("enable-chroma-key", "false");
        }
    }
    function validateForm() {
      const project = store.projectId.trim();
      const loc = store.location.trim();
      const token = store.accessToken.trim();
      const oauth = store.oauthClientId.trim();

      // Show/hide Google Sign-in button based on OAuth Client ID availability
      if (googleSignInBtn) {
        googleSignInBtn.classList.toggle("hidden", oauth.length === 0);
      }

      const isValid =
        project.length > 0 &&
        loc.length > 0 &&
        (token.length > 0 || oauth.length > 0);

      if (!avatar.isConnected && streamBtn) {
        streamBtn.disabled = !isValid;
      }

      // Lucky buttons require project, location, and token!
      const isLuckyValid =
        project.length > 0 && loc.length > 0 && token.length > 0;
      if (luckyPersonaBtn) luckyPersonaBtn.disabled = !isLuckyValid;
      if (luckyGreetingBtn) luckyGreetingBtn.disabled = !isLuckyValid;

      // Custom Avatar validation!
      const customName = store.customAvatarName.trim();
      const isCustomValid = customName.length > 0;

      const isValidForCustom = isLuckyValid && isCustomValid;

      if (cameraBtn) cameraBtn.disabled = !isValidForCustom;
      if (uploadBtn) uploadBtn.disabled = !isValidForCustom;
      if (generateImageBtn) generateImageBtn.disabled = !isValidForCustom;

      // Lucky image button only requires project, location, and token!
      if (luckyImageBtn) luckyImageBtn.disabled = !isLuckyValid;

      // Update tooltips
      const missingGeneral = [];
      if (project.length === 0) missingGeneral.push("Project ID");
      if (loc.length === 0) missingGeneral.push("Location");
      if (token.length === 0 && oauth.length === 0)
        missingGeneral.push("Access Token or OAuth Client ID");

      const generalMissingStr =
        missingGeneral.length > 0
          ? ` (Missing: ${missingGeneral.join(", ")})`
          : "";

      const missingLucky = [];
      if (project.length === 0) missingLucky.push("Project ID");
      if (loc.length === 0) missingLucky.push("Location");
      if (token.length === 0) missingLucky.push("Access Token");

      const missingCustom = [...missingLucky];
      if (customName.length === 0) missingCustom.push("Avatar Name");

      const luckyMissingStr =
        missingLucky.length > 0 ? ` (Missing: ${missingLucky.join(", ")})` : "";
      const customMissingStr =
        missingCustom.length > 0
          ? ` (Missing: ${missingCustom.join(", ")})`
          : "";

      if (saveBtn)
        saveBtn.setAttribute(
          "data-tooltip",
          "Save configuration to local storage." + generalMissingStr,
        );
      if (streamBtn) {
        if (avatar.isConnected) {
          streamBtn.setAttribute("data-tooltip", "Stop the avatar session.");
        } else {
          streamBtn.setAttribute(
            "data-tooltip",
            "Start the avatar session." + generalMissingStr,
          );
        }
      }

      if (luckyPersonaBtn)
        luckyPersonaBtn.setAttribute(
          "data-tooltip",
          "Generate a random persona." + luckyMissingStr,
        );
      if (luckyGreetingBtn)
        luckyGreetingBtn.setAttribute(
          "data-tooltip",
          "Generate a default greeting." + luckyMissingStr,
        );

      if (cameraBtn)
        cameraBtn.setAttribute(
          "data-tooltip",
          "Take a photo with your camera to create a custom avatar." +
            customMissingStr,
        );
      if (uploadBtn)
        uploadBtn.setAttribute(
          "data-tooltip",
          "Upload an image to create a custom avatar." + customMissingStr,
        );
      if (luckyImageBtn)
        luckyImageBtn.setAttribute(
          "data-tooltip",
          "Generate a prompt for the avatar image." + luckyMissingStr,
        );
      if (generateImageBtn)
        generateImageBtn.setAttribute(
          "data-tooltip",
          "Generate an avatar image from prompt." + customMissingStr,
        );
    }

    const updateVisibleControls = () => {
      const list = [];
      if (ctrlMic.checked) list.push("mic");
      if (ctrlCamera.checked) list.push("camera");
      if (ctrlScreen.checked) list.push("screen");
      if (ctrlMute.checked) list.push("mute");
      if (ctrlSnapshot.checked) list.push("snapshot");
      if (ctrlSettings && ctrlSettings.checked) list.push("settings");
      avatar.setAttribute("visible-controls", list.join(","));
    };


    // Listeners
    if (expandBtn) {
      expandBtn.onclick = () => {
        const isCollapsed = configContainer.classList.toggle('hidden');
        
        if (isCollapsed) {
          expandBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
          expandBtn.title = "Expand Configuration";
        } else {
          expandBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>`;
          expandBtn.title = "Collapse Configuration";
        }
      };
    }
    function setupAvatar2() {
        if (!avatar2) return;
        
        if (elements.avatarName2) {
            elements.avatarName2.innerHTML = "";
            Object.values(AVATAR_PRESETS).forEach((preset) => {
                const option = document.createElement("option");
                option.value = preset.id;
                option.textContent = `${preset.displayName} (${preset.style})`;
                elements.avatarName2.appendChild(option);
            });
            const audioOnlyOption = document.createElement("option");
            audioOnlyOption.value = "AudioOnly";
            audioOnlyOption.textContent = "Audio Only";
            elements.avatarName2.appendChild(audioOnlyOption);
            
            Object.keys(customAvatars).forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                elements.avatarName2.appendChild(option);
            });
            
            elements.avatarName2.value = "Kira";
            avatar2.setPreview("Kira");
        }
        
        if (elements.voiceSelect2) {
            elements.voiceSelect2.innerHTML = "";
            Object.values(VOICE_PRESETS).forEach((preset) => {
                const option = document.createElement("option");
                option.value = preset.id;
                option.textContent = `${preset.displayName} (${preset.description})`;
                elements.voiceSelect2.appendChild(option);
            });
        }
        
        if (elements.size2) elements.size2.onchange = () => avatar2?.setAttribute("size", elements.size2.value);
        
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
                        avatar2?.setAttribute("enable-chroma-key", "false");
                    } else {
                        avatar2?.setAttribute("enable-chroma-key", elements.enableChromaKey2.checked.toString());
                    }
                }

                avatar2?.setAttribute("avatar-name", val);
                const preset = (AVATAR_PRESETS as any)[val];
                if (preset) {
                    avatar2?.setPreview(val);
                } else if (customAvatars[val]) {
                    avatar2?.setAttribute('custom-avatar-url', customAvatars[val].image);
                }
            };
        }
        
        if (elements.languageSelect2) elements.languageSelect2.onchange = () => avatar2?.setAttribute("language", elements.languageSelect2.value);
        if (elements.enableChromaKey2) elements.enableChromaKey2.onchange = () => avatar2?.setAttribute("enable-chroma-key", elements.enableChromaKey2.checked.toString());
        if (elements.chromaKeyTolerance2) {
            elements.chromaKeyTolerance2.oninput = () => {
                if (elements.chromaKeyToleranceVal2) elements.chromaKeyToleranceVal2.textContent = elements.chromaKeyTolerance2.value;
                avatar2?.setAttribute("chroma-key-tolerance", elements.chromaKeyTolerance2.value);
            };
        }
        if (elements.enableTranscript2) elements.enableTranscript2.onchange = () => avatar2?.setAttribute("enable-transcript", elements.enableTranscript2.checked.toString());
        if (elements.enableChatInput2) elements.enableChatInput2.onchange = () => avatar2?.setAttribute("enable-chat-input", elements.enableChatInput2.checked.toString());
        if (elements.enableSessionResumption2) elements.enableSessionResumption2.onchange = () => avatar2?.setAttribute("enable-session-resumption", elements.enableSessionResumption2.checked.toString());
        if (elements.enableGrounding2) elements.enableGrounding2.onchange = () => avatar2?.setAttribute("enable-grounding", elements.enableGrounding2.checked.toString());

        // Initial state for transparency checkbox for Avatar 2
        if (elements.avatarName2) {
            const val = elements.avatarName2.value;
            const isPreset = val in AVATAR_PRESETS;
            if (elements.enableChromaKey2) {
                elements.enableChromaKey2.disabled = isPreset;
                if (isPreset) {
                    avatar2?.setAttribute("enable-chroma-key", "false");
                }
            }
        }
    }

    if (elements.addAvatarBtn) {
        elements.addAvatarBtn.onclick = () => {
            if (isAvatar2Active) return;
            
            avatar2 = document.createElement('gemini-avatar') as GeminiAvatar;
            avatar2.id = 'my-avatar-2';
            
            const pos1 = avatar.getAttribute('position') || 'top-right';
            let pos2 = 'top-left';
            if (pos1.includes('right')) pos2 = pos1.replace('right', 'left');
            else if (pos1.includes('left') || pos1.includes('middle')) pos2 = pos1.replace('left', 'right').replace('middle', 'right');
            
            avatar2.setAttribute('position', pos2);
            avatar2.setAttribute('size', avatar.getAttribute('size') || '300px');
            avatar2.setAttribute('project-id', avatar.getAttribute('project-id') || '');
            avatar2.setAttribute('location', avatar.getAttribute('location') || 'us-central1');
            avatar2.setAttribute('avatar-name', 'Kira');
            
            avatar2.setAudioContext(sharedAudioContext);
            
            document.body.appendChild(avatar2);
            
            if (elements.avatar2Config) {
                elements.avatar2Config.style.display = 'block';
            }
            
            isAvatar2Active = true;
            elements.addAvatarBtn.disabled = true;
            
            if (elements.position2) elements.position2.value = pos2;
            
            setupAvatar2();
        };
    }

    projectIdInput.addEventListener(
      "input",
      () => (store.projectId = projectIdInput.value),
    );
    locationInput.addEventListener(
      "input",
      () => (store.location = locationInput.value),
    );
    tokenInput.addEventListener(
      "input",
      () => (store.accessToken = tokenInput.value),
    );
    tokenInput.addEventListener("change", async () => {
      const token = tokenInput.value.trim();
      if (token) {
        const data = await verifyToken(token);
        if (data && data.expires_in) {
          const now = new Date().getTime();
          store.tokenExpiry = now + parseInt(data.expires_in) * 1000;
          console.log("Token verified, set expiry to:", store.tokenExpiry);

          const fallbackName = data.email || "User";

          // Fetch user profile when manual token is valid
          await fetchUserProfile(token, elements, store);

          // If name was not set by fetchUserProfile, use email as fallback
          if (!store.userName) {
            store.userName = fallbackName;
            displayUserProfile(fallbackName, store.userAvatar || "", elements);
          }
        } else {
          alert("Invalid token or failed to verify.");
        }
      }
    });
    oauthClientIdInput.addEventListener(
      "input",
      () => (store.oauthClientId = oauthClientIdInput.value),
    );
    oauthClientIdInput.addEventListener("change", () => initGoogleAuth());

    if (saveBtn) {
      saveBtn.onclick = () => {
        saveSettings(elements, store, customAvatars);

        alert("Configuration saved.");
      };
    }

    avatar.addEventListener("avatar-disconnected", () => {
      if (streamBtn) {
        streamBtn.textContent = "Start";
        streamBtn.style.background =
          "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
        streamBtn.disabled = false;
      }
      if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
      }
      validateForm();
    });

    avatar.addEventListener("avatar-setup-error", (e: any) => {
      const userName = store.userName || "The current user";
      const projectName = store.projectId || "the project";
      alert(
        `Something went wrong. Likely causes: User ${userName} has no permission to use the Gemini Live model in project ${projectName}.`,
      );
    });

    avatar.addEventListener("transcript-item", (e: any) => {
      const { sender, text } = e.detail;
      if (
        renderOutsideToggle &&
        renderOutsideToggle.checked &&
        externalTranscript
      ) {
        const lastChild = externalTranscript.lastElementChild;
        if (lastChild && lastChild.getAttribute("data-sender") === sender) {
          lastChild.innerHTML += " " + text;
        } else {
          const p = document.createElement("p");
          p.setAttribute("data-sender", sender);
          p.style.margin = "5px 0";
          p.style.fontSize = "0.95rem";
          p.style.padding = "5px 10px";
          p.style.borderRadius = "8px";
          p.style.maxWidth = "80%";
          p.style.wordBreak = "break-word";

          const isUser = sender === "User";
          const icon = isUser ? "👤" : "🤖";

          p.innerHTML = `<span>${icon}</span> ${text}`;

          if (isUser) {
            p.style.alignSelf = "flex-end";
            p.style.background = "rgba(99, 102, 241, 0.3)";
            p.style.marginLeft = "auto";
            p.style.color = "#f8fafc";
          } else {
            p.style.alignSelf = "flex-start";
            p.style.background = "rgba(255, 255, 255, 0.1)";
            p.style.marginRight = "auto";
            p.style.color = "#cbd5e1";
          }

          externalTranscript.appendChild(p);
        }
        // Scroll to bottom
        externalTranscript.scrollTop = externalTranscript.scrollHeight;
      }
    });

    function pollValidation() {
      validateForm();
      setTimeout(pollValidation, 500);
    }
    pollValidation();

    if (customAvatarName) {
      customAvatarName.addEventListener("input", () => {
        store.customAvatarName = customAvatarName.value;

        const newName = customAvatarName.value.trim();
        const oldName = avatarNameSelect.value;
        const hasImage =
          generatedImageContainer &&
          generatedImageContainer.style.display !== "none";

        // Show/hide New Custom Avatar and Save buttons
        if (newCustomAvatarBtn) {
          newCustomAvatarBtn.style.display =
            newName && hasImage ? "inline-block" : "none";
        }
        if (saveCustomAvatarBtn) {
          saveCustomAvatarBtn.style.display =
            newName && hasImage ? "inline-block" : "none";
        }

        // Rename custom avatar if conditions are met
        if (
          newName &&
          oldName &&
          customAvatars[oldName] &&
          newName !== oldName &&
          hasImage
        ) {
          const imageData = customAvatars[oldName];
          delete customAvatars[oldName];
          customAvatars[newName] = imageData;

          // Update dropdown option
          for (let i = 0; i < avatarNameSelect.options.length; i++) {
            if (avatarNameSelect.options[i].value === oldName) {
              avatarNameSelect.options[i].value = newName;
              avatarNameSelect.options[i].textContent = newName;
              break;
            }
          }
          avatarNameSelect.value = newName;
        }
      });
    }

    if (newCustomAvatarBtn) {
      newCustomAvatarBtn.onclick = () => {
        if (customAvatarName) customAvatarName.value = "";
        if (generatedImg) generatedImg.src = "";
        if (generatedImageContainer)
          generatedImageContainer.style.display = "none";
        newCustomAvatarBtn.style.display = "none";
        if (saveCustomAvatarBtn) saveCustomAvatarBtn.style.display = "none";
        validateForm();
      };
    }

    if (saveCustomAvatarBtn) {
      saveCustomAvatarBtn.onclick = () => {
        const name = customAvatarName.value.trim();
        const imageUrl = generatedImg.src;
        if (name && imageUrl) {
          customAvatars[name] = {
            image: imageUrl,
            originalImage: elements.originalImg ? elements.originalImg.src : undefined,
            type: "custom",
            palette: detectedPalette,
          };
          updateDropdown(name);
          avatar.setAttribute("custom-avatar-url", imageUrl);
          localStorage.setItem(
            "gemini_custom_avatars",
            JSON.stringify(customAvatars),
          );
          alert(`Custom avatar "${name}" saved.`);
        }
      };
    }

    if (elements.redoImprovementBtn) {
      elements.redoImprovementBtn.onclick = async () => {
        const name = customAvatarName.value.trim();
        const originalImageUrl = elements.originalImg ? elements.originalImg.src : "";
        if (!name) {
            alert('Please enter a name for the custom avatar.');
            return;
        }
        if (!originalImageUrl) {
            alert('No original image to improve.');
            return;
        }
        
        await handleImageImprovement(
          originalImageUrl,
          enableChromaKey.checked,
          chromaKeyColor.value,
          projectIdInput.value,
          locationInput.value || "us-central1",
          tokenInput.value,
          {
            generatedImg,
            imageProcessingMessage,
            redoImprovementBtn: elements.redoImprovementBtn,
          },
          (colors) => {
            detectedPalette = colors;
          },
        );
      };
    }

    if (sizeSelect)
      sizeSelect.onchange = () => avatar.setAttribute("size", sizeSelect.value);
    if (positionSelect)
      positionSelect.onchange = () =>
        avatar.setAttribute("position", positionSelect.value);

    if (avatarNameSelect) {
      avatarNameSelect.onchange = () => {
        const val = avatarNameSelect.value;
        const isPreset = val in AVATAR_PRESETS;
        
        if (enableChromaKey) {
            enableChromaKey.disabled = isPreset;
            if (isPreset) {
                avatar.setAttribute("enable-chroma-key", "false");
            } else {
                avatar.setAttribute("enable-chroma-key", enableChromaKey.checked.toString());
            }
        }

        applyAvatarTheme(val, avatar, customAvatars, {
          customAvatarName,
          generatedImg,
          generatedImageContainer,
          newCustomAvatarBtn,
        });
        avatar.setAttribute("avatar-name", val);

        const preset = (AVATAR_PRESETS as any)[val];
        if (preset && preset.defaultGreeting) {
          defaultGreetingInput.value = preset.defaultGreeting;
        } else if (val === "Custom") {
          defaultGreetingInput.value = "Hi";
        }
      };
    }

    if (micAutoRequestToggle) {
      micAutoRequestToggle.onchange = () =>
        avatar.setAttribute(
          "mic-auto-request",
          micAutoRequestToggle.checked.toString(),
        );
    }

    [
      ctrlMic,
      ctrlCamera,
      ctrlScreen,
      ctrlMute,
      ctrlSnapshot,
      ctrlSettings,
    ].forEach((el) => {
      if (el) el.onchange = updateVisibleControls;
    });

    if (audioChunkSizeSlider) {
      audioChunkSizeSlider.oninput = () => {
        chunkSizeVal.textContent = audioChunkSizeSlider.value;
        avatar.setAttribute("audio-chunk-size", audioChunkSizeSlider.value);
      };
    }

    // Chroma Key Listeners
    if (enableChromaKey)
      enableChromaKey.onchange = () =>
        avatar.setAttribute(
          "enable-chroma-key",
          enableChromaKey.checked.toString(),
        );
    if (chromaKeyColor)
      chromaKeyColor.onchange = () =>
        avatar.setAttribute("chroma-key-color", chromaKeyColor.value);


    if (chromaKeyTolerance) {
      chromaKeyTolerance.oninput = () => {
        chromaKeyToleranceVal.textContent = chromaKeyTolerance.value;
        avatar.setAttribute("chroma-key-tolerance", chromaKeyTolerance.value);
      };
    }

    // Toggle Listeners
    if (enableTranscript) {
      enableTranscript.onchange = () => {
        const val = enableTranscript.checked.toString();
        console.log("[Demo] Setting enable-transcript to:", val);
        avatar.setAttribute("enable-transcript", val);
      };
    }
    if (enableChatInput)
      enableChatInput.onchange = () =>
        avatar.setAttribute(
          "enable-chat-input",
          enableChatInput.checked.toString(),
        );
    if (enableSessionResumption)
      enableSessionResumption.onchange = () =>
        avatar.setAttribute(
          "enable-session-resumption",
          enableSessionResumption.checked.toString(),
        );

    if (renderOutsideToggle) {
      renderOutsideToggle.onchange = () => {
        avatar.setAttribute(
          "render-transcript-outside",
          renderOutsideToggle.checked.toString(),
        );
        if (externalTranscriptSection) {
          externalTranscriptSection.style.display = renderOutsideToggle.checked
            ? "block"
            : "none";
        }
      };
    }

    // Grounding Listener
    if (enableGrounding) {
      enableGrounding.onchange = () =>
        avatar.setAttribute(
          "enable-grounding",
          enableGrounding.checked.toString(),
        );
    }

    // Background Listeners
    if (bgImageUrl) {
        bgImageUrl.onchange = () => {
            const url = bgImageUrl.value;
            if (url) {
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const finalUrl = isLocal && url.startsWith('http') ? `/proxy?url=${encodeURIComponent(url)}` : url;
                
                document.body.style.backgroundImage = `url(${finalUrl})`;
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundSize = 'cover';
                document.body.classList.remove('animated-bg');
                localStorage.setItem('gemini_background_image', url);
            }
        };
    }

    if (uploadBgBtn && bgImageUpload) {
        uploadBgBtn.onclick = () => bgImageUpload.click();
        bgImageUpload.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleBackgroundUpload(file, elements);
            }
        };
    }

    if (generateBgBtn) {
        generateBgBtn.onclick = () => {
            const prompt = elements.bgImagePrompt.value;
            handleBackgroundGeneration(prompt, elements.projectIdInput.value, elements.locationInput.value || 'us-central1', elements.tokenInput.value, elements);
        };
    }

    if (clearBgBtn) {
        clearBgBtn.onclick = () => {
            document.body.style.backgroundImage = '';
            document.body.classList.add('animated-bg');
            localStorage.removeItem('gemini_background_image');
            bgImageUrl.value = '';
            const name = elements.avatarNameSelect.value;
            applyAvatarTheme(name, avatar, customAvatars, elements);
        };
    }

    if (luckyBgPromptBtn) {
        luckyBgPromptBtn.onclick = () => handleLuckyBgPrompt(store, tokenClient, elements);
    }

    // Lucky buttons
    if (luckyPersonaBtn) {
      luckyPersonaBtn.onclick = async () => {
        if (!(await ensureValidToken(store, tokenClient, elements))) return;
        const name = avatarNameSelect.value;
        const voice = voiceSelect.value;
        const preset = (AVATAR_PRESETS as any)[name];
        let texture = preset ? preset.texture : "nice and random";
        let mood = preset ? preset.mood : "pleasant and engaging";

        const prompt = `Generate a nice, funny, earnest random persona for an AI avatar named ${name} with voice ${voice}. The avatar has style ${preset ? preset.style : "custom"}, visual texture "${texture}" and mood "${mood}". Return only the persona description.`;

        try {
          luckyPersonaBtn.disabled = true;
          const originalText = luckyPersonaBtn.textContent;
          luckyPersonaBtn.textContent = "Thinking...";
          const data = await generateContent(
            "gemini-3-flash-preview",
            prompt,
            projectIdInput.value,
            locationInput.value || "us-central1",
            tokenInput.value,
          );
          const text = data.candidates[0].content.parts[0].text;
          systemInstructionInput.value = text.trim();
          luckyPersonaBtn.textContent = originalText;
        } catch (e: any) {
          alert(`Failed to generate persona: ${e.message}`);
          luckyPersonaBtn.textContent = "I'm feeling lucky";
        } finally {
          luckyPersonaBtn.disabled = false;
        }
      };
    }

    if (luckyGreetingBtn) {
      luckyGreetingBtn.onclick = async () => {
        if (!(await ensureValidToken(store, tokenClient, elements))) return;
        const persona = systemInstructionInput.value;
        const name = avatarNameSelect.value;
        const preset = (AVATAR_PRESETS as any)[name];
        let texture = preset ? preset.texture : "custom";
        let mood = preset ? preset.mood : "pleasant";

        let prompt = "";
        if (persona) {
          prompt = `Generate a default greeting for an AI avatar with this persona: "${persona}". Return only the greeting text.`;
        } else {
          prompt = `Generate a default greeting for an AI avatar named ${name} with visual texture "${texture}" and mood "${mood}". Return only the greeting text.`;
        }

        try {
          luckyGreetingBtn.disabled = true;
          const originalText = luckyGreetingBtn.textContent;
          luckyGreetingBtn.textContent = "Thinking...";
          const data = await generateContent(
            "gemini-3-flash-preview",
            prompt,
            projectIdInput.value,
            locationInput.value || "us-central1",
            tokenInput.value,
          );
          const text = data.candidates[0].content.parts[0].text;
          defaultGreetingInput.value = text.trim();
          luckyGreetingBtn.textContent = originalText;
        } catch (e: any) {
          alert(`Failed to generate greeting: ${e.message}`);
          luckyGreetingBtn.textContent = "I'm feeling lucky";
        } finally {
          luckyGreetingBtn.disabled = false;
        }
      };
    }

    if (luckyImageBtn) {
      luckyImageBtn.onclick = async () => {
        if (!(await ensureValidToken(store, tokenClient, elements))) return;
        const persona = systemInstructionInput.value;
        const name = avatarNameSelect.value;
        const preset = (AVATAR_PRESETS as any)[name];
        let texture = preset ? preset.texture : "custom";
        let mood = preset ? preset.mood : "pleasant";

        let prompt = "";
        if (persona) {
          prompt = `Generate an image generation prompt for a profile picture of an AI avatar with this persona: "${persona}". Return only the prompt text.`;
        } else {
          prompt = `Generate an image generation prompt for a profile picture of an AI avatar named ${name} with style ${preset ? preset.style : "custom"}, visual texture "${texture}" and mood "${mood}". Return only the prompt text.`;
        }

        try {
          luckyImageBtn.disabled = true;
          const originalText = luckyImageBtn.textContent;
          luckyImageBtn.textContent = "Thinking...";
          const data = await generateContent(
            "gemini-3-flash-preview",
            prompt,
            projectIdInput.value,
            locationInput.value || "us-central1",
            tokenInput.value,
          );
          const text = data.candidates[0].content.parts[0].text;
          imagePromptInput.value = text.trim();
          luckyImageBtn.textContent = originalText;
        } catch (e: any) {
          alert(`Failed to generate image prompt: ${e.message}`);
          luckyImageBtn.textContent = "I'm feeling lucky";
        } finally {
          luckyImageBtn.disabled = false;
        }
      };
    }

    if (generateImageBtn) {
        generateImageBtn.onclick = async () => {
            if (!await ensureValidToken(store, tokenClient, elements)) return;
            await handleImageGeneration(
              customAvatarName.value.trim(),
              imagePromptInput.value,
              enableChromaKey.checked,
              chromaKeyColor.value,
              "transparent",
              projectIdInput.value,
              locationInput.value || "us-central1",
              tokenInput.value,
              customAvatars,
              avatar,
              {
                generateImageBtn,
                generatedImg,
                generatedImageContainer,
                customAvatarName,
              },
              updateDropdown,
              (colors) => {
                detectedPalette = colors;
              },
            );
        };
    }

    function updateDropdown(name: string) {
        let optionExists = false;
        for (let i = 0; i < avatarNameSelect.options.length; i++) {
            if (avatarNameSelect.options[i].value === name) {
                optionExists = true;
                break;
            }
        }
        
        if (!optionExists) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            avatarNameSelect.appendChild(option);
        }
        
        avatarNameSelect.value = name;
    }

    // Custom Avatar Buttons (Camera & Upload)
    if (cameraBtn) {
        cameraBtn.onclick = async () => {
            if (cameraModal && cameraVideo) {
                cameraModal.classList.add('active');
                // Wait for layout to finish before reading offsetHeight
                setTimeout(updateVideoContainerWidth, 0);
                
                const cameraSelect = document.getElementById('cameraSelect') as HTMLSelectElement;
                const cameraSelectContainer = document.getElementById('cameraSelectContainer') as HTMLDivElement;
                
                const populateCameras = async (currentDeviceId?: string) => {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(d => d.kind === 'videoinput');
                    
                    if (cameraSelectContainer) {
                        cameraSelectContainer.style.display = videoDevices.length > 1 ? 'block' : 'none';
                    }
                    
                    if (cameraSelect) {
                        cameraSelect.innerHTML = '';
                        videoDevices.forEach(d => {
                            const opt = document.createElement('option');
                            opt.value = d.deviceId;
                            opt.textContent = d.label || `Camera ${cameraSelect.options.length + 1}`;
                            cameraSelect.appendChild(opt);
                        });
                        
                        if (currentDeviceId) {
                            cameraSelect.value = currentDeviceId;
                        }
                        
                        cameraSelect.onchange = async () => {
                            const stream = cameraVideo.srcObject as MediaStream;
                            if (stream) {
                                stream.getTracks().forEach(track => track.stop());
                            }
                            await startStream(cameraSelect.value);
                        };
                    }
                };

                const startStream = async (deviceId?: string) => {
                    try {
                        const constraints: MediaStreamConstraints = {
                            video: {
                                width: { ideal: 704 },
                                height: { ideal: 1280 },
                                aspectRatio: 704/1280
                            }
                        };
                        if (deviceId) {
                            (constraints.video as any).deviceId = { exact: deviceId };
                        } else {
                            (constraints.video as any).facingMode = 'user';
                        }
                        
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        cameraVideo.srcObject = stream;
                        
                        // Labels might only be available AFTER getUserMedia!
                        const actualDeviceId = deviceId || stream.getVideoTracks()[0]?.getSettings().deviceId;
                        await populateCameras(actualDeviceId);
                    } catch (e) {
                        console.error('Camera access error:', e);
                        // Fallback
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                            cameraVideo.srcObject = stream;
                        } catch (e2) {
                            alert('Failed to access camera: ' + e2);
                            cameraModal.classList.remove('active');
                        }
                    }
                };

                await startStream();
            }
        };
    }

    if (closeCameraBtn) {
        closeCameraBtn.onclick = () => {
            if (cameraModal && cameraVideo) {
                const stream = cameraVideo.srcObject as MediaStream;
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                cameraVideo.srcObject = null;
                cameraModal.classList.remove('active');
            }
        };
    }

    if (captureBtn) {
        captureBtn.onclick = async () => {
            if (!await ensureValidToken(store, tokenClient, elements)) return;
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }
            await handleCameraCapture(
              cameraVideo,
              name,
              enableChromaKey.checked,
              chromaKeyColor.value,
              "transparent",
              toggleImageImprovement.checked,
              projectIdInput.value,
              locationInput.value || "us-central1",
              tokenInput.value,
              customAvatars,
              avatar,
              {
                generatedImg,
                generatedImageContainer,
                customAvatarName,
                captureBtn,
                cameraModal,
                imageProcessingMessage,
              },
              updateDropdown,
              (colors) => {
                detectedPalette = colors;
              },
            );
        };
    }

    if (uploadBtn) {
        uploadBtn.onclick = () => {
            const name = customAvatarName.value.trim();
            if (!name) {
                alert('Please enter a name for the custom avatar.');
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e: any) => {
                if (!await ensureValidToken(store, tokenClient, elements)) return;
                const file = e.target.files[0];
                if (file) {
                    await handleUpload(
                      file,
                      name,
                      enableChromaKey.checked,
                      chromaKeyColor.value,
                      "transparent",
                      toggleImageImprovement.checked,
                      projectIdInput.value,
                      locationInput.value || "us-central1",
                      tokenInput.value,
                      customAvatars,
                      avatar,
                      {
                        generatedImg,
                        generatedImageContainer,
                        customAvatarName,
                        uploadBtn,
                        imageProcessingMessage,
                      },
                      updateDropdown,
                      (colors) => {
                        detectedPalette = colors;
                      },
                    );
                }
            };
            input.click();
        };
    }

    // Feature Walkthrough Logic
    setupWalkthrough(qaScenarios, qaContainer, qaList, toggleQaBtn, avatar);

    if (copyHtmlBtn) copyHtmlBtn.setAttribute('data-tooltip', "Copy the HTML embed code for this avatar.");
    if (toggleQaBtn) toggleQaBtn.setAttribute('data-tooltip', "Open or close the Feature Walkthrough panel.");
    if (externalSendBtn) externalSendBtn.setAttribute('data-tooltip', "Send message to the avatar.");
    if (newCustomAvatarBtn) newCustomAvatarBtn.setAttribute('data-tooltip', "Clear inputs to create another custom avatar.");
    if (saveCustomAvatarBtn) saveCustomAvatarBtn.setAttribute('data-tooltip', "Save current custom avatar to presets.");
    if (captureBtn) captureBtn.setAttribute('data-tooltip', "Capture photo from camera.");
    if (closeCameraBtn) closeCameraBtn.setAttribute('data-tooltip', "Close camera modal.");

    // Sync store with loaded values
    store.projectId = projectIdInput.value;
    store.location = locationInput.value;
    store.accessToken = tokenInput.value;
    store.oauthClientId = oauthClientIdInput.value;
    store.avatarName = avatarNameSelect.value;
    store.voice = voiceSelect.value;
    store.language = languageSelect.value;
    store.size = sizeSelect.value;
    store.position = positionSelect.value;
    store.saveVideo = saveVideoToggle.checked;
    store.debug = debugToggle.checked;
    if (recordUserAudioCheckbox) store.recordUserAudio = recordUserAudioCheckbox.checked;
    if (micAutoRequestToggle) store.micAutoRequest = micAutoRequestToggle.checked;
    store.ctrlMic = ctrlMic.checked;
    store.ctrlCamera = ctrlCamera.checked;
    store.ctrlScreen = ctrlScreen.checked;
    store.ctrlMute = ctrlMute.checked;
    store.ctrlSnapshot = ctrlSnapshot.checked;
    store.audioChunkSize = audioChunkSizeSlider.value;
    store.systemInstruction = systemInstructionInput.value;
    store.defaultGreeting = defaultGreetingInput.value;
    store.imagePrompt = imagePromptInput.value;
    store.enableChromaKey = enableChromaKey.checked;
    store.chromaKeyColor = chromaKeyColor.value;
    store.backgroundColor = "transparent";
    store.enableTranscript = enableTranscript.checked;
    store.enableChatInput = enableChatInput.checked;
    store.renderTranscriptOutside = renderOutsideToggle.checked;
    if (enableGrounding) store.enableGrounding = enableGrounding.checked;
    if (customAvatarName) store.customAvatarName = customAvatarName.value;
    
    // Initial apply
    updateVisibleControls();
    validateForm();
    
    // Restore Start button listener!
    if (streamBtn) {
        streamBtn.onclick = async () => {
            if (avatar.isConnected) {
                const savingVideo = saveVideoToggle.checked;
                const recordingAudio = recordUserAudioCheckbox ? recordUserAudioCheckbox.checked : false;
                
                if (savingVideo) {
                    streamBtn.textContent = 'Processing video...';
                    streamBtn.disabled = true;
                }
                
                if (savingVideo || recordingAudio) {
                    if (avatar2 && isAvatar2Active) {
                        const files = avatar2.getSessionFiles();
                        console.log("[Demo] Attempting to download Avatar 2 files", { hasAudio: !!files.audioBlob, size: files.audioBlob?.size });
                        if (files.audioBlob && files.audioBlob.size > 0) {
                            downloadBlob(files.audioBlob, `avatar2_input_${new Date().toISOString()}.pcm`);
                        } else {
                            console.log("[Demo] Avatar 2 audio blob is empty or null, skipping download");
                        }
                    }
                    
                    // Download Avatar 1 output instead of input!
                    const outputBlob1 = avatar.getRecordedOutput();
                    console.log("[Demo] Attempting to download Avatar 1 output", { size: outputBlob1?.size });
                    if (outputBlob1 && outputBlob1.size > 0) {
                        downloadBlob(outputBlob1, `avatar1_output_${new Date().toISOString()}.pcm`);
                    } else {
                        console.log("[Demo] Avatar 1 output blob is empty or null, skipping download");
                    }
                }

                await avatar.stop();
                
                if (avatar2 && isAvatar2Active) {
                    await avatar2.stop();
                }
                
                streamBtn.textContent = 'Start';
                streamBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; // Green!
                streamBtn.disabled = false;
                if (statsInterval) {
                    clearInterval(statsInterval);
                    statsInterval = null;
                }
            } else {
                if (!await ensureValidToken(store, tokenClient, elements)) return;
                
                // Update attributes for Avatar 1
                avatar.setAttribute('access-token', tokenInput.value);
                avatar.setAttribute('project-id', projectIdInput.value);
                avatar.setAttribute('location', locationInput.value || 'us-central1');
                avatar.setAttribute('avatar-name', avatarNameSelect.value);
                avatar.setAttribute('voice', voiceSelect.value);
                avatar.setAttribute('language', languageSelect.value);
                avatar.setAttribute('system-instruction', systemInstructionInput.value);
                avatar.setAttribute('default-greeting', defaultGreetingInput.value);
                avatar.setAttribute('record-video', saveVideoToggle.checked.toString());
                avatar.setAttribute('debug', debugToggle.checked.toString());
                if (recordUserAudioCheckbox) {
                    avatar.setAttribute('record-user-audio', recordUserAudioCheckbox.checked.toString());
                }
                
                try {
                    streamBtn.disabled = true;
                    streamBtn.textContent = 'Connecting...';
                    
                    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    
                    const stream1 = avatar.getAudioOutputStream();
                    console.log("[Demo] stream1 tracks:", stream1.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled, readyState: t.readyState })));
                    
                    let stream2: MediaStream | null = null;
                    if (avatar2 && isAvatar2Active) {
                        // Update attributes for Avatar 2
                        avatar2.setAttribute('access-token', tokenInput.value);
                        avatar2.setAttribute('project-id', projectIdInput.value);
                        avatar2.setAttribute('location', locationInput.value || 'us-central1');
                        avatar2.setAttribute('avatar-name', elements.avatarName2.value);
                        avatar2.setAttribute('voice', elements.voiceSelect2.value);
                        avatar2.setAttribute('language', elements.languageSelect2.value);
                        avatar2.setAttribute('system-instruction', elements.systemInstruction2.value);
                        avatar2.setAttribute('default-greeting', elements.defaultGreeting2.value);
                        avatar2.setAttribute('record-video', saveVideoToggle.checked.toString());
                        avatar2.setAttribute('record-user-audio', recordUserAudioCheckbox.checked.toString());
                        avatar2.setAttribute('debug', debugToggle.checked.toString());
                        
                        stream2 = avatar2.getAudioOutputStream();
                        console.log("[Demo] stream2 tracks:", stream2.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled, readyState: t.readyState })));
                    }
                    
                    await avatar.start(undefined, micStream);
                    
                    if (avatar2 && isAvatar2Active) {
                        await avatar2.start(undefined, micStream);
                    }
                    
                    avatar.updateExternalStream(stream2);
                    if (avatar2 && isAvatar2Active) {
                        avatar2.updateExternalStream(stream1);
                    }
                    
                    streamBtn.textContent = 'Stop';
                    streamBtn.style.background = '#ea4335'; // Red!
                    streamBtn.disabled = false;
                    
                    // Start stats interval
                    statsInterval = setInterval(() => {
                        updateStats(avatar, elements);
                        if (avatar2 && isAvatar2Active) {
                            updateStats(avatar2, elements, "2");
                        }
                    }, 1000);
                } catch (e: any) {
                    alert('Failed to start session: ' + e.message);
                    streamBtn.textContent = 'Start';
                    streamBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    streamBtn.disabled = false;
                }
            }
        };
    }
});


let statsInterval: any = null;
