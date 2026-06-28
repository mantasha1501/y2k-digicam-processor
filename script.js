const coreCanvasElement = document.getElementById('mainProcessorCanvas');
const canvasRendering2DContext = coreCanvasElement.getContext('2d');
let cachingSourceImageObject = null;

let activeFilters = {
    flashBleach: false,
    cyberNight: false,
    bitCrush: false,
    vintageChrome: false
};

let photoboothFrames = [];
let photoboothModeActive = false;

function loadSourceImageIntoCanvas() {
    const fileSelectorInput = document.getElementById('imageUpload').files[0];
    if (!fileSelectorInput) return;

    const pipelineFileReader = new FileReader();
    pipelineFileReader.onload = function(eventResult) {
        const tempImg = new Image();
        tempImg.onload = function() {
            if (photoboothModeActive) {
                if (photoboothFrames.length < 4) {
                    photoboothFrames.push(tempImg);
                    compilePhotoboothStrip();
                }
            } else {
                cachingSourceImageObject = tempImg;
                coreCanvasElement.width = cachingSourceImageObject.width;
                coreCanvasElement.height = cachingSourceImageObject.height;
                canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0);
                document.getElementById('resolutionDisplay').innerText = `RAW: ${cachingSourceImageObject.width}x${cachingSourceImageObject.height}`;
                document.getElementById('fallbackText').style.display = 'none';
                resetAllFilterToggles();
                clearInterfaceSlidersToZero();
            }
            // Show save option whenever canvas holds image registers
            document.getElementById('downloadBtn').style.display = 'block';
        };
        tempImg.src = eventResult.target.result;
    };
    pipelineFileReader.readAsDataURL(fileSelectorInput);
}

function clearInterfaceSlidersToZero() {
    document.getElementById('pixelateSlider').value = 1;
    document.getElementById('noiseSlider').value = 0;
    document.getElementById('chromaSlider').value = 0;
    document.getElementById('pixelVal').innerText = "1px";
    document.getElementById('noiseVal').innerText = "0%";
    document.getElementById('chromaVal').innerText = "0%";
}

function resetAllFilterToggles() {
    activeFilters = { flashBleach: false, cyberNight: false, bitCrush: false, vintageChrome: false };
    const buttons = document.querySelectorAll('.macro-btn:not(.photobooth-init-btn)');
    buttons.forEach(btn => {
        btn.style.border = "3px solid #000000";
        btn.style.boxShadow = "2px 2px 0px #000000";
    });
}

function resetSourceImageToBaseline() {
    // Completely clears all settings and cached variables
    photoboothModeActive = false;
    photoboothFrames = [];
    cachingSourceImageObject = null;
    resetAllFilterToggles();
    clearInterfaceSlidersToZero();
    
    document.getElementById('boothToggleBtn').innerText = "🎞️ ACTIVATE PHOTOBOOTH MODE";
    document.getElementById('boothToggleBtn').style.background = "var(--brutal-gray)";
    document.getElementById('resolutionDisplay').innerText = "NO_SIGNAL";
    document.getElementById('fallbackText').style.display = 'flex';
    document.getElementById('fallbackText').innerText = "[!] INSERT MEDIA CARD";
    document.getElementById('downloadBtn').style.display = 'none';
    
    canvasRendering2DContext.clearRect(0, 0, coreCanvasElement.width, coreCanvasElement.height);
}

// TOGGLE LOGIC SWITCH FOR MODE SELECTIONS
function togglePhotoboothMode() {
    if (photoboothModeActive) {
        // EXIT MODE: Turn off photobooth operations and reset everything back to baseline
        resetSourceImageToBaseline();
    } else {
        // ENTER MODE: Turn on photobooth strip configuration parameters
        photoboothModeActive = true;
        photoboothFrames = [];
        resetAllFilterToggles();
        clearInterfaceSlidersToZero();
        
        document.getElementById('boothToggleBtn').innerText = "❌ EXIT PHOTOBOOTH MODE";
        document.getElementById('boothToggleBtn').style.background = "#F87171"; // Red alarm color
        
        coreCanvasElement.width = 400;
        coreCanvasElement.height = 1450;
        document.getElementById('resolutionDisplay').innerText = "MODE: PHOTOBOOTH STRIP";
        document.getElementById('fallbackText').style.display = 'none';
        document.getElementById('downloadBtn').style.display = 'block';
        
        renderBasePhotoboothLayout();
    }
}

function toggleFilter(filterName, buttonElement) {
    if (!cachingSourceImageObject && !photoboothModeActive) return;
    activeFilters[filterName] = !activeFilters[filterName];
    
    if (activeFilters[filterName]) {
        buttonElement.style.border = "3px dashed #FFFFFF";
        buttonElement.style.boxShadow = "none";
    } else {
        buttonElement.style.border = "3px solid #000000";
        buttonElement.style.boxShadow = "2px 2px 0px #000000";
    }
    
    if (photoboothModeActive) {
        compilePhotoboothStrip();
    } else {
        applyDigicamTransforms();
    }
}

