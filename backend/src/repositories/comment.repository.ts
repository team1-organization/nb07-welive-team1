import { prisma } from '../lib/prisma';

interface CreateCommentParams {
    userId: bigint;
    content: string;
    noticeId?: bigint | null;
    complaintId?: bigint | null;
}

interface UpdateCommentParams {
    commentId: bigint;
    content: string;
}

export const createComment = async (params: CreateCommentParams) => {
    return prisma.comment.create({
        data: { ...params },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const findCommentById = async (commentId: bigint) => {
    return prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const updateComment = async ({ commentId, content }: UpdateCommentParams) => {
    return prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
            User: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const deleteComment = async (commentId: bigint) => {
    return prisma.comment.delete({
        where: { id: commentId },
    });
};
