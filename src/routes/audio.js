const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files only
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'), false);
        }
    }
});

// Generate audio from text (TTS, Music, SFX)
router.post('/generate', ensureAuthenticated, audioController.generateAudio);

// Transcribe audio to text (Speech-to-Text)
router.post('/transcribe', ensureAuthenticated, upload.single('audio'), audioController.transcribeAudio);

// Get audio generation history
router.get('/history', ensureAuthenticated, audioController.getHistory);

// Get user's audio credits/stats
router.get('/stats', ensureAuthenticated, audioController.getStats);

module.exports = router;

