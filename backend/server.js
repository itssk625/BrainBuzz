const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config();
// debug: masked MONGO_URI check — remove after debugging
if (process.env.MONGO_URI) {
  const preview = process.env.MONGO_URI.slice(0, 40) + '...';
  console.log('DEBUG: MONGO_URI present, preview:', preview);
} else {
  console.log('DEBUG: MONGO_URI is NOT present (undefined)');
}
console.log('MONGO_URI present?', !!process.env.MONGO_URI);

// Connect to database
connectDB();

// Initialize express app
const app = express();

const allowedLocalOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3001'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow tools with no origin (Postman, file://)
    if (!origin || origin === 'null') return callback(null, true);

    // allow localhost dev origins
    if (allowedLocalOrigins.includes(origin)) return callback(null, true);

    // allow Vercel frontend URL passed in env (set exactly, no trailing slash)
    const FRONTEND_URL = process.env.FRONTEND_URL;
    if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);

    // fallback: reject
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight


// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BrainBuzz API is running'
  });
});
// --- Auto-detect & serve frontend static files from common folders ---
// Place this BEFORE your final 404 handler so static files and SPA fallback are served.
const fs = require('fs');
const path = require('path');

// candidate folders to check (common layouts)
const candidates = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'client', 'build'),
  path.join(__dirname, 'frontend'),
  path.join(__dirname, 'build'), // CRA default when server & build in same dir
  path.join(__dirname, 'dist')   // Vite default
];

let servedFrom = null;
for (const candidate of candidates) {
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    servedFrom = candidate;
    break;
  }
}

if (servedFrom) {
  console.log(`Static frontend found — serving from: ${servedFrom}`);
  app.use(express.static(servedFrom));

  // serve exact files if they exist; otherwise fallback to index.html for SPA routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    const maybe = path.join(servedFrom, req.path);
    if (fs.existsSync(maybe) && fs.statSync(maybe).isFile()) {
      return res.sendFile(maybe);
    }

    // fallback to index.html
    const indexFile = path.join(servedFrom, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    // If no index.html found (unlikely), fallthrough to 404 handler
    return next();
  });
} else {
  console.log('No static frontend detected in common folders (public, client/build, frontend, build, dist).');
  console.log('If your frontend is elsewhere, either move it to one of those folders or update server to point to it.');
}


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`BrainBuzz Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`Another server instance is already running on port ${PORT}.`);
    console.error(`Please stop the existing server or use a different port.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
