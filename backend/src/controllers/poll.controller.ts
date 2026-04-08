import { NextFunction, Request, Response } from 'express';
import { PollStatus } from '../../generated/prisma';
import { PollService } from '../services/poll.service';
import { AuthUser, CreatePollData, PollFilterQuery, UpdatePollData } from '../types/poll.type';

export class PollController {
    private pollService = new PollService();

    createPoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const data = req.body as CreatePollData;

            const result = await this.pollService.createPoll(user, data);
            res.status(201).json({ message: '투표가 등록되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    getPolls = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const query: PollFilterQuery = {
                status: typeof req.query.status === 'string' ? (req.query.status as PollStatus) : undefined,
                buildingPermission: typeof req.query.buildingPermission === 'string' ? req.query.buildingPermission : undefined,
                keyword: typeof req.query.keyword === 'string' ? req.query.keyword : undefined,
            };

            const result = await this.pollService.getPolls(user, query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getPollDetail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const pollId = BigInt(String(req.params.pollId));

            const result = await this.pollService.getPollDetail(user, pollId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    vote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const pollId = BigInt(String(req.params.pollId));
            const optionId = BigInt(String(req.body.optionId));

            const result = await this.pollService.vote(user, pollId, optionId);
            res.status(201).json({ message: '투표가 완료되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    updatePoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const pollId = BigInt(String(req.params.pollId));
            const data = req.body as UpdatePollData;

            const result = await this.pollService.updatePoll(user, pollId, data);
            res.status(200).json({ message: '투표가 수정되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    deletePoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const pollId = BigInt(String(req.params.pollId));

            await this.pollService.deletePoll(user, pollId);
            res.status(200).json({ message: '투표가 삭제되었습니다.' });
        } catch (error) {
            next(error);
        }
    };
}
