// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed
const { protect } = require('../middleware/authMiddleware'); // Assuming this middleware exists
const bcrypt = require('bcryptjs'); // Only needed if you were doing hashing here, your model does it

// @desc    Get all users (for partner selection, etc.)
// @route   GET /api/users (when mounted in index.js)
// @access  Public (or adjust with `protect` if only authenticated users can see list)
router.get('/', async (req, res) => {
    try {
        // --- MODIFICATION HERE: Ensure '_id' is selected along with 'name' ---
        const users = await User.find({}).select('-passord -__v -date');
        console.log(`GET /api/users - Returning ${users.length} users.`);
        res.json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ message: 'Failed to fetch users from database.' });
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile (when mounted in index.js)
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                education: user.education,
                university: user.university,
                location: user.location,
                phoneNumber: user.phoneNumber,
                bio: user.bio,
                skillsOwned: user.skillsOwned,
                skillsToLearn: user.skillsToLearn,
                domain: user.domain,
                workLinks: user.workLinks,
                achievements: user.achievements,
                certificates: user.certificates,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile (when mounted in index.js)
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { name, email, dateOfBirth, gender, education, university, location, phoneNumber, bio, skillsOwned, skillsToLearn, domain, workLinks, achievements } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name || user.name;
            // Only update email if it's different and not already taken by another user
            if (email && user.email !== email) {
                const existingUser = await User.findOne({ email });
                if (existingUser && String(existingUser._id) !== String(user._id)) {
                    return res.status(400).json({ message: 'This email is already in use by another account.' });
                }
                user.email = email;
            }

            // Handle dateOfBirth
            if (dateOfBirth) {
                const parsedDate = new Date(dateOfBirth);
                if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900 && parsedDate.getFullYear() < 2100) {
                    user.dateOfBirth = parsedDate;
                } else {
                    return res.status(400).json({ message: 'Invalid Date of Birth format or value out of bounds.' });
                }
            } else {
                user.dateOfBirth = null; // Set to null if explicitly cleared or not provided
            }

            // Update other fields, allowing them to be explicitly set to null/undefined if desired from frontend
            user.gender = gender !== undefined ? gender : user.gender;
            user.education = education !== undefined ? education : user.education;
            user.university = university !== undefined ? university : user.university;
            user.location = location !== undefined ? location : user.location;
            user.phoneNumber = phoneNumber !== undefined ? phoneNumber : user.phoneNumber;
            user.bio = bio !== undefined ? bio : user.bio;
            user.skillsOwned = skillsOwned !== undefined ? skillsOwned : user.skillsOwned;
            user.skillsToLearn = skillsToLearn !== undefined ? skillsToLearn : user.skillsToLearn;
            user.domain = domain !== undefined ? domain : user.domain;
            user.workLinks = workLinks !== undefined ? workLinks : user.workLinks;
            user.achievements = achievements !== undefined ? achievements : user.achievements;
            // Note: `certificates` and `profileImageUrl` usually have separate upload routes.

            const updatedUser = await user.save();

            // Send back relevant user data
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profileImageUrl: updatedUser.profileImageUrl,
                dateOfBirth: updatedUser.dateOfBirth,
                gender: updatedUser.gender,
                education: updatedUser.education,
                university: updatedUser.university,
                location: updatedUser.location,
                phoneNumber: updatedUser.phoneNumber,
                bio: updatedUser.bio,
                skillsOwned: updatedUser.skillsOwned,
                skillsToLearn: updatedUser.skillsToLearn,
                domain: updatedUser.domain,
                workLinks: updatedUser.workLinks,
                achievements: updatedUser.achievements,
                certificates: updatedUser.certificates,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        // Handle unique email error during update
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ message: 'This email is already in use by another account.' });
        }
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const isMatch = await user.matchPassword(oldPassword);

            if (!isMatch) {
                return res.status(401).json({ message: 'Old password does not match.' });
            }

            user.password = newPassword; // The pre('save') hook in your User model will hash this
            await user.save();

            res.status(200).json({ message: 'Password updated successfully!' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error while changing password.' });
    }
});

// @desc    Delete user account
// @route   DELETE /api/users/delete-account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            await User.deleteOne({ _id: req.user._id }); // Use deleteOne to remove the user document
            res.status(200).json({ message: 'Account deleted successfully.' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error while deleting account.' });
    }
});

module.exports = router;