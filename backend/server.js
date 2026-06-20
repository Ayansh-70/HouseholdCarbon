require('dotenv').config();

// Ensure Gemini key is present before starting (Fail-fast requirement)
if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== 'test') {
  console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.");
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const footprintRoutes = require('./routes/footprint.routes');

const app = express();

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://d8j0ntlcm91z4.cloudfront.net"],
        mediaSrc: ["'self'", "https://d8j0ntlcm91z4.cloudfront.net", "blob:"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
      },
    },
  })
);

// Restrict CORS (in a real app, specify exact origins, here we allow dev origins and self)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.FRONTEND_URL].filter(Boolean);
// Strict regex to safely match localhost ports while preventing lookalike domains like localhost.attacker.com from bypassing string match checks
const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || localhostPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Body parser with size limit to prevent large payload attacks
app.use(express.json({ limit: '10kb' }));

// API Routes
app.use('/api/footprint', footprintRoutes);
app.use('/api', require('./routes/history'));
app.use('/api', require('./routes/goalCoaching'));
app.use('/api', require('./routes/dailyTip'));

// Serve static frontend assets
const staticPath = path.join(__dirname, 'public/dist');
app.use(express.static(staticPath));

// Fallback catch-all route below all API routes to serve index.html for frontend routing
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Global error handler so stack traces don't leak to client
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: "Payload Too Large" });
  }
  
  res.status(500).json({ success: false, error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

// Export app for testing, or listen if ran directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
