import { GeminiAvatar } from './gemini-avatar';

export function setupWalkthrough(
    qaScenarios: any[],
    qaContainer: HTMLDivElement,
    qaList: HTMLDivElement,
    toggleQaBtn: HTMLButtonElement,
    avatar: GeminiAvatar
) {
    const qaState: Record<string, boolean> = {};
    qaScenarios.forEach(scenario => {
        const savedState = localStorage.getItem(`gemini_qa_${scenario.id}`);
        qaState[scenario.id] = savedState === 'true';
    });

    // Create Filter Switch
    const switchDiv = document.createElement('div');
    switchDiv.className = 'flex gap-2 mb-4 p-1 bg-slate-800 rounded-lg w-fit';
    
    const mainBtn = document.createElement('button');
    mainBtn.textContent = 'Main Features';
    mainBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all bg-indigo-600 text-white';
    
    const allBtn = document.createElement('button');
    allBtn.textContent = 'All Features';
    allBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-slate-400 hover:text-white';
    
    switchDiv.appendChild(mainBtn);
    switchDiv.appendChild(allBtn);
    
    if (qaContainer && qaList) {
        qaContainer.insertBefore(switchDiv, qaList);
    }
    
    let currentFilter = 'main';
    
    const updateSwitchUI = () => {
        if (currentFilter === 'main') {
            mainBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all bg-indigo-600 text-white';
            allBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-slate-400 hover:text-white';
        } else {
            allBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all bg-indigo-600 text-white';
            mainBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-slate-400 hover:text-white';
        }
    };
    
    mainBtn.onclick = () => {
        currentFilter = 'main';
        updateSwitchUI();
        renderQA();
    };
    
    allBtn.onclick = () => {
        currentFilter = 'all';
        updateSwitchUI();
        renderQA();
    };

    const renderQA = () => {
        if (!qaList) return;
        qaList.innerHTML = '';
        
        const filteredScenarios = qaScenarios.filter(scenario => {
            if (currentFilter === 'main') {
                return !scenario.isDetailed;
            }
            return true;
        });
        
        filteredScenarios.forEach(scenario => {
            const div = document.createElement('div');
            div.className = 'qa-scenario';
            div.style.marginBottom = '15px';
            div.style.padding = '15px';
            div.style.background = '#1e293b';
            div.style.borderRadius = '8px';
            
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.gap = '8px';
            header.style.fontWeight = 'bold';
            header.style.color = '#f8fafc';
            header.style.marginBottom = '5px';
            header.style.fontSize = '1.1rem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.width = 'auto';
            checkbox.checked = qaState[scenario.id] || false;
            
            checkbox.onchange = () => {
                qaState[scenario.id] = checkbox.checked;
                localStorage.setItem(`gemini_qa_${scenario.id}`, checkbox.checked.toString());
            };
            
            header.appendChild(checkbox);
            const titleSpan = document.createElement('span');
            titleSpan.textContent = `${scenario.id}: ${scenario.title}`;
            header.appendChild(titleSpan);
            
            div.appendChild(header);
            
            if (scenario.description) {
                const desc = document.createElement('p');
                desc.style.fontSize = '0.95rem';
                desc.style.color = '#94a3b8';
                desc.style.margin = '0 0 10px 25px';
                desc.textContent = scenario.description;
                div.appendChild(desc);
            }
            
            const stepsTitle = document.createElement('div');
            stepsTitle.style.fontSize = '0.95rem';
            stepsTitle.style.fontWeight = 'bold';
            stepsTitle.style.color = '#cbd5e1';
            stepsTitle.style.margin = '0 0 5px 25px';
            stepsTitle.textContent = 'Steps:';
            div.appendChild(stepsTitle);
            
            const ul = document.createElement('ul');
            ul.style.margin = '0 0 10px 45px';
            ul.style.fontSize = '0.95rem';
            ul.style.color = '#cbd5e1';
            scenario.steps.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                ul.appendChild(li);
            });
            div.appendChild(ul);
            
            const verifTitle = document.createElement('div');
            verifTitle.style.fontSize = '0.95rem';
            verifTitle.style.fontWeight = 'bold';
            verifTitle.style.color = '#cbd5e1';
            verifTitle.style.margin = '0 0 5px 25px';
            verifTitle.textContent = 'Verification:';
            div.appendChild(verifTitle);
            
            const ulVerif = document.createElement('ul');
            ulVerif.style.margin = '0 0 0 45px';
            ulVerif.style.fontSize = '0.95rem';
            ulVerif.style.color = '#cbd5e1';
            scenario.verification.forEach(step => {
                const li = document.createElement('li');
                li.textContent = step;
                ulVerif.appendChild(li);
            });
            div.appendChild(ulVerif);
            
            qaList.appendChild(div);
        });
    };

    const updateQaPosition = () => {
        if (!qaContainer) return;
        const pos = avatar.getAttribute('position') || 'top-right';
        
        qaContainer.style.top = '0';
        qaContainer.style.bottom = '0';
        qaContainer.style.height = '100vh';
        qaContainer.style.width = 'min(570px, 40vw)';
        
        if (pos.includes('right')) {
            qaContainer.style.left = '0';
            qaContainer.style.right = 'auto';
            qaContainer.style.borderRight = '1px solid #334155';
            qaContainer.style.borderLeft = 'none';
        } else {
            qaContainer.style.right = '0';
            qaContainer.style.left = 'auto';
            qaContainer.style.borderLeft = '1px solid #334155';
            qaContainer.style.borderRight = 'none';
        }
    };

    if (toggleQaBtn) {
        toggleQaBtn.onclick = () => {
            if (qaContainer) {
                const isVisible = window.getComputedStyle(qaContainer).display !== 'none';
                qaContainer.style.display = isVisible ? 'none' : 'block';
                toggleQaBtn.textContent = isVisible ? 'Open Feature Walkthrough' : 'Close Feature Walkthrough';
                if (!isVisible) {
                    updateQaPosition();
                    renderQA();
                }
            }
        };
    }

    // Listen for position changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'position') {
                updateQaPosition();
            }
        });
    });
    observer.observe(avatar, { attributes: true });
}
