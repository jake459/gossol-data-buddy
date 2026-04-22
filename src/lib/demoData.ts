// 데모 모드 정적 예시 데이터 — 실제 DB 호출 없이 모든 메뉴를 둘러볼 수 있도록 구성

export type DemoBranch = {
  id: string;
  name: string;
  address: string;
  phone: string;
};

export type DemoRoom = {
  id: string;
  room_number: string;
  floor: number;
  status: "occupied" | "vacant" | "cleaning" | "maintenance";
  monthly_rent: number;
  tenant_id?: string;
};

export type DemoTenant = {
  id: string;
  name: string;
  phone: string;
  emergency_contact: string;
  room_id: string;
  room_number: string;
  status: "active" | "overdue" | "moved_out";
  move_in_date: string;
  move_out_date?: string;
  monthly_rent: number;
  deposit: number;
  payment_day: number;
  memo?: string;
};

export type DemoInvoice = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  due_date: string;
  status: "paid" | "unpaid" | "overdue";
  paid_at?: string;
};

export type DemoEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  kind: "move_in" | "move_out" | "inspection" | "room_tour" | "memo";
  memo?: string;
};

export const DEMO_BRANCHES: DemoBranch[] = [
  { id: "b1", name: "강남 1호점 (데모)", address: "서울 강남구 테헤란로 123", phone: "02-555-1234" },
  { id: "b2", name: "신촌 2호점 (데모)", address: "서울 서대문구 신촌로 45", phone: "02-555-5678" },
];

export const DEMO_ROOMS: DemoRoom[] = [
  { id: "r1", room_number: "201", floor: 2, status: "occupied", monthly_rent: 380000, tenant_id: "t1" },
  { id: "r2", room_number: "202", floor: 2, status: "occupied", monthly_rent: 380000, tenant_id: "t2" },
  { id: "r3", room_number: "203", floor: 2, status: "vacant", monthly_rent: 380000 },
  { id: "r4", room_number: "204", floor: 2, status: "cleaning", monthly_rent: 380000 },
  { id: "r5", room_number: "301", floor: 3, status: "occupied", monthly_rent: 420000, tenant_id: "t3" },
  { id: "r6", room_number: "302", floor: 3, status: "occupied", monthly_rent: 420000, tenant_id: "t4" },
  { id: "r7", room_number: "303", floor: 3, status: "occupied", monthly_rent: 420000, tenant_id: "t5" },
  { id: "r8", room_number: "304", floor: 3, status: "vacant", monthly_rent: 420000 },
  { id: "r9", room_number: "401", floor: 4, status: "occupied", monthly_rent: 450000, tenant_id: "t6" },
  { id: "r10", room_number: "402", floor: 4, status: "occupied", monthly_rent: 450000, tenant_id: "t7" },
  { id: "r11", room_number: "403", floor: 4, status: "occupied", monthly_rent: 450000, tenant_id: "t8" },
  { id: "r12", room_number: "404", floor: 4, status: "maintenance", monthly_rent: 450000 },
  { id: "r13", room_number: "501", floor: 5, status: "occupied", monthly_rent: 500000, tenant_id: "t9" },
  { id: "r14", room_number: "502", floor: 5, status: "occupied", monthly_rent: 500000, tenant_id: "t10" },
];

