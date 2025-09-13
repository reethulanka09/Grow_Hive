// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // Ensure this path is correct, typically models/Event.js (singular)
const User = require('../models/User');   // Ensure this path is correct
const { protect } = require('../middleware/authMiddleware'); // Your authentication middleware

// --- Event Routes ---

// @desc    Get all events relevant to the authenticated user
// @route   GET /api/events
// @access  Private
router.get('/events', protect, async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Fetch events where the current user is involved, including workshops,
        // accepted meetings, and pending requests they have *sent*.
        const events = await Event.find({
            $or: [
                { type: 'workshop' }, // General workshops (if relevant to user or public)
                { // Events where current user is the requester and it's accepted
                    requesterId: currentUserId,
                    status: 'accepted'
                },
                { // Events where current user is the recipient and it's accepted
                    recipientId: currentUserId,
                    status: 'accepted'
                },
                { // Pending meeting requests SENT BY the current user (to show 'Pending...' in their list)
                    requesterId: currentUserId,
                    type: 'meeting_request',
                    status: 'pending'
                }
            ]
        })
            .populate('requesterId', 'name email') // Populate requester's name/email
            .populate('recipientId', 'name email')   // Populate recipient's name/email
            .sort({ date: 1, time: 1 });

        const formattedEvents = events.map(event => {
            const eventObj = event.toObject(); // Convert Mongoose document to plain JS object

            let instructorName = 'Unknown';
            // Safely get requester/recipient names from populated fields
            const requesterName = eventObj.requesterId ? eventObj.requesterId.name : 'Unknown';
            const recipientName = eventObj.recipientId ? eventObj.recipientId.name : 'Unknown';

            // Determine the "instructor" (the other person in the event/meeting) for display
            if (eventObj.type === 'meeting_request' || eventObj.type === 'accepted_meeting') {
                if (String(eventObj.requesterId._id) === String(currentUserId)) {
                    // Current user is the requester, so the 'instructor' is the recipient
                    instructorName = recipientName;
                } else if (String(eventObj.recipientId._id) === String(currentUserId)) {
                    // Current user is the recipient, so the 'instructor' is the requester
                    instructorName = requesterName;
                }
            } else {
                // For other types like 'workshop', use the stored instructor
                instructorName = eventObj.instructor || 'N/A';
            }

            return {
                id: eventObj._id, // Ensure 'id' for FlatList keyExtractor
                ...eventObj,
                requesterName: requesterName,
                recipientName: recipientName,
                // Override instructor with the determined value
                instructor: instructorName,
                // Ensure IDs are simple strings if needed by frontend
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

// @desc    Create a new event or send a meeting request
// @route   POST /api/events
// @access  Private
router.post('/events', protect, async (req, res) => {
    console.log('*** POST /api/events ROUTE HIT ***'); // <--- ADD THIS LINE
    console.log('Request body:', req.body);
    const { title, date, time, type, recipientId, message, color } = req.body;
    const currentUserId = req.user._id;
    const currentUserName = req.user.name; // Assuming 'name' is available on req.user

    if (!title || !date || !time) {
        return res.status(400).json({ message: 'Title, date, and time are required.' });
    }

    try {
        if (type === 'meeting_request') {
            if (!recipientId) {
                return res.status(400).json({ message: 'Recipient ID is required for a meeting request.' });
            }

            const recipientUser = await User.findById(recipientId);
            if (!recipientUser) {
                return res.status(404).json({ message: `Recipient user with ID '${recipientId}' not found.` });
            }

            const newRequest = new Event({
                title,
                date,
                time,
                type: 'meeting_request',
                status: 'pending',
                requesterId: currentUserId,
                requesterName: currentUserName, // Store requester's name
                recipientId: recipientUser._id,
                recipientName: recipientUser.name, // Store recipient's name
                message: message || `Meeting request from ${currentUserName}`,
                color: color || "#FFC107", // Default color for pending requests
            });

            const savedRequest = await newRequest.save();

            // Populate and return the saved request with names for frontend
            const populatedRequest = await Event.findById(savedRequest._id)
                .populate('requesterId', 'name email')
                .populate('recipientId', 'name email');

            const formattedRequest = {
                id: populatedRequest._id,
                ...populatedRequest.toObject(),
                requesterName: populatedRequest.requesterId ? populatedRequest.requesterId.name : 'Unknown',
                recipientName: populatedRequest.recipientId ? populatedRequest.recipientId.name : 'Unknown',
            };

            return res.status(201).json(formattedRequest);

        } else if (type === 'scheduled_meeting') {
            // For directly scheduling a meeting (e.g., if you have an 'Add Event' button
            // that doesn't involve a request flow, or self-scheduling)
            const { instructor, partnerId } = req.body; // Assuming 'instructor' (name) and 'partnerId' (ID)
            // are sent for direct scheduled_meeting
            if (!instructor || !partnerId) {
                return res.status(400).json({ message: 'Instructor and partnerId are required for a direct scheduled meeting.' });
            }

            const partnerUser = await User.findById(partnerId);
            if (!partnerUser) {
                return res.status(404).json({ message: `Partner user with ID '${partnerId}' not found.` });
            }

            const newMeeting = new Event({
                title,
                instructor: instructor, // The name provided (could be self or other)
                date,
                time,
                type: 'scheduled_meeting',
                initiatorId: currentUserId, // Current user is the initiator
                receiverId: partnerUser._id, // The directly chosen partner is the receiver
                status: 'active', // Directly active
                message: message || null,
                color: color || '#DBEAFE',
            });

            const savedMeeting = await newMeeting.save();

            // Populate and return the saved meeting for frontend
            const populatedMeeting = await Event.findById(savedMeeting._id)
                .populate('initiatorId', 'name email')
                .populate('receiverId', 'name email');

            const formattedMeeting = {
                id: populatedMeeting._id,
                ...populatedMeeting.toObject(),
                requesterName: populatedMeeting.initiatorId ? populatedMeeting.initiatorId.name : 'Unknown',
                recipientName: populatedMeeting.receiverId ? populatedMeeting.receiverId.name : 'Unknown',
            };

            return res.status(201).json(formattedMeeting);

        } else {
            return res.status(400).json({ message: 'Invalid event type provided.' });
        }

    } catch (error) {
        console.error('Error creating event/request:', error);
        if (error.name === 'ValidationError') {
            console.error('Mongoose Validation Error:', error.errors);
        } else if (error.code === 11000) {
            console.error('MongoDB Duplicate Key Error:', error.message);
        }
        res.status(500).json({ message: 'Server error while processing event/request.' });
    }
});


// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
router.delete('/events/:id', protect, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Only initiator or recipient can delete the event
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

// @desc    Get all incoming pending meeting requests for the authenticated user (as recipient)
// @route   GET /api/requests/incoming
// @access  Private
router.get('/requests/incoming', protect, async (req, res) => {
    try {
        const incomingRequests = await Event.find({
            recipientId: req.user._id,
            type: 'meeting_request',
            status: 'pending'
        })
            .populate('requesterId', 'name email') // Populate sender's name and email
            .sort({ createdAt: 1 }); // Sort by creation date

        const formattedRequests = incomingRequests.map(reqItem => ({
            id: reqItem._id, // Ensure 'id' field is present for frontend
            ...reqItem.toObject(),
            requesterName: reqItem.requesterId ? reqItem.requesterId.name : 'Unknown', // Use populated name
            requesterId: reqItem.requesterId ? String(reqItem.requesterId._id) : null,
            recipientId: reqItem.recipientId ? String(reqItem.recipientId._id) : null,
        }));
        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching incoming requests:', error);
        res.status(500).json({ message: 'Server error while fetching incoming requests.' });
    }
});


// @desc    Accept a pending meeting request
// @route   PUT /api/requests/:id/accept  <--- Using PUT for idempotency
// @access  Private (only recipient can accept)
router.put('/requests/:id/accept', protect, async (req, res) => {
    try {
        const requestId = req.params.id;
        const currentUserId = req.user._id;

        const request = await Event.findOne({
            _id: requestId,
            recipientId: currentUserId, // Ensure current user is the recipient
            type: 'meeting_request',
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found or not authorized.' });
        }

        // Update the original request document for the recipient
        request.status = 'accepted';
        request.type = 'accepted_meeting'; // Change type to accepted_meeting
        request.color = "#81C784"; // Green for accepted
        // Instructor can be requester's name
        request.instructor = request.requesterName;
        const acceptedEvent = await request.save();

        // Also update the event on the requester's side
        // Find the requester's original 'pending' request and update its status and type
        await Event.updateOne(
            {
                requesterId: request.requesterId,
                recipientId: request.recipientId, // This is current user's ID
                title: request.title,
                date: request.date,
                time: request.time,
                type: 'meeting_request', // Target the original request sent by them
                status: 'pending'
            },
            {
                $set: {
                    status: 'accepted',
                    type: 'accepted_meeting',
                    color: "#81C784",
                    instructor: request.recipientName // For requester, the instructor is the accepter
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

// @desc    Decline a meeting request
// @route   PUT /api/requests/:id/reject  <--- Using PUT for idempotency
// @access  Private (only recipient can reject)
router.put('/requests/:id/reject', protect, async (req, res) => {
    try {
        const requestId = req.params.id;
        const currentUserId = req.user._id;

        const request = await Event.findOne({
            _id: requestId,
            recipientId: currentUserId, // Ensure current user is the recipient
            type: 'meeting_request',
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found or not authorized.' });
        }

        request.status = 'rejected';
        request.type = 'rejected_meeting'; // Mark it as rejected
        request.color = "#EF4444"; // Red for rejected
        const rejectedEvent = await request.save();

        // Also update the event on the requester's side
        await Event.updateOne(
            {
                requesterId: request.requesterId,
                recipientId: request.recipientId,
                title: request.title,
                date: request.date,
                time: request.time,
                type: 'meeting_request', // Target the original request sent by them
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


// --- User Routes (Placed here for context, ideally in userRoutes.js) ---

// @desc    Search for users by name or email
// @route   GET /api/users/search?q=query
// @access  Private
router.get('/users/search', protect, async (req, res) => {
    const { q } = req.query; // Get the search query from URL params
    const currentUserId = req.user._id;

    if (!q) {
        return res.status(400).json({ message: 'Search query "q" is required.' });
    }

    try {
        const users = await User.find({
            $and: [
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } }, // Case-insensitive search by name
                        { email: { $regex: q, $options: 'i' } }  // Case-insensitive search by email
                    ]
                },
                { _id: { $ne: currentUserId } } // Exclude the current logged-in user from results
            ]
        }).select('name email profileImageUrl'); // Only return necessary public fields

        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error during user search.' });
    }
});

module.exports = router;