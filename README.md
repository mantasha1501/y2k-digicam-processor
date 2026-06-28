# 📷 DIGICAM.EXE // Y2K CCD Sensor Emulation Lab

A lightweight, mobile-first web app that emulates early 2000s digicam hardware filters, sensor pixelation artifacts, and vintage digital camera looks using pure HTML5 Canvas byte manipulation.

### 🔗 [Live Demo Link] https://mantasha1501.github.io/y2k-digicam-processor/

---

## ✨ Features
* **Mobile-First App UI:** Built strictly for smartphone viewports first, expanding safely into an app dashboard layout on desktop screens. No desktop mode switching required.
* **Canvas Processing Pipeline:** Manipulates raw image arrays via custom arithmetic filters rather than basic CSS styling overlays.
* **Smart Image Downscaling:** Automatically handles and compresses high-resolution smartphone uploads in the background to prevent lower-memory mobile browser engines from crashing.
* **Interactive Filter Toggles:** Toggle multiple filters dynamically on a single frame buffer without wiping your baseline slider states.
* **Camera Roll Export:** Encodes live canvas frames into high-quality client-side `image/jpeg` streams for native file downloads.

---

## 🛠️ How It Works

Unlike web applications that use simple CSS style overlays, this engine processes data directly at the pixel level using the HTML5 Canvas 2D Context API:

1. **Asset Ingestion & Safety Resize:** Incoming images via the File Reader API are checked against size thresholds. Large megapixel phone images are safely downsampled onto an offscreen canvas.
2. **Matrix Rescaling (Pixelation):** Pixelation is achieved by shrinking the canvas buffer coordinates down to a fraction of their size (`width / pixelSize`) with image smoothing explicitly disabled (`imageSmoothingEnabled = false`), then stretching it back up to force retro pixel grid interpolation.
3. **Byte Stream Processing:** The engine loops through the raw `RGBA` pixel arrays to calculate custom color weights, color noise offsets, and channel limits mathematically in real time.

---

## 📸 Core Filter Implementations
* **⚡ FLASH BLEACH:** Multiplies absolute primary colors to emulate overexposed vintage camera flash tubes.
* **🟢 CYBER NIGHT:** Computes accurate pixel luminance values and remaps them exclusively across boosted green channels to replicate retro night-vision sensors.
* **👾 BIT-CRUSH:** Segments color values into low-fidelity byte chunks to recreate older flash storage read-write constraints.
* **🎞️ VINTAGE CHROME:** Artificially warms red matrix channels while drawing down cool blue saturation to capture aging color profiles.

---

## 📂 Project Architecture

```text
├── index.html      # Mobile-first semantic layout structure & web application controls
├── style.css       # Neo-Brutalist design tokens, custom sliders, and responsive breakpoints
└── script.js       # Core image processing, phone asset downscaling, and canvas render pipelines
