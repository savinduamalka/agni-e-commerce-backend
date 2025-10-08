import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import validator from 'validator';
import { sendOTP } from '../utils/emailUtils.js';
import OTP from '../models/otpModel.js';
import Cart from '../models/cartModel.js';
import Wishlist from '../models/wishlistModel.js';

const generateToken = (user) => {
  const userData = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };
  return jwt.sign(userData, process.env.JWT_KEY, { expiresIn: '48h' });
};

export async function createUser(req, res) {
  const { email, firstName, lastName, password, avatar } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({
      message: 'All fields are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      message: 'Invalid email format',
    });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({
      message:
        'Password is not strong enough. It should be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and symbols.',
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      avatar,
    });

    const savedUser = await user.save();

    res.status(201).json({
      message: 'User created successfully. Please verify your email to login.',
      user: {
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    });
  } catch (err) {
    console.error('User creation error:', err);
    res.status(500).json({
      message: 'User creation failed',
    });
  }
}

export async function loginUser(req, res) {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: 'Access denied. Your account has been blocked.' });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({
          message: 'Email not verified. Please verify your email to login.',
        });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({
          message: 'Invalid credentials. Please try signing in with Google.',
        });
    }

    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export function getCurrentUser(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: 'Please login to get user details',
    });
    return;
  }
  res.json({
    user: req.user,
  });
}

export async function loginWithGoogle(req, res) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(401).json({ message: 'ID token is required' });
  }

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const googleUser = response.data;

    // Verify the audience to ensure the ID token is for your app
    if (googleUser.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: 'Invalid ID token audience' });
    }

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = new User({
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        avatar: googleUser.picture,
        isVerified: true,
      });
      await user.save();
    } else {
      if (user.isBlocked) {
        return res
          .status(403)
          .json({ message: 'Access denied. Your account has been blocked.' });
      }
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token: token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ message: 'Invalid Google ID token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    // Find the most recent OTP for this email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found for this email' });
    }

    // Check if OTP is expired (should be handled by TTL, but double-check)
    const now = new Date();
    const otpAge = now - otpRecord.createdAt;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (otpAge > fiveMinutes) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteOne({ _id: otpRecord._id });

    const user = await User.findOne({ email });
    const token = generateToken(user);

    res.status(200).json({
      message: 'Email verified successfully',
      token,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function requestEmailVerification(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Delete any existing OTPs for this email before sending a new one
    await OTP.deleteMany({ email });

    await sendOTP({
      email,
      subject: 'Verify your email address',
      message: 'Please use the following OTP to verify your email address.',
    });

    res
      .status(200)
      .json({
        message:
          'Verification email sent successfully. Please check your email.',
      });
  } catch (error) {
    console.error('Request verification email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete any existing OTPs for this email before sending a new one
    await OTP.deleteMany({ email });

    await sendOTP({
      email,
      subject: 'Reset your password',
      message: 'Please use the following OTP to reset your password.',
    });

    res
      .status(200)
      .json({
        message:
          'Password reset OTP sent successfully. Please check your email.',
      });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Email, OTP, and new password are required' });
  }

  if (!validator.isStrongPassword(newPassword)) {
    return res.status(400).json({
      message:
        'Password is not strong enough. It should be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and symbols.',
    });
  }

  try {
    // Find the most recent OTP for this email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found for this email' });
    }

    // Check if OTP is expired (should be handled by TTL, but double-check)
    const now = new Date();
    const otpAge = now - otpRecord.createdAt;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (otpAge > fiveMinutes) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateUser(req, res) {
  try {
    const { firstName, lastName, avatar, address, phone } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.avatar = avatar || user.avatar;
    user.address = address || user.address;
    user.phone = phone || user.phone;

    const updatedUser = await user.save();
    const token = generateToken(updatedUser);

    res.status(200).json({
      message: 'User details updated successfully',
      token,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Old and new passwords are required' });
    }

    const isPasswordCorrect = bcrypt.compareSync(oldPassword, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          'New password is not strong enough. It should be at least 8 characters long and include a mix of uppercase letters, lowercase letters, numbers, and symbols.',
      });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteUser(req, res) {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      User.deleteOne({ email: userEmail }),
      Cart.deleteOne({ user: userEmail }),
      Wishlist.deleteOne({ user: userEmail }),
    ]);
    res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function blockUser(req, res) {
  try {
    const { email } = req.params;
    await User.findOneAndUpdate({ email }, { isBlocked: true });
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function unblockUser(req, res) {
  try {
    const { email } = req.params;
    await User.findOneAndUpdate({ email }, { isBlocked: false });
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
export async function getAllUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || '';

    let filter = {};
    if (searchQuery) {
      filter = {
        $or: [
          { firstName: { $regex: searchQuery, $options: 'i' } },
          { lastName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }

    const totalUsers = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
