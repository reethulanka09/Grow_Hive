// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();

// Import the protect middleware
const { protect } = require('../middleware/authMiddleware');

// Import the notification controller functions
// This assumes your notificationController.js file is in ../controllers/notificationController.js
const notificationController = require('../controllers/notificationController');

// @route GET /api/notifications
// @desc Get all notifications for the authenticated user, including unread count
// @access Private
router.get('/', protect, notificationController.getNotifications);

// @route PUT /api/notifications/mark-read
// @desc Mark one or more notifications as read (or all unread if no IDs provided)
// @access Private
router.put('/mark-read', protect, notificationController.markNotificationsAsRead);

// @route DELETE /api/notifications/:id
// @desc Delete a specific notification by ID
// @access Private
router.delete('/:id', protect, notificationController.deleteNotifications);

// @route DELETE /api/notifications (with body for multiple deletions)
// @desc Delete multiple notifications by an array of IDs in the request body
// @access Private
// Note: This route must come AFTER the /:id route if you're using similar paths
router.delete('/', protect, notificationController.deleteNotifications);

module.exports = router;