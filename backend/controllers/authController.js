const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
}

async function registerUser(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const emailClean = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: emailClean });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: emailClean,
      password: hashedPassword,
      role: 'customer',
      phone: phone ? phone.trim() : '',
      addresses: []
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to ROAM & REV.',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        addresses: newUser.addresses || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const emailClean = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailClean });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No user found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password is incorrect.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        addresses: user.addresses || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const { password, ...userWithoutPassword } = user;
    return res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateUserProfile(req, res) {
  try {
    const { name, phone, addresses, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (addresses) updateData.addresses = addresses;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    const updated = await User.findByIdAndUpdate(user._id, updateData);
    const { password, ...safeUser } = updated;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};
