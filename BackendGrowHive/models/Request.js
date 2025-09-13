// models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        trim: true
    },
    requestedDate: {
        type: String, // YYYY-MM-DD
        required: true
    },
    requestedTime: {
        type: String, // HH:MM AM/PM
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: { // 'pending', 'accepted', 'declined'
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
    // Add any other fields relevant to a request
}, {
    timestamps: true
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;