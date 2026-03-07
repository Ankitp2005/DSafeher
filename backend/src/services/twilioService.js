const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const isStub = !accountSid || !authToken || accountSid.includes('dummy') || authToken.includes('dummy');
const client = !isStub ? twilio(accountSid, authToken) : null;

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
  },

  sendSOS: async (phoneNumber, userName, trackingUrl) => {
    if (!client) {
      console.log(`[STUB] Twilio not configured. SOS alert for ${userName} sent to ${phoneNumber}. Track: ${trackingUrl}`);
      return { success: true };
    }
    try {
      const message = await client.messages.create({
        body: `🚨 EMERGENCY! ${userName} has triggered a SafeHer SOS alert. Track their live location here: ${trackingUrl}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending SOS SMS via Twilio:', error);
      throw error;
    }
  },

  sendSafeNotification: async (phoneNumber, userName) => {
    if (!client) {
      console.log(`[STUB] Twilio not configured. Safe notification for ${userName} sent to ${phoneNumber}.`);
      return { success: true };
    }
    try {
      const message = await client.messages.create({
        body: `✅ ${userName} has indicated they are safe. The SafeHer SOS alert has been resolved.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending safe notification via Twilio:', error);
      throw error;
    }
  }
};

module.exports = twilioService;
