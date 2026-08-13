// Import MediaPipe from CDN
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs";

// List of supported gestures in the dictionary
const GESTURES = [
  { name: "Hello", emoji: "🖐️", pattern: "[1, 1, 1, 1, 1]", desc: "Open palm facing camera. Standard greeting or stop sign." },
  { name: "Yes", emoji: "👍", pattern: "[1, 0, 0, 0, 0]", desc: "Thumbs up. Thumb points up, other fingers curled. Agreement." },
  { name: "No", emoji: "✊", pattern: "[0, 0, 0, 0, 0]", desc: "Closed fist. All fingers curled. Negation or stop." },
  { name: "I Love You", emoji: "🤟", pattern: "[1, 1, 0, 0, 1]", desc: "Thumb, index, and pinky extended. ASL phrase sign." },
  { name: "Victory", emoji: "✌️", pattern: "[0, 1, 1, 0, 0]", desc: "Index and middle fingers extended. Peace or number 2." },
  { name: "OK", emoji: "👌", pattern: "Pinch [4 & 8]", desc: "Thumb and index tips touching, others extended. Approval." },
  { name: "L Sign", emoji: "👉", pattern: "[1, 1, 0, 0, 0]", desc: "Thumb and index extended forming an L-shape. Letter L." },
  { name: "Y Sign", emoji: "🤙", pattern: "[1, 0, 0, 0, 1]", desc: "Thumb and pinky extended. Letter Y or phone gesture." },
  { name: "Point / One", emoji: "☝️", pattern: "[0, 1, 0, 0, 0]", desc: "Index finger pointing straight up. Number 1." },
  { name: "Rock On", emoji: "🤘", pattern: "[0, 1, 0, 0, 1]", desc: "Index and pinky fingers extended. Rock / metal sign." },
  { name: "Three", emoji: "🤟", pattern: "[1, 1, 1, 0, 0]", desc: "Thumb, index, and middle extended. Number 3." }
];

// Connection indices for hand drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]             // Knuckles
];

// App state variables
let handLandmarker = null;
let webcamStream = null;
let isModelLoaded = false;
let isTrackingActive = false;
let lastVideoTime = -1;
let animationFrameId = null;

// Stability state
let lastDetectedGesture = "Unknown";
let stableCounter = 0;
const STABILITY_THRESHOLD = 30; // Frames required to confirm a sign (~1s)
let lastTypedGesture = "";
let gestureHistory = [];
const HISTORY_LIMIT = 8; // smooth over last 8 frames (~250ms at 30fps)

// DOM Elements
const webcam = document.getElementById("webcam");
const canvas = document.getElementById("output-canvas");
const ctx = canvas.getContext("2d");

const cameraBtn = document.getElementById("camera-btn");
const statusBadge = document.getElementById("status-badge");
const themeToggle = document.getElementById("theme-toggle");

const cameraPlaceholder = document.getElementById("camera-placeholder");
const cameraError = document.getElementById("camera-error");

const detectedGestureEl = document.getElementById("detected-gesture");
const detectedIconEl = document.getElementById("detected-icon");
const stabilityFill = document.getElementById("stability-fill");
const stabilityPercent = document.getElementById("stability-percent");

const sentenceOutput = document.getElementById("sentence-output");
const dictGrid = document.getElementById("dictionary-grid");
const dictSearch = document.getElementById("dict-search");

// Control buttons
const btnSpace = document.getElementById("btn-space");
const btnBackspace = document.getElementById("btn-backspace");
const btnClear = document.getElementById("btn-clear");
const btnSpeak = document.getElementById("btn-speak");
const btnCopy = document.getElementById("btn-copy");

// Debug elements
const debugCoords = document.getElementById("debug-coords");
const debugPattern = document.getElementById("debug-pattern");
const debugPinch = document.getElementById("debug-pinch");
const debugFps = document.getElementById("debug-fps");
let frameCount = 0;

// Initialize Application
async function init() {
  renderDictionary(GESTURES);
  setupEventListeners();
  
  try {
    updateStatus("loading", "Loading AI Model...");
    
    // Create FileResolver for Vision tasks
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    // Instantiate HandLandmarker
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    
    isModelLoaded = true;
    updateStatus("ready", "Model Ready");
    
    // Hide startup screen and show start-webcam permission prompt
    cameraPlaceholder.classList.remove("active");
    cameraBtn.removeAttribute("disabled");
    
    // Attempt automatic webcam startup
    startWebcam();
  } catch (error) {
    console.error("Initialization error:", error);
    updateStatus("error", "Error Loading Model");
    showSplash(cameraError);
  }
}

