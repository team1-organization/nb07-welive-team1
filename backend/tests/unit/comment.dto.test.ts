import { CreateCommentDto, DeleteCommentParamSchema } from '../../src/dtos/comment.dto';

describe('Comment DTO 유닛 테스트', () => { 
  
  describe('CreateCommentDto (댓글 생성)', () => {
    it('올바른 데이터가 들어오면 통과해야 한다', () => {
      const validData = {
        content: '안녕하세요, 테스트 댓글입니다.',
        boardType: 'NOTICE',
        boardId: '123' // 문자열로 들어와도 OK
      };
      
      const result = CreateCommentDto.safeParse(validData);
      expect(result.success).toBe(true);
      
      // 변환 결과 확인 (boardId가 BigInt로 바뀌었는지)
      if (result.success) {
        expect(typeof result.data.boardId).toBe('bigint');
        expect(result.data.boardId).toBe(123n);
      }
    });     
    

    it('boardType이 POLL이나 다른 값인 경우 실패해야 한다', () => {
      const invalidData = {
        content: '내용',
        boardType: 'POLL', // 허용되지 않은 타입
        boardId: '123'
      };
      
      const result = CreateCommentDto.safeParse(invalidData);
      expect(result.success).toBe(false);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    
    expect(firstIssue?.message).toContain('민원(COMPLAINT) 또는 공지사항(NOTICE)');
  }
    });

    it('내용(content)이 비어있으면 실패해야 한다', () => {
      const invalidData = {
        content: '',
        boardType: 'NOTICE',
        boardId: '123'
      };
      const result = CreateCommentDto.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteCommentParamSchema (경로 파라미터)', () => {
    it('숫자 형태의 문자열 ID는 BigInt로 변환되어 통과해야 한다', () => {
      const result = DeleteCommentParamSchema.safeParse({ commentId: '999' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.commentId).toBe(999n);
      }
    });

    it('ID가 숫자가 아닌 경우 실패해야 한다', () => {
      const result = DeleteCommentParamSchema.safeParse({ commentId: 'abc' });
      expect(result.success).toBe(false);
    });
  });
}); 