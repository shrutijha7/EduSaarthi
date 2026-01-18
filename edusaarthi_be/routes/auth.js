const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');

const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-very-secure';

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: '90d'
    });
};

/* POST register user */
router.post('/register', async (req, res, next) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });

        const token = signToken(newUser._id);

        // Remove password from output
        newUser.password = undefined;

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email or Username already exists'
            });
        }
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

/* POST login user */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            });
        }

        // 2) Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }

        // 3) If everything ok, send token to client
        const token = signToken(user._id);

        // Remove password from output
        user.password = undefined;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

/* GET current user profile */
router.get('/me', protect, async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

/* PUT update user details */
router.put('/updatedetails', protect, async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            notificationsEnabled: req.body.notificationsEnabled
        };

        // Filter out undefined fields
        Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]);

        const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

/* PUT update password */
router.put('/updatepassword', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                status: 'fail',
                message: 'New password must be at least 8 characters long'
            });
        }

        // 1) Get user from collection
        const user = await User.findById(req.user.id).select('+password');

        // 2) Check if POSTed current password is correct
        const isCorrect = await user.correctPassword(currentPassword, user.password);

        if (!isCorrect) {
            return res.status(401).json({
                status: 'fail',
                message: 'Your current password is wrong'
            });
        }

        // 3) Update password
        user.password = newPassword;
        await user.save();

        // 4) Log user in/send JWT
        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

/* POST forgot password */
router.post('/forgotpassword', async (req, res) => {
    try {
        // 1) Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'There is no user with that email address.'
            });
        }

        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3) Send it to user's email
        // In a real app, this URL would point to your frontend reset password page
        const resetURL = `${req.get('origin') || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>Forgot your password?</h1>
            <p>You can reset your password by clicking the link below:</p>
            <a href="${resetURL}" style="display:inline-block; padding:10px 20px; background:#6366f1; color:white; text-decoration:none; border-radius:5px;">Reset Your Password</a>
            <p>If you didn't forget your password, please ignore this email.</p>
            <p>This link will expire in 10 minutes.</p>
        `;

        const emailSent = await sendEmail(user.email, 'Your password reset token (valid for 10 min)', message);

        if (!emailSent) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                status: 'error',
                message: 'There was an error sending the email. Try again later!'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

/* POST reset password */
router.post('/resetpassword/:token', async (req, res) => {
    try {
        // 1) Get user based on the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        // 2) If token has not expired, and there is user, set the new password
        if (!user) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token is invalid or has expired'
            });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 3) Log the user in, send JWT
        const token = signToken(user._id);

        res.status(200).json({
            status: 'success',
            token,
            message: 'Password reset successfully!'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

module.exports = router;