// Set up UI Event listeners
function setupEventListeners() {
  cameraBtn.addEventListener("click", toggleWebcam);
  
  // Sentence controls
  btnSpace.addEventListener("click", () => appendToSentence(" "));
  btnBackspace.addEventListener("click", () => {
    let current = sentenceOutput.textContent;
    if (current.endsWith(" ")) {
      sentenceOutput.textContent = current.slice(0, -1);
    } else {
      // For words, delete the last word or character
      const words = current.trim().split(" ");
      words.pop();
      sentenceOutput.textContent = words.join(" ") + (words.length > 0 ? " " : "");
    }
    triggerButtonAnimation(btnBackspace);
  });
  
  btnClear.addEventListener("click", () => {
    sentenceOutput.textContent = "";
    lastTypedGesture = "";
    triggerButtonAnimation(btnClear);
  });
  
  btnSpeak.addEventListener("click", () => {
    const text = sentenceOutput.textContent.trim();
    if (text) {
      speakText(text);
    } else {
      speakText("Sentence is empty");
    }
    triggerButtonAnimation(btnSpeak);
  });
  
  btnCopy.addEventListener("click", () => {
    const text = sentenceOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btnCopy.innerHTML;
      btnCopy.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
      setTimeout(() => {
        btnCopy.innerHTML = originalText;
      }, 2000);
    });
  });

  // Dictionary Search
  dictSearch.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = GESTURES.filter(g => 
      g.name.toLowerCase().includes(query) || 
      g.desc.toLowerCase().includes(query)
    );
    renderDictionary(filtered);
  });

  // Dark/Light Theme toggle
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeToggle.innerHTML = isLight ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
  });
}

// Helper to update status indicator
function updateStatus(state, message) {
  statusBadge.className = `status-badge status-${state}`;
  statusBadge.querySelector(".status-text").textContent = message;
}

// Show specific splash screen
function showSplash(splashElement) {
  cameraPlaceholder.classList.remove("active");
  cameraError.classList.remove("active");
  if (splashElement) splashElement.classList.add("active");
}

// Helper to trigger active state animation on control buttons
function triggerButtonAnimation(btn) {
  btn.style.transform = "scale(0.95)";
  setTimeout(() => {
    btn.style.transform = "";
  }, 100);
}

// Build list cards in Dictionary
function renderDictionary(data) {
  dictGrid.innerHTML = "";
  if (data.length === 0) {
    dictGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No matching signs found.</div>`;
    return;
  }
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "dict-card";
    card.id = `dict-card-${item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    card.innerHTML = `
      <div class="dict-icon">${item.emoji}</div>
      <div class="dict-name">${item.name}</div>
      <div class="dict-desc">${item.desc}</div>
    `;
    card.addEventListener("click", () => {
      // Simulate/trigger description reading
      speakText(`${item.name} sign. ${item.desc}`);
    });
    dictGrid.appendChild(card);
  });
}

// Webcam start/stop orchestration
async function startWebcam() {
  if (!isModelLoaded) return;
  
  try {
    cameraPlaceholder.classList.remove("active");
    cameraError.classList.remove("active");
    
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      },
      audio: false
    });
    
    webcam.srcObject = webcamStream;
    webcam.addEventListener("loadedmetadata", () => {
      isTrackingActive = true;
      cameraBtn.innerHTML = `<i class="fa-solid fa-camera-rotate"></i> Stop Webcam`;
      cameraBtn.classList.remove("secondary-btn");
      cameraBtn.classList.add("danger-btn");
      
      // Resize canvas to match video stream natural proportions
      canvas.width = webcam.videoWidth;
      canvas.height = webcam.videoHeight;
      
      // Start processing loops
      lastVideoTime = -1;
      animationFrameId = requestAnimationFrame(detectionLoop);
    });
  } catch (error) {
    console.error("Webcam access failed:", error);
    updateStatus("error", "Webcam Access Denied");
    showSplash(cameraError);
  }
}

function stopWebcam() {
  isTrackingActive = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  
  webcam.srcObject = null;
  cameraBtn.innerHTML = `<i class="fa-solid fa-video"></i> Start Webcam`;
  cameraBtn.classList.remove("danger-btn");
  cameraBtn.classList.add("secondary-btn");
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset tracking stats
  gestureHistory = [];
  detectedGestureEl.textContent = "Waiting...";
  detectedGestureEl.className = "gesture-text";
  detectedIconEl.innerHTML = `<i class="fa-solid fa-hands"></i>`;
  detectedIconEl.classList.remove("active");
  stabilityFill.style.width = "0%";
  stabilityPercent.textContent = "0%";
  
  // Clear dictionary highlight
  document.querySelectorAll(".dict-card").forEach(c => c.classList.remove("matched"));
}

