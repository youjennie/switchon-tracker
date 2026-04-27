"use client";

import type { Schedule } from "./schedule";

const KEY_SCHEDULE = "switchon.schedule.v2";
const KEY_PROFILE = "switchon.profile.v2";
const KEY_LOGS = "switchon.logs.v2";
const KEY_PARTICIPANTS = "switchon.participants.v1";
const KEY_ROOM_ID = "switchon.roomId.v1";
const KEY_JOURNALS = "switchon.journals.v1";
const KEY_SLOT_OVERRIDES = "switchon.slotOverrides.v1";

export type UserProfile = {
  name: string;
  weightKg: number;
  proteinGoalG: number;
};

/** logs[day][slotIndex] = entries for that slot */
export type FoodEntry = { id: string; text: string; createdAt: number };
export type DayLogs = Record<string, FoodEntry[]>; // key = slotIndex as string
export type AllLogs = Record<number, DayLogs>; // key = day number 1..28

export type Participant = { id: string; name: string };

export type DayJournal = {
  mood?: string;
  exercise?: string;
  note?: string;
};
export type AllJournals = Record<number, DayJournal>;

/** Per-day, per-slot override. Both fields optional — only the ones the
 *  user changed are stored. */
export type SlotOverride = { minuteOfDay?: number; label?: string };
export type SlotOverrides = Record<number, Record<string, SlotOverride>>;

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// --- Schedule ---
export const loadSchedule = () => safeGet<Schedule>(KEY_SCHEDULE);
export const saveSchedule = (s: Schedule) => safeSet(KEY_SCHEDULE, s);

// --- Profile ---
export const loadProfile = () => safeGet<UserProfile>(KEY_PROFILE);
export const saveProfile = (p: UserProfile) => safeSet(KEY_PROFILE, p);

export function clearProgram(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_SCHEDULE);
  window.localStorage.removeItem(KEY_PROFILE);
  window.localStorage.removeItem(KEY_LOGS);
}

// --- Food logs ---
export const loadLogs = (): AllLogs => safeGet<AllLogs>(KEY_LOGS) ?? {};
export const saveLogs = (logs: AllLogs) => safeSet(KEY_LOGS, logs);

export function addLogEntry(
  logs: AllLogs,
  day: number,
  slotIndex: number,
  text: string
): AllLogs {
  const next: AllLogs = { ...logs };
  const dayMap: DayLogs = { ...(next[day] ?? {}) };
  const slotKey = String(slotIndex);
  const entries = [...(dayMap[slotKey] ?? [])];
  entries.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: Date.now(),
  });
  dayMap[slotKey] = entries;
  next[day] = dayMap;
  return next;
}

export function removeLogEntry(
  logs: AllLogs,
  day: number,
  slotIndex: number,
  entryId: string
): AllLogs {
  const dayMap = logs[day];
  if (!dayMap) return logs;
  const slotKey = String(slotIndex);
  const entries = dayMap[slotKey];
  if (!entries) return logs;
  const nextEntries = entries.filter((e) => e.id !== entryId);
  return {
    ...logs,
    [day]: { ...dayMap, [slotKey]: nextEntries },
  };
}

// --- Participants ---
export const loadParticipants = (): Participant[] =>
  safeGet<Participant[]>(KEY_PARTICIPANTS) ?? [];
export const saveParticipants = (p: Participant[]) =>
  safeSet(KEY_PARTICIPANTS, p);

// --- Journals (mood + exercise + note per day) ---
export const loadJournals = (): AllJournals =>
  safeGet<AllJournals>(KEY_JOURNALS) ?? {};
export const saveJournals = (j: AllJournals) => safeSet(KEY_JOURNALS, j);

export function setDayJournal(
  journals: AllJournals,
  day: number,
  patch: Partial<DayJournal>
): AllJournals {
  const current = journals[day] ?? {};
  const merged: DayJournal = { ...current, ...patch };
  return { ...journals, [day]: merged };
}

// --- Slot time overrides (e.g., move a workout to a different hour for a given day) ---
export const loadSlotOverrides = (): SlotOverrides =>
  safeGet<SlotOverrides>(KEY_SLOT_OVERRIDES) ?? {};
export const saveSlotOverrides = (s: SlotOverrides) =>
  safeSet(KEY_SLOT_OVERRIDES, s);

export function patchSlotOverride(
  overrides: SlotOverrides,
  day: number,
  slotIndex: number,
  patch: Partial<SlotOverride>
): SlotOverrides {
  const dayMap = { ...(overrides[day] ?? {}) };
  const key = String(slotIndex);
  const cur = dayMap[key] ?? {};
  const next: SlotOverride = { ...cur };
  if ("minuteOfDay" in patch) next.minuteOfDay = patch.minuteOfDay;
  if ("label" in patch) {
    const trimmed = patch.label?.trim();
    if (trimmed) next.label = trimmed;
    else delete next.label;
  }
  // If both fields ended up empty, drop the entry entirely.
  if (next.minuteOfDay == null && !next.label) {
    delete dayMap[key];
  } else {
    dayMap[key] = next;
  }
  return { ...overrides, [day]: dayMap };
}

export function setSlotTimeOverride(
  overrides: SlotOverrides,
  day: number,
  slotIndex: number,
  minuteOfDay: number
): SlotOverrides {
  return patchSlotOverride(overrides, day, slotIndex, { minuteOfDay });
}

export function clearSlotTimeOverride(
  overrides: SlotOverrides,
  day: number,
  slotIndex: number
): SlotOverrides {
  const dayMap = overrides[day];
  if (!dayMap) return overrides;
  const next = { ...dayMap };
  delete next[String(slotIndex)];
  return { ...overrides, [day]: next };
}

/** Sum all "<number>g" occurrences in a string (e.g., "계란 2개 14g + 닭가슴살 100g" → 114). */
export function extractGramsTotal(text: string): number {
  const re = /(\d+(?:\.\d+)?)\s*g\b/gi;
  let sum = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    sum += parseFloat(m[1]);
  }
  return sum;
}

/** Return a stable per-browser room id (used in the shareable invite link). */
export function getOrCreateRoomId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY_ROOM_ID);
  if (!id) {
    id = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4);
    window.localStorage.setItem(KEY_ROOM_ID, id);
  }
  return id;
}

export function recommendedProteinG(weightKg: number): number {
  return Math.round(weightKg * 1.5);
}
