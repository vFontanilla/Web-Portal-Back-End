import express from 'express';
// import { query } from '../config/db';
import { getMember, putMember } from '../controllers/member.controller';

const router = express.Router();

router.get('/', getMember);
router.post('/', putMember);

export default router;
