const coreCanvasElement = document.getElementById('mainProcessorCanvas');
const canvasRendering2DContext = coreCanvasElement.getContext('2d');
let cachingSourceImageObject = null;

let activeFilters = {
    flashBleach: false,
    cyberNight: false,
    bitCrush: false,
    vintageChrome: false
};

function loadSourceImageIntoCanvas() {
    const fileSelectorInput = document.getElementById('imageUpload').files[0];
    if (!fileSelectorInput) return;

    const pipelineFileReader = new FileReader();
    pipelineFileReader.onload = function(eventResult) {
        const tempImg = new Image();
        tempImg.onload = function() {
            // SAFE SMART-DOWNSCALING FOR HIGH-RES PHONE IMAGES
            // Prevents high-megapixel photos from crashing lower-memory phone browser engines
            const MAX_ALLOWED_DIMENSION = 1200;
            let targetWidth = tempImg.width;
            let targetHeight = tempImg.height;

            if (targetWidth > MAX_ALLOWED_DIMENSION || targetHeight > MAX_ALLOWED_DIMENSION) {
                if (targetWidth > targetHeight) {
                    targetHeight = Math.round((targetHeight * MAX_ALLOWED_DIMENSION) / targetWidth);
                    targetWidth = MAX_ALLOWED_DIMENSION;
                } else {
                    targetWidth = Math.round((targetWidth * MAX_ALLOWED_DIMENSION) / targetHeight);
                    targetHeight = MAX_ALLOWED_DIMENSION;
                }
            }

            // Create a secondary background staging canvas to cleanly downsample the image scale
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = targetWidth;
            offscreenCanvas.height = targetHeight;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            offscreenCtx.drawImage(tempImg, 0, 0, targetWidth, targetHeight);

            // Re-cache the streamlined asset down to native size boundaries
            const optimizedImg = new Image();
            optimizedImg.onload = function() {
                cachingSourceImageObject = optimizedImg;
                coreCanvasElement.width = cachingSourceImageObject.width;
                coreCanvasElement.height = cachingSourceImageObject.height;
                canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0);
                
                document.getElementById('resolutionDisplay').innerText = `RAW: ${cachingSourceImageObject.width}x${cachingSourceImageObject.height}`;
                document.getElementById('fallbackText').style.display = 'none';
                document.getElementById('downloadBtn').style.display = 'block';
                
                resetAllFilterToggles();
                clearInterfaceSlidersToZero();
            };
            optimizedImg.src = offscreenCanvas.toDataURL('image/jpeg', 0.85);
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
    const buttons = document.querySelectorAll('.macro-btn');
    buttons.forEach(btn => {
        btn.style.border = "3px solid #000000";
        btn.style.boxShadow = "2px 2px 0px #000000";
    });
}

function resetSourceImageToBaseline() {
    cachingSourceImageObject = null;
    resetAllFilterToggles();
    clearInterfaceSlidersToZero();
    
    document.getElementById('resolutionDisplay').innerText = "NO_SIGNAL";
    document.getElementById('fallbackText').style.display = 'flex';
    document.getElementById('fallbackText').innerText = "[!] INSERT MEDIA CARD";
    document.getElementById('downloadBtn').style.display = 'none';
    
    canvasRendering2DContext.clearRect(0, 0, coreCanvasElement.width, coreCanvasElement.height);
}

function toggleFilter(filterName, buttonElement) {
    if (!cachingSourceImageObject) return;
    activeFilters[filterName] = !activeFilters[filterName];
    
    if (activeFilters[filterName]) {
        buttonElement.style.border = "3px dashed #FFFFFF";
        buttonElement.style.boxShadow = "none";
    } else {
        buttonElement.style.border = "3px solid #000000";
        buttonElement.style.boxShadow = "2px 2px 0px #000000";
    }
    
    applyDigicamTransforms();
}

function applyDigicamTransforms() {
    if (!cachingSourceImageObject) return;

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
        
        canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0, w, h);
        canvasRendering2DContext.drawImage(coreCanvasElement, 0, 0, w, h, 0, 0, smallW, smallH);
        canvasRendering2DContext.drawImage(coreCanvasElement, 0, 0, smallW, smallH, 0, 0, w, h);
    } else {
        canvasRendering2DContext.drawImage(cachingSourceImageObject, 0, 0);
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

function downloadEditedAsset() {
    const imageSourceDataURL = coreCanvasElement.toDataURL("image/jpeg", 0.95);
    const clientDownloadTriggerAnchor = document.createElement('a');
    clientDownloadTriggerAnchor.href = imageSourceDataURL;
    const fileTimestamp = Math.floor(Date.now() / 1000);
    clientDownloadTriggerAnchor.download = `DIGICAM_${fileTimestamp}.jpg`;
    document.body.appendChild(clientDownloadTriggerAnchor);
    clientDownloadTriggerAnchor.click();
    document.body.removeChild(clientDownloadTriggerAnchor);
}
