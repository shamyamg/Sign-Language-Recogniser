# 🖐️ AuraSign - Real-Time AI Sign Language Recognizer

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/shamyamg/Sign-Language-Recogniser)
[![Render Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat&logo=render)](https://render.com/deploy?repo=https://github.com/shamyamg/Sign-Language-Recogniser)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?style=flat&logo=github)](https://shamyamg.github.io/Sign-Language-Recogniser/)

**AuraSign** is an AI-powered web application that recognizes hand gestures and American Sign Language (ASL) in real-time directly through your web browser using Google's **MediaPipe Vision API**. It translates detected signs into live text, assembles words and sentences, and speaks them out loud using Text-to-Speech (TTS).

---

## 🌟 Live Demo Links

Once deployed, you can access AuraSign globally:
- **GitHub Pages**: [https://shamyamg.github.io/Sign-Language-Recogniser/](https://shamyamg.github.io/Sign-Language-Recogniser/)
- **Vercel URL**: `https://<your-project-name>.vercel.app`
- **Render URL**: `https://<your-project-name>.onrender.com`

---

## ✨ Features

- **⚡ Real-Time On-Device AI**: Powered by Google MediaPipe HandLandmarker running locally in your browser (no sensitive video frames sent to servers).
- **🔤 Interactive Sentence Builder**: Hold a gesture for 1.2s to type it into the console automatically.
- **🔊 Text-to-Speech (TTS)**: One-click speech synthesis to pronounce recognized sentences out loud.
- **📖 Interactive Sign Dictionary**: Filterable visual dictionary of supported hand gestures and ASL signs.
- **🛠️ Landmark Diagnostics**: Real-time 21-joint skeleton tracker, finger extension state monitors, and coordinate inspection.
- **🌓 Dark & Light Modes**: Seamless visual themes tailored for any lighting condition.
- **🚀 Multi-Cloud Ready**: Preconfigured for instant 1-click deployment on **Vercel**, **Render**, and **GitHub Pages**.

---

## 🖐️ Supported Gestures & Signs

| Gesture | Emoji | Meaning / Output |
| :--- | :---: | :--- |
| **Hello** | 🖐️ | Open Palm / Greeting |
| **Yes** | 👍 | Thumbs Up / Agreement |
| **No** | ✊ | Closed Fist / Negation |
| **I Love You** | 🤟 | ASL "I Love You" Sign |
| **Victory** | ✌️ | Peace / Number 2 |
| **OK** | 👌 | Index-Thumb Pinch / Approval |
| **L Sign** | 👉 | Letter L Formation |
| **Y Sign** | 🤙 | Letter Y / Phone Sign |
| **Point / One** | ☝️ | Number 1 / Pointer |
| **Rock On** | 🤘 | Metal / Rock Gesture |
| **Three** | 🤟 | Thumb, Index, and Middle extended |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- A modern web browser (Chrome, Edge, Firefox, Brave) with webcam permissions enabled

### 1. Clone the repository
```bash
git clone https://github.com/shamyamg/Sign-Language-Recogniser.git
cd Sign-Language-Recogniser
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Or start production server
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel (Frontend / Fullstack)

1. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository: `https://github.com/shamyamg/Sign-Language-Recogniser`.
4. Vercel will automatically detect `vercel.json` and Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**. Your live URL will be ready in under 60 seconds!

---

## 🌐 Deploy to Render (Node.js Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository `Sign-Language-Recogniser`.
3. Configure the settings (or use automatic blueprint):
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan Type**: `Free`
4. Click **"Create Web Service"**. Render will deploy your service and provide a live `https://<service-name>.onrender.com` link with `/api/health` monitoring!

---

## 🌐 Deploy to GitHub Pages (Free Instant Static Hosting)

1. Go to your GitHub repository on GitHub.com: `https://github.com/shamyamg/Sign-Language-Recogniser`.
2. Click **Settings** -> **Pages** (on the left menu).
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. Push any commit to `main`, and GitHub Actions will automatically build and publish the site to:
   `https://shamyamg.github.io/Sign-Language-Recogniser/`

---

## 🏗️ Project Architecture

```
Sign-Language-Recogniser/
├── .github/
│   └── workflows/
│       └── static.yml         # GitHub Actions automatic Pages deploy
├── index.html                 # Semantic HTML5 UI layout
├── styles.css                 # Glassmorphic UI design system
├── app.js                     # MediaPipe hand tracking & gesture classifier
├── server.js                  # Production Express backend & health checks
├── vite.config.js             # Vite production bundling configuration
├── vercel.json                # Vercel deployment & routing configuration
├── render.yaml                # Render Blueprint web service configuration
├── package.json               # Node dependencies and build scripts
└── .gitignore                 # Clean repository file filters
```

---

## 📄 License
This project is open-source under the MIT License.
