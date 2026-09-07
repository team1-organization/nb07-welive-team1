# 1. 환경 설정 (Node.js 20 버전 사용)
FROM node:24-alpine

# 2. 컨테이너 내부 작업 디렉토리 생성
WORKDIR /app

# 3. 의존성 파일 복사 및 설치 (lock 파일 기준 재현 가능한 설치)
COPY package*.json ./
RUN npm ci

# 4. 소스 코드 복사
COPY . .

# 5. Prisma Client 생성 (중요: DB 모델 변경 시 필수)
RUN npx prisma generate

# 6. 포트 설정 (Heroku container stack은 런타임에 $PORT를 주입하므로 EXPOSE는 문서 목적)
EXPOSE 3000

# 7. 실행 명령어 (server.ts가 process.env.PORT를 읽어 바인딩함)
CMD ["npm", "start"]