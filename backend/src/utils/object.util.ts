/**
 * 객체 내의 null이나 undefined인 필드를 제거 (Compact)
 * 주로 수정(Update) API에서 클라이언트가 보내지 않은 값들을 제외하고 DB에 전달할 때 사용합니다.
 * @param obj 가공할 객체
 * @returns 값이 존재하지 않는 키가 제거된 새로운 객체
 * @example
 * const updated = compact({ title: '수정됨', content: null }); // { title: '수정됨' }
 */
export function compact<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)) as Partial<T>;
}

/**
 * 객체에서 특정 키(Keys)만 추출하여 새로운 객체 생성 (Pick)
 * @param obj 원본 객체
 * @param keys 추출할 키 배열
 * @example
 * const summary = pick(task, ['id', 'title']); // { id: '1', title: '숙제' }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) result[key] = obj[key];
    });
    return result;
}

/**
 * 객체에서 특정 키(Keys)를 제외한 나머지로 새로운 객체 생성 (Omit)
 * 민감한 정보(비밀번호 등)를 제외하고 데이터를 전달할 때 유용합니다.
 * @param obj 원본 객체
 * @param keys 제외할 키 배열
 * @example
 * const publicInfo = omit(user, ['password']);
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => {
        delete result[key];
    });
    return result as Omit<T, K>;
}

/**
 * 객체가 비어있는지 확인 ({})
 * @param obj 검사할 객체
 * @example
 * isEmptyObject({}); // true
 */
export function isEmptyObject(obj: object): boolean {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * 객체 내의 모든 BigInt 값을 문자열로 재귀적 변환
 * JSON.stringify 시 BigInt 에러를 방지하고 프론트엔드로 안전하게 전달하기 위해 사용합니다.
 * @param obj BigInt가 포함된 객체 또는 배열
 * @example
 * const safeData = serializeBigInt(prismaResult);
 */
export function serializeBigInt(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

/**
 * 객체 내부의 중첩된 객체까지 모두 새로운 참조로 복사합니다.
 * @param obj 복사할 객체
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
}
