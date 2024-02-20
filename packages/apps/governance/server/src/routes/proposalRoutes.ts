import express from 'express';
import { getProposal } from '../controllers/proposalController';

const router = express.Router();

router.get('/proposal', getProposal);

export default router;
