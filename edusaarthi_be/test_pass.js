const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    }
});

userSchema.pre('save', async function () {
    console.log('Pre-save hook triggered. Modified:', this.isModified('password'));
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
    console.log('Password hashed');
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('TestUser', userSchema);

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    try {
        // Create user
        const user = new User({ password: 'initialPassword' });
        await user.save();
        console.log('User created');

        // Check password
        const fetchedUser = await User.findById(user._id).select('+password');
        const match = await fetchedUser.correctPassword('initialPassword', fetchedUser.password);
        console.log('Match initial:', match);

        // Update password
        fetchedUser.password = 'newPassword123';
        await fetchedUser.save();
        console.log('User updated');

        const updatedUser = await User.findById(user._id).select('+password');
        const matchNew = await updatedUser.correctPassword('newPassword123', updatedUser.password);
        console.log('Match new:', matchNew);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.dropCollection('testusers');
        await mongoose.disconnect();
    }
}

test();