function toggleWebcam() {
  if (isTrackingActive) {
    stopWebcam();
  } else {
    startWebcam();
  }
}

// MediaPipe frame processing loop
async function detectionLoop() {
  if (!isTrackingActive) return;
  
  if (webcam.currentTime !== lastVideoTime) {
    lastVideoTime = webcam.currentTime;
    frameCount++;
    
    // Run landmark detection
    const startTimeMs = performance.now();
    const results = handLandmarker.detectForVideo(webcam, startTimeMs);
    
    // Render loop and recognition logic
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // 1. Draw Hand Skeleton Overlay
      drawHand(landmarks);
      
      // 2. Classify Hand State
      const classification = classifyGesture(landmarks);
      
      // 3. Process Stability and Spill Text
      processGestureStability(classification.name, classification.emoji);
      
      // 4. Update Developer Diagnostics
      updateDiagnostics(landmarks, classification);
    } else {
      processGestureStability("Unknown", "❓");
      clearDiagnostics();
    }
  }
  
  animationFrameId = requestAnimationFrame(detectionLoop);
}

// Calculate Euclidean distance between two 3D landmarks, corrected for aspect ratio (converted to pixels)
function calculateDistance(pt1, pt2) {
  const w = canvas.width || 640;
  const h = canvas.height || 480;
  const dx = (pt1.x - pt2.x) * w;
  const dy = (pt1.y - pt2.y) * h;
  const dz = (pt1.z - pt2.z) * w; // MediaPipe's depth scale is relative to width
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Closest-gesture matching helper using Hamming distance with 1-bit tolerance
function findClosestGesture(thumbExt, indexExt, middleExt, ringExt, pinkyExt) {
  const currentPattern = [thumbExt ? 1 : 0, indexExt ? 1 : 0, middleExt ? 1 : 0, ringExt ? 1 : 0, pinkyExt ? 1 : 0];
  
  const gesturePatterns = {
    "Hello": [1, 1, 1, 1, 1],
    "No": [0, 0, 0, 0, 0],
    "Yes": [1, 0, 0, 0, 0],
    "I Love You": [1, 1, 0, 0, 1],
    "Victory": [0, 1, 1, 0, 0],
    "L Sign": [1, 1, 0, 0, 0],
    "Y Sign": [1, 0, 0, 0, 1],
    "Point / One": [0, 1, 0, 0, 0],
    "Rock On": [0, 1, 0, 0, 1],
    "Three": [1, 1, 1, 0, 0]
  };
  
  let bestMatches = [];
  let minDifference = 6;
  
  for (const [name, pattern] of Object.entries(gesturePatterns)) {
    let diff = 0;
    for (let i = 0; i < 5; i++) {
      if (currentPattern[i] !== pattern[i]) {
        diff++;
      }
    }
    if (diff < minDifference) {
      minDifference = diff;
      bestMatches = [name];
    } else if (diff === minDifference) {
      bestMatches.push(name);
    }
  }
  
  // Exact match (difference 0) is always returned
  if (minDifference === 0 && bestMatches.length === 1) {
    return bestMatches[0];
  }
  
  // If difference is 1 and it's unique, return it
  if (minDifference === 1 && bestMatches.length === 1) {
    return bestMatches[0];
  }
  
  return "Unknown";
}

// Heuristics Sign Classifier
function classifyGesture(lm) {
  const palmSize = calculateDistance(lm[0], lm[9]);
  
  // Helper to check standard finger extension based on straightness ratio
  const checkFingerExt = (mcp, pip, dip, tip) => {
    const direct = calculateDistance(lm[mcp], lm[tip]);
    const total = calculateDistance(lm[mcp], lm[pip]) + 
                  calculateDistance(lm[pip], lm[dip]) + 
                  calculateDistance(lm[dip], lm[tip]);
    return direct > total * 0.78;
  };
  
  const indexExt = checkFingerExt(5, 6, 7, 8);
  const middleExt = checkFingerExt(9, 10, 11, 12);
  const ringExt = checkFingerExt(13, 14, 15, 16);
  const pinkyExt = checkFingerExt(17, 18, 19, 20);
  
  // Thumb calculation: extended if it is far from both middle finger MCP and index finger MCP
  const thumbExt = calculateDistance(lm[4], lm[9]) > calculateDistance(lm[2], lm[9]) * 1.15 ||
                   calculateDistance(lm[4], lm[5]) > palmSize * 0.58;
  
  // Check index finger to thumb pinch (OK sign) - scale relative to palm size
  const pinchThumbIndex = calculateDistance(lm[4], lm[8]) < palmSize * 0.18;
  
  const binaryPattern = [thumbExt ? 1 : 0, indexExt ? 1 : 0, middleExt ? 1 : 0, ringExt ? 1 : 0, pinkyExt ? 1 : 0];
  
  let gestureName = "Unknown";
  let gestureEmoji = "❓";

  // Heuristic rule matching
  if (pinchThumbIndex && middleExt && ringExt && pinkyExt) {
    gestureName = "OK";
    gestureEmoji = "👌";
  } else {
    gestureName = findClosestGesture(thumbExt, indexExt, middleExt, ringExt, pinkyExt);
    
    const emojis = {
      "Hello": "🖐️",
      "No": "✊",
      "Yes": "👍",
      "I Love You": "🤟",
      "Victory": "✌️",
      "L Sign": "👉",
      "Y Sign": "🤙",
      "Point / One": "☝️",
      "Rock On": "🤘",
      "Three": "🤟",
      "Unknown": "❓"
    };
    
    gestureEmoji = emojis[gestureName] || "❓";
    
    // Check orientation for Yes (thumbs up) vs Dislike (thumbs down)
    if (gestureName === "Yes") {
      if (lm[4].y < lm[2].y) {
        gestureName = "Yes";
        gestureEmoji = "👍";
      } else {
        gestureName = "Dislike";
        gestureEmoji = "👎";
      }
    }
  }
  
  return {
    name: gestureName,
    emoji: gestureEmoji,
    pattern: binaryPattern,
    pinch: calculateDistance(lm[4], lm[8]),
    rawFingers: { thumbExt, indexExt, middleExt, ringExt, pinkyExt }
  };
}

// Process stability tracker and Sentence builder triggers
function processGestureStability(rawGestureName, rawGestureEmoji) {
  // Push raw gesture to history for smoothing
  gestureHistory.push({ name: rawGestureName, emoji: rawGestureEmoji });
  if (gestureHistory.length > HISTORY_LIMIT) {
    gestureHistory.shift();
  }
  
  // Majority voting to find the smoothed gesture
  const nameCounts = {};
  let maxCount = 0;
  let gestureName = "Unknown";
  let gestureEmoji = "❓";
  
  for (const item of gestureHistory) {
    nameCounts[item.name] = (nameCounts[item.name] || 0) + 1;
    if (nameCounts[item.name] > maxCount) {
      maxCount = nameCounts[item.name];
      gestureName = item.name;
      gestureEmoji = item.emoji;
    }
  }

  if (gestureName === "Unknown") {
    // Decline stability quickly if hands drop
    stableCounter = Math.max(0, stableCounter - 2);
    updateStabilityUI(0);
    detectedGestureEl.textContent = "Waiting...";
    detectedGestureEl.className = "gesture-text";
    detectedIconEl.innerHTML = `<i class="fa-solid fa-hands"></i>`;
    detectedIconEl.classList.remove("active");
    
    // Remove highlights from dict
    document.querySelectorAll(".dict-card").forEach(c => c.classList.remove("matched"));
    return;
  }
  
  // Highlight dictionary cards
  document.querySelectorAll(".dict-card").forEach(c => c.classList.remove("matched"));
  const cleanId = `dict-card-${gestureName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const card = document.getElementById(cleanId);
  if (card) {
    card.classList.add("matched");
  }
  
  if (gestureName === lastDetectedGesture) {
    stableCounter = Math.min(STABILITY_THRESHOLD, stableCounter + 1);
  } else {
    stableCounter = 0;
    lastDetectedGesture = gestureName;
  }
  
  const percentage = Math.round((stableCounter / STABILITY_THRESHOLD) * 100);
  updateStabilityUI(percentage);
  
  detectedGestureEl.textContent = gestureName;
  detectedGestureEl.classList.add("detected");
  setTimeout(() => detectedGestureEl.classList.remove("detected"), 250);
  detectedIconEl.textContent = gestureEmoji;
  detectedIconEl.classList.add("active");
  
  // Spell letter/word if held stable
  if (stableCounter === STABILITY_THRESHOLD) {
    if (gestureName !== lastTypedGesture) {
      appendGestureToSentence(gestureName);
      lastTypedGesture = gestureName;
    }
  }
}

// Append gesture outputs to Sentence Output container
function appendGestureToSentence(gestureName) {
  let textToAppend = "";
  
  switch(gestureName) {
    case "Hello":
      textToAppend = "Hello ";
      break;
    case "Yes":
      textToAppend = "Yes ";
      break;
    case "No":
      textToAppend = "No ";
      break;
    case "I Love You":
      textToAppend = "I Love You ";
      break;
    case "Victory":
      textToAppend = "Peace ";
      break;
    case "OK":
      textToAppend = "OK ";
      break;
    case "L Sign":
      textToAppend = "L";
      break;
    case "Y Sign":
      textToAppend = "Y";
      break;
    case "Point / One":
      textToAppend = "1";
      break;
    case "Rock On":
      textToAppend = "Rock ";
      break;
    case "Three":
      textToAppend = "3";
      break;
    default:
      break;
  }
  
  if (textToAppend) {
    appendToSentence(textToAppend);
    speakText(textToAppend);
  }
}

function appendToSentence(str) {
  sentenceOutput.textContent += str;
  sentenceOutput.scrollTop = sentenceOutput.scrollHeight;
}

// Stability Bar controls
function updateStabilityUI(percentage) {
  stabilityFill.style.width = `${percentage}%`;
  stabilityPercent.textContent = `${percentage}%`;
  
  if (percentage === 100) {
    stabilityFill.style.background = "linear-gradient(to right, var(--success), #059669)";
  } else {
    stabilityFill.style.background = "linear-gradient(to right, var(--accent), var(--primary))";
  }
}

// Text-to-speech engine wrapper
function speakText(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Cancel any current utterances
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
}

// Draw skeleton and nodes on canvas
function drawHand(landmarks) {
  // 1. Draw connections
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  
  HAND_CONNECTIONS.forEach(connection => {
    const pt1 = landmarks[connection[0]];
    const pt2 = landmarks[connection[1]];
    
    // Draw connection lines
    ctx.beginPath();
    ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
    ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
    
    // Create modern glowing linear gradients for bones
    const grad = ctx.createLinearGradient(
      pt1.x * canvas.width, pt1.y * canvas.height,
      pt2.x * canvas.width, pt2.y * canvas.height
    );
    grad.addColorStop(0, "hsla(190, 90%, 50%, 0.85)");
    grad.addColorStop(1, "hsla(265, 89%, 65%, 0.85)");
    
    ctx.strokeStyle = grad;
    ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
    ctx.shadowBlur = 4;
    ctx.stroke();
  });
  
  // 2. Draw nodes/joint coordinates
  ctx.shadowBlur = 0; // reset shadow
  landmarks.forEach((lm, index) => {
    const x = lm.x * canvas.width;
    const y = lm.y * canvas.height;
    
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "hsl(265, 89%, 65%)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    
    // Draw fingertip pulse lights
    const fingerTips = [4, 8, 12, 16, 20];
    if (fingerTips.includes(index)) {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
  });
}

// Update Diagnostic collapse details
function updateDiagnostics(landmarks, classification) {
  const wrist = landmarks[0];
  debugCoords.textContent = `X: ${wrist.x.toFixed(3)}, Y: ${wrist.y.toFixed(3)}, Z: ${wrist.z.toFixed(3)}`;
  debugPattern.textContent = JSON.stringify(classification.pattern);
  debugPinch.textContent = `${classification.pinch.toFixed(4)}`;
  debugFps.textContent = `${frameCount}`;
  
  // Update Finger DOM indicators
  updateFingerDOM("state-thumb", "Thumb", classification.rawFingers.thumbExt);
  updateFingerDOM("state-index", "Index Finger", classification.rawFingers.indexExt);
  updateFingerDOM("state-middle", "Middle Finger", classification.rawFingers.middleExt);
  updateFingerDOM("state-ring", "Ring Finger", classification.rawFingers.ringExt);
  updateFingerDOM("state-pinky", "Pinky Finger", classification.rawFingers.pinkyExt);
}

function updateFingerDOM(elementId, label, isExtended) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
      <span class="finger-name">${label}</span>
      <span class="finger-value ${isExtended ? 'state-extended' : 'state-curled'}">${isExtended ? 'Extended' : 'Curled'}</span>
    `;
  }
}

function clearDiagnostics() {
  debugCoords.textContent = "N/A";
  debugPattern.textContent = "[0, 0, 0, 0, 0]";
  debugPinch.textContent = "N/A";
  
  updateFingerDOM("state-thumb", "Thumb", false);
  updateFingerDOM("state-index", "Index Finger", false);
  updateFingerDOM("state-middle", "Middle Finger", false);
  updateFingerDOM("state-ring", "Ring Finger", false);
  updateFingerDOM("state-pinky", "Pinky Finger", false);
}

// Start app
init();
