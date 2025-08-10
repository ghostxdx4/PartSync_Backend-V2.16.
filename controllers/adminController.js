import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { generateOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM admin WHERE email = ?', [email]);
      if (rows.length === 0) return res.json({ success: false, message: 'Admin not found' });
  
      const admin = rows[0];
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) return res.json({ success: false, message: 'Invalid password' });
  
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60000);
  
      await pool.query(
        'UPDATE admin SET otp_code=?, otp_expires=? WHERE id=?',
        [otp, otpExpiry, admin.id]
      );
  
      await sendOTPEmail(email, otp);
  
      return res.json({ success: true, message: 'OTP sent to your email' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (rows.length === 0) return res.json({ success: false, message: 'Admin not found' });

    const admin = rows[0];
    if (admin.otp_code !== otp) return res.json({ success: false, message: 'Invalid OTP' });
    if (new Date(admin.otp_expires) < new Date()) {
      return res.json({ success: false, message: 'OTP expired' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    await pool.query('UPDATE admin SET otp_code=NULL, otp_expires=NULL WHERE id=?', [admin.id]);

    res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
