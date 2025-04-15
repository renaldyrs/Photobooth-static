
        // Global variables
        let stream = null;
        let selectedFrameColor = '#ff6b6b';
        let countdownInterval = null;
        let currentPhotoIndex = 0;
        let capturedPhotos = [];
        let selectedLayout = 'single';
        let layoutConfig = {
            'single': { cols: 1, rows: 1, photosNeeded: 1 },
            'vertical': { cols: 1, rows: 2, photosNeeded: 2 },
            'horizontal': { cols: 2, rows: 1, photosNeeded: 2 },
            'grid': { cols: 2, rows: 2, photosNeeded: 4 }
        };
        
        // Simple screen navigation
        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById(screenId).classList.add('active');
            
            // Update layout preview when showing layout selection
            if (screenId === 'screen3-layout') {
                updateLayoutPreview();
            }
        }
        
        // Select layout type
        function selectLayout(element, layoutType) {
            document.querySelectorAll('.layout-option').forEach(option => {
                option.classList.remove('selected');
            });
            element.classList.add('selected');
            selectedLayout = layoutType;
            updateLayoutPreview();
        }
        
        // Update the layout preview
        function updateLayoutPreview() {
            const preview = document.getElementById('layoutPreview');
            preview.innerHTML = '';
            
            const config = layoutConfig[selectedLayout];
            preview.style.height = `${config.rows * 50}px`;
            
            for (let i = 0; i < config.rows; i++) {
                for (let j = 0; j < config.cols; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'layout-preview-cell';
                    cell.style.width = `${100/config.cols}%`;
                    cell.style.height = `${100/config.rows}%`;
                    cell.textContent = `Photo ${i * config.cols + j + 1}`;
                    preview.appendChild(cell);
                }
            }
        }
        
        // Initialize camera
        async function initCamera() {
            try {
                showScreen('screen4-camera');
                document.getElementById('cameraView').style.display = 'block';
                
                // Reset photo capture state
                currentPhotoIndex = 0;
                capturedPhotos = [];
                
                // Access the camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user', // Use 'environment' for rear camera
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                
                const cameraView = document.getElementById('cameraView');
                cameraView.srcObject = stream;
                
                // Start countdown for first photo
                startCountdown();
                
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Could not access the camera. Please make sure you've granted camera permissions.");
                showScreen('screen2');
            }
        }
        
        // Start countdown for photo capture
        function startCountdown() {
            let seconds = 3;
            const countdownElement = document.getElementById('countdown');
            countdownElement.style.display = 'block';
            countdownElement.textContent = `Photo ${currentPhotoIndex + 1} in ${seconds}...`;
            
            countdownInterval = setInterval(() => {
                seconds--;
                countdownElement.textContent = `Photo ${currentPhotoIndex + 1} in ${seconds}...`;
                
                if (seconds <= 0) {
                    clearInterval(countdownInterval);
                    countdownElement.style.display = 'none';
                    capturePhoto();
                }
            }, 1000);
        }
        
        // Capture photo from camera
        function capturePhoto() {
            // Trigger flash effect
            const flash = document.getElementById('flash');
            flash.classList.add('flash-animation');
            
            setTimeout(() => {
                flash.classList.remove('flash-animation');
                
                const cameraView = document.getElementById('cameraView');
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Set canvas dimensions to match video
                canvas.width = cameraView.videoWidth;
                canvas.height = cameraView.videoHeight;
                
                // Draw video frame to canvas
                context.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
                
                // Save the captured photo
                capturedPhotos.push(canvas.toDataURL('image/png'));
                currentPhotoIndex++;
                
                // Check if we need more photos
                const photosNeeded = layoutConfig[selectedLayout].photosNeeded;
                if (currentPhotoIndex < photosNeeded) {
                    startCountdown();
                } else {
                    // All photos captured, show preview
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                    createFinalLayout();
                    showScreen('screen5-preview');
                }
            }, 100);
        }
        
        // Create the final layout with all photos
        function createFinalLayout() {
            const finalLayout = document.getElementById('finalLayout');
            finalLayout.innerHTML = '';
            finalLayout.style.display = 'block';
            
            const config = layoutConfig[selectedLayout];
            finalLayout.style.width = '100%';
            finalLayout.style.aspectRatio = `${config.cols}/${config.rows}`;
            finalLayout.style.display = 'flex';
            finalLayout.style.flexWrap = 'wrap';
            finalLayout.style.border = `10px solid ${selectedFrameColor}`;
            finalLayout.style.borderRadius = '10px';
            finalLayout.style.overflow = 'hidden';
            
            for (let i = 0; i < capturedPhotos.length; i++) {
                const img = document.createElement('img');
                img.src = capturedPhotos[i];
                img.style.width = `${100/config.cols}%`;
                img.style.height = `${100/config.rows}%`;
                img.style.objectFit = 'cover';
                finalLayout.appendChild(img);
            }
        }
        
        // Frame selection
        function selectFrame(element, color) {
            document.querySelectorAll('.frame-option').forEach(option => {
                option.classList.remove('selected');
            });
            element.classList.add('selected');
            selectedFrameColor = color;
            document.getElementById('finalLayout').style.border = `10px solid ${color}`;
        }
        
        // Retake photo
        function retakePhoto() {
            showScreen('screen3-layout');
            document.getElementById('finalLayout').style.display = 'none';
        }
        
        // Download photo
        function downloadPhoto() {
            const finalLayout = document.getElementById('finalLayout');
            
            // Create a canvas to render the final layout
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Set canvas dimensions
            canvas.width = finalLayout.offsetWidth;
            canvas.height = finalLayout.offsetHeight;
            
            // Draw border background
            context.fillStyle = selectedFrameColor;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Calculate content area (inside border)
            const borderWidth = 10;
            const contentWidth = canvas.width - (borderWidth * 2);
            const contentHeight = canvas.height - (borderWidth * 2);
            
            // Draw white background for content
            context.fillStyle = 'white';
            context.fillRect(borderWidth, borderWidth, contentWidth, contentHeight);
            
            // Draw each photo in the layout
            const config = layoutConfig[selectedLayout];
            const cellWidth = contentWidth / config.cols;
            const cellHeight = contentHeight / config.rows;
            
            for (let i = 0; i < capturedPhotos.length; i++) {
                const img = new Image();
                img.src = capturedPhotos[i];
                
                const col = i % config.cols;
                const row = Math.floor(i / config.cols);
                
                const x = borderWidth + (col * cellWidth);
                const y = borderWidth + (row * cellHeight);
                
                // Draw image in the correct position
                context.drawImage(img, x, y, cellWidth, cellHeight);
            }
            
            // Convert to download
            const link = document.createElement('a');
            link.download = 'cekrek-photo.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        // Clean up when leaving the page
        window.addEventListener('beforeunload', () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
        });