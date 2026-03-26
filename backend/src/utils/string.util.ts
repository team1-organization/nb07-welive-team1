/**
 * 문자열이 비었는지 확인 (Type Guard)
 * null, undefined, 빈 문자열(""), 공백만 있는 문자열("   ")을 모두 빈 값으로 간주합니다.
 * @param value 검사할 문자열 또는 null/undefined
 * @returns 빈 값일 경우 true
 * @example
 * if (isEmpty(name)) { throw new Error("이름을 입력하세요."); }
 */
export function isEmpty(value: string | null | undefined): value is null | undefined | '' {
  return value === null || value === undefined || value.trim().length === 0;
}

/**
 * 문자열 정규화 (Normalization)
 * 문자열이 존재하면 앞뒤 공백을 제거(trim)하여 반환하고, 비어있으면 null을 반환합니다.
 * DB 저장 전 데이터를 깔끔하게 정리할 때 유용합니다.
 * @param value 정규화할 문자열
 * @returns 정제된 문자열 또는 null
 * @example
 * const title = normalizeString("  공백이 섞인 제목  "); // "공백이 섞인 제목"
 * const empty = normalizeString("   "); // null
 */
export function normalizeString(value: string | null | undefined): string | null {
  return isEmpty(value) ? null : value.trim();
}

/**
 * 문자열 대체값 반환 (Fallback)
 * 첫 번째 인자(a)가 비어있을 경우 두 번째 인자(b)를 반환합니다.
 * @param a 우선순위가 높은 값
 * @param b a가 없을 때 반환할 기본값
 * @returns a 또는 b
 * @example
 * const displayName = fallback(user.nickname, user.username);
 */
export function fallback(a: string | null | undefined, b: string): string {
  return isEmpty(a) ? b : a;
}

/**
 * Null/Undefined 체크 및 기본값 할당 (Generic)
 * 값이 정확히 null 또는 undefined일 경우에만 설정된 기본값을 반환합니다.
 * @param value 검사할 값 (어떤 타입이든 가능)
 * @param defaultVal 값이 없을 때 반환할 기본값
 * @returns 입력값 또는 기본값
 * @example
 * const limit = defaultValue(params.limit, 10);
 */
export function defaultValue<T>(value: T | null | undefined, defaultVal: T): T {
  return value === null || value === undefined ? defaultVal : value;
}

/**
 * 안전한 문자열 변환기 (Safe Casting)
 * 어떤 타입의 값이 들어와도 문자열로 안전하게 변환합니다.
 * null이나 undefined는 빈 문자열("")로 변환되어 런타임 에러를 방지합니다.
 * @param value 변환할 임의의 값
 * @returns 변환된 문자열
 * @example
 * safeString(null); // ""
 * safeString(123);  // "123"
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}
