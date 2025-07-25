import { Request, Response } from 'express';
import { query } from '../config/db';

export const getMember = async (req: Request, res: Response) => {
  try {
    const members = await query('SELECT * FROM members');
    res.json(members);
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ message: 'Server error' });
  }
};