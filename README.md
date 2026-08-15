# Sign Language Recognizer

A real-time hand gesture and sign language recognition application that translates signs into text and speech directly in the browser.

## Overview

Sign Language Recognizer is built using computer vision and machine learning (Google MediaPipe Tasks) to detect hand landmarks and classify gestures in real time using a standard webcam. The project provides an interactive interface for translating signs, assembling sentences, and reading them aloud using speech synthesis.

## Features

- **Real-Time Hand Landmark Tracking**: Detects 21 3D hand landmarks at high frame rates directly in the browser.
- **Gesture Classification**: Recognizes common American Sign Language (ASL) signs and hand gestures.
- **Sentence Builder**: Automatically types recognized gestures when held steadily for a short duration.
- **Text-to-Speech (TTS)**: Reads out assembled sentences using the Web Speech API.
- **Sign Dictionary**: Searchable reference list of supported gestures and their descriptions.
- **Visual Diagnostics**: Real-time feedback showing finger extension states and landmark metrics.
- **Dark / Light Theme**: Toggleable interface modes.

## Supported Gestures

| Gesture | Output | Description |
| :--- | :---: | :--- |
| **Hello** | Hello | Open palm facing camera |
| **Yes** | Yes | Thumbs up |
| **No** | No | Closed fist |
| **I Love You** | I Love You | Thumb, index, and pinky extended |
| **Victory / Peace** | Peace | Index and middle fingers extended (V sign) |
| **OK** | OK | Thumb and index tips pinched together |
| **L Sign** | L | Thumb and index forming an L-shape |
| **Y Sign** | Y | Thumb and pinky extended |
| **Point / One** | 1 | Index finger pointing up |
| **Rock On** | Rock | Index and pinky fingers extended |
| **Three** | 3 | Thumb, index, and middle fingers extended |

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+ Modules)
- **Computer Vision**: Google MediaPipe Tasks Vision API (Hand Landmarker)
- **Backend / Serving**: Node.js, Express
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A modern browser (Chrome, Edge, Firefox, Brave) with webcam permissions enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shamyamg/Sign-Language-Recogniser.git
   cd Sign-Language-Recogniser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Production Build

To build the static production bundle and start the server:
```bash
npm run build
npm start
```
The application will be served at `http://localhost:3000`.

## Project Structure

```
Sign-Language-Recogniser/
├── index.html        # Main user interface layout
├── styles.css        # Application styling and layout rules
├── app.js            # MediaPipe integration and gesture detection logic
├── server.js         # Express server for production static serving
├── vite.config.js    # Vite build configuration
├── package.json      # Project dependencies and scripts
└── .gitignore        # Files excluded from git
```

## License

This project is open source and available under the [MIT License](LICENSE).
