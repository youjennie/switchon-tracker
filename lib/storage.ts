"use client";

import type { Schedule } from "./schedule";

const KEY_SCHEDULE = "switchon.schedule.v2";
const KEY_PROFILE = "switchon.profile.v2";
const KEY_LOGS = "switchon.logs.v2";
const KEY_PARTICIPANTS = "switchon.participants.v1";
const KEY_ROOM_ID = "switchon.roomId.v1";

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
