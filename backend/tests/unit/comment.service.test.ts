import { ForbiddenError } from '../../src/errors/ForbiddenError';
import { NotFoundError } from '../../src/errors/NotFoundError';
import * as commentRepository from '../../src/repositories/comment.repository';
import { ComplaintRepository } from '../../src/repositories/complaint.repository';
import * as noticeRepository from '../../src/repositories/notice.repository';
import * as commentService from '../../src/services/comment.service';

jest.mock('../../src/repositories/comment.repository');
jest.mock('../../src/repositories/notice.repository');
jest.mock('../../src/repositories/complaint.repository');

describe('comment.service', () => {
  const mockUser = {
    id: 1n,
    role: 'USER' as const,
  };

  const mockAdminUser = {
    id: 99n,
    role: 'ADMIN' as const,
  };

  const mockComplaintRepo = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (ComplaintRepository as jest.Mock).mockImplementation(() => mockComplaintRepo);
  });

  describe('createComment', () => {
    it('NOTICE 댓글 생성 성공', async () => {
      (noticeRepository.findNoticeById as jest.Mock).mockResolvedValue({
        id: 10n,
      });

      (commentRepository.createComment as jest.Mock).mockResolvedValue({
        id: 100n,
        userId: 1n,
        content: '공지 댓글',
        createdAt: new Date('2025-06-19T00:00:00.000Z'),
        updatedAt: new Date('2025-06-19T00:00:00.000Z'),
        User: {
          name: '홍길동',
        },
      });

      const result = await commentService.createComment({
        user: mockUser,
        body: {
          content: '공지 댓글',
          boardType: 'NOTICE',
          boardId: 10n,
        },
      });

      expect(noticeRepository.findNoticeById).toHaveBeenCalledWith(10n);
      expect(commentRepository.createComment).toHaveBeenCalledWith({
        userId: 1n,
        content: '공지 댓글',
        noticeId: 10n,
        complaintId: null,
      });

      expect(result).toEqual({
        comment: {
          id: '100',
          userId: '1',
          content: '공지 댓글',
          createdAt: new Date('2025-06-19T00:00:00.000Z'),
          updatedAt: new Date('2025-06-19T00:00:00.000Z'),
          writerName: '홍길동',
        },
        board: {
          id: '10',
          boardType: 'NOTICE',
        },
      });
    });

    it('COMPLAINT 댓글 생성 성공', async () => {
      mockComplaintRepo.findById.mockResolvedValue({
        id: 20n,
      });

      (commentRepository.createComment as jest.Mock).mockResolvedValue({
        id: 101n,
        userId: 1n,
        content: '민원 댓글',
        createdAt: new Date('2025-06-19T00:00:00.000Z'),
        updatedAt: new Date('2025-06-19T00:00:00.000Z'),
        User: {
          name: '홍길동',
        },
      });

      const result = await commentService.createComment({
        user: mockUser,
        body: {
          content: '민원 댓글',
          boardType: 'COMPLAINT',
          boardId: 20n,
        },
      });

      expect(mockComplaintRepo.findById).toHaveBeenCalledWith(20n);
      expect(commentRepository.createComment).toHaveBeenCalledWith({
        userId: 1n,
        content: '민원 댓글',
        noticeId: null,
        complaintId: 20n,
      });

      expect(result.board).toEqual({
        id: '20',
        boardType: 'COMPLAINT',
      });
    });

    it('NOTICE 대상이 없으면 NotFoundError', async () => {
      (noticeRepository.findNoticeById as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.createComment({
          user: mockUser,
          body: {
            content: '댓글',
            boardType: 'NOTICE',
            boardId: 999n,
          },
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('COMPLAINT 대상이 없으면 NotFoundError', async () => {
      mockComplaintRepo.findById.mockResolvedValue(null);

      await expect(
        commentService.createComment({
          user: mockUser,
          body: {
            content: '댓글',
            boardType: 'COMPLAINT',
            boardId: 999n,
          },
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateComment', () => {
    it('댓글이 없으면 NotFoundError', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.updateComment({
          user: mockUser,
          commentId: 1n,
          body: {
            content: '수정',
          },
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('작성자가 아니면 ForbiddenError', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 2n,
      });

      await expect(
        commentService.updateComment({
          user: mockUser,
          commentId: 1n,
          body: {
            content: '수정',
          },
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('작성자면 댓글 수정 성공', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 1n,
      });

      (commentRepository.updateComment as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 1n,
        content: '수정된 댓글',
        createdAt: new Date('2025-06-19T00:00:00.000Z'),
        updatedAt: new Date('2025-06-20T00:00:00.000Z'),
        noticeId: 10n,
        complaintId: null,
        User: {
          name: '홍길동',
        },
      });

      const result = await commentService.updateComment({
        user: mockUser,
        commentId: 1n,
        body: {
          content: '수정된 댓글',
        },
      });

      expect(commentRepository.updateComment).toHaveBeenCalledWith({
        commentId: 1n,
        content: '수정된 댓글',
      });

      expect(result.board).toEqual({
        id: '10',
        boardType: 'NOTICE',
      });
    });
  });

  describe('deleteComment', () => {
    it('댓글이 없으면 NotFoundError', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue(null);

      await expect(
        commentService.deleteComment({
          user: mockUser,
          commentId: 1n,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('작성자도 관리자도 아니면 ForbiddenError', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 2n,
      });

      await expect(
        commentService.deleteComment({
          user: mockUser,
          commentId: 1n,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('작성자면 삭제 성공', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 1n,
      });

      (commentRepository.deleteComment as jest.Mock).mockResolvedValue({
        id: 1n,
      });

      await commentService.deleteComment({
        user: mockUser,
        commentId: 1n,
      });

      expect(commentRepository.deleteComment).toHaveBeenCalledWith(1n);
    });

    it('관리자면 삭제 성공', async () => {
      (commentRepository.findCommentById as jest.Mock).mockResolvedValue({
        id: 1n,
        userId: 2n,
      });

      (commentRepository.deleteComment as jest.Mock).mockResolvedValue({
        id: 1n,
      });

      await commentService.deleteComment({
        user: mockAdminUser,
        commentId: 1n,
      });

      expect(commentRepository.deleteComment).toHaveBeenCalledWith(1n);
    });
  });
});