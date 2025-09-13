// routes/SchedulingRoutes.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// --- IMPORTANT: Ensure Event Model has these fields:
//    - type (enum: 'workshop', 'scheduled_meeting', 'meeting_request', 'accepted_meeting', 'rejected_meeting')
//    - status (enum: 'pending', 'accepted', 'rejected', default: 'pending')
//    - requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
//    - requesterName: { type: String }
//    - recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
//    - recipientName: { type: String }
//    - instructor: { type: String } (used for general workshops or accepted meetings)
//    - message: { type: String }
//    - color: { type: String }


// --- Event Routes ---

// @desc    Get all events relevant to the authenticated user
// @route   GET /api/events
// @access  Private
router.get('/events', protect, async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // --- MODIFIED QUERY HERE ---
        const events = await Event.find({
            $or: [
                { type: 'workshop' }, // Include all workshops
                {
                    // Include all meeting-related events where the user is involved
                    $or: [
                        { requesterId: currentUserId },
                        { recipientId: currentUserId }
                    ],
                    // Ensure it's a meeting-related type
                    type: { $in: ['meeting_request', 'accepted_meeting', 'rejected_meeting', 'scheduled_meeting'] }
                    // *** IMPORTANT: No status filter here. We want all statuses (pending, accepted, rejected)
                    // for events the user is involved in. The frontend will handle specific display based on status.
                }
            ]
        })
            .populate('requesterId', 'name email')
            .populate('recipientId', 'name email')
            .sort({ date: 1, time: 1 }); // Sort by date and time

        const formattedEvents = events.map(event => {
            const eventObj = event.toObject(); // Convert Mongoose document to plain JS object

            let instructorName = 'N/A'; // Default instructor name

            if (eventObj.type === 'meeting_request' || eventObj.type === 'accepted_meeting' || eventObj.type === 'rejected_meeting') {
                // For requests/meetings, determine the 'other' person's name as instructor
                if (String(eventObj.requesterId._id) === String(currentUserId)) {
                    instructorName = eventObj.recipientId ? eventObj.recipientId.name : 'Unknown Partner';
                } else if (String(eventObj.recipientId._id) === String(currentUserId)) {
                    instructorName = eventObj.requesterId ? eventObj.requesterId.name : 'Unknown Partner';
                }
            } else {
                // For 'workshop' or other general events, use the stored instructor field
                instructorName = eventObj.instructor || 'N/A';
            }

            return {
                id: eventObj._id, // Ensure 'id' for FlatList keyExtractor
                ...eventObj,
                // These are used for display on frontend
                requesterName: eventObj.requesterId ? eventObj.requesterId.name : 'Unknown',
                recipientName: eventObj.recipientId ? eventObj.recipientId.name : 'Unknown',
                instructor: instructorName, // The determined 'other' person for UI
                // Ensure IDs are plain strings
                requesterId: eventObj.requesterId ? String(eventObj.requesterId._id) : null,
                recipientId: eventObj.recipientId ? String(eventObj.recipientId._id) : null,
            };
        });

        res.json(formattedEvents);

    } catch (error) {
        console.error('Backend GET /api/events: Error fetching events:', error);
        res.status(500).json({ message: 'Server error while fetching events' });
    }
});


