import { Request, Response } from 'express';
import { query } from '../config/db';
import { v4 as uuidv4 } from "uuid";
import { toZonedTime, format } from 'date-fns-tz';
import path from 'path';
import fs from "fs";


// export const getMember = async (req: Request, res: Response) => {
//   try {
//     const members = await query('SELECT * FROM members');
//     res.json(members);
//   } catch (err) {
//     console.error('Failed to fetch members:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const getMember = async (req: Request, res: Response) => {
  const { state } = req.query;

  try {
    let members;

    if (state && typeof state === 'string') {
      members = await query('SELECT * FROM members WHERE state = ?', [state]);
    } else {
      members = await query('SELECT * FROM members');
    }

    res.json({ members }); // wrap in object for consistency
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

export const uploadDocs = async (req: Request, res: Response) => {
  try {
    const memberId = req.body.memberId;
    const file = req.file;

    if (!file || !memberId) {
      return res.status(400).json({ message: 'Missing file or memberId' });
    }

    // Insert document into documentsUploaded table
    await query(
      `INSERT INTO documentsuploaded (memberId, filename, filepath) VALUES (?, ?, ?)`,
      [memberId, file.originalname, file.path]
    );

    // Update member's applicationDocStatus to 'Submitted'
    await query(
      `UPDATE members SET status='Pending', applicationDocStatus = 'Submitted' WHERE memberId = ?`,
      [memberId]
    );

    res.status(200).json({ message: 'Document uploaded and status updated.' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload.' });
  }
};

export const getUploadedDocuments = async (req: Request, res: Response) => {
  const memberId = req.params.memberId;

  try {
    const documents = await query(
      `SELECT filename FROM documentsuploaded WHERE memberId = ? ORDER BY created_at DESC LIMIT 1`,
      [memberId]
    );
    res.json(documents[0] || {});
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Failed to fetch document." });
  }
};

export const putappointment = async (req: Request, res: Response) => {
  const { memberId, appointmentDate } = req.body;

    // Step 1: Convert incoming UTC date string to Date object
    const utcDate = new Date(appointmentDate);
    const timeZone = 'Asia/Manila';
    const phDate = toZonedTime(utcDate, timeZone);

    const formattedDate = format(phDate, 'yyyy-MM-dd HH:mm:ss', { timeZone });

  console.log("MemberId:", memberId);
  console.log("AppointmentDate:", formattedDate);

  if (!memberId || !appointmentDate) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    await query(
      `UPDATE members SET calendarDate = ? WHERE memberId = ?`,
      [formattedDate, memberId]
    );
    res.status(200).json({ message: "Appointment updated.", appointmentDate: formattedDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update." });
  }
};

export const getappointment = async (req: Request, res: Response) => {
  const { memberId } = req.params;

  console.log("MemberIdsa:", memberId);

  try {
    if (!memberId) {
      return res.status(400).json({ message: "Missing memberId" });
    }

    const resulta = await query(
      `SELECT calendarDate FROM members WHERE memberId = ?`,
      [memberId]
    );

    if (resulta.length === 0) {
      return res.status(404).json({ message: "No appointment found" });
    }

    console.log("DB Result:", resulta);
    return res.json({ appointmentDate: resulta[0].calendarDate });
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const putComment = async (req: Request, res: Response) => {
  const { memberId, comment } = req.body;

  console.log("Received comment for Member ID:", memberId, comment);

  try {
    if (!memberId || !comment?.trim()) {
      return res.status(400).json({ message: "Missing memberId or comment" });
    }

    // Option 1: Update comment field in `members` table (if it exists)
    await query(
      `UPDATE members SET comments = ? WHERE memberId = ?`,
      [comment, memberId]
    );

    // Option 2 (alternative): Insert into separate comments table (if exists)
    // await query(
    //   `INSERT INTO member_comments (memberId, comment) VALUES (?, ?)`,
    //   [memberId, comment]
    // );

    return res.status(200).json({ message: "Comment updated successfully.", data: { memberId, comment }});

  } catch (err) {
    console.error("Error saving comment:", err);
    return res.status(500).json({ message: "Server error while saving comment." });
  }
};

export const putMemberType = async (req: Request, res: Response) => {
  const { memberId, type } = req.body;

  console.log("Received memberType update:", memberId, type);

  try {
    if (!memberId || !type) {
      return res.status(400).json({ message: "Missing memberId or memberType" });
    }

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

export const updateMemberStatus = async (req: Request, res: Response) => {
  const { memberId, status } = req.body;

  try {
    if (!memberId || !status) {
      return res.status(400).json({ message: "Missing memberId or status" });
    }

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

export const deleteMemberFile = async (req: Request, res: Response) => {
  const { memberId } = req.body;

  try {
    if (!memberId) {
      return res.status(400).json({ message: "Missing memberId" });
    }

    // Get the latest uploaded file for the member
    const result = await query(
      `SELECT filename FROM documentsUploaded WHERE memberId = ?`,
      [memberId]
    );

    if (!result.length || !result[0].filename) {
      return res.status(404).json({ message: "No file found for this member" });
    }

    const fileName = result[0].filename;
    const filePath = path.join(__dirname, "../../uploads", fileName);

    // Delete from filesystem
    fs.unlink(filePath, async (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("File deletion error:", err);
        return res.status(500).json({ message: "Failed to delete file from server." });
      }

      // Delete the record for this file from documentsUploaded
      await query(
        `DELETE FROM documentsUploaded WHERE memberId = ? AND filename = ?`,
        [memberId, fileName]
      );

      // Set applicationDocStatus to NULL in members table
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

export const getFilteredMembers = async (req: Request, res: Response) => {
  const { state } = req.query;

  try {
    let members;

    if (state && typeof state === 'string') {
      members = await query('SELECT * FROM members WHERE state = ?', [state]);
    }

    res.json({ members }); // wrap in { members } for consistent structure
  } catch (err) {
    console.error('Failed to fetch members:', err);
    res.status(500).json({ message: 'Server error' });
  }
};