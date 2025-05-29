"use client";

import { useState, useEffect } from "react";
import { ScheduleSkeleton } from "./Skeleton";

interface WorkDay {
  day: string;
  date: string;
  isWorking: boolean;
  isToday: boolean;
  isHoliday: boolean;
}

interface WeekSchedule {
  weekNumber: number;
  year: number;
  days: WorkDay[];
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function isOliviaWorkingTuesday(weekNumber: number): boolean {
  // Vecka 22: ledig tisdag (referenspunkt)
  // Varannan tisdag från vecka 24
  const referenceWeek = 22;
  const weeksFromReference = weekNumber - referenceWeek;

  // Om jämnt antal veckor från referens = ledig tisdag
  // Om udda antal veckor från referens = arbetar tisdag
  return weeksFromReference % 2 !== 0;
}

function isSwedishHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  // Fasta helgdagar
  const fixedHolidays = [
    { month: 1, day: 1 }, // Nyårsdagen
    { month: 1, day: 6 }, // Trettondedag jul
    { month: 5, day: 1 }, // Första maj
    { month: 6, day: 6 }, // Nationaldagen
    { month: 6, day: 24 }, // Midsommarafton
    { month: 6, day: 25 }, // Midsommardagen
    { month: 12, day: 24 }, // Julafton
    { month: 12, day: 25 }, // Juldagen
    { month: 12, day: 26 }, // Annandag jul
    { month: 12, day: 31 }, // Nyårsafton
  ];

  // Kolla fasta helgdagar
  if (
    fixedHolidays.some(
      (holiday) => holiday.month === month && holiday.day === day
    )
  ) {
    return true;
  }

  // Beräkna påsk (förenklad algoritm för 2024-2030)
  const easterDates: { [key: number]: { month: number; day: number } } = {
    2024: { month: 3, day: 31 },
    2025: { month: 4, day: 20 },
    2026: { month: 4, day: 5 },
    2027: { month: 3, day: 28 },
    2028: { month: 4, day: 16 },
    2029: { month: 4, day: 1 },
    2030: { month: 4, day: 21 },
  };

  const easter = easterDates[year];
  if (easter) {
    const easterDate = new Date(year, easter.month - 1, easter.day);

    // Påskrelaterade helgdagar
    const easterRelated = [
      -2, // Långfredag
      0, // Påskdagen
      1, // Annandag påsk
      39, // Kristi himmelfärd
      49, // Pingstdagen
      50, // Annandag pingst
    ];

    for (const offset of easterRelated) {
      const holidayDate = new Date(easterDate);
      holidayDate.setDate(easterDate.getDate() + offset);

      if (
        holidayDate.getMonth() + 1 === month &&
        holidayDate.getDate() === day
      ) {
        return true;
      }
    }
  }

  return false;
}

function getWeekSchedule(weekNumber: number, year: number): WeekSchedule {
  // Hitta måndagen för given vecka
  const jan1 = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7 - jan1.getDay() + 1;
  const monday = new Date(year, 0, 1 + daysToAdd);

  const workingTuesday = isOliviaWorkingTuesday(weekNumber);

  const today = new Date();
  const days: WorkDay[] = [];

  // Skapa veckoschema (måndag till söndag)
  const dayNames = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);

    // Logik för lediga dagar:
    // 1. Kolla om det är helgdag (alltid ledig)
    // 2. Om ledig tisdag: tisdag och söndag är lediga (gröna)
    // 3. Om arbetar tisdag: lördag och söndag är lediga (gröna)
    let isWorking = true; // Default: arbetar

    // Kolla först om det är en svensk helgdag
    if (isSwedishHoliday(currentDay)) {
      isWorking = false;
    } else if (!workingTuesday) {
      // Ledig tisdag-vecka: tisdag och söndag lediga
      if (i === 1 || i === 6) isWorking = false; // Tisdag eller söndag
    } else {
      // Arbetar tisdag-vecka: lördag och söndag lediga
      if (i === 5 || i === 6) isWorking = false; // Lördag eller söndag
    }

    const isToday =
      currentDay.getDate() === today.getDate() &&
      currentDay.getMonth() === today.getMonth() &&
      currentDay.getFullYear() === today.getFullYear();

    days.push({
      day: dayNames[i],
      date: currentDay.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "short",
      }),
      isWorking,
      isToday,
      isHoliday: isSwedishHoliday(currentDay),
    });
  }

  return {
    weekNumber,
    year,
    days,
  };
}

export default function OliviaScheduleCard() {
  const [currentWeek, setCurrentWeek] = useState<WeekSchedule | null>(null);
  const [nextWeek, setNextWeek] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const currentWeekNum = getWeekNumber(now);
    const currentYear = now.getFullYear();

    setCurrentWeek(getWeekSchedule(currentWeekNum, currentYear));
    setNextWeek(getWeekSchedule(currentWeekNum + 1, currentYear));
    setLoading(false);
  }, []);

  if (loading || !currentWeek || !nextWeek) {
    return <ScheduleSkeleton />;
  }

  const WeekDisplay = ({
    week,
    title,
  }: {
    week: WeekSchedule;
    title: string;
  }) => (
    <div className="mb-3 md:mb-6">
      <h3 className="text-base md:text-lg font-semibold text-slate-100 mb-2 md:mb-3 flex items-center">
        <span className="mr-2">📅</span>
        {title} (v.{week.weekNumber})
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {week.days.map((day, index) => {
          // Parse date to get day number and month
          const dateParts = day.date.split(" ");
          const dayNumber = dateParts[0];
          const month = dateParts[1];

          return (
            <div
              key={index}
              className={`day-card ${
                day.isToday ? "today" : ""
              } text-center transition-all duration-200`}
            >
              {/* Day name */}
              <div className="day-name">{day.day}</div>

              {/* Date number */}
              <div className="date-number">{dayNumber}</div>

              {/* Month */}
              <div className="month">{month}</div>

              {/* Status badge - only show if NOT today AND not working */}
              {!day.isWorking && !day.isToday && (
                <div className="status-badge">Ledig</div>
              )}

              {/* Empty div to maintain spacing when no badge */}
              {(day.isWorking || day.isToday) && (
                <div style={{ height: "1.5rem" }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="card-glass rounded-2xl p-3 md:p-6 h-full shadow-2xl text-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-slate-100 flex items-center">
          Schema
        </h2>
        <div className="text-xs md:text-sm text-slate-400">Varannan tisdag</div>
      </div>

      {/* Aktuell vecka */}
      <WeekDisplay week={currentWeek} title="Denna vecka" />

      {/* Nästa vecka */}
      <WeekDisplay week={nextWeek} title="Nästa vecka" />
    </div>
  );
}
