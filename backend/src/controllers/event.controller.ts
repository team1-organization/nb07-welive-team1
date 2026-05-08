import { Request, Response } from 'express';
import { eventIdParamSchema, getEventListQuerySchema, upsertEventBodySchema } from '../dtos/event.dto';
import * as eventService from '../services/event.service';
import { safeString } from '../utils/string.util';

export const getEventList = async (req: Request, res: Response) => {
    const query = getEventListQuerySchema.parse(req.query);
    const result = await eventService.getEventList(query);

    return res.status(200).json(result);
};

export const upsertEvent = async (req: Request, res: Response) => {
    const body = upsertEventBodySchema.parse({
        boardType: req.query.boardType || req.body.boardType,
        boardId: req.query.boardId || req.body.boardId,
        startDate: req.query.startDate || req.body.startDate,
        endDate: req.query.endDate || req.body.endDate,
    });

    await eventService.upsertEvent(body);

    return res.status(204).send();
};

export const deleteEvent = async (req: Request, res: Response) => {
    const { eventId } = eventIdParamSchema.parse(req.params);
    const event = await eventService.deleteEvent(eventId);

    return res.status(200).json({
        id: safeString(event.id),
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        boardType: event.boardType,
        noticeId: event.noticeId ? safeString(event.noticeId) : null,
        pollId: event.pollId ? safeString(event.pollId) : null,
    });
};
