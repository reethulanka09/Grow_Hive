// backend/controllers/eventController.js

const Event = require('../models/Event'); // Your Event model
const User = require('../models/User');   // Your User model
const Notification = require('../models/Notification'); // <--- NEW: Import Notification model
const mongoose = require('mongoose');

// Helper function to create a notification (This part is already correct)
const createNotification = async (senderId, recipientId, type, message, relatedEntityId) => {
    try {
        const notification = new Notification({
            senderId,
            recipientId,
            type,
            message,
            relatedEntityId,
        });
        await notification.save();
        console.log(`Notification created for recipient ${recipientId}: ${message}`);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

// --- NEW: getEvents function ---
// @desc    Get all events (workshops, requests, accepted/rejected meetings) for the authenticated user
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from the protect middleware

        // Find events where the user is either the requester or the recipient
        // We fetch ALL types and statuses here; frontend will handle display and coloring.
        const events = await Event.find({
            $or: [
                { requesterId: userId },
                { recipientId: userId }
            ]
        })
            .populate('requesterId', 'name') // Populate requester's name
            .populate('recipientId', 'name') // Populate recipient's name
            .sort({ createdAt: -1 }); // Sort by newest first, or by date/time if preferred for scheduling

        // You might want to filter events by current/future dates here if your
        // "Upcoming Events" is strictly for future events.
        // For now, let's send all relevant events and let frontend filter/categorize.

        res.status(200).json(events);

    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: 'Server error fetching events', error: error.message });
    }
};


// MODIFIED: acceptRequest function (This part is already correct)
exports.acceptRequest = async (req, res) => {
    const { id } = req.params; // This is the Event ID
    const currentUserId = req.user.id; // ID of the user accepting the request

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Meeting request not found' });
        }

        if (event.recipientId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the recipient of this request' });
        }

        if (event.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${event.status}` });
        }

        event.status = 'accepted';
        event.type = 'accepted_meeting';
        const recipientUser = await User.findById(currentUserId);
        if (recipientUser) {
            event.instructor = recipientUser.name;
        } else {
            console.warn(`Recipient user with ID ${currentUserId} not found when accepting request.`);
        }

        await event.save();

        const requesterUser = await User.findById(event.requesterId);
        if (requesterUser && recipientUser) {
            await createNotification(
                currentUserId,
                event.requesterId,
                'meeting_status_update',
                `${recipientUser.name} accepted your meeting request for '${event.title}' on ${event.date} at ${event.time}.`,
                event._id
            );
        } else {
            console.warn("Could not find requester or recipient user for notification creation.");
        }

        res.status(200).json({ message: 'Meeting request accepted', event });

    } catch (error) {
        console.error("Error accepting meeting request:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// MODIFIED: rejectRequest function (This part is already correct)
exports.rejectRequest = async (req, res) => {
    const { id } = req.params; // This is the Event ID
    const currentUserId = req.user.id; // ID of the user rejecting the request

    try {
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Meeting request not found' });
        }

        if (event.recipientId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the recipient of this request' });
        }

        if (event.status !== 'pending') {
            return res.status(400).json({ message: `Request already ${event.status}` });
        }

        event.status = 'rejected';
        event.type = 'rejected_meeting';
        // No change to instructor here, as the meeting is rejected.

        await event.save();

        const requesterUser = await User.findById(event.requesterId);
        const recipientUser = await User.findById(currentUserId);
        if (requesterUser && recipientUser) {
            await createNotification(
                currentUserId,
                event.requesterId,
                'meeting_status_update',
                `${recipientUser.name} rejected your meeting request for '${event.title}' on ${event.date} at ${event.time}.`,
                event._id
            );
        } else {
            console.warn("Could not find requester or recipient user for notification creation.");
        }

        res.status(200).json({ message: 'Meeting request rejected', event });

    } catch (error) {
        console.error("Error rejecting meeting request:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};