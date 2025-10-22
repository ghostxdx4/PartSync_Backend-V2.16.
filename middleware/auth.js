import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
import pool from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Missing token' });
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Not authenticated' });
      const [[user]] = await pool.query('SELECT * FROM admin WHERE id = ?', [userId]);
      if (!user) return res.status(401).json({ message: 'User not found' });
      if (!roles.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
};
