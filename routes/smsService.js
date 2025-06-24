const twilio = require('twilio');
/*require('dotenv').config();*/

// Use your Twilio Console credentials
/*const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;*/
const fromNumber = 'whatsapp:+14155238886'; // Twilio sandbox number

const client = twilio(accountSid, authToken);

// Function to send WhatsApp message
/*async function sendWhatsApp(to, message) {
    try {
      await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${to}`, // make sure `to` starts with +216...
        body: message,
      });
      console.log(`✅ WhatsApp sent to ${to}`);
    } catch (err) {
      console.error(`❌ WhatsApp failed to ${to}:`, err.message);
    }
  }*/

module.exports = { sendWhatsApp };
