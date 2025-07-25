import express from 'express';
// import { query } from '../config/db';
import { getMember } from '../controllers/member.controller';

const router = express.Router();

router.get('/', getMember);

export default router;