// @desc    Create a new event or send a meeting request
// @route   POST /api/events
// @access  Private
router.post('/events', protect, async (req, res) => {
    console.log('*** POST /api/events ROUTE HIT ***');
    console.log('Request body:', req.body);

    const { title, date, time, type, recipientId, instructor, partnerId, message, color } = req.body;
    const currentUserId = req.user._id;
    const currentUserName = req.user.name;

    if (!title || !date || !time || !type) {
        console.log('Validation failed: Missing title, date, time, or type.');
        return res.status(400).json({ message: 'Title, date, time, and type are required.' });
    }

    try {
        if (type === 'meeting_request') {
            if (!recipientId) {
                console.log('Validation failed: Recipient ID missing for meeting request.');
                return res.status(400).json({ message: 'Recipient ID is required for a meeting request.' });
            }

            const recipientUser = await User.findById(recipientId);
            if (!recipientUser) {
                console.log(`Validation failed: Recipient user with ID '${recipientId}' not found.`);
                return res.status(404).json({ message: `Recipient user with ID '${recipientId}' not found.` });
            }

            const newRequest = new Event({
                title,
                date,
                time,
                type: 'meeting_request',
                status: 'pending',
                requesterId: currentUserId,
                requesterName: currentUserName,
                recipientId: recipientUser._id,
                recipientName: recipientUser.name,
                message: message || `Meeting request from ${currentUserName}`,
                color: color || "#FFC107", // Default color for pending requests (yellow/orange)
            });

            const savedRequest = await newRequest.save();
            console.log('Event successfully saved as request:', savedRequest);

            const populatedRequest = await Event.findById(savedRequest._id)
                .populate('requesterId', 'name email')
                .populate('recipientId', 'name email');

            const formattedRequest = {
                id: populatedRequest._id,
                ...populatedRequest.toObject(),
                requesterName: populatedRequest.requesterId ? populatedRequest.requesterId.name : 'Unknown',
                recipientName: populatedRequest.recipientId ? populatedRequest.recipientId.name : 'Unknown',
                requesterId: populatedRequest.requesterId ? String(populatedRequest.requesterId._id) : null,
                recipientId: populatedRequest.recipientId ? String(populatedRequest.recipientId._id) : null,
            };

            return res.status(201).json(formattedRequest);

        } else if (type === 'scheduled_meeting' || type === 'workshop') {
            if (type === 'scheduled_meeting' && (!instructor || !partnerId)) {
                console.log('Validation failed: Instructor/partnerId missing for scheduled meeting.');
                return res.status(400).json({ message: 'Instructor and partnerId are required for a direct scheduled meeting.' });
            }

            let finalInstructor = instructor;
            let finalReceiverId = null;
            let finalStatus = 'active';

            if (partnerId) {
                const partnerUser = await User.findById(partnerId);
                if (!partnerUser) {
                    console.log(`Validation failed: Partner user with ID '${partnerId}' not found.`);
                    return res.status(404).json({ message: `Partner user with ID '${partnerId}' not found.` });
                }
                finalReceiverId = partnerUser._id;
                finalInstructor = instructor || partnerUser.name;
            } else if (type === 'workshop') {
                finalInstructor = instructor || currentUserName;
            }


            const newEvent = new Event({
                title,
                instructor: finalInstructor,
                date,
                time,
                type: type,
                initiatorId: currentUserId,
                receiverId: finalReceiverId,
                status: finalStatus,
                message: message || null,
                color: color || '#DBEAFE',
            });

            const savedEvent = await newEvent.save();
            console.log('Event successfully saved:', savedEvent);

            const populatedEvent = await Event.findById(savedEvent._id)
                .populate('initiatorId', 'name email')
                .populate(finalReceiverId ? 'receiverId' : '', 'name email');

            const formattedEvent = {
                id: populatedEvent._id,
                ...populatedEvent.toObject(),
                requesterName: populatedEvent.initiatorId ? populatedEvent.initiatorId.name : 'Unknown',
                recipientName: populatedEvent.receiverId ? populatedEvent.receiverId.name : 'Unknown',
                instructor: populatedEvent.instructor || finalInstructor,
                initiatorId: populatedEvent.initiatorId ? String(populatedEvent.initiatorId._id) : null,
                receiverId: populatedEvent.receiverId ? String(populatedEvent.receiverId._id) : null,
            };

            return res.status(201).json(formattedEvent);

        } else {
            console.log('Validation failed: Invalid event type provided, or type not handled.');
            return res.status(400).json({ message: 'Invalid event type provided.' });
        }

    } catch (error) {
        console.error('Error creating event/request:', error);
        if (error.name === 'ValidationError') {
            console.error('Mongoose Validation Error:', error.errors);
            return res.status(400).json({ message: 'Validation Error: ' + error.message });
        } else if (error.code === 11000) {
            console.error('MongoDB Duplicate Key Error:', error.message);
            return res.status(400).json({ message: 'Duplicate Key Error: ' + error.message });
        }
        res.status(500).json({ message: 'Server error while processing event/request.' });
    }
});


// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
router.delete('/events/:id', protect, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        if (String(event.requesterId || event.initiatorId) !== String(req.user._id) &&
            String(event.recipientId || event.receiverId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this event.' });
        }

        await Event.deleteOne({ _id: eventId });
        res.status(200).json({ message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Error deleting event:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }
        res.status(500).json({ message: 'Server error while deleting event.' });
    }
});


// --- Meeting Request Routes ---

// @desc    Get all incoming pending meeting requests for the authenticated user (as recipient)
// @route   GET /api/requests/incoming
// @access  Private
router.get('/requests/incoming', protect, async (req, res) => {
    try {
        const incomingRequests = await Event.find({
            recipientId: req.user._id,
            type: 'meeting_request',
            status: 'pending'
        })
            .populate('requesterId', 'name email')
            .sort({ createdAt: 1 });

        const formattedRequests = incomingRequests.map(reqItem => ({
            id: reqItem._id,
            ...reqItem.toObject(),
            requesterName: reqItem.requesterId ? reqItem.requesterId.name : 'Unknown',
            requesterId: reqItem.requesterId ? String(reqItem.requesterId._id) : null,
            recipientId: reqItem.recipientId ? String(reqItem.recipientId._id) : null,
        }));
        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching incoming requests:', error);
        res.status(500).json({ message: 'Server error while fetching incoming requests.' });
    }
});


// @desc    Accept a pending meeting request
// @route   PUT /api/requests/:id/accept
// @access  Private (only recipient can accept)
router.put('/requests/:id/accept', protect, async (req, res) => {
    try {
        const requestId = req.params.id;
        const currentUserId = req.user._id;

        const request = await Event.findOne({
            _id: requestId,
            recipientId: currentUserId,
            type: 'meeting_request',
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found or not authorized.' });
        }

        request.status = 'accepted';
        request.type = 'accepted_meeting';
        request.color = "#81C784";
        request.instructor = request.requesterName;
        const acceptedEvent = await request.save();

        await Event.updateOne(
            {
                requesterId: request.requesterId,
                recipientId: request.recipientId,
                title: request.title,
                date: request.date,
                time: request.time,
                type: 'meeting_request',
                status: 'pending'
            },
            {
                $set: {
                    status: 'accepted',
                    type: 'accepted_meeting',
                    color: "#81C784",
                    instructor: request.recipientName
                }
            }
        );

        res.status(200).json({ message: 'Request accepted and meeting scheduled!', event: acceptedEvent });
    } catch (error) {
        console.error('Error accepting request:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid request ID format.' });
        }
        res.status(500).json({ message: 'Server error while accepting request.' });
    }
});

// @desc    Decline a meeting request
// @route   PUT /api/requests/:id/reject
// @access  Private (only recipient can reject)
router.put('/requests/:id/reject', protect, async (req, res) => {
    try {
        const requestId = req.params.id;
        const currentUserId = req.user._id;

        const request = await Event.findOne({
            _id: requestId,
            recipientId: currentUserId,
            type: 'meeting_request',
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found or not authorized.' });
        }

        request.status = 'rejected';
        request.type = 'rejected_meeting';
        request.color = "#EF4444";
        const rejectedEvent = await request.save();

        await Event.updateOne(
            {
                requesterId: request.requesterId,
                recipientId: request.recipientId,
                title: request.title,
                date: request.date,
                time: request.time,
                type: 'meeting_request',
                status: 'pending'
            },
            {
                $set: {
                    status: 'rejected',
                    type: 'rejected_meeting',
                    color: "#EF4444"
                }
            }
        );

        res.status(200).json({ message: 'Request declined.', event: rejectedEvent });
    } catch (error) {
        console.error('Error declining request:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid request ID format.' });
        }
        res.status(500).json({ message: 'Server error while declining request.' });
    }
});

module.exports = router;