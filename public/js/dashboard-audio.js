// Dashboard Audio Mode Handler
// Handles audio type selection, model loading, and audio generation in dashboard

(function() {
    'use strict';
    
    console.log('🎵 Dashboard Audio Handler Loaded');
    
    // Audio Type Configuration
    const AUDIO_TYPE_CONFIG = {
        'text-to-speech': {
            label: 'Text',
            placeholder: 'Enter the text you want to convert to speech...',
            showDuration: false,
            description: 'Convert text to natural speech'
        },
        'text-to-music': {
            label: 'Prompt',
            placeholder: 'Describe the music you want to generate...',
            showDuration: true,
            description: 'Generate music from descriptions'
        },
        'text-to-audio': {
            label: 'Prompt',
            placeholder: 'Describe the sound effect you want to generate...',
            showDuration: true,
            description: 'Generate sound effects'
        }
    };
    
    // State
    let audioModels = [];
    let selectedAudioModel = null;
    let selectedAudioType = null;
    
    // DOM Elements
    const audioTypeBtn = document.getElementById('audio-type-btn');
    const audioTypeDropdown = document.getElementById('audio-type-dropdown');
    const audioTypeSelect = document.getElementById('audio-type-select');
    const audioTypeOptions = document.querySelectorAll('.audio-type-option');
    const selectedAudioTypeText = document.getElementById('selected-audio-type');
    const selectedAudioTypeDesc = document.getElementById('selected-audio-type-desc');
    
    const audioModelCards = document.getElementById('audio-model-cards');
    const audioModelSearch = document.getElementById('audio-model-search');
    
    const audioPrompt = document.getElementById('audio-prompt');
    const audioDuration = document.getElementById('audio-duration');
    const audioDurationDisplay = document.getElementById('audio-duration-display');
    
    // Advanced options state - Music
    let selectedGenre = null;
    let selectedMood = null;
    let selectedTempo = 120;
    let selectedVocalGender = 'auto';
    let isInstrumental = false;
    
    // Advanced options state - Audio/SFX
    let selectedCategory = null;
    let selectedQuality = null;
    let selectedAmbience = 'none';
    
    // ============ EXAMPLE PROMPTS ============
    
    const EXAMPLE_PROMPTS = {
        'text-to-speech': [
            'Welcome to our service! We are glad to have you here.',
            'The weather today is sunny with a high of 75 degrees.',
            'Thank you for your order. Your package will arrive in 2-3 business days.',
            'Good morning! I hope you have a wonderful day ahead.'
        ],
        'text-to-music': [
            'Upbeat electronic dance music with energetic synths and pulsing bass',
            'Calm piano melody with soft strings, perfect for meditation',
            'Epic orchestral soundtrack with powerful drums and heroic brass',
            'Lofi hip hop beats with vinyl crackle and jazzy piano chords'
        ],
        'text-to-audio': [
            'Thunder rumbling in the distance with heavy rain',
            'Birds chirping in a peaceful forest at dawn',
            'Busy city street with cars and people talking',
            'Ocean waves crashing on the beach with seagulls'
        ]
    };
    
    // Setup example prompt button
    function setupExamplePrompt() {
        const exampleBtn = document.getElementById('audio-example-btn');
        if (!exampleBtn || !audioPrompt) return;
        
        exampleBtn.addEventListener('click', function() {
            if (!selectedAudioType) {
                if (window.showNotification) {
                    window.showNotification('Please select an audio type first', 'info');
                } else {
                    alert('Please select an audio type first');
                }
                return;
            }
            
            const examples = EXAMPLE_PROMPTS[selectedAudioType] || [];
            if (examples.length === 0) return;
            
            // Get random example
            const randomExample = examples[Math.floor(Math.random() * examples.length)];
            audioPrompt.value = randomExample;
            
            // Trigger input event for character counter and save
            audioPrompt.dispatchEvent(new Event('input'));
            
            // Visual feedback
            audioPrompt.classList.add('ring-2', 'ring-blue-500/50');
            setTimeout(() => {
                audioPrompt.classList.remove('ring-2', 'ring-blue-500/50');
            }, 500);
            
            console.log('✨ Example prompt applied:', randomExample);
        });
    }
    
    // ============ ADVANCED OPTIONS ============
    
    // Setup advanced options toggle
    function setupAdvancedOptions() {
        const advancedToggle = document.getElementById('audio-advanced-toggle');
        const advancedContent = document.getElementById('audio-advanced-content');
        
        if (!advancedToggle || !advancedContent) return;
        
        advancedToggle.addEventListener('click', function() {
            const isHidden = advancedContent.classList.contains('hidden');
            const chevron = this.querySelector('.chevron-icon');
            const text = this.querySelector('span');
            
            if (isHidden) {
                advancedContent.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
                text.textContent = 'Hide';
            } else {
                advancedContent.classList.add('hidden');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
                text.textContent = 'Show';
            }
        });
        
        // Instrumental Toggle
        const instrumentalToggle = document.getElementById('instrumental-toggle');
        const instrumentalLabel = document.getElementById('instrumental-label');
        const instrumentalHint = document.getElementById('instrumental-hint');
        const vocalGenderSection = document.getElementById('vocal-gender-section');
        
        if (instrumentalToggle) {
            instrumentalToggle.addEventListener('change', function() {
                isInstrumental = this.checked;
                
                // Update label
                if (this.checked) {
                    instrumentalLabel.textContent = 'Instrumental';
                    instrumentalHint.textContent = 'No vocals';
                    // Disable vocal gender buttons
                    if (vocalGenderSection) {
                        vocalGenderSection.style.opacity = '0.5';
                        vocalGenderSection.style.pointerEvents = 'none';
                    }
                } else {
                    instrumentalLabel.textContent = 'With Vocals';
                    instrumentalHint.textContent = 'Music with singing';
                    // Enable vocal gender buttons
                    if (vocalGenderSection) {
                        vocalGenderSection.style.opacity = '1';
                        vocalGenderSection.style.pointerEvents = 'auto';
                    }
                }
                
                console.log('🎸 Instrumental:', isInstrumental);
            });
        }
        
        // Genre buttons
        const genreBtns = document.querySelectorAll('.audio-genre-btn');
        genreBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // Toggle selection
                const wasActive = this.classList.contains('bg-blue-500/30');
                genreBtns.forEach(b => {
                    b.classList.remove('bg-blue-500/30', 'border-blue-500');
                    b.classList.add('bg-white/5', 'border-white/10');
                });
                
                if (!wasActive) {
                    this.classList.remove('bg-white/5', 'border-white/10');
                    this.classList.add('bg-blue-500/30', 'border-blue-500');
                    selectedGenre = this.getAttribute('data-genre');
                } else {
                    selectedGenre = null;
                }
                
                console.log('🎼 Genre:', selectedGenre);
                updatePromptFromAdvanced();
            });
        });
        
        // Mood buttons
        const moodBtns = document.querySelectorAll('.audio-mood-btn');
        moodBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                // Toggle selection
                const wasActive = this.classList.contains('bg-blue-500/30');
                moodBtns.forEach(b => {
                    b.classList.remove('bg-blue-500/30', 'border-blue-500');
                    b.classList.add('bg-white/5', 'border-white/10');
                });
                
                if (!wasActive) {
                    this.classList.remove('bg-white/5', 'border-white/10');
                    this.classList.add('bg-blue-500/30', 'border-blue-500');
                    selectedMood = this.getAttribute('data-mood');
                } else {
                    selectedMood = null;
                }
                
                console.log('😊 Mood:', selectedMood);
                updatePromptFromAdvanced();
            });
        });
        
        // Vocal Gender buttons
        const vocalGenderBtns = document.querySelectorAll('.vocal-gender-btn');
        vocalGenderBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                vocalGenderBtns.forEach(b => {
                    b.classList.remove('bg-blue-500/30', 'border-blue-500/50', 'active');
                    b.classList.add('bg-white/5', 'border-white/10');
                });
                this.classList.remove('bg-white/5', 'border-white/10');
                this.classList.add('bg-blue-500/30', 'border-blue-500/50', 'active');
                selectedVocalGender = this.getAttribute('data-gender') || 'auto';
                console.log('👤 Vocal Gender:', selectedVocalGender);
            });
        });
        
        // Tempo slider
        const tempoSlider = document.getElementById('audio-tempo');
        const tempoDisplay = document.getElementById('audio-tempo-display');
        if (tempoSlider && tempoDisplay) {
            tempoSlider.addEventListener('input', function() {
                selectedTempo = this.value;
                tempoDisplay.textContent = `${this.value} BPM`;
                updatePromptFromAdvanced();
            });
        }
        
            // Instruments input
            const instrumentsInput = document.getElementById('audio-instruments');
            if (instrumentsInput) {
                instrumentsInput.addEventListener('input', () => {
                    updatePromptFromAdvanced();
                });
            }
            
            // Lyrics textarea with character counter
            const lyricsTextarea = document.getElementById('audio-lyrics');
            const lyricsCounter = document.getElementById('audio-lyrics-count');
            if (lyricsTextarea && lyricsCounter) {
                lyricsTextarea.addEventListener('input', function() {
                    const length = this.value.length;
                    const maxLength = 1000;
                    lyricsCounter.textContent = `${length} / ${maxLength}`;
                    
                    // Limit length
                    if (length > maxLength) {
                        this.value = this.value.substring(0, maxLength);
                        lyricsCounter.textContent = `${maxLength} / ${maxLength}`;
                    }
                    
                    // Update color based on usage
                    if (length > maxLength * 0.9) {
                        lyricsCounter.classList.add('text-red-400');
                        lyricsCounter.classList.remove('text-gray-600', 'text-yellow-400');
                    } else if (length > maxLength * 0.7) {
                        lyricsCounter.classList.add('text-yellow-400');
                        lyricsCounter.classList.remove('text-gray-600', 'text-red-400');
                    } else {
                        lyricsCounter.classList.add('text-gray-600');
                        lyricsCounter.classList.remove('text-yellow-400', 'text-red-400');
                    }
                });
            }
            
            // ============ AUDIO/SFX ADVANCED OPTIONS ============
            
            // Category buttons (use module-level variables)
            const categoryBtns = document.querySelectorAll('.audio-category-btn');
            categoryBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    categoryBtns.forEach(b => b.classList.remove('bg-blue-500/30', 'border-blue-500'));
                    this.classList.add('bg-blue-500/30', 'border-blue-500');
                    selectedCategory = this.getAttribute('data-category');
                    console.log('📂 Category selected:', selectedCategory);
                });
            });
            
            // Quality buttons (use module-level variables)
            const qualityBtns = document.querySelectorAll('.audio-quality-btn');
            qualityBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    qualityBtns.forEach(b => b.classList.remove('bg-blue-500/30', 'border-blue-500'));
                    this.classList.add('bg-blue-500/30', 'border-blue-500');
                    selectedQuality = this.getAttribute('data-quality');
                    console.log('🎚️  Quality selected:', selectedQuality);
                });
            });
            
            // Ambience buttons (use module-level variables)
            const ambienceBtns = document.querySelectorAll('.audio-ambience-btn');
            const ambienceDisplay = document.getElementById('audio-ambience-display');
            ambienceBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    ambienceBtns.forEach(b => b.classList.remove('bg-blue-500/30', 'border-blue-500'));
                    this.classList.add('bg-blue-500/30', 'border-blue-500');
                    selectedAmbience = this.getAttribute('data-ambience');
                    if (ambienceDisplay) {
                        const displayText = selectedAmbience.charAt(0).toUpperCase() + selectedAmbience.slice(1);
                        ambienceDisplay.textContent = displayText;
                    }
                    console.log('🌊 Ambience selected:', selectedAmbience);
                });
            });
        }
    
    // Update prompt based on advanced options
    function updatePromptFromAdvanced() {
        if (!audioPrompt || selectedAudioType !== 'text-to-music') return;
        
        // Only auto-update if prompt is empty or was auto-generated
        const currentPrompt = audioPrompt.value.trim();
        if (currentPrompt && !audioPrompt.dataset.autoGenerated) {
            return; // Don't override user's manual input
        }
        
        let parts = [];
        
        // Add tempo description
        if (selectedTempo) {
            if (selectedTempo < 90) parts.push('slow tempo');
            else if (selectedTempo > 140) parts.push('fast tempo');
            else parts.push('medium tempo');
        }
        
        // Add mood
        if (selectedMood) {
            parts.push(`${selectedMood} mood`);
        }
        
        // Add genre
        if (selectedGenre) {
            parts.push(`${selectedGenre} music`);
        }
        
        // Add instruments
        const instruments = document.getElementById('audio-instruments')?.value.trim();
        if (instruments) {
            parts.push(`featuring ${instruments}`);
        }
        
        if (parts.length > 0) {
            const enhancedPrompt = parts.join(', ');
            audioPrompt.value = enhancedPrompt.charAt(0).toUpperCase() + enhancedPrompt.slice(1);
            audioPrompt.dataset.autoGenerated = 'true';
            audioPrompt.dispatchEvent(new Event('input')); // Trigger character counter
        }
    }
    
    // Auto-adjust duration range based on audio type
    function adjustDurationRange(type) {
        if (!audioDuration) return;
        
        const minSpan = document.getElementById('audio-duration-min');
        const maxSpan = document.getElementById('audio-duration-max');
        const hintSpan = document.getElementById('audio-duration-hint');
        
        let min, max, defaultVal, hint;
        
        if (type === 'text-to-music') {
            min = 10;
            max = 240; // 4 minutes for music
            defaultVal = 30;
            hint = 'Music: 10s - 4 minutes. Longer = better quality';
        } else if (type === 'text-to-audio') {
            min = 3;
            max = 30; // 30 seconds for SFX
            defaultVal = 5;
            hint = 'Sound effects: 3-30 seconds';
        } else {
            // TTS - not shown anyway
            min = 5;
            max = 60;
            defaultVal = 10;
            hint = 'Duration auto-adjusted';
        }
        
        audioDuration.min = min;
        audioDuration.max = max;
        audioDuration.value = defaultVal;
        
        if (minSpan) minSpan.textContent = `${min}s`;
        if (maxSpan) maxSpan.textContent = `${max}s`;
        if (hintSpan) hintSpan.textContent = hint;
        
        audioDurationDisplay.textContent = `${defaultVal} seconds`;
        
        console.log(`✅ Duration range adjusted for ${type}:`, {min, max, default: defaultVal});
    }
    
    // Initialize
    async function init() {
        console.log('🎵 Initializing Audio Handler...');
        setupAudioTypeDropdown();
        setupDurationSlider();
        setupPromptSave();
        setupCharacterCounter();
        setupExamplePrompt();
        setupAdvancedOptions();
        
        // Load models first, THEN restore state
        await loadAudioModels();
        
        // Restore state after models are loaded
        restoreState();
    }
    
    // Restore state from localStorage (like Image/Video)
    function restoreState() {
        console.log('📦 Restoring audio state from localStorage...');
        
        // Small delay to ensure DOM is fully ready
        setTimeout(() => {
            // Restore audio type
            const savedType = localStorage.getItem('dashboard_audio_type');
            console.log('🔍 Saved audio type from localStorage:', savedType);
            
            if (savedType) {
                const typeOption = document.querySelector(`.audio-type-option[data-type="${savedType}"]`);
                console.log('🔍 Type option element found:', typeOption);
                
                if (typeOption) {
                    const desc = typeOption.getAttribute('data-desc');
                    const typeText = typeOption.querySelector('.text-white, .text-sm')?.textContent || savedType;
                    
                    console.log('✅ Restoring audio type:', savedType, 'with desc:', desc);
                    selectAudioType(savedType, desc, typeOption);
                } else {
                    console.warn('⚠️ Audio type option not found for:', savedType);
                }
            } else {
                console.log('ℹ️ No saved audio type found');
            }
            
            // Restore prompt/text
            const savedPrompt = localStorage.getItem('dashboard_audio_prompt');
            if (savedPrompt && audioPrompt) {
                audioPrompt.value = savedPrompt;
                console.log('✅ Audio prompt restored');
            }
            
            // Restore duration
            const savedDuration = localStorage.getItem('dashboard_audio_duration');
            if (savedDuration && audioDuration) {
                audioDuration.value = savedDuration;
                if (audioDurationDisplay) {
                    audioDurationDisplay.textContent = `${savedDuration} seconds`;
                }
                console.log('✅ Audio duration restored:', savedDuration);
            }
            
            // Note: Selected model will be restored in displayModels() after models load
            const savedModelId = localStorage.getItem('selected_audio_model_id');
            if (savedModelId) {
                console.log('📋 Audio model to restore:', savedModelId, '(will restore after type selection)');
            }
        }, 100); // Small delay to ensure DOM ready
    }
    
    // Setup prompt auto-save
    function setupPromptSave() {
        if (audioPrompt) {
            // Save on input with debounce
            let saveTimeout;
            audioPrompt.addEventListener('input', function() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    localStorage.setItem('dashboard_audio_prompt', this.value);
                    console.log('💾 Audio prompt saved');
                }, 500);
            });
            
            // Clear auto-generated flag when user manually edits
            audioPrompt.addEventListener('keydown', function() {
                if (this.dataset.autoGenerated) {
                    delete this.dataset.autoGenerated;
                    console.log('✏️ User manual edit detected - auto-gen disabled');
                }
            });
        }
    }
    
    // Setup character counter (SAME as Image/Video)
    function setupCharacterCounter() {
        if (!audioPrompt) return;
        
        const charCount = document.getElementById('audio-char-count');
        const charMax = document.getElementById('audio-char-max');
        
        if (!charCount || !charMax) return;
        
        // Update counter on input
        audioPrompt.addEventListener('input', function() {
            const length = this.value.length;
            const maxLength = getCharacterLimit();
            
            charCount.textContent = length;
            charMax.textContent = maxLength;
            
            // Color coding based on usage
            charCount.classList.remove('text-gray-400', 'text-yellow-400', 'text-red-400', 'text-green-400');
            
            if (length > maxLength) {
                charCount.classList.add('text-red-400');
            } else if (length > maxLength * 0.8) {
                charCount.classList.add('text-yellow-400');
            } else if (length > 0) {
                charCount.classList.add('text-green-400');
            } else {
                charCount.classList.add('text-gray-400');
            }
            
            // Update cost for TTS (per-character pricing)
            if (selectedAudioType === 'text-to-speech') {
                updateAudioCost();
            }
        });
        
        // Trigger initial update
        audioPrompt.dispatchEvent(new Event('input'));
    }
    
    // Get character limit based on audio type
    function getCharacterLimit() {
        return selectedAudioType === 'text-to-speech' ? 5000 : 500;
    }
    
    // ============ INPUT VALIDATION ============
    
    // Validate audio generation inputs
    function validateAudioInputs() {
        const errors = [];
        
        // Check type selected
        if (!selectedAudioType) {
            errors.push('Please select an audio type');
        }
        
        // Check model selected
        if (!selectedAudioModel) {
            errors.push('Please select a model');
        }
        
        // Check prompt/text
        const promptValue = audioPrompt?.value?.trim() || '';
        
        if (!promptValue) {
            const fieldName = selectedAudioType === 'text-to-speech' ? 'text' : 'prompt';
            errors.push(`Please enter ${fieldName} to generate audio`);
        } else {
            // Character limits
            const maxLength = getCharacterLimit();
            const minLength = selectedAudioType === 'text-to-speech' ? 1 : 10;
            
            if (promptValue.length < minLength) {
                errors.push(`${selectedAudioType === 'text-to-speech' ? 'Text' : 'Prompt'} must be at least ${minLength} characters`);
            }
            
            if (promptValue.length > maxLength) {
                errors.push(`${selectedAudioType === 'text-to-speech' ? 'Text' : 'Prompt'} must not exceed ${maxLength} characters`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Show validation errors
    function showValidationErrors(errors) {
        if (!errors || errors.length === 0) return;
        
        const errorMessage = errors.join('\n');
        
        // Use existing toast/notification system if available
        if (window.showNotification) {
            window.showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    }
    
    // Get audio generation data for API call
    function getAudioGenerationData() {
        const promptValue = audioPrompt?.value?.trim() || '';
        const durationValue = audioDuration?.value || 10;
        
        const data = {
            type: selectedAudioType,
            model: selectedAudioModel?.model_id || selectedAudioModel?.name,
            prompt: promptValue,
            duration: selectedAudioType === 'text-to-speech' ? undefined : parseInt(durationValue),
            // Additional metadata
            model_name: selectedAudioModel?.name,
            cost: selectedAudioModel?.cost || 0,
            pricing_type: selectedAudioModel?.pricing_type
        };
        
        // Add advanced options for music
        if (selectedAudioType === 'text-to-music') {
            const advanced = {
                genre: selectedGenre || null,
                mood: selectedMood || null,
                tempo: selectedTempo || 120,
                instrumental: isInstrumental,
                vocal_gender: isInstrumental ? null : (selectedVocalGender || 'auto'),
                instruments: document.getElementById('audio-instruments')?.value.trim() || null,
                lyrics: document.getElementById('audio-lyrics')?.value.trim() || null
            };
            
            // Only add advanced if at least one option is set
            if (advanced.genre || advanced.mood || advanced.tempo !== 120 || advanced.instrumental || advanced.vocal_gender || advanced.instruments || advanced.lyrics) {
                data.advanced = advanced;
            }
        }
        
        // Add advanced options for audio/SFX
        if (selectedAudioType === 'text-to-audio') {
            const advanced = {
                category: selectedCategory || null,
                quality: selectedQuality || null,  // Don't default to 'realistic' - only if user selects
                ambience: selectedAmbience !== 'none' ? selectedAmbience : null
            };
            
            // Only add advanced if at least one option is set
            if (advanced.category || advanced.quality || advanced.ambience) {
                data.advanced = advanced;
            }
        }
        
        return data;
    }
    
    // ============ COST CALCULATION ============
    
    // Calculate generation cost based on selected model and duration
    function calculateAudioCost() {
        if (!selectedAudioModel) return 0;
        
        const baseCost = parseFloat(selectedAudioModel.cost) || 0;
        const pricingType = selectedAudioModel.pricing_type;
        
        // For per-second pricing (music/sfx)
        if (pricingType === 'per_second' && selectedAudioType !== 'text-to-speech') {
            const duration = parseInt(audioDuration?.value || 5);
            return baseCost * duration;
        }
        
        // For per-character pricing (TTS) - estimate
        if (pricingType === 'per_character' || pricingType === 'per_1k_chars') {
            const charCount = audioPrompt?.value?.length || 0;
            if (pricingType === 'per_1k_chars') {
                return (charCount / 1000) * baseCost;
            }
            return charCount * baseCost;
        }
        
        // Fixed pricing
        return baseCost;
    }
    
    // Update cost display in generate button
    function updateAudioCost() {
        const cost = calculateAudioCost();
        
        // Update button if exists
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            const costDisplay = generateBtn.querySelector('.cost-display');
            if (costDisplay) {
                costDisplay.textContent = `${cost.toFixed(2)} credits`;
            }
        }
        
        console.log('💰 Audio generation cost:', cost.toFixed(2), 'credits');
    }
    
    // Expose functions globally (for dashboard-generation.js)
    window.validateAudioInputs = validateAudioInputs;
    window.getAudioGenerationData = getAudioGenerationData;
    window.calculateAudioCost = calculateAudioCost;
    window.updateAudioCost = updateAudioCost;
    
    // Audio Type Dropdown
    function setupAudioTypeDropdown() {
        if (!audioTypeBtn || !audioTypeDropdown) return;
        
        // Toggle dropdown
        audioTypeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            audioTypeDropdown.classList.toggle('hidden');
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!audioTypeBtn.contains(e.target) && !audioTypeDropdown.contains(e.target)) {
                audioTypeDropdown.classList.add('hidden');
            }
        });
        
        // Type selection
        audioTypeOptions.forEach(option => {
            option.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const desc = this.getAttribute('data-desc');
                selectAudioType(type, desc, this);
            });
        });
    }
    
    // Reset advanced options state when switching audio types
    function resetAdvancedOptionsState(newType) {
        // Reset music options if switching away from music
        if (newType !== 'text-to-music') {
            if (selectedGenre || selectedMood || selectedTempo !== 120 || selectedVocalGender !== 'auto' || isInstrumental) {
                selectedGenre = null;
                selectedMood = null;
                selectedTempo = 120;
                selectedVocalGender = 'auto';
                isInstrumental = false;
                
                // Reset instrumental toggle
                const instToggle = document.getElementById('instrumental-toggle');
                if (instToggle) {
                    instToggle.checked = false;
                    document.getElementById('instrumental-label').textContent = 'With Vocals';
                    document.getElementById('instrumental-hint').textContent = 'Music with singing';
                    const vocalSection = document.getElementById('vocal-gender-section');
                    if (vocalSection) {
                        vocalSection.style.opacity = '1';
                        vocalSection.style.pointerEvents = 'auto';
                    }
                }
                
                // Reset UI - genre buttons
                document.querySelectorAll('.audio-genre-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500');
                    btn.classList.add('bg-white/5', 'border-white/10');
                });
                
                // Reset UI - mood buttons
                document.querySelectorAll('.audio-mood-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500');
                    btn.classList.add('bg-white/5', 'border-white/10');
                });
                
                // Reset UI - vocal gender buttons
                document.querySelectorAll('.vocal-gender-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500/50', 'active');
                    btn.classList.add('bg-white/5', 'border-white/10');
                    if (btn.getAttribute('data-gender') === 'auto') {
                        btn.classList.remove('bg-white/5', 'border-white/10');
                        btn.classList.add('bg-blue-500/30', 'border-blue-500/50', 'active');
                    }
                });
                
                // Reset tempo slider
                const tempoSlider = document.getElementById('audio-tempo');
                const tempoDisplay = document.getElementById('audio-tempo-display');
                if (tempoSlider) tempoSlider.value = 120;
                if (tempoDisplay) tempoDisplay.textContent = '120 BPM';
                
                // Clear text inputs
                const instrumentsInput = document.getElementById('audio-instruments');
                const lyricsInput = document.getElementById('audio-lyrics');
                if (instrumentsInput) instrumentsInput.value = '';
                if (lyricsInput) lyricsInput.value = '';
                
                console.log('🔄 Music advanced options reset');
            }
        }
        
        // Reset audio/SFX options if switching away from audio
        if (newType !== 'text-to-audio') {
            if (selectedCategory || selectedQuality || selectedAmbience !== 'none') {
                selectedCategory = null;
                selectedQuality = null;
                selectedAmbience = 'none';
                
                // Reset UI - category buttons
                document.querySelectorAll('.audio-category-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500');
                });
                
                // Reset UI - quality buttons
                document.querySelectorAll('.audio-quality-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500');
                });
                
                // Reset UI - ambience buttons
                document.querySelectorAll('.audio-ambience-btn').forEach(btn => {
                    btn.classList.remove('bg-blue-500/30', 'border-blue-500');
                });
                
                // Reset ambience display
                const ambienceDisplay = document.getElementById('audio-ambience-display');
                if (ambienceDisplay) ambienceDisplay.textContent = 'None';
                
                console.log('🔄 Audio/SFX advanced options reset');
            }
        }
    }
    
    function selectAudioType(type, desc, element) {
        console.log('🎵 Audio type selected:', type);
        
        selectedAudioType = type;
        
        // ✨ Reset advanced options state when switching types
        resetAdvancedOptionsState(type);
        
        // Update UI
        const titleElement = element.querySelector('.text-white, .text-sm.font-semibold');
        if (selectedAudioTypeText && titleElement) {
            selectedAudioTypeText.textContent = titleElement.textContent;
            selectedAudioTypeText.classList.remove('text-gray-400');
            selectedAudioTypeText.classList.add('text-white');
        }
        
        if (selectedAudioTypeDesc) {
            selectedAudioTypeDesc.textContent = desc;
            selectedAudioTypeDesc.classList.remove('text-gray-500');
            selectedAudioTypeDesc.classList.add('text-gray-400');
        }
        
        // Update icon
        const icon = element.querySelector('i.fa-microphone, i.fa-music, i.fa-volume-up');
        if (icon && audioTypeBtn) {
            const iconClone = icon.cloneNode(true);
            const iconContainer = audioTypeBtn.querySelector('.w-8.h-8');
            if (iconContainer) {
                iconContainer.innerHTML = '';
                iconContainer.appendChild(iconClone);
                
                // Copy gradient classes from dropdown to button
                const dropdownIconContainer = element.querySelector('.w-10');
                if (dropdownIconContainer) {
                    iconContainer.className = dropdownIconContainer.className.replace('w-10', 'w-8').replace('h-10', 'h-8');
                }
            }
        }
        
        // Update hidden select
        if (audioTypeSelect) audioTypeSelect.value = type;
        
        // Update active state
        audioTypeOptions.forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        
        // Close dropdown
        if (audioTypeDropdown) audioTypeDropdown.classList.add('hidden');
        
        // Apply conditional UI based on type
        applyConditionalUI(type);
        
        // Save to localStorage
        localStorage.setItem('dashboard_audio_type', type);
        console.log('💾 Audio type saved to localStorage:', type);
        
        // Load models for this type
        console.log('📥 Filtering models for type:', type, '(Total models:', audioModels.length, ')');
        filterAndDisplayModels(type);
    }
    
    // Apply Conditional UI based on audio type
    function applyConditionalUI(type) {
        const config = AUDIO_TYPE_CONFIG[type];
        if (!config) return;
        
        console.log('🎨 Applying conditional UI for:', type, config);
        
        // Update prompt label and placeholder
        const promptLabel = document.querySelector('label[for="audio-prompt"]');
        if (promptLabel) {
            const labelText = config.label;
            const isTTS = type === 'text-to-speech';
            promptLabel.className = 'control-label';
            promptLabel.innerHTML = `${labelText} ${isTTS ? '<span class="text-gray-500 text-xs ml-1">(Text to convert to speech)</span>' : ''}`;
            console.log('✅ Prompt label updated to:', labelText);
        }
        
        if (audioPrompt) {
            audioPrompt.placeholder = config.placeholder;
            // Clear auto-generated flag when type changes
            delete audioPrompt.dataset.autoGenerated;
            console.log('✅ Prompt placeholder updated');
            
            // Trigger character counter update with new limit
            audioPrompt.dispatchEvent(new Event('input'));
        }
        
        // Update hint text
        const promptHint = document.getElementById('audio-prompt-hint');
        if (promptHint) {
            if (type === 'text-to-speech') {
                promptHint.innerHTML = '<i class="fas fa-info-circle text-blue-400"></i><span>Enter any text you want to hear spoken</span>';
            } else {
                promptHint.innerHTML = '<i class="fas fa-lightbulb text-blue-400"></i><span>Be descriptive for better results</span>';
            }
        }
        
        // Show/Hide advanced options (Music & Audio)
        const advancedOptions = document.getElementById('audio-advanced-options');
        const musicAdvancedOptions = document.getElementById('music-advanced-options');
        const audioSfxAdvancedOptions = document.getElementById('audio-sfx-advanced-options');
        
        if (advancedOptions) {
            if (type === 'text-to-music' || type === 'text-to-audio') {
                advancedOptions.classList.remove('hidden');
                console.log('✅ Advanced options SHOWN for', type);
                
                // Show appropriate sub-options
                if (musicAdvancedOptions) {
                    if (type === 'text-to-music') {
                        musicAdvancedOptions.classList.remove('hidden');
                        console.log('   🎵 Music advanced options visible');
                    } else {
                        musicAdvancedOptions.classList.add('hidden');
                    }
                }
                
                if (audioSfxAdvancedOptions) {
                    if (type === 'text-to-audio') {
                        audioSfxAdvancedOptions.classList.remove('hidden');
                        console.log('   🔊 Audio/SFX advanced options visible');
                    } else {
                        audioSfxAdvancedOptions.classList.add('hidden');
                    }
                }
            } else {
                advancedOptions.classList.add('hidden');
                console.log('🔇 Advanced options HIDDEN for', type);
            }
        }
        
        // Show/Hide duration control
        const durationContainer = document.getElementById('audio-duration-container');
        if (durationContainer) {
            if (config.showDuration) {
                durationContainer.style.display = 'block';
                // Auto-adjust duration range
                adjustDurationRange(type);
                console.log('✅ Duration control SHOWN for', type);
            } else {
                durationContainer.style.display = 'none';
                console.log('✅ Duration control HIDDEN for', type, '(TTS mode)');
            }
        } else {
            console.warn('⚠️ Duration container not found!');
        }
    }
    
    // Load Audio Models
    async function loadAudioModels() {
        try {
            console.log('📥 Loading audio models...');
            
            const response = await fetch('/api/models/all?type=audio');
            const data = await response.json();
            
            if (data.success) {
                audioModels = data.models;
                console.log('✅ Loaded', audioModels.length, 'audio models');
                
                // If type is already selected, display models
                if (selectedAudioType) {
                    filterAndDisplayModels(selectedAudioType);
                }
            } else {
                console.error('❌ Failed to load audio models:', data.message);
                showError('Failed to load audio models');
            }
        } catch (error) {
            console.error('❌ Error loading audio models:', error);
            showError('Error loading audio models');
        }
    }
    
    // Filter and Display Models
    function filterAndDisplayModels(type) {
        if (!audioModels || audioModels.length === 0) {
            audioModelCards.innerHTML = '<p class="text-center text-gray-500 text-sm py-4">No audio models available</p>';
            return;
        }
        
        // Map type to category (with flexible matching)
        const categoryMap = {
            'text-to-speech': ['Text-to-Speech', 'Voice-Conversion', 'text-to-speech', 'TTS', 'speech'],
            'text-to-music': ['Text-to-Music', 'text-to-music', 'Music', 'music', 'Music Generation'],
            'text-to-audio': ['Text-to-Audio', 'text-to-audio', 'Audio', 'audio', 'SFX', 'Sound Effects']
        };
        
        const categories = categoryMap[type] || [];
        
        // Filter models with case-insensitive matching
        let filtered = audioModels.filter(model => {
            if (!model.category) return false;
            
            // Normalize category for comparison
            const modelCategory = model.category.trim();
            
            // Exact match (case-sensitive)
            if (categories.some(cat => modelCategory === cat)) {
                return true;
            }
            
            // Case-insensitive match
            const modelCategoryLower = modelCategory.toLowerCase();
            return categories.some(cat => modelCategoryLower === cat.toLowerCase());
        });
        
        console.log('🔍 Filtered', filtered.length, 'models for type:', type);
        console.log('   Available categories:', audioModels.map(m => m.category).filter((v, i, a) => a.indexOf(v) === i));
        
        if (filtered.length === 0) {
            audioModelCards.innerHTML = `
                <div class="text-center text-gray-500 text-sm py-4">
                    <p>No models available for this type</p>
                    <p class="text-xs mt-2 text-gray-600">Expected categories: ${categories.slice(0, 3).join(', ')}</p>
                </div>
            `;
            return;
        }
        
        // Display models
        displayModels(filtered);
    }
    
    function displayModels(models) {
        if (!models || models.length === 0) {
            audioModelCards.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-circle text-4xl text-gray-600 mb-3"></i>
                    <p class="text-sm text-gray-400">No models found</p>
                </div>
            `;
            return;
        }
        
        // Use the SAME rendering format as Image/Video
        audioModelCards.innerHTML = models.map(model => {
            const gradientClass = model.trending ? 'from-yellow-500 to-orange-600' : 'from-blue-500 to-cyan-600';
            const iconClass = model.category === 'Text-to-Speech' ? 'fa-microphone' :
                            model.category === 'Text-to-Music' ? 'fa-music' :
                            'fa-volume-up';
            
            return `
                <button type="button" class="model-card w-full p-4 rounded-xl border border-white/10 hover:border-blue-500/50 bg-white/5 text-left transition-all duration-300 group" 
                        data-model-id="${model.model_id || model.id}"
                        data-db-id="${model.id}"
                        data-cost="${model.cost || 2}"
                        data-fal-price="${model.fal_price || 0.003}"
                        data-pricing-type="${model.pricing_type || 'per_second'}">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="fas ${iconClass} text-white"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1">
                                <p class="text-sm font-semibold text-white line-clamp-1">
                                    ${model.name}
                                    ${model.trending ? ' 🔥' : ''}
                                    ${model.viral ? ' ⚡' : ''}
                                </p>
                            </div>
                            <p class="text-xs text-gray-400 line-clamp-2 mb-2">${model.description || model.provider || 'AI audio model'}</p>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                                    ${model.category || 'Audio'}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-semibold flex items-center gap-1">
                                    <i class="fas fa-coins"></i>
                                    ${model.cost || 2}${model.pricing_type === 'per_second' ? '/s' : ''}
                                </span>
                            </div>
                        </div>
                        <i class="fas fa-check text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                </button>
            `;
        }).join('');
        
        // Add click handlers
        audioModelCards.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                // Pass true to collapse after manual selection
                selectAudioModel(this, true);
            });
        });
        
        // ✨ RESTORE SAVED MODEL or auto-select first (SAME as Image/Video)
        const savedModelId = localStorage.getItem('selected_audio_model_id');
        let modelRestored = false;
        
        if (savedModelId) {
            // Try to find and select the saved model
            const savedCard = audioModelCards.querySelector(`[data-db-id="${savedModelId}"]`);
            if (savedCard) {
                console.log('🔄 Restoring saved audio model:', savedModelId);
                // Collapse immediately after restoring
                selectAudioModel(savedCard, true); // ✅ Auto-collapse on restore
                modelRestored = true;
            } else {
                console.log('⚠️ Saved audio model not found, selecting first');
            }
        }
        
        // If no saved model or not found, auto-select first
        if (!modelRestored) {
            const firstCard = audioModelCards.querySelector('.model-card');
            if (firstCard) {
                // Collapse immediately after first selection
                selectAudioModel(firstCard, true); // ✅ Auto-collapse on first load
            }
        }
    }
    
    function selectAudioModel(card, shouldCollapse = true) {
        // Update selected state - SAME as Image/Video
        audioModelCards.querySelectorAll('.model-card').forEach(c => {
            c.classList.remove('border-blue-500/50', 'bg-blue-500/10');
            const checkIcon = c.querySelector('.fa-check');
            if (checkIcon) checkIcon.style.opacity = '0';
        });
        
        card.classList.add('border-blue-500/50', 'bg-blue-500/10');
        const checkIcon = card.querySelector('.fa-check');
        if (checkIcon) checkIcon.style.opacity = '1';
        
        // Save selected model
        selectedAudioModel = {
            model_id: card.getAttribute('data-model-id'),
            db_id: card.getAttribute('data-db-id'),
            cost: parseFloat(card.getAttribute('data-cost')),
            fal_price: parseFloat(card.getAttribute('data-fal-price')),
            pricing_type: card.getAttribute('data-pricing-type')
        };
        
        console.log('✅ Selected audio model:', selectedAudioModel);
        
        // Get model data from card attributes for display
        const modelName = card.querySelector('.text-sm.font-semibold')?.textContent || 'Audio Model';
        const modelDesc = card.querySelector('.text-xs.text-gray-400')?.textContent || 'AI audio generation model';
        const modelCategory = card.querySelector('.bg-blue-500\\/20')?.textContent || 'Audio';
        
        // ✨ SAVE TO LOCALSTORAGE FOR PERSISTENCE (SAME as Image/Video)
        try {
            localStorage.setItem('selected_audio_model_id', selectedAudioModel.db_id);
            localStorage.setItem('selected_audio_model', JSON.stringify(selectedAudioModel));
            console.log('💾 Saved audio model to localStorage:', selectedAudioModel.model_id);
        } catch (e) {
            console.warn('Failed to save audio model to localStorage:', e);
        }
        
        // Update model info display (SAME as Image/Video)
        updateAudioModelInfo(modelName, modelDesc, modelCategory, selectedAudioModel.cost, selectedAudioModel.pricing_type);
        
        // Collapse model cards after selection (SAME as Image/Video)
        console.log('🔽 Should collapse?', shouldCollapse, 'Function exists?', !!window.collapseModelCards);
        
        if (shouldCollapse) {
            if (window.collapseModelCards) {
                console.log('🔽 Collapsing audio model cards...');
                setTimeout(() => {
                    window.collapseModelCards('audio');
                    console.log('✅ Collapse function called for audio');
                }, 100);
            } else {
                console.warn('⚠️ window.collapseModelCards not found! Check model-cards-handler.js');
            }
        } else {
            console.log('ℹ️ Skipping collapse (shouldCollapse = false)');
        }
        
        // Update cost calculation
        updateAudioCost();
    }
    
    // Duration Slider
    function setupDurationSlider() {
        if (!audioDuration || !audioDurationDisplay) return;
        
        audioDuration.addEventListener('input', function() {
            const value = this.value;
            audioDurationDisplay.textContent = `${value} seconds`;
            
            // Save to localStorage
            localStorage.setItem('dashboard_audio_duration', value);
            console.log('💾 Audio duration saved:', value);
            
            updateAudioCost();
        });
    }
    
    // Update Audio Model Info Display (SAME as Image/Video)
    function updateAudioModelInfo(name, desc, category, cost, pricingType) {
        const modelInfo = document.getElementById('audio-model-info');
        const modelName = document.getElementById('audio-model-name');
        const modelDesc = document.getElementById('audio-model-desc');
        const modelBadge = document.getElementById('audio-model-badge');
        const modelCost = document.getElementById('audio-model-cost');
        
        if (!modelInfo) return;
        
        if (modelName) modelName.textContent = name;
        if (modelDesc) modelDesc.textContent = desc;
        if (modelBadge) modelBadge.textContent = category;
        
        if (modelCost) {
            const costSpan = modelCost.querySelector('span');
            if (costSpan) {
                const costText = pricingType === 'per_second' ? `${cost}/s` : `${cost}`;
                costSpan.textContent = `${costText} credits`;
            }
        }
        
        // Show model info card
        modelInfo.classList.remove('hidden');
        console.log('✅ Audio model info displayed:', name);
    }
    
    // Update Cost Calculation
    function updateAudioCost() {
        if (!selectedAudioModel) return;
        
        const duration = audioDuration ? parseInt(audioDuration.value) : 5;
        let cost = parseFloat(selectedAudioModel.cost);
        
        // For per-second pricing, model.cost is already credits/second (from admin × 10)
        // Simply multiply by duration
        if (selectedAudioModel.pricing_type === 'per_second') {
            const creditsPerSecond = cost; // Already calculated by admin
            cost = creditsPerSecond * duration;
            console.log(`🎵 Audio per-second: ${creditsPerSecond.toFixed(2)} cr/s × ${duration}s = ${cost.toFixed(2)} cr`);
        }
        
        // Update main credit cost display
        const creditCostElement = document.getElementById('credit-cost');
        const creditBreakdownElement = document.getElementById('credit-breakdown');
        const quantitySelect = document.getElementById('quantity-select');
        
        if (creditCostElement && quantitySelect) {
            const quantity = parseInt(quantitySelect.value) || 1;
            const totalCost = (cost * quantity).toFixed(2);
            
            creditCostElement.textContent = `${totalCost} Credits`;
            
            if (creditBreakdownElement) {
                if (selectedAudioModel.pricing_type === 'per_second') {
                    creditBreakdownElement.textContent = `${quantity}x audio (${duration}s each) @ ${cost.toFixed(2)} credits`;
                } else {
                    creditBreakdownElement.textContent = `${quantity}x audio @ ${cost.toFixed(2)} credits each`;
                }
            }
        }
    }
    
    // Model Search
    if (audioModelSearch) {
        audioModelSearch.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            
            if (!query) {
                // Show all filtered models for current type
                if (selectedAudioType) {
                    filterAndDisplayModels(selectedAudioType);
                }
                return;
            }
            
            // Search within current filtered models
            const filtered = audioModels.filter(model => {
                return model.name.toLowerCase().includes(query) ||
                       (model.provider && model.provider.toLowerCase().includes(query)) ||
                       (model.category && model.category.toLowerCase().includes(query));
            });
            
            displayModels(filtered);
        });
    }
    
    // Helper Functions
    function showError(message) {
        if (audioModelCards) {
            audioModelCards.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-red-400 text-2xl mb-2"></i>
                    <p class="text-red-400 text-sm">${message}</p>
                </div>
            `;
        }
    }
    
    // Expand Button Handler
    function setupExpandButton() {
        const expandBtn = document.getElementById('expand-audio-models');
        if (expandBtn) {
            expandBtn.addEventListener('click', function() {
                if (window.expandModelCards) {
                    window.expandModelCards('audio');
                }
            });
        }
    }
    
    // Export for access from dashboard.js
    window.audioHandler = {
        getSelectedModel: () => selectedAudioModel,
        getSelectedType: () => selectedAudioType,
        getDuration: () => audioDuration ? parseInt(audioDuration.value) : 5,
        updateCost: updateAudioCost
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            setupExpandButton();
        });
    } else {
        init();
        setupExpandButton();
    }
    
})();

