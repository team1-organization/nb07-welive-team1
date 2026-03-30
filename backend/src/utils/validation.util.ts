/**
 * 이메일 형식 유효성 검사
 * @param value 검사할 문자열
 * @example isEmail('user@example.com') // true
 */
export function isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}

/**
 * 비밀번호 정책 검사 (최소 8자, 영문, 숫자 포함)
 * @param value 검사할 비밀번호 문자열
 * @example isStrongPassword('pass1234') // true
 */
export function isStrongPassword(value: string): boolean {
    return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

/**
 * 시작일과 종료일의 논리적 타당성 검사 (시작일 <= 종료일)
 * @param start 시작 날짜
 * @param end 종료 날짜
 * @example isValidDateRange('2024-01-01', '2024-01-02') // true
 */
export function isValidDateRange(start: Date | string, end: Date | string): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
    return startDate <= endDate;
}

/**
 * 값이 유효한 숫자인지 확인 (문자열로 된 숫자 포함)
 * @param value 검사할 값 (unknown)
 * @example isNumeric('123.45') // true
 */
export function isNumeric(value: unknown): boolean {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return !isNaN(parseFloat(value)) && isFinite(Number(value));
    return false;
}

/**
 * URL 형식 유효성 검사
 * @param url 검사할 URL 문자열
 * @example isValidUrl('https://google.com') // true
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * 문자열의 최대/최소 길이 검사 (공백 제외)
 * @param value 검사할 문자열
 * @param min 최소 길이
 * @param max 최대 길이
 * @example isLengthBetween('안녕하세요', 2, 10) // true
 */
export function isLengthBetween(value: string, min: number, max: number): boolean {
    const length = value.trim().length;
    return length >= min && length <= max;
}

/**
 * 필수 필드들이 객체 내에 존재하는지 확인 (undefined, null, 빈 문자열 체크)
 * @param obj 검사할 객체
 * @param fields 필수 필드 키 배열
 * @example hasRequiredFields({ title: '숙제' }, ['title']) // true
 */
export function hasRequiredFields<T extends object>(obj: T, fields: (keyof T)[]): boolean {
    return fields.every((field) => obj[field] !== undefined && obj[field] !== null && obj[field] !== '');
}

/**
 * 특정 날짜가 현재 시간보다 이후(미래)인지 확인
 * @param date 검사할 날짜
 * @example isFutureDate('2099-12-31') // true
 */
export function isFutureDate(date: Date | string): boolean {
    const target = new Date(date);
    const now = new Date();
    return target > now;
}

/**
 * 파일명이 허용된 확장자 목록에 포함되는지 확인
 * @param fileName 확장자를 포함한 파일명
 * @param extensions 허용할 확장자 배열 (예: ['jpg', 'png'])
 * @example isAllowedExtension('image.png', ['png', 'jpg']) // true
 */
export function isAllowedExtension(fileName: string, extensions: string[]): boolean {
    const part = fileName.split('.');
    if (part.length < 2) return false;

    const ext = part[part.length - 1]?.toLowerCase() || '';
    return extensions.map((e) => e.toLowerCase()).includes(ext);
}

/**
 * 문자열을 BigInt로 안전하게 변환 가능한지 확인
 * @param value 검사할 문자열
 * @example isBigIntString('9007199254740991') // true
 */
export function isBigIntString(value: string): boolean {
    if (!value) return false;
    try {
        BigInt(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * 문자열이 유효한 JSON 형식인지 확인
 * @param value 검사할 JSON 문자열
 * @example isValidJson('{"key": "value"}') // true
 */
export function isValidJson(value: string): boolean {
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * 값이 허용된 리스트(Enum 또는 배열)에 포함되어 있는지 확인
 * @param value 검사할 값
 * @param list 허용된 값들의 readonly 배열
 * @example isInList('TODO', ['TODO', 'DONE'] as const) // true
 */
export function isInList<T>(value: any, list: readonly T[]): value is T {
    return list.includes(value);
}
