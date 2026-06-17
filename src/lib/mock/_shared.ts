import { seededRandom } from "../utils";

export const FIRST_NAMES = [
  "Алишер", "Дана", "Ержан", "Камила", "Бекзат", "Айгерим", "Санжар", "Динара",
  "Арман", "Жанель", "Алмас", "Аяулым", "Ислам", "Балжан", "Дамир", "Назгуль",
  "Темирлан", "Асель", "Руслан", "Гаухар", "Олжас", "Сабина", "Мирас", "Алия",
  "Нурсултан", "Жанна", "Адиль", "Карина", "Бауыржан", "Меруерт", "Ескендир",
  "Айша", "Данияр", "Зарина", "Кайрат", "Лейла", "Серик", "Томирис", "Ансар",
];
export const LAST_INITIALS = ["А.", "Б.", "Е.", "К.", "М.", "Н.", "С.", "Т.", "Ж.", "Д."];

export const pad = (n: number) => String(n).padStart(2, "0");

export function makeRng(seed: number) {
  const rnd = seededRandom(seed);
  return {
    rnd,
    pick: <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)],
    int: (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1)),
  };
}

export function fullName(i: number): string {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_INITIALS[i % LAST_INITIALS.length]}`;
}

export function phoneFor(i: number): string {
  const a = 700 + (i % 80);
  return `+7 ${a} ${pad((i * 7) % 100)}${pad((i * 3) % 10)} ${pad((i * 11) % 100)} ${pad((i * 13) % 100)}`;
}

export function daysAgoISO(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysFromNowISO(days: number, hour = 10, minute = 0): string {
  return daysAgoISO(-days, hour, minute);
}
