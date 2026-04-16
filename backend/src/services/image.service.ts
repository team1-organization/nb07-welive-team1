import * as userRepository from '../repositories/user.repository';
import { s3 } from '../utils/s3.util';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

interface S3File extends Express.Multer.File {
    key: string;
    location: string;
}

export async function imageUpload(userId: string, file: Express.Multer.File) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error('존재하지 않는 사용자입니다.');

    const s3File = file as S3File;
    console.log(`file: ${JSON.stringify(file)}`);
    await userRepository.updateProfileImage(userId, s3File.key);

    return s3File.location;
}

export async function imageDelete(userId: string) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error('존재하지 않는 사용자입니다.');

    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: user.profileImage!,
        }),
    );
    return await userRepository.updateProfileImage(userId, null);
}

export async function imageUpdate(userId: string, file: Express.Multer.File) {
    // 사용자 확인
    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error('존재하지 않는 사용자입니다.');
    // 이미지 확인
    // 이미지 삭제
    await imageDelete(userId);
    // user 테이블에 profileImage 이미지 변경
    // 변경내용 리턴
    return await imageUpload(userId, file);
}
