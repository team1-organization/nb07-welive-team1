import { describe, expect, it } from '@jest/globals';
import { createNoticeBodySchema, updateNoticeBodySchema } from '../src/dtos/notice.dto';

describe('Notice DTO - 핵심 검증', () => {
    const validBase = {
        category: 'MAINTENANCE',
        title: '테스트 공지',
        content: '내용입니다',
        boardId: '1',
    };

    // ========================
    // CREATE
    // ========================
    describe('createNoticeBodySchema', () => {
        it('정상 데이터는 통과한다', () => {
            const result = createNoticeBodySchema.safeParse({
                ...validBase,
                startDate: '2025-06-01T00:00:00Z',
                endDate: '2025-06-10T00:00:00Z',
            });

            expect(result.success).toBe(true);
        });

        it('일정 없이도 등록 가능하다', () => {
            const result = createNoticeBodySchema.safeParse(validBase);

            expect(result.success).toBe(true);
        });

        it('startDate만 있으면 실패한다', () => {
            const result = createNoticeBodySchema.safeParse({
                ...validBase,
                startDate: '2025-06-01T00:00:00Z',
            });

            expect(result.success).toBe(false);
        });

        it('endDate가 startDate보다 빠르면 실패한다', () => {
            const result = createNoticeBodySchema.safeParse({
                ...validBase,
                startDate: '2025-06-10T00:00:00Z',
                endDate: '2025-06-01T00:00:00Z',
            });

            expect(result.success).toBe(false);
        });
    });

    // ========================
    // UPDATE
    // ========================
     describe('updateNoticeBodySchema', () => {
    it('필드 하나만 수정해도 통과한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        title: '수정된 제목',
      });

      expect(result.success).toBe(true);
    });

    it('빈 객체면 실패한다', () => {
      const result = updateNoticeBodySchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('startDate만 수정해도 통과한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: '2025-06-01T00:00:00Z',
      });

      expect(result.success).toBe(true);
    });

    it('endDate만 수정해도 통과한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        endDate: '2025-06-10T00:00:00Z',
      });

      expect(result.success).toBe(true);
    });

    it('startDate와 endDate를 함께 보내고 순서가 올바르면 통과한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: '2025-06-01T00:00:00Z',
        endDate: '2025-06-10T00:00:00Z',
      });

      expect(result.success).toBe(true);
    });

    it('startDate와 endDate를 함께 보냈을 때 endDate가 더 빠르면 실패한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: '2025-06-10T00:00:00Z',
        endDate: '2025-06-01T00:00:00Z',
      });

      expect(result.success).toBe(false);
    });

    it('startDate와 endDate가 모두 null이면 통과한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: null,
        endDate: null,
      });

      expect(result.success).toBe(true);
    });

    it('startDate만 null이면 실패한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: null,
        endDate: '2025-06-10T00:00:00Z',
      });

      expect(result.success).toBe(false);
    });

    it('endDate만 null이면 실패한다', () => {
      const result = updateNoticeBodySchema.safeParse({
        startDate: '2025-06-01T00:00:00Z',
        endDate: null,
      });

      expect(result.success).toBe(false);
    });
  });
});