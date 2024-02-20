import { Request, Response } from 'express';
import { fetchProposalData } from '../services/proposalService';

export const getProposal = async (req: Request, res: Response) => {
    const proposalId = req.query.id;
    if (!proposalId) {
        return res.status(400).send('The proposal Id is mandatory. Please provide a valid value.');
    }

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const results = await fetchProposalData(proposalId);
    res.send(results);
};
