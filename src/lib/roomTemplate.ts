// 방 타입 3단계 템플릿 — 첨부 파일 "방타입_템플릿.txt" 기준.
// DB enum과 동기화되어 있어야 함 (room_category, window_type, room_size_type).

export const ROOM_CATEGORIES = [
  { value: "mini", label: "미니룸", desc: "공용 화장실/샤워실" },
  { value: "shower", label: "샤워룸", desc: "개인 샤워부스 포함" },
  { value: "studio", label: "원룸형", desc: "개인 화장실/샤워실 포함" },
] as const;

export const WINDOW_TYPES = [
  { value: "external", label: "외창", desc: "건물 밖으로 난 창" },
  { value: "internal", label: "내창", desc: "복도로 난 창" },
] as const;

export const ROOM_SIZES = [
  { value: "standard", label: "기본형" },
  { value: "wide", label: "넓은방", desc: "1.5배 이상" },
  { value: "duplex", label: "복층형" },
] as const;

// 개별 옵션 (다중 선택)
export const ROOM_OPTIONS = [
  { value: "aircon", label: "개별 에어컨" },
  { value: "washer", label: "개별 세탁기" },
  { value: "fridge", label: "개인 냉장고" },
] as const;

// 특수 태그 (다중 선택)
export const ROOM_TAGS = [
  { value: "netflix", label: "넷플릭스 지원" },
  { value: "twin_bed", label: "침대 2개(2인실)" },
] as const;

export type RoomCategory = (typeof ROOM_CATEGORIES)[number]["value"];
export type WindowKind = (typeof WINDOW_TYPES)[number]["value"];
export type RoomSize = (typeof ROOM_SIZES)[number]["value"];

const CAT_LABEL: Record<RoomCategory, string> = {
  mini: "미니룸",
  shower: "샤워룸",
  studio: "원룸형",
};
const WIN_LABEL: Record<WindowKind, string> = { external: "외창", internal: "내창" };
const SIZE_LABEL: Record<RoomSize, string> = {
  standard: "기본형",
  wide: "넓은방",
  duplex: "복층형",
};

/**
 * 자동 명명: "원룸형 · 외창 · 넓은방" 형태로 조합.
 * 누락된 단계는 건너뜀.
 */
export function buildAutoRoomName(input: {
  category?: RoomCategory | null;
  window_type?: WindowKind | null;
  size_type?: RoomSize | null;
}): string {
  const parts: string[] = [];
  if (input.category) parts.push(CAT_LABEL[input.category]);
  if (input.window_type) parts.push(WIN_LABEL[input.window_type]);
  if (input.size_type && input.size_type !== "standard") parts.push(SIZE_LABEL[input.size_type]);
  return parts.join(" · ");
}