// MAIN TRANSFORMS SENSOR FILTER STACKS
function applyDigicamTransforms() {
    if (!cachingSourceImageObject && !photoboothModeActive) return;

    const pixelSize = parseInt(document.getElementById('pixelateSlider').value);
    const noiseLevel = parseInt(document.getElementById('noiseSlider').value);
    const chromaStain = parseInt(document.getElementById('chromaSlider').value);

    document.getElementById('pixelVal').innerText = `${pixelSize}px`;
    document.getElementById('noiseVal').innerText = `${noiseLevel}%`;
    document.getElementById('chromaVal').innerText = `${chromaStain}%`;

    const w = coreCanvasElement.width;
    const h = coreCanvasElement.height;

    if (pixelSize > 1) {
        const smallW = Math.max(1, Math.floor(w / pixelSize));
        const smallH = Math.max(1, Math.floor(h / pixelSize));
        canvasRendering2DContext.imageSmoothingEnabled = false;
        
        if (photoboothModeActive) { renderBasePhotoboothLayout(); } 
        else { canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0, w, h); }
        
        canvasRendering2DContext.drawImage(coreCanvasElement, 0, 0, w, h, 0, 0, smallW, smallH);
        canvasRendering2DContext.drawImage(coreCanvasElement, 0, 0, smallW, smallH, 0, 0, w, h);
    } else {
        if (photoboothModeActive) { renderBasePhotoboothLayout(); } 
        else { canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0); }
    }

    const frameData = canvasRendering2DContext.getImageData(0, 0, w, h);
    const pixels = frameData.data;

    for (let i = 0; i < pixels.length; i += 4) {
        if (noiseLevel > 0) {
            const noiseFactor = (Math.random() - 0.5) * noiseLevel * 1.8;
            pixels[i] = Math.min(255, Math.max(0, pixels[i] + noiseFactor));
            pixels[i+1] = Math.min(255, Math.max(0, pixels[i+1] + noiseFactor));
            pixels[i+2] = Math.min(255, Math.max(0, pixels[i+2] + noiseFactor));
        }

        if (chromaStain > 0) {
            pixels[i] = Math.min(255, pixels[i] + (chromaStain * 0.4));
            pixels[i+2] = Math.max(0, pixels[i+2] - (chromaStain * 0.2));
        }

        if (activeFilters.flashBleach) {
            pixels[i] = Math.min(255, pixels[i] * 1.35 + 15);
            pixels[i+1] = Math.min(255, pixels[i+1] * 1.25 + 10);
            pixels[i+2] = Math.min(255, pixels[i+2] * 1.15);
        }
        
        if (activeFilters.cyberNight) {
            const luminance = 0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2];
            pixels[i] = luminance * 0.15; pixels[i+1] = luminance * 1.55; pixels[i+2] = luminance * 0.2;
        }

        if (activeFilters.bitCrush) {
            pixels[i] = Math.floor(pixels[i] / 64) * 64;
            pixels[i+1] = Math.floor(pixels[i+1] / 64) * 64;
            pixels[i+2] = Math.floor(pixels[i+2] / 64) * 64;
        }

        if (activeFilters.vintageChrome) {
            pixels[i] = Math.min(255, pixels[i] * 1.4 - 25);
            pixels[i+1] = Math.min(255, pixels[i+1] * 1.15 - 5);
            pixels[i+2] = Math.min(255, pixels[i+2] * 0.85);
        }
    }
    canvasRendering2DContext.putImageData(frameData, 0, 0);
}

// REAL FILM PHOTOBOOTH STRIP RENDERING MATRICES
function renderBasePhotoboothLayout() {
    canvasRendering2DContext.fillStyle = "#FFFFFF";
    canvasRendering2DContext.fillRect(0, 0, coreCanvasElement.width, coreCanvasElement.height);

    const frameWidth = 340;
    const frameHeight = 310;
    const leftMargin = 30;
    const topStartMargin = 35;
    const verticalGap = 18;

    for (let index = 0; index < 4; index++) {
        const currentYCoordinate = topStartMargin + index * (frameHeight + verticalGap);
        
        if (photoboothFrames[index]) {
            canvasRendering2DContext.drawImage(photoboothFrames[index], leftMargin, currentYCoordinate, frameWidth, frameHeight);
        } else {
            canvasRendering2DContext.fillStyle = "#1A1A1A";
            canvasRendering2DContext.fillRect(leftMargin, currentYCoordinate, frameWidth, frameHeight);
            canvasRendering2DContext.fillStyle = "#666666";
            canvasRendering2DContext.font = "bold 10px Space Mono";
            canvasRendering2DContext.textAlign = "center";
            canvasRendering2DContext.fillText(`[ CAM_ROLL_FRAME_0${index + 1} ]`, coreCanvasElement.width / 2, currentYCoordinate + (frameHeight / 2));
        }
    }
}

function compilePhotoboothStrip() {
    renderBasePhotoboothLayout();
    applyDigicamTransforms(); 
}

// CLIENT FILE EXPORT PIPELINES
function downloadEditedAsset() {
    // Grabs active data URLs direct from canvas rendering layers
    const imageSourceDataURL = coreCanvasElement.toDataURL("image/jpeg", 0.95);
    
    // Instantiates temporary virtual anchor links to trigger native system device file saving layers
    const clientDownloadTriggerAnchor = document.createElement('a');
    clientDownloadTriggerAnchor.href = imageSourceDataURL;
    
    // Generates unique timestamp tags for file names
    const fileTimestamp = Math.floor(Date.now() / 1000);
    clientDownloadTriggerAnchor.download = `DIGICAM_${fileTimestamp}.jpg`;
    
    // Fire event click routines to pass items directly to the mobile device download queue
    document.body.appendChild(clientDownloadTriggerAnchor);
    clientDownloadTriggerAnchor.click();
    document.body.removeChild(clientDownloadTriggerAnchor);
}