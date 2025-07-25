import { Request, Response } from 'express';
import { query } from '../config/db';
import { v4 as uuidv4 } from "uuid";

export const getMember = async (req: Request, res: Response) => {
  try {
    const members = await query('SELECT * FROM members');
    res.json(members);
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const putMember = async (req: Request, res: Response) => {
  try {
    const {
      name,
      memberId,
      state,
      status,
      applicationDocStatus,
      calendarDate,
      memberType,
      comments,
    } = req.body;

    const id = uuidv4();

    const result = await query(
      `INSERT INTO members 
      (id, name, memberId, state, status, applicationDocStatus, calendarDate, memberType, comments) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, memberId, state, status, applicationDocStatus, calendarDate, memberType, comments]
    );

    res.status(201).json({
      message: 'Member added successfully',
      inserted: {
        id,
        name,
        memberId,
        state,
      },
    });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};