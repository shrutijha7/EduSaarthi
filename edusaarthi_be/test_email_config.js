require('dotenv').config();
const { sendEmail } = require('./services/emailService');

const testEmail = async () => {
    console.log('Attempting to send test email...');
    console.log(`From: ${process.env.EMAIL_USER}`);

    // Send to self
    const result = await sendEmail(
        process.env.EMAIL_USER,
        'Test Email from Edusaarthi',
        '<h1>It Works!</h1><p>Your email configuration is correct.</p>'
    );

    if (result) {
        console.log('✅ SUCCESS: Test email sent successfully!');
        console.log('Check your inbox (' + process.env.EMAIL_USER + ')');
    } else {
        console.log('❌ FAILED: Could not send email.');
        console.log('Make sure EMAIL_PASS is an "App Password" if using Gmail, not your login password.');
        console.log('https://myaccount.google.com/apppasswords');
    }
};

testEmail();
