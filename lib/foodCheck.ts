import type { PhaseKey, SlotKind } from "./schedule";

export type Verdict = "ok" | "nope";

/** Keywords forbidden in ALL phases after Boot (alcohol / junk / desserts). */
const UNIVERSAL_NOPE: string[] = [
  // alcohol
  "술", "맥주", "소주", "와인", "막걸리", "칵테일", "하이볼", "위스키",
  "alcohol", "beer", "wine", "soju", "liquor", "whisky", "whiskey", "cocktail",
  // junk food / desserts
  "과자", "쿠키", "초콜릿", "초코", "사탕", "젤리", "아이스크림", "케이크", "도넛",
  "cookie", "candy", "chocolate", "dessert", "cake", "donut", "ice cream",
  // soda / sugary drinks
  "콜라", "사이다", "탄산", "주스", "에이드", "밀크티",
  "coke", "soda", "juice", "cola", "sprite",
  // deep-fried
  "튀김", "치킨", "피자", "햄버거",
  "fried", "pizza", "burger",
];

/** Boot phase allowlist — only shakes, water, coffee, tea, leafy greens. */
const BOOT_ALLOW: string[] = [
  "쉐이크", "셰이크", "단백질", "프로틴",
  "shake", "protein",
  "물", "water",
  "블랙커피", "아메리카노", "커피",
  "black coffee", "americano",
  "차", "녹차", "허브차", "민트차", "루이보스",
  "tea", "green tea", "herbal",
  "채소", "샐러드", "상추", "시금치", "케일", "브로콜리", "오이", "아스파라거스",
  "salad", "lettuce", "spinach", "kale", "broccoli", "cucumber", "asparagus",
  "계란흰자",
  "egg white",
];

/** Switch phase forbiddens — carbs + processed foods. */
const SWITCH_NOPE: string[] = [
  "밥", "쌀", "라이스", "볶음밥", "비빔밥", "김밥", "덮밥",
  "rice",
  "빵", "토스트", "크로와상", "베이글", "샌드위치",
  "bread", "toast", "croissant", "bagel", "sandwich",
  "라면", "국수", "파스타", "우동", "쫄면", "냉면", "스파게티",
  "ramen", "noodle", "pasta", "spaghetti", "udon",
  "삼겹살", "곱창", "베이컨",
  "bacon", "pork belly",
  "설탕", "시럽", "꿀",
  "sugar", "syrup", "honey",
  "떡", "떡볶이",
  "rice cake", "tteokbokki",
];

/** Booster / Maintain — only major red flags; carbs OK in moderation. */
const LATE_PHASE_NOPE: string[] = [
  "야식",
  "late night",
];

const SHAKE_HINT: string[] = [
  "쉐이크", "셰이크", "단백질", "프로틴",
  "shake", "protein",
];

const WORKOUT_HINT: string[] = [
  "산책", "걸었", "걷기", "운동", "스쿼트", "스쾃", "유산소", "근력", "런닝", "러닝", "조깅", "요가", "필라테스", "자전거",
  "walk", "run", "jog", "cardio", "squat", "strength", "yoga", "pilates", "bike", "workout",
];

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function anyMatch(text: string, list: string[]): boolean {
  const t = norm(text);
  if (!t) return false;
  return list.some((k) => t.includes(k.toLowerCase()));
}

/** Validate one food/activity entry against a phase. */
export function validateEntry(text: string, phase: PhaseKey): Verdict {
  if (anyMatch(text, UNIVERSAL_NOPE)) return "nope";

  if (phase === "boot") {
    // Allowlist only — everything outside is "nope"
    return anyMatch(text, BOOT_ALLOW) ? "ok" : "nope";
  }

  if (phase === "switch") {
    return anyMatch(text, SWITCH_NOPE) ? "nope" : "ok";
  }

  // booster / maintain
  return anyMatch(text, LATE_PHASE_NOPE) ? "nope" : "ok";
}

/** True if the entry text loosely matches the slot kind's expectation. */
export function matchesSlotKind(text: string, kind: SlotKind): boolean {
  switch (kind) {
    case "shake":
      return anyMatch(text, SHAKE_HINT);
    case "workout":
      return anyMatch(text, WORKOUT_HINT);
    case "meal":
    case "snack":
      // any real food keyword is fine; a non-empty entry counts
      return norm(text).length > 0;
    case "fast-start":
    case "fast-end":
      return false;
  }
}

/** Slot is considered "done" if it has at least one entry that validates OK AND loosely matches the slot kind. */
export function isSlotDone(
  entries: { text: string }[],
  phase: PhaseKey,
  kind: SlotKind
): boolean {
  if (entries.length === 0) return false;
  return entries.some(
    (e) =>
      validateEntry(e.text, phase) === "ok" && matchesSlotKind(e.text, kind)
  );
}
