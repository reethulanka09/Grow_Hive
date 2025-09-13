const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM AM/PM
    type: {
        type: String,
        enum: ['workshop', 'scheduled_meeting', 'meeting_request', 'accepted_meeting', 'rejected_meeting'],
        required: true
    },
    status: { // Only relevant for 'meeting_request', 'accepted_meeting', 'rejected_meeting'
        type: String,
        enum: ['pending', 'active', 'accepted', 'rejected'], // Added 'active' for direct schedules
        default: 'pending' // Default for requests
    },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: { type: String },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientName: { type: String },
    // For general events or accepted meetings, 'instructor' is the other participant's display name
    instructor: { type: String },
    message: { type: String }, // Optional message for requests
    color: { type: String, default: "#DBEAFE" }, // Default color
    // initiatorId and receiverId can be used for 'scheduled_meeting' if preferred,
    // but requesterId/recipientId provide a more unified model for 1-to-1 events.
    // If you keep initiatorId/receiverId, adjust relevant parts of the code.
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('Event', eventSchema);