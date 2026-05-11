/**
 * 값이 유효한 숫자인지 확인합니다.
 * null, undefined, NaN, Infinity, 빈 문자열 등은 유효하지 않은 값으로 처리합니다.
 * @param {*} value - 검사할 값
 * @returns {boolean} 유효한 숫자이면 true
 */
export function isNumeric(value: unknown): value is number {
    // Number.isFinite NaN, Infinity, undefined, null 등을 모두 false로 처리합니다.
    // 문자열이 들어올 경우 강제 형변환하여 처리합니다.
    return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 값을 안전하게 숫자로 변환합니다.
 * 변환에 실패하거나 유효하지 않은 숫자일 경우 기본값을 반환합니다.
 * @param {*} value - 변환할 값
 * @param {number} defaultVal - 변환 실패 시 반환할 기본값 (기본값: 0)
 * @returns {number} 변환된 숫자 또는 기본값
 */
export function safeNumber(value: unknown, defaultVal: number = 0): number {
    if (!isNumeric(value)) return defaultVal;

    return isNumeric(value) ? value : defaultVal;
}

/**
 * 값이 양수(0보다 큼)인지 확인합니다.
 * 유효한 숫자가 아니면 false를 반환합니다.
 * @param {*} value - 검사할 값
 * @returns {boolean} 양수이면 true
 */
export function isPositive(value: unknown): boolean {
    // 기본값을 -1로 하여 유효하지 않은 값은 false가 되도록 유도
    return safeNumber(value, NaN) > 0;
}

/**
 * 값이 정수(Integer)인지 확인합니다.
 * @param {*} value - 검사할 값
 * @returns {boolean} 정수이면 true
 */
export function isInteger(value: unknown): boolean {
    return Number.isInteger(safeNumber(value, NaN));
}

/**
 * 숫자를 지정된 형식으로 포맷합니다 (예: 통화 형식).
 * @param {number} value - 포맷할 숫자
 * @param {string} locale - 사용할 로케일 (예: 'ko-KR', 'en-US')
 * @param {string} style - 포맷 스타일 ('decimal', 'currency', 'percent')
 * @returns {string} 포맷된 문자열
 */
export function formatNumber(value: unknown, locale: string = 'ko-KR', style: Intl.NumberFormatOptions = { style: 'decimal' }): string {
    const num = safeNumber(value, 0);
    try {
        return new Intl.NumberFormat(locale, style).format(num);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('숫자 포맷 오류:', error);
        return String(num); // 원본 숫자 문자열 반환
    }
}

/**
 * 숫자를 한국 통화 (KRW) 형식으로 포맷합니다.
 * @param {number} value - 포맷할 숫자
 * @returns {string} 예: "1,234,567원"
 */
export function formatCurrency(value: unknown): string {
    const formatted = formatNumber(value, 'ko-KR', {
        style: 'decimal',
        maximumFractionDigits: 0,
    });
    return `${formatted}원`;
}
