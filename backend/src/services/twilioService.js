const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const twilioService = {
  sendOTP: async (phoneNumber, otp) => {
    if (!client) {
      console.log(`[STUB] Twilio not configured. OTP for ${phoneNumber}: ${otp}`);
      return { success: true };
    }
    try {
      const message = await client.messages.create({
        body: `Your SafeHer verification code is: ${otp}. Do not share this code with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending OTP via Twilio:', error);
      throw error;
    }
  }
};

module.exports = twilioService;
