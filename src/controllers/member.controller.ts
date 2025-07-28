import { Request, Response } from 'express';
import { query } from '../config/db';
import { v4 as uuidv4 } from "uuid";
import { toZonedTime, format } from 'date-fns-tz';
import path from 'path';
import fs from "fs";

// GET members (all or filtered by state)
export const getMember = async (req: Request, res: Response) => {
  const { state } = req.query;

  try {
    const members = state && typeof state === 'string'
      ? await query('SELECT * FROM members WHERE state = ?', [state])
      : await query('SELECT * FROM members');

    res.json({ members });
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// INSERT member
export const putMember = async (req: Request, res: Response) => {
  try {
    const {
      name, memberId, state, status,
      applicationDocStatus, calendarDate,
      memberType, comments,
    } = req.body;

    const id = uuidv4();

    await query(
      `INSERT INTO members 
      (id, name, memberId, state, status, applicationDocStatus, calendarDate, memberType, comments) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, memberId, state, status, applicationDocStatus, calendarDate, memberType, comments]
    );

    res.status(201).json({
      message: 'Member added successfully',
      inserted: { id, name, memberId, state },
    });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload document
export const uploadDocs = async (req: Request, res: Response) => {
  const memberId = req.body.memberId;
  const file = req.file;

  if (!file || !memberId) {
    return res.status(400).json({ message: 'Missing file or memberId' });
  }

  try {
    await query(
      `INSERT INTO documentsuploaded (memberId, filename, filepath) VALUES (?, ?, ?)`,
      [memberId, file.originalname, file.path]
    );

    await query(
      `UPDATE members SET status='Pending', applicationDocStatus='Submitted' WHERE memberId = ?`,
      [memberId]
    );

    res.status(200).json({ message: 'Document uploaded and status updated.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload.' });
  }
};

// Get latest uploaded document
export const getUploadedDocuments = async (req: Request, res: Response) => {
  const memberId = req.params.memberId;

  try {
    const documents: any[] = await query(
      `SELECT filename FROM documentsuploaded WHERE memberId = ? ORDER BY created_at DESC LIMIT 1`,
      [memberId]
    );

    res.json(documents[0] || {});
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Failed to fetch document." });
  }
};

// Set appointment
export const putappointment = async (req: Request, res: Response) => {
  const { memberId, appointmentDate } = req.body;

  if (!memberId || !appointmentDate) {
    return res.status(400).json({ message: "Missing data" });
  }

  const utcDate = new Date(appointmentDate);
  const timeZone = 'Asia/Manila';
  const phDate = toZonedTime(utcDate, timeZone);
  const formattedDate = format(phDate, 'yyyy-MM-dd HH:mm:ss', { timeZone });

  try {
    await query(`UPDATE members SET calendarDate = ? WHERE memberId = ?`, [formattedDate, memberId]);
    res.status(200).json({ message: "Appointment updated.", appointmentDate: formattedDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update." });
  }
};

// Get appointment
export const getappointment = async (req: Request, res: Response) => {
  const { memberId } = req.params;

  if (!memberId) {
    return res.status(400).json({ message: "Missing memberId" });
  }

  try {
    const result: any[] = await query(
      `SELECT calendarDate FROM members WHERE memberId = ?`,
      [memberId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "No appointment found" });
    }

    return res.json({ appointmentDate: result[0].calendarDate });
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update comment
export const putComment = async (req: Request, res: Response) => {
  const { memberId, comment } = req.body;

  if (!memberId || !comment?.trim()) {
    return res.status(400).json({ message: "Missing memberId or comment" });
  }

  try {
    await query(
      `UPDATE members SET comments = ? WHERE memberId = ?`,
      [comment, memberId]
    );

    return res.status(200).json({
      message: "Comment updated successfully.",
      data: { memberId, comment }
    });
  } catch (err) {
    console.error("Error saving comment:", err);
    return res.status(500).json({ message: "Server error while saving comment." });
  }
};

// Update memberType
export const putMemberType = async (req: Request, res: Response) => {
  const { memberId, type } = req.body;

  if (!memberId || !type) {
    return res.status(400).json({ message: "Missing memberId or memberType" });
  }

  try {
    await query(
      `UPDATE members SET memberType = ? WHERE memberId = ?`,
      [type, memberId]
    );

    return res.status(200).json({
      message: "Member type updated successfully.",
      data: { memberId, type },
    });

  } catch (err) {
    console.error("Error updating member type:", err);
    return res.status(500).json({ message: "Server error while updating member type." });
  }
};

// Update member status
export const updateMemberStatus = async (req: Request, res: Response) => {
  const { memberId, status } = req.body;

  if (!memberId || !status) {
    return res.status(400).json({ message: "Missing memberId or status" });
  }

  try {
    await query(`UPDATE members SET status = ? WHERE memberId = ?`, [status, memberId]);

    return res.status(200).json({
      message: `Member status updated to ${status}`,
      data: { memberId, status },
    });
  } catch (err) {
    console.error("Error updating member status:", err);
    return res.status(500).json({ message: "Server error while updating member status." });
  }
};

// Delete member file
export const deleteMemberFile = async (req: Request, res: Response) => {
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({ message: "Missing memberId" });
  }

  try {
    const result: any[] = await query(
      `SELECT filename FROM documentsuploaded WHERE memberId = ? ORDER BY created_at DESC LIMIT 1`,
      [memberId]
    );

    if (!result.length || !result[0].filename) {
      return res.status(404).json({ message: "No file found for this member" });
    }

    const fileName = result[0].filename;
    const filePath = path.join(__dirname, "../../uploads", fileName);

    fs.unlink(filePath, async (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("File deletion error:", err);
        return res.status(500).json({ message: "Failed to delete file from server." });
      }

      await query(
        `DELETE FROM documentsuploaded WHERE memberId = ? AND filename = ?`,
        [memberId, fileName]
      );

      await query(
        `UPDATE members SET applicationDocStatus = NULL WHERE memberId = ?`,
        [memberId]
      );

      return res.status(200).json({ message: "File deleted and applicationDocStatus cleared." });
    });

  } catch (err) {
    console.error("Error deleting member file:", err);
    return res.status(500).json({ message: "Server error while deleting file." });
  }
};

// Filtered members (redundant now; merged in getMember)
export const getFilteredMembers = getMember;
