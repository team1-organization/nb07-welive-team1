import { fetchResidentNoticeDetail } from '@/entities/notice/api/noticeApi';
import { BoardType } from '@/shared/comments/api/comment.api';
import CommentSection from '@/shared/comments/ui/CommentSection';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type NoticeDetail = {
  title: string;
  category: string;
  createdAt: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  content: string;
  boardName: string;
  pollResult?: {
    id: string;
    title: string;
    options: { id: string; title: string; voteCount: number }[];
    totalVotes: number;
  } | null;
  comments: {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    writerName: string;
  }[];
};

const CATEGORY_LABEL_MAP = {
  MAINTENANCE: '정기점검',
  EMERGENCY: '긴급점검',
  COMMUNITY: '공동생활',
  RESIDENT_VOTE: '주민투표',
  RESIDENT_COUNCIL: '주민회의',
  ETC: '기타',
} as const;

export default function DetailResidentNoticePage() {
  const router = useRouter();
  const { id: noticeId } = router.query;
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  useEffect(() => {
    if (!noticeId || typeof noticeId !== 'string') return;

    const fetchData = async () => {
      try {
        const data = await fetchResidentNoticeDetail(noticeId);
        setNotice(data);
      } catch (err) {
        console.error('상세 공지사항 불러오기 실패', err);
      }
    };

    fetchData();
  }, [noticeId]);

  if (!notice) {
    return <div className='py-[100px] text-center text-gray-500'>불러오는 중...</div>;
  }

  return (
    <div className='text-gray-900'>
      <div className='border-b border-gray-200'>
        <div className='mb-5 text-sm text-gray-500'>공지사항</div>
        <h2 className='text-[26px] font-bold'>{notice.title}</h2>
        <div className='flex justify-between pt-8 pb-4.5'>
          <ul className='flex gap-4 text-[14px] text-gray-400'>
            <li className='text-main'>
              {CATEGORY_LABEL_MAP[notice.category as keyof typeof CATEGORY_LABEL_MAP]}
            </li>
            <li className='text-gray-200'>|</li>
            <li className='text-gray-500'>{formatDate(notice.createdAt)}</li>
            <li className='text-gray-200'>|</li>
            <li>조회수&nbsp;&nbsp;{notice.viewsCount}</li>
            <li className='text-gray-200'>|</li>
            <li>댓글수&nbsp;&nbsp;{notice.commentsCount}</li>
          </ul>
        </div>
      </div>

      <div className='mt-[40px] mb-[90px] text-lg leading-relaxed whitespace-pre-wrap'>
        {notice.content}
      </div>
      {notice.pollResult && (
        <div className='mb-[90px] rounded-xl border border-gray-200 bg-gray-50 p-8'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-main'>📊 투표 결과 안내</h3>
            <span className='text-sm text-gray-500'>총 {notice.pollResult.totalVotes}명 참여</span>
          </div>
          
          <div className='flex flex-col gap-5'>
            {notice.pollResult.options.map((option) => {
              const percentage = notice.pollResult!.totalVotes > 0 
                ? Math.round((option.voteCount / notice.pollResult!.totalVotes) * 100) 
                : 0;

              return (
                <div key={option.id} className='flex flex-col gap-2'>
                  <div className='flex justify-between font-medium'>
                    <span>{option.title}</span>
                    <span>{option.voteCount}표 ({percentage}%)</span>
                  </div>
                  <div className='h-3 w-full overflow-hidden rounded-full bg-gray-200'>
                    <div 
                      className='bg-main h-full transition-all duration-500' 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <CommentSection
        initialComments={notice.comments}
        boardId={noticeId as string}
        commentCount={notice.commentsCount}
        boardType={BoardType.NOTICE}
      />
    </div>
  );
}
