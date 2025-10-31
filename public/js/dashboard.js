// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            sidebarItems.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get section
            const section = this.getAttribute('data-section');
            
            // Here you can add logic to show/hide different sections
        });
    });

    // Sidebar hover effect (only if sidebar exists)
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar) {
        sidebar.addEventListener('mouseenter', function() {
            this.classList.add('expanded');
        });
        
        sidebar.addEventListener('mouseleave', function() {
            this.classList.remove('expanded');
        });
    }

    // Mobile sidebar toggle (if needed)
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Profile Dropdown Toggle
    const profileBtn = document.getElementById('profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }

    // ===================================
    // CUSTOM DROPDOWN HANDLERS
    // ===================================
    
    
    // Image Type Custom Dropdown
    const imageTypeBtn = document.getElementById('image-type-btn');
    const imageTypeDropdown = document.getElementById('image-type-dropdown');
    const imageTypeSelect = document.getElementById('image-type');
    const imageTypeOptions = document.querySelectorAll('.image-type-option');
    
    if (imageTypeBtn && imageTypeDropdown) {
        
        // Toggle dropdown
        imageTypeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = imageTypeDropdown.classList.contains('hidden');
            imageTypeDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!imageTypeBtn.contains(e.target) && !imageTypeDropdown.contains(e.target)) {
                imageTypeDropdown.classList.add('hidden');
            }
        });
        
    } else {
        console.error('❌ Image type dropdown elements not found!');
    }
    
    // Handle option selection
    if (imageTypeOptions.length > 0) {
        
        imageTypeOptions.forEach((option, index) => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const type = this.getAttribute('data-type');
                const desc = this.getAttribute('data-desc');
                
                
                // Update hidden select
                if (imageTypeSelect) {
                    imageTypeSelect.value = type;
                    imageTypeSelect.dispatchEvent(new Event('change'));
                }
                
                // Update button display
                const selectedTypeEl = document.getElementById('selected-image-type');
                const selectedDescEl = document.getElementById('selected-image-type-desc');
                
                if (selectedTypeEl && selectedDescEl) {
                    const typeText = this.querySelector('.text-sm').textContent;
                    selectedTypeEl.textContent = typeText;
                    selectedTypeEl.classList.remove('text-gray-400');
                    selectedTypeEl.classList.add('text-white');
                    
                    selectedDescEl.textContent = desc;
                    selectedDescEl.classList.remove('text-gray-500');
                    selectedDescEl.classList.add('text-gray-400');
                }
                
                // Update button icon
                const typeIconContainer = this.querySelector('.w-10');
                const btnIconContainer = imageTypeBtn.querySelector('.w-8');
                
                if (typeIconContainer && btnIconContainer) {
                    btnIconContainer.className = typeIconContainer.className.replace('w-10', 'w-8').replace('h-10', 'h-8');
                }
                
                // Update active state
                imageTypeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Close dropdown
                imageTypeDropdown.classList.add('hidden');
                
                // Save to localStorage
                localStorage.setItem('dashboard_image_type', type);
            });
        });
        
    } else {
        console.error('❌ No image type options found!');
    }

    // State management with localStorage persistence
    let currentQuantity = parseInt(localStorage.getItem('dashboard_quantity')) || 1;
    let currentMode = localStorage.getItem('dashboard_mode') || 'image';
    
    // Restore state from localStorage
    function restoreState() {
        
        // Restore mode (Image/Video tab)
        const savedMode = localStorage.getItem('dashboard_mode');
        
        if (savedMode) {
            currentMode = savedMode;
            
            // Set active tab
            const tabs = document.querySelectorAll('.creation-tab');
            
            tabs.forEach(tab => {
                const tabMode = tab.getAttribute('data-mode');
                if (tabMode === savedMode) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            
            // Show correct mode content
            const modes = document.querySelectorAll('.creation-mode');
            
            modes.forEach(mode => mode.classList.add('hidden'));
            const activeMode = document.getElementById(`${savedMode}-mode`);
            
            if (activeMode) {
                activeMode.classList.remove('hidden');
                activeMode.classList.add('active');
            }
        } else {
            // ✅ No saved mode - save the current active tab
            const activeTab = document.querySelector('.creation-tab.active');
            if (activeTab) {
                currentMode = activeTab.getAttribute('data-mode') || 'image';
                localStorage.setItem('dashboard_mode', currentMode);
            }
        }
        
        // Restore quantity
        const savedQuantity = localStorage.getItem('dashboard_quantity');
        
        if (savedQuantity) {
            const quantitySelect = document.getElementById('quantity-select');
            
            if (quantitySelect) {
                quantitySelect.value = savedQuantity;
                currentQuantity = parseInt(savedQuantity);
            }
        }
        
        // Restore image type
        const savedImageType = localStorage.getItem('dashboard_image_type');
        
        if (savedImageType) {
            const imageTypeSelect = document.getElementById('image-type');
            const imageTypeBtn = document.getElementById('image-type-btn');
            const selectedTypeEl = document.getElementById('selected-image-type');
            const selectedDescEl = document.getElementById('selected-image-type-desc');
            
            
            if (imageTypeSelect && imageTypeBtn && selectedTypeEl) {
                // Update hidden select
                imageTypeSelect.value = savedImageType;
                
                // Find the option data
                const imageTypeOption = document.querySelector(`.image-type-option[data-type="${savedImageType}"]`);
                
                if (imageTypeOption) {
                    // Directly update visual without click animation
                    const typeText = imageTypeOption.querySelector('.text-sm').textContent;
                    const typeDesc = imageTypeOption.getAttribute('data-desc');
                    const typeIconContainer = imageTypeOption.querySelector('.w-10');
                    const typeIcon = imageTypeOption.querySelector('.w-10 i').className;
                    
                    selectedTypeEl.textContent = typeText;
                    selectedTypeEl.classList.remove('text-gray-400');
                    selectedTypeEl.classList.add('text-white');
                    
                    selectedDescEl.textContent = typeDesc;
                    selectedDescEl.classList.remove('text-gray-500');
                    selectedDescEl.classList.add('text-gray-400');
                    
                    // Update icon container (background + icon)
                    const btnIconContainer = imageTypeBtn.querySelector('.w-8');
                    if (btnIconContainer && typeIconContainer) {
                        // Copy all classes from dropdown option to button (w-10 → w-8)
                        btnIconContainer.className = typeIconContainer.className.replace('w-10', 'w-8').replace('h-10', 'h-8');
                    }
                    
                    const iconEl = imageTypeBtn.querySelector('.w-8 i');
                    if (iconEl) iconEl.className = typeIcon;
                    
                    // Update active state
                    document.querySelectorAll('.image-type-option').forEach(opt => opt.classList.remove('active'));
                    imageTypeOption.classList.add('active');
                    
                    // ✅ ONLY trigger change if currently on IMAGE tab
                    const activeTab = document.querySelector('.creation-tab.active');
                    const actualMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
                    
                    if (actualMode === 'image') {
                        // Trigger change event for model loading
                        imageTypeSelect.dispatchEvent(new Event('change'));
                    } else {
                    }
                } else {
                    // Fallback: just dispatch change (only if on image tab)
                    const activeTab = document.querySelector('.creation-tab.active');
                    const actualMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
                    
                    if (actualMode === 'image') {
                        imageTypeSelect.dispatchEvent(new Event('change'));
                    }
                }
            }
        }
        
        // Restore video type
        const savedVideoType = localStorage.getItem('dashboard_video_type');
        
        if (savedVideoType) {
            const videoTypeSelect = document.getElementById('video-type');
            const videoTypeBtn = document.getElementById('video-type-btn');
            const selectedTypeEl = document.getElementById('selected-video-type');
            const selectedDescEl = document.getElementById('selected-video-type-desc');
            
            
            if (videoTypeSelect && videoTypeBtn && selectedTypeEl) {
                // Update hidden select
                videoTypeSelect.value = savedVideoType;
                
                // Find the option data
                const videoTypeOption = document.querySelector(`.video-type-option[data-type="${savedVideoType}"]`);
                
                if (videoTypeOption) {
                    // Directly update visual without click animation
                    const typeText = videoTypeOption.querySelector('.text-sm').textContent;
                    const typeDesc = videoTypeOption.getAttribute('data-desc');
                    const typeIconContainer = videoTypeOption.querySelector('.w-10');
                    const typeIcon = videoTypeOption.querySelector('.w-10 i').className;
                    
                    selectedTypeEl.textContent = typeText;
                    selectedTypeEl.classList.remove('text-gray-400');
                    selectedTypeEl.classList.add('text-white');
                    
                    selectedDescEl.textContent = typeDesc;
                    selectedDescEl.classList.remove('text-gray-500');
                    selectedDescEl.classList.add('text-gray-400');
                    
                    // Update icon container (background + icon)
                    const btnIconContainer = videoTypeBtn.querySelector('.w-8');
                    if (btnIconContainer && typeIconContainer) {
                        // Copy all classes from dropdown option to button (w-10 → w-8)
                        btnIconContainer.className = typeIconContainer.className.replace('w-10', 'w-8').replace('h-10', 'h-8');
                    }
                    
                    const iconEl = videoTypeBtn.querySelector('.w-8 i');
                    if (iconEl) iconEl.className = typeIcon;
                    
                    // Update active state
                    document.querySelectorAll('.video-type-option').forEach(opt => opt.classList.remove('active'));
                    videoTypeOption.classList.add('active');
                    
                    // ✅ ONLY trigger change if currently on VIDEO tab
                    const activeTab = document.querySelector('.creation-tab.active');
                    const actualMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
                    
                    if (actualMode === 'video') {
                        // Trigger change event for model loading
                        videoTypeSelect.dispatchEvent(new Event('change'));
                    } else {
                    }
                } else {
                    // Fallback: just dispatch change (only if on video tab)
                    const activeTab = document.querySelector('.creation-tab.active');
                    const actualMode = activeTab ? activeTab.getAttribute('data-mode') : 'image';
                    
                    if (actualMode === 'video') {
                        videoTypeSelect.dispatchEvent(new Event('change'));
                    }
                }
            }
        }
        
        // Restore aspect ratio for image mode
        const savedImageAspectRatio = localStorage.getItem('dashboard_image_aspect_ratio');
        
        if (savedImageAspectRatio) {
            const imageAspectBtns = document.querySelector('#image-mode')?.querySelectorAll('.aspect-btn');
            if (imageAspectBtns && imageAspectBtns.length > 0) {
                imageAspectBtns.forEach(btn => {
                    if (btn.getAttribute('data-ratio') === savedImageAspectRatio) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }
        
        // Restore aspect ratio for video mode
        const savedVideoAspectRatio = localStorage.getItem('dashboard_video_aspect_ratio');
        
        if (savedVideoAspectRatio) {
            const videoAspectBtns = document.querySelector('#video-mode')?.querySelectorAll('.aspect-btn');
            if (videoAspectBtns && videoAspectBtns.length > 0) {
                videoAspectBtns.forEach(btn => {
                    if (btn.getAttribute('data-ratio') === savedVideoAspectRatio) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }
        
    }
    
    // Save state to localStorage
    function saveState() {
        localStorage.setItem('dashboard_mode', currentMode);
        localStorage.setItem('dashboard_quantity', currentQuantity);
    }

    // ✅ REMOVED: calculateCreditCost() is now handled by dashboard-generation.js
    // That file loads real model data from database and calculates accurate pricing
    // This avoids function name collision and deprecated hardcoded values

    // Creation Mode Tabs with Animation
    const creationTabs = document.querySelectorAll('.creation-tab');
    const creationModes = document.querySelectorAll('.creation-mode');


    creationTabs.forEach((tab, index) => {
        
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const mode = this.getAttribute('data-mode');
            
            currentMode = mode;
            saveState(); // ✅ Save to localStorage
            
            // Remove active class from all tabs
            creationTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all creation modes
            creationModes.forEach(m => {
                m.classList.remove('active');
                m.classList.add('hidden');
            });
            
            // Show selected mode
            const selectedMode = document.getElementById(`${mode}-mode`);
            
            if (selectedMode) {
                selectedMode.classList.remove('hidden');
                selectedMode.classList.add('active');
            }
            
            // ✅ Trigger model reload and cost recalculation for the new mode
            setTimeout(() => {
                if (mode === 'image') {
                    const imageTypeSelect = document.getElementById('image-type');
                    if (imageTypeSelect && imageTypeSelect.value) {
                        imageTypeSelect.dispatchEvent(new Event('change'));
                    }
                } else if (mode === 'video') {
                    const videoTypeSelect = document.getElementById('video-type');
                    if (videoTypeSelect && videoTypeSelect.value) {
                        videoTypeSelect.dispatchEvent(new Event('change'));
                    }
                }
                
                // ✅ Force cost recalculation after tab switch
                if (window.calculateCreditCost) {
                    setTimeout(() => {
                        window.calculateCreditCost();
                    }, 150); // Wait for model selection to complete
                }
            }, 100); // Small delay to ensure UI is updated
            
        });
    });

    // Character counter for textareas
    const imageTextarea = document.getElementById('image-textarea');
    const videoTextarea = document.getElementById('video-textarea');

    if (imageTextarea) {
        imageTextarea.addEventListener('input', function() {
            document.getElementById('image-counter').textContent = this.value.length;
        });
    }

    if (videoTextarea) {
        videoTextarea.addEventListener('input', function() {
            document.getElementById('video-counter').textContent = this.value.length;
        });
    }

    // Image Type Change Handler
    const imageType = document.getElementById('image-type');
    const imageUploadSection = document.getElementById('image-upload-section');
    
    if (imageType && imageUploadSection) {
        imageType.addEventListener('change', function() {
            const value = this.value;
            localStorage.setItem('dashboard_image_type', value); // ✅ Save to localStorage
            
            if (value === 'edit-image' || value === 'edit-multi' || value === 'upscale' || value === 'remove-bg') {
                imageUploadSection.classList.remove('hidden');
            } else {
                imageUploadSection.classList.add('hidden');
            }
        });
    }

    // Video Type Change Handler
    const videoType = document.getElementById('video-type');
    const videoUploadSection = document.getElementById('video-upload-section');
    const videoEndFrameSection = document.getElementById('video-end-frame-section');
    
    if (videoType && videoUploadSection) {
        videoType.addEventListener('change', function() {
            const value = this.value;
            localStorage.setItem('dashboard_video_type', value); // ✅ Save to localStorage
            
            // Show upload section for both image-to-video options
            if (value === 'image-to-video' || value === 'image-to-video-end') {
                videoUploadSection.classList.remove('hidden');
                
                // Show end frame only for image-to-video-end
                if (value === 'image-to-video-end' && videoEndFrameSection) {
                    videoEndFrameSection.classList.remove('hidden');
                } else if (videoEndFrameSection) {
                    videoEndFrameSection.classList.add('hidden');
                }
            } else {
                videoUploadSection.classList.add('hidden');
                if (videoEndFrameSection) {
                    videoEndFrameSection.classList.add('hidden');
                }
            }
            
            // ✅ Pricing is handled by dashboard-generation.js
        });
    }

    // Aspect Ratio Buttons
    const aspectBtns = document.querySelectorAll('.aspect-btn');
    aspectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings in same parent
            const parent = this.parentElement;
            parent.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Save aspect ratio to localStorage based on current mode
            const aspectRatio = this.getAttribute('data-ratio');
            const storageKey = currentMode === 'image' ? 'dashboard_image_aspect_ratio' : 'dashboard_video_aspect_ratio';
            localStorage.setItem(storageKey, aspectRatio);
        });
    });

    // Duration Buttons - REMOVED (handled by dashboard-generation.js to avoid conflicts)
    // dashboard-generation.js already has the duration button listener

    // Quantity Dropdown (fal.ai style)
    const quantitySelect = document.getElementById('quantity-select');
    
    if (quantitySelect) {
        quantitySelect.addEventListener('change', function() {
            // Update quantity
            currentQuantity = parseInt(this.value);
            saveState(); // ✅ Save to localStorage
            
            // ✅ Pricing is handled by dashboard-generation.js
            
        });
    }

    // File Upload Click Handlers
    const imageUploadDiv = document.querySelector('#image-upload-section .border-dashed');
    const imageUploadInput = document.getElementById('image-upload');
    
    if (imageUploadDiv && imageUploadInput) {
        imageUploadDiv.addEventListener('click', () => imageUploadInput.click());
        imageUploadInput.addEventListener('change', function() {
            const imageFilesList = document.getElementById('image-files-list');
            const imageUploadText = document.getElementById('image-upload-text');
            const imageUploadTextMulti = document.getElementById('image-upload-text-multi');
            
            if (this.files && this.files.length > 0) {
                // Check if multiple files (edit-multi mode)
                if (this.files.length > 1 || this.hasAttribute('multiple')) {
                    // ✅ Multiple files mode - show list
                    if (imageFilesList) {
                        imageFilesList.classList.remove('hidden');
                        imageFilesList.innerHTML = ''; // Clear previous
                        
                        Array.from(this.files).forEach((file, index) => {
                            const fileItem = document.createElement('div');
                            fileItem.className = 'flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-green-500/30';
                            fileItem.innerHTML = `
                                <div class="flex items-center gap-2 flex-1">
                                    <i class="fas fa-image text-green-400"></i>
                                    <span class="text-sm text-green-400 font-semibold truncate">${file.name}</span>
                                    <span class="text-xs text-gray-500">(${(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button type="button" class="text-red-400 hover:text-red-300 ml-2" onclick="this.parentElement.remove()">
                                    <i class="fas fa-times"></i>
                                </button>
                            `;
                            imageFilesList.appendChild(fileItem);
                        });
                    }
                    
                    // Update main text with truncate (responsive)
                    const visibleText = imageUploadTextMulti && !imageUploadTextMulti.classList.contains('hidden') ? imageUploadTextMulti : imageUploadText;
                    if (visibleText) {
                        visibleText.innerHTML = `<i class="fas fa-check-circle mr-2"></i><span class="truncate inline-block max-w-[150px] sm:max-w-[250px] md:max-w-[350px] align-bottom">${this.files.length} files selected</span>`;
                        visibleText.classList.remove('text-gray-500');
                        visibleText.classList.add('text-green-400', 'font-semibold');
                    }
                    
                } else {
                    // ✅ Single file mode - show filename with truncate (responsive)
                    const fileName = this.files[0].name;
                    const textEl = imageUploadText || imageUploadDiv.querySelector('p');
                    if (textEl) {
                        // Add truncate for long filenames - responsive width
                        textEl.innerHTML = '<i class="fas fa-check-circle mr-2"></i><span class="truncate inline-block max-w-[150px] sm:max-w-[250px] md:max-w-[350px] align-bottom">' + fileName + '</span>';
                        textEl.classList.remove('text-gray-500', 'group-hover:text-gray-300');
                        textEl.classList.add('text-green-400', 'font-semibold');
                    }
                    // Hide files list if visible
                    if (imageFilesList) {
                        imageFilesList.classList.add('hidden');
                    }
                }
                
                // Update border to green
                imageUploadDiv.classList.add('border-green-500/50');
            }
        });
    }

    // Video Start Frame Upload
    const videoStartDiv = document.getElementById('video-start-frame-dropzone');
    const videoStartInput = document.getElementById('video-start-frame');
    
    if (videoStartDiv && videoStartInput) {
        videoStartDiv.addEventListener('click', () => videoStartInput.click());
        videoStartInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                const textEl = videoStartDiv.querySelector('p');
                if (textEl) {
                    // ✅ Show filename with green color + checkmark icon + truncate (responsive)
                    textEl.innerHTML = '<i class="fas fa-check-circle mr-2"></i><span class="truncate inline-block max-w-[150px] sm:max-w-[250px] md:max-w-[350px] align-bottom">' + fileName + '</span>';
                    textEl.classList.remove('text-gray-500', 'group-hover:text-blue-400');
                    textEl.classList.add('text-green-400', 'font-semibold');
                }
                // Also update border to green
                videoStartDiv.classList.add('border-green-500/50');
            }
        });
    }

    // Video End Frame Upload
    const videoEndDiv = document.getElementById('video-end-frame-dropzone');
    const videoEndInput = document.getElementById('video-end-frame');
    
    if (videoEndDiv && videoEndInput) {
        videoEndDiv.addEventListener('click', () => videoEndInput.click());
        videoEndInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                const textEl = videoEndDiv.querySelector('p');
                if (textEl) {
                    // ✅ Show filename with green color + checkmark icon + truncate (responsive)
                    textEl.innerHTML = '<i class="fas fa-check-circle mr-2"></i><span class="truncate inline-block max-w-[150px] sm:max-w-[250px] md:max-w-[350px] align-bottom">' + fileName + '</span>';
                    textEl.classList.remove('text-gray-500', 'group-hover:text-blue-400');
                    textEl.classList.add('text-green-400', 'font-semibold');
                }
                // Also update border to green
                videoEndDiv.classList.add('border-green-500/50');
            }
        });
    }

    // ✅ Type change listeners removed - pricing handled by dashboard-generation.js
    // No need to listen for type changes here since pricing is calculated
    // automatically when model is selected in dashboard-generation.js
    
    // Restore state from localStorage on page load
    // ✅ IMPORTANT: Wait for DOM elements to be ready before restoring
    function tryRestoreState() {
        
        // ✅ Check if critical elements exist
        const tabs = document.querySelectorAll('.creation-tab');
        const modes = document.querySelectorAll('.creation-mode');
        
        if (tabs.length === 0 || modes.length === 0) {
            console.warn('⚠️ Critical elements not ready yet (tabs:', tabs.length, 'modes:', modes.length, ')');
            return false; // Signal: not ready yet
        }
        
        restoreState();
        
        // ✅ Signal that state restoration is complete
        window.dashboardStateRestored = true;
        window.dispatchEvent(new Event('dashboard-restored'));
        return true; // Signal: success
    }
    
    // ✅ Retry mechanism: Try to restore with exponential backoff
    let retryCount = 0;
    const maxRetries = 10;
    
    function attemptRestore() {
        const success = tryRestoreState();
        
        if (!success && retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(50 * retryCount, 200); // 50ms, 100ms, 150ms, 200ms max
            setTimeout(attemptRestore, delay);
        } else if (!success) {
            console.error('❌ Max retries reached! State restoration failed.');
        }
    }
    
    // Start attempting restoration after minimal delay
    setTimeout(attemptRestore, 10);
    
    // ✅ Initial pricing calculation is handled by dashboard-generation.js
    // after models are loaded from database

    // ✅ Generate button implementation is in dashboard-generation.js
    // (Removed mock implementation - using real API integration)
});

