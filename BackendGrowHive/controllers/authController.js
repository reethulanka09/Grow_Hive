const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OtpSchema');
const { sendOTPEmail } = require('../utlis/emailrel');

// ✅ Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ JWT token generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// ✅ Send OTP to email
exports.send = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOTP();

    await OTP.deleteMany({ email }); // clear previous
    await new OTP({ email, otp }).save(); // save new

    await sendOTPEmail(email, otp); // send via email

    res.status(200).json({
      message: 'OTP sent successfully to your email',
      ...(process.env.NODE_ENV === 'development' && { otp }), // for testing
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ✅ Verify OTP
exports.verify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

    await OTP.deleteOne({ email, otp });
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

// ✅ Register new user
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: 'User registered successfully. Please complete your profile.',
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).send('Server error during registration');
  }
};

// ✅ Login
exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) { // Ensure matchPassword is defined in User model
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
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
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send('Server error during login');
  }
};

// @desc    Complete/Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.completeProfile = async (req, res) => {
  const userId = req.user._id;
  const { skillsOwned, skillsToLearn, domains, ...otherUpdates } = req.body;

  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update skillsOwned if provided and valid
    if (skillsOwned) {
      if (!Array.isArray(skillsOwned)) {
        return res.status(400).json({ message: 'skillsOwned must be an array' });
      }
      for (const skill of skillsOwned) {
        if (!skill.skill || !skill.proficiency || !skill.domain) {
          return res.status(400).json({ message: 'Each owned skill must have skill, proficiency, and domain' });
        }
        if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.proficiency)) {
          return res.status(400).json({ message: 'Invalid proficiency level' });
        }
      }
      user.skillsOwned = skillsOwned;
    }

    // Update skillsToLearn if provided and valid
    if (skillsToLearn) {
      if (!Array.isArray(skillsToLearn)) {
        return res.status(400).json({ message: 'skillsToLearn must be an array' });
      }
      for (const skill of skillsToLearn) {
        if (!skill.skill || !skill.domain) {
          return res.status(400).json({ message: 'Each skill to learn must have skill and domain' });
        }
      }
      user.skillsToLearn = skillsToLearn;
    }

    // Update domains if provided and valid
    if (domains) {
      if (!Array.isArray(domains)) {
        return res.status(400).json({ message: 'domains must be an array' });
      }
      const validDomains = [
        'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity',
        'Web Development', 'Mobile Development', 'Blockchain', 'Game Development',
        'UI/UX Design', 'Cloud Computing', 'DevOps', 'Software Engineering',
        'Database Management', 'Network Administration', 'Digital Marketing',
        'Project Management', 'Quality Assurance', 'Data Analysis', 'Business Intelligence'
      ];
      for (const domain of domains) {
        if (!validDomains.includes(domain)) {
          return res.status(400).json({ message: `Invalid domain: ${domain}` });
        }
      }
      user.domains = domains;
    }

    // Update other general profile fields
    for (const key in otherUpdates) {
      if (
        Object.hasOwnProperty.call(otherUpdates, key) &&
        Object.hasOwnProperty.call(user.schema.paths, key) &&
        !['password', 'id', 'createdAt', '_v', 'skillsOwned', 'skillsToLearn', 'domains', 'email'].includes(key)
      ) {
        user[key] = otherUpdates[key];
      }
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      education: user.education,
      university: user.university,
      location: user.location,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      skillsOwned: user.skillsOwned,
      skillsToLearn: user.skillsToLearn,
      domains: user.domains,
      workLinks: user.workLinks,
      achievements: user.achievements,
      certificates: user.certificates,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified,
      message: 'Profile updated successfully!',
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
};

// @desc    Get profile (for logged-in user)
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('getProfile Controller: Fetching profile for userId:', userId);

    // Fetch user, explicitly include fields that are 'select: false' in schema
    const user = await User.findById(userId)
      .select('+skillsOwned +skillsToLearn +domains')
      .lean(); // .lean() returns a plain JavaScript object, faster for reads

    console.log('getProfile Controller: User found from DB:', user);

    if (!user) {
      console.log('getProfile Controller: User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure array fields are always arrays, even if empty or null in DB
    user.skillsOwned = Array.isArray(user.skillsOwned) ? user.skillsOwned : [];
    user.skillsToLearn = Array.isArray(user.skillsToLearn) ? user.skillsToLearn : [];
    user.domains = Array.isArray(user.domains) ? user.domains : [];

    console.log('getProfile Controller: Sending user data as-is from DB:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('getProfile Controller Error:', error.message);
    res.status(500).send('Server error fetching profile');
  }
};

// @desc    Bulk insert users (for development/testing)
// @route   POST /api/auth/bulk
// @access  Public (should be restricted in production)
exports.bulk = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Expected an array of users' });
    }
    const users = await User.insertMany(req.body);
    res.status(201).json({ message: 'Users inserted successfully', data: users });
  } catch (error) {
    console.error('Bulk insert failed:', error.message);
    res.status(500).json({ message: 'Bulk insert failed', error: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await User.deleteOne({ _id: userId });

    res.status(200).json({ message: 'Account deleted successfully.' });

  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ message: 'Server error during account deletion.' });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log('Backend: changePassword route hit for user ID:', req.user._id);

  try {
    // Find user by ID. Select the password field explicitly because it's typically excluded by default.
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      console.log('Backend: User not found during password change for ID:', req.user._id);
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify old password
    // Assumes you have a matchPassword method defined on your User model (User.js)
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      console.log('Backend: Invalid old password for user ID:', req.user._id);
      return res.status(401).json({ message: 'Invalid old password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    console.log('Backend: Password updated successfully for user ID:', req.user._id);
    res.status(200).json({ message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Backend: Error in changePassword for user ID:', req.user._id, error.message);
    // Handle Mongoose validation errors (e.g., if new password doesn't meet schema requirements)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error changing password.' });
  }
};
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error.message);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// --- Optional: Get user by ID (if your frontend requests specific user profiles by ID) ---
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error.message);
        res.status(500).json({ message: 'Server error fetching user by ID' });
    }
};