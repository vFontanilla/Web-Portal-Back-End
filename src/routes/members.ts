import express from 'express';
// import { query } from '../config/db';
import { getMember, putMember, uploadDocs, getUploadedDocuments, putappointment, getappointment, putComment, putMemberType, updateMemberStatus, deleteMemberFile, getFilteredMembers } from '../controllers/member.controller';
import { upload } from "../middleware/upload";

const router = express.Router();

router.get('/', getMember);
router.get('/:memberId', getUploadedDocuments);
router.get('/get-appointment/:memberId', getappointment);
// router.get('/', getFilteredMembers);
router.post('/', putMember);
router.post('/upload', upload.single("file"), uploadDocs);
router.post('/update-appointment', putappointment);
router.post('/comment', putComment);
router.post('/member-type', putMemberType);
router.post('/status', updateMemberStatus);
router.post('/delete', deleteMemberFile);

export default router;
