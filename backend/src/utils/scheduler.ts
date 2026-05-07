import cron from 'node-cron';
import { PollService } from 'src/services/poll.service';

export const initializeScheduler = (pollService: PollService): void => {
    cron.schedule('* * * * *', async () => {
        try {
            await pollService.autoCloseExpiredPolls();
        } catch (error) {
            console.error('[Scheduler] 투표 자동 종료 중 치명적 오류 발생:', error);
        }
    });

    console.log('[Scheduler] 투표 자동 종료 스케줄러가 등록되었습니다.');
};
