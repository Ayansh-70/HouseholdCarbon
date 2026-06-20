const express = require('express');
const { validateInput } = require('../middleware/validateInput');
const { submitFootprint, getHistory } = require('../controllers/footprint.controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting specifically for the POST endpoint (which calls AI)
// 15 requests per 15 minutes per IP.
// NOTE: For Gemini Free Tier (15 RPM limits), this allows a single IP to theoretically 
// exhaust the entire global per-minute quota if spammed within 1 min, but 15 per 15 min 
// allows normal iterative demoing without fully leaving the backend exposed to infinite loop abuse.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

router.post('/', aiLimiter, validateInput, submitFootprint);
router.get('/history', getHistory);

module.exports = router;
