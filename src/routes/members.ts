import express from 'express';
// import { query } from '../config/db';
import { getMember, putMember, uploadDocs, getUploadedDocuments, putappointment, getappointment } from '../controllers/member.controller';
import { upload } from "../middleware/upload";

const router = express.Router();

router.get('/', getMember);
router.get('/:memberId', getUploadedDocuments);
router.post('/', putMember);
router.post('/upload', upload.single("file"), uploadDocs);
router.post('/update-appointment', putappointment);
router.get('/get-appointment/:memberId', getappointment);

export default router;
