// src/controllers/userController.ts
import { Request, Response } from "express";
import { query } from "../config/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  try {
    const existing = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await query(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [id, name, email, hashed, role || "user"]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  const users = await query("SELECT id, name, email, role, created_at FROM users");
  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await query("SELECT id, name, email, role FROM users WHERE id = ?", [req.params.id]);
  if (user.length === 0) return res.status(404).json({ error: "User not found" });
  res.json(user[0]);
};

export const deleteUser = async (req: Request, res: Response) => {
  await query("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ message: "User deleted" });
};
