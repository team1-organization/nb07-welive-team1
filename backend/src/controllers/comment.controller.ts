import { Request, Response } from 'express';
import { CommentIdParamSchema, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import * as commentService from '../services/comment.service.ts';

export const createComment = async (req: Request, res: Response) => {
    const user = req.user;
    const body = CreateCommentDto.parse(req.body);

    const result = await commentService.createComment({
        user,
        body,
    });

    return res.status(201).json(result);
};

export const updateComment = async (req: Request, res: Response) => {
    const user = req.user;
    const params = CommentIdParamSchema.parse(req.params);
    const body = UpdateCommentDto.parse(req.body);

    const result = await commentService.updateComment({
        user,
        commentId: params.commentId,
        body,
    });

    return res.status(200).json(result);
};

export const deleteComment = async (req: Request, res: Response) => {
    const user = req.user;
    const params = CommentIdParamSchema.parse(req.params);

    await commentService.deleteComment({
        user,
        commentId: params.commentId,
    });

    return res.status(200).json({
        message: '정상적으로 삭제 처리되었습니다',
    });
};
