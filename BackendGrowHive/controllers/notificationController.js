// backend/controllers/notificationController.js

const Notification = require('../models/Notifications');
const User = require('../models/User');
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // User ID from the protect middleware

        const notifications = await Notification.find({ recipientId: userId })
            .populate('senderId', 'name profileImageUrl') // Populate sender's name and profile image
            .populate('relatedEntityId', 'title date time') // Populate related event details
            .sort({ createdAt: -1 }); // Sort by newest first

        // Calculate unread count
        const unreadCount = notifications.filter(notification => !notification.read).length;

        res.status(200).json({ notifications, unreadCount });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error fetching notifications', error: error.message });
    }
};

// @desc   Mark notifications as read
// @route PUT /api/notifications/mark-read
// @access Private
exports.markNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body; // Array of notification IDs to mark as read

        let updateResult;

        if (notificationIds && notificationIds.length > 0) {
            // Mark specific notifications as read
            updateResult = await Notification.updateMany(
                { _id: { $in: notificationIds }, recipientId: userId },
                { $set: { read: true } }
            );
        } else {
            // If no specific IDs are provided, mark all unread notifications for the user as read
            updateResult = await Notification.updateMany(
                { recipientId: userId, read: false },
                { $set: { read: true } }
            );
        }

        if (updateResult.modifiedCount > 0) {
            // Optionally, re-fetch notifications to send updated list or just send success
            // For simplicity, we'll re-fetch to ensure consistency on frontend
            const updatedNotifications = await Notification.find({ recipientId: userId })
                .populate('senderId', 'name profileImageUrl')
                .populate('relatedEntityId', 'title date time')
                .sort({ createdAt: -1 });

            const unreadCount = updatedNotifications.filter(notification => !notification.read).length;

            res.status(200).json({
                message: `${updateResult.modifiedCount} notifications marked as read`,
                notifications: updatedNotifications,
                unreadCount
            });
        } else {
            res.status(200).json({ message: 'No notifications were updated.', modifiedCount: 0 });
        }

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: 'Server error marking notifications as read', error: error.message });
    }
};

// @desc   Delete a specific notification or multiple notifications
// @route DELETE /api/notifications/:id or /api/notifications (with body for multiple)
// @access Private
exports.deleteNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body; // Can be an array of IDs or single ID

        let deleteResult;

        if (req.params.id) {
            // Delete single notification by ID from URL param
            deleteResult = await Notification.deleteOne({ _id: req.params.id, recipientId: userId });
        } else if (notificationIds && notificationIds.length > 0) {
            // Delete multiple notifications from request body
            deleteResult = await Notification.deleteMany({ _id: { $in: notificationIds }, recipientId: userId });
        } else {
            return res.status(400).json({ message: 'No notification ID(s) provided for deletion.' });
        }

        if (deleteResult.deletedCount > 0) {
            res.status(200).json({ message: `${deleteResult.deletedCount} notifications deleted successfully.` });
        } else {
            res.status(404).json({ message: 'No notifications found or deleted.' });
        }

    } catch (error) {
        console.error('Error deleting notification(s):', error);
        res.status(500).json({ message: 'Server error deleting notification(s)', error: error.message });
    }
};