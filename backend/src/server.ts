import 'dotenv/config';
import server from './app';

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행 중...`);
});
