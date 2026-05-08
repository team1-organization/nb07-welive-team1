import axios from '@/shared/lib/axios';

export enum BoardType {
  NOTICE = 'NOTICE',
  POLL = 'POLL',
  COMPLAINT = 'COMPLAINT',
}

export interface IComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  writerName: string;
}


interface CreateCommentResponse {
  message: string; 
  data: {        
    comment: IComment;
    board: {
      id: string;
      boardType: BoardType;
    };
  };
}

export const createComment = async ({
  boardId,
  boardType,
  content,
}: {
  boardId: string;
  boardType: BoardType;
  content: string;
}): Promise<IComment> => {
  const res = await axios.post<CreateCommentResponse>('/comments', {
    boardId,
    boardType,
    content,
  });

  return res.data.data.comment; 
};
// 댓글 수정
export const updateComment = async ({
  commentId,
  content,
  boardId,
  boardType,
}: {
  commentId: string;
  content: string;
  boardId: string;
  boardType: BoardType;
}) => {
  const res = await axios.patch(`/comments/${commentId}`, {
    content,
    boardId,
    boardType,
  });
  return res.data;
};

// 댓글 삭제
export const deleteComment = async (commentId: string) => {
  const res = await axios.delete(`/comments/${commentId}`);
  return res.data;
};
