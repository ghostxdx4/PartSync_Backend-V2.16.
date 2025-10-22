import { sendOTPEmail } from './utils/email.js';

await sendOTPEmail('discordant2020@gmail.com', '123456');
console.log('Email sent!');
