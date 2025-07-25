// src/routes/userRoutes.ts
import { Router } from "express";
import { signup, login, getUsers, getUserById, deleteUser } from "../controllers/userController";
import { verifyToken } from "../middleware/auth"; // create this



const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/", getUsers); // Protect with JWT if needed
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);
router.get("/", verifyToken, getUsers);

export default router;
