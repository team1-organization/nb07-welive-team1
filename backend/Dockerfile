# 1. 환경 설정 (Node.js 20 버전 사용)
FROM node:24-alpine

# 2. 컨테이너 내부 작업 디렉토리 생성
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 4. 소스 코드 복사
COPY . .

# 5. Prisma Client 생성 (중요: DB 모델 변경 시 필수)
RUN npx prisma generate

# 6. 포트 설정 (Express 기본 포트)
EXPOSE 3000

# 7. 실행 명령어 (개발 모드 실행)
CMD ["npm", "start"]