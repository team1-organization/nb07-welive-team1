import { Request, Response } from 'express';
import { createCommentReqSchema, deleteCommentReqSchema, updateCommentReqSchema } from '../dtos/comment.dto';
import * as commentService from '../services/comment.service';

export const createComment = async (req: Request, res: Response) => {
    const validated = createCommentReqSchema.parse({
        user: req.user,
        body: req.body,
    });

    const result = await commentService.createComment(validated);

    res.status(201).json(result);
};

export const updateComment = async (req: Request, res: Response) => {
    const validated = updateCommentReqSchema.parse({
        user: req.user,
        params: req.params,
        body: req.body,
    });

    const result = await commentService.updateComment(validated);

    res.status(200).json(result);
};

export const deleteComment = async (req: Request, res: Response) => {
    const validated = deleteCommentReqSchema.parse({
        user: req.user,
        params: req.params,
    });

    const result = await commentService.deleteComment(validated);

    res.status(200).json({ message: '정상적으로 삭제 처리되었습니다' });
};
