const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer configuration for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/users/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// ============ NOTIFICATIONS ============
router.get('/notifications', userController.getNotifications);
router.put('/notifications/:id/read', userController.markNotificationRead);
router.put('/notifications/read-all', userController.markAllNotificationsRead);

// ============ PROMO CODES ============
router.post('/promo/validate', userController.validatePromoCode);
router.post('/promo/apply', userController.applyPromoCode);
router.post('/claim-credits', userController.claimCredits);

// ============ PROFILE MANAGEMENT ============
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.delete('/delete-account', userController.deleteAccount);

// ============ AVATAR UPLOAD ============
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/delete-avatar', userController.deleteAvatar);

module.exports = router;

