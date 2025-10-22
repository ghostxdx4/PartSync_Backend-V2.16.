const otpStore = new Map();


export function generateOTP(email, meta = {}) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(email, { otp, expires, ...meta });
  return otp;
}


export function verifyOTP(email, otp) {
  const record = otpStore.get(email);
  if (!record) return false;
  if (record.expires < Date.now()) {
    otpStore.delete(email);
    return false;
  }
  if (record.otp !== otp) return false;

  otpStore.delete(email);
  return true;
}


export function storeOTP(email, data) {
  const expires = Date.now() + 5 * 60 * 1000;
  otpStore.set(email, { expires, ...data });
}


export function getStoredOTP(email) {
  const record = otpStore.get(email);
  if (!record) return null;
  if (record.expires < Date.now()) {
    otpStore.delete(email);
    return null;
  }
  return record;
}
