import { CreateCommentReqDto, DeleteCommentReqDto, UpdateCommentReqDto } from '../dtos/comment.dto';
import { BadRequestError } from '../errors/BadRequestError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { NotFoundError } from '../errors/NotFoundError';
import * as commentRepository from '../repositories/comment.repository';
import { ComplaintRepository } from '../repositories/complaint.repository';
import * as noticeRepository from '../repositories/notice.repository';

const validateCommentTarget = async (boardType: 'COMPLAINT' | 'NOTICE', boardId: bigint) => {
    const complaintRepo = new ComplaintRepository();
    if (boardType === 'NOTICE') {
        const notice = await noticeRepository.findNoticeById(boardId);
        if (!notice) {
            throw new NotFoundError('공지사항을 찾을 수 없습니다.');
        }

        return {
            noticeId: notice.id,
            complaintId: null,
        };
    }

    if (boardType === 'COMPLAINT') {
        const complaint = await complaintRepo.findById(boardId);
        if (!complaint) {
            throw new NotFoundError('민원을 찾을 수 없습니다.');
        }

        return {
            noticeId: null,
            complaintId: complaint.id,
        };
    }

    throw new BadRequestError('지원하지 않는 게시판 타입입니다.');
};

export const createComment = async (data: CreateCommentReqDto) => {
    const target = await validateCommentTarget(data.body.boardType, data.body.boardId);

    const comment = await commentRepository.createComment({
        userId: data.user.id,
        content: data.body.content,
        ...target,
    });

    return {
        comment: {
            id: comment.id.toString(),
            userId: comment.userId.toString(),
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            writerName: comment.User.name,
        },
        board: {
            id: data.body.boardId.toString(),
            boardType: data.body.boardType,
        },
    };
};

export const updateComment = async (data: UpdateCommentReqDto) => {
    const existingComment = await commentRepository.findCommentById(data.params.commentId);
    if (!existingComment) {
        throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.userId !== data.user.id) {
        throw new ForbiddenError('댓글 작성자만 수정할 수 있습니다.');
    }

    const updatedComment = await commentRepository.updateComment({
        commentId: data.params.commentId,
        content: data.body.content,
    });

    const boardType = updatedComment.noticeId ? 'NOTICE' : 'COMPLAINT';
    const boardId = updatedComment.noticeId ?? updatedComment.complaintId;

    return {
        comment: {
            id: updatedComment.id.toString(),
            userId: updatedComment.userId.toString(),
            content: updatedComment.content,
            createdAt: updatedComment.createdAt,
            updatedAt: updatedComment.updatedAt,
            writerName: updatedComment.User.name,
        },
        board: {
            id: boardId?.toString() ?? '',
            boardType,
        },
    };
};

export const deleteComment = async (data: DeleteCommentReqDto) => {
    const existingComment = await commentRepository.findCommentById(data.params.commentId);
    if (!existingComment) {
        throw new NotFoundError('댓글을 찾을 수 없습니다.');
    }

    const isAuthor = existingComment.userId === data.user.id;
    const isAdmin = data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN';

    if (!isAuthor && !isAdmin) {
        throw new ForbiddenError('댓글 작성자 또는 관리자만 삭제할 수 있습니다.');
    }

    await commentRepository.deleteComment(data.params.commentId);

    return {
        message: '정상적으로 삭제 처리되었습니다',
    };
};
