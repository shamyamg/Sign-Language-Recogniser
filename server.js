import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// CORS & Security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API: Health check endpoint (for Render / Vercel / uptime monitors)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'AuraSign - Real-Time Sign Language Recognizer',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API: Gestures dictionary endpoint
app.get('/api/gestures', (req, res) => {
  res.status(200).json({
    count: 11,
    gestures: [
      { name: 'Hello', emoji: '🖐️', pattern: '[1, 1, 1, 1, 1]', desc: 'Open palm facing camera. Standard greeting or stop sign.' },
      { name: 'Yes', emoji: '👍', pattern: '[1, 0, 0, 0, 0]', desc: 'Thumbs up. Thumb points up, other fingers curled. Agreement.' },
      { name: 'No', emoji: '✊', pattern: '[0, 0, 0, 0, 0]', desc: 'Closed fist. All fingers curled. Negation or stop.' },
      { name: 'I Love You', emoji: '🤟', pattern: '[1, 1, 0, 0, 1]', desc: 'Thumb, index, and pinky extended. ASL phrase sign.' },
      { name: 'Victory', emoji: '✌️', pattern: '[0, 1, 1, 0, 0]', desc: 'Index and middle fingers extended. Peace or number 2.' },
      { name: 'OK', emoji: '👌', pattern: 'Pinch [4 & 8]', desc: 'Thumb and index tips touching, others extended. Approval.' },
      { name: 'L Sign', emoji: '👉', pattern: '[1, 1, 0, 0, 0]', desc: 'Thumb and index extended forming an L-shape. Letter L.' },
      { name: 'Y Sign', emoji: '🤙', pattern: '[1, 0, 0, 0, 1]', desc: 'Thumb and pinky extended. Letter Y or phone gesture.' },
      { name: 'Point / One', emoji: '☝️', pattern: '[0, 1, 0, 0, 0]', desc: 'Index finger pointing straight up. Number 1.' },
      { name: 'Rock On', emoji: '🤘', pattern: '[0, 1, 0, 0, 1]', desc: 'Index and pinky fingers extended. Rock / metal sign.' },
      { name: 'Three', emoji: '🤟', pattern: '[1, 1, 1, 0, 0]', desc: 'Thumb, index, and middle extended.' }
    ]
  });
});

// Serve production static assets from dist/ if built, otherwise from current directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}
app.use(express.static(__dirname));

// Fallback route for SPA - compatible across all Express versions
app.use((req, res) => {
  const distIndex = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 AuraSign Server listening on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});
