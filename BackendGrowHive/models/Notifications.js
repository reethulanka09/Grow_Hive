// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who performed the action (e.g., accepted/rejected)
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who should receive the notification (e.g., the requester)
        required: true,
    },
    type: {
        type: String,
        enum: ['meeting_status_update', 'new_message', 'other'], // Define notification types
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    relatedEntityId: { // To link notification to a specific event/meeting
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // Or whatever your meeting/event model is called
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);