export const DEMO_TENANTS: DemoTenant[] = [
  { id: "t1", name: "김민수", phone: "010-1111-2222", emergency_contact: "010-9000-1111", room_id: "r1", room_number: "201", status: "active", move_in_date: "2025-09-01", monthly_rent: 380000, deposit: 500000, payment_day: 1, memo: "조용한 분, 야간 근무" },
  { id: "t2", name: "이서연", phone: "010-2222-3333", emergency_contact: "010-9000-2222", room_id: "r2", room_number: "202", status: "overdue", move_in_date: "2025-07-15", monthly_rent: 380000, deposit: 500000, payment_day: 5 },
  { id: "t3", name: "박지훈", phone: "010-3333-4444", emergency_contact: "010-9000-3333", room_id: "r5", room_number: "301", status: "active", move_in_date: "2025-06-01", monthly_rent: 420000, deposit: 500000, payment_day: 1 },
  { id: "t4", name: "최유진", phone: "010-4444-5555", emergency_contact: "010-9000-4444", room_id: "r6", room_number: "302", status: "active", move_in_date: "2025-08-10", monthly_rent: 420000, deposit: 500000, payment_day: 10 },
  { id: "t5", name: "정도윤", phone: "010-5555-6666", emergency_contact: "010-9000-5555", room_id: "r7", room_number: "303", status: "overdue", move_in_date: "2024-12-01", monthly_rent: 420000, deposit: 500000, payment_day: 1, memo: "지난달 일부 미납" },
  { id: "t6", name: "강시현", phone: "010-6666-7777", emergency_contact: "010-9000-6666", room_id: "r9", room_number: "401", status: "active", move_in_date: "2025-05-20", monthly_rent: 450000, deposit: 500000, payment_day: 20 },
  { id: "t7", name: "윤서아", phone: "010-7777-8888", emergency_contact: "010-9000-7777", room_id: "r10", room_number: "402", status: "active", move_in_date: "2025-10-05", monthly_rent: 450000, deposit: 500000, payment_day: 5 },
  { id: "t8", name: "장하늘", phone: "010-8888-9999", emergency_contact: "010-9000-8888", room_id: "r11", room_number: "403", status: "active", move_in_date: "2025-03-15", monthly_rent: 450000, deposit: 500000, payment_day: 15 },
  { id: "t9", name: "임수빈", phone: "010-9999-0000", emergency_contact: "010-9000-9999", room_id: "r13", room_number: "501", status: "active", move_in_date: "2025-04-01", monthly_rent: 500000, deposit: 1000000, payment_day: 1 },
  { id: "t10", name: "오재현", phone: "010-1010-2020", emergency_contact: "010-9000-1010", room_id: "r14", room_number: "502", status: "active", move_in_date: "2025-11-01", monthly_rent: 500000, deposit: 1000000, payment_day: 1 },
];

const today = new Date();
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const offset = (n: number) => ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));

export const DEMO_INVOICES: DemoInvoice[] = [
  { id: "i1", tenant_id: "t1", tenant_name: "김민수", amount: 380000, due_date: offset(0), status: "paid", paid_at: offset(-1) },
  { id: "i2", tenant_id: "t2", tenant_name: "이서연", amount: 380000, due_date: offset(-3), status: "overdue" },
  { id: "i3", tenant_id: "t3", tenant_name: "박지훈", amount: 420000, due_date: offset(0), status: "paid", paid_at: offset(-2) },
  { id: "i4", tenant_id: "t4", tenant_name: "최유진", amount: 420000, due_date: offset(2), status: "unpaid" },
  { id: "i5", tenant_id: "t5", tenant_name: "정도윤", amount: 420000, due_date: offset(-7), status: "overdue" },
  { id: "i6", tenant_id: "t6", tenant_name: "강시현", amount: 450000, due_date: offset(5), status: "unpaid" },
  { id: "i7", tenant_id: "t7", tenant_name: "윤서아", amount: 450000, due_date: offset(0), status: "paid", paid_at: offset(0) },
  { id: "i8", tenant_id: "t8", tenant_name: "장하늘", amount: 450000, due_date: offset(8), status: "unpaid" },
  { id: "i9", tenant_id: "t9", tenant_name: "임수빈", amount: 500000, due_date: offset(0), status: "paid", paid_at: offset(-1) },
  { id: "i10", tenant_id: "t10", tenant_name: "오재현", amount: 500000, due_date: offset(0), status: "unpaid" },
];

export const DEMO_EVENTS: DemoEvent[] = [
  { id: "e1", title: "오재현 님 입실", event_date: offset(0), event_time: "14:00", kind: "move_in" },
  { id: "e2", title: "203호 룸투어", event_date: offset(1), event_time: "11:00", kind: "room_tour", memo: "신청자 010-2345-6789" },
  { id: "e3", title: "204호 청소 점검", event_date: offset(1), event_time: "16:00", kind: "inspection" },
  { id: "e4", title: "이서연 님 퇴실 예정", event_date: offset(3), event_time: "10:00", kind: "move_out" },
  { id: "e5", title: "소방 점검", event_date: offset(5), event_time: "09:30", kind: "inspection" },
  { id: "e6", title: "303호 룸투어", event_date: offset(6), event_time: "15:00", kind: "room_tour" },
  { id: "e7", title: "월말 정산 메모", event_date: offset(10), kind: "memo", memo: "공과금 정리" },
];

export const DEMO_STATS = {
  monthRevenue: DEMO_INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
  occupied: DEMO_ROOMS.filter((r) => r.status === "occupied").length,
  vacant: DEMO_ROOMS.filter((r) => r.status === "vacant").length,
  cleaning: DEMO_ROOMS.filter((r) => r.status === "cleaning").length,
  maintenance: DEMO_ROOMS.filter((r) => r.status === "maintenance").length,
  overdueCount: DEMO_INVOICES.filter((i) => i.status === "overdue").length,
  overdueSum: DEMO_INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
  todayDue: DEMO_INVOICES.filter((i) => i.due_date === offset(0) && i.status !== "paid").length,
};
