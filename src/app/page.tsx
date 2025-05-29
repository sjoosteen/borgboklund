"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import WeatherCard from "../components/WeatherCard";
import TransportCard from "../components/TransportCard";
import OliviaScheduleCard from "../components/OliviaScheduleCard";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-4 md:py-6 lg:py-8 min-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 h-full">
          {/* SMHI Väderprognos med trädgård */}
          <div className="flex flex-col">
            <WeatherCard />
          </div>

          {/* Kollektivtrafik */}
          <div className="flex flex-col">
            <TransportCard />
          </div>

          {/* Olivias Schema */}
          <div className="flex flex-col lg:col-span-2 xl:col-span-1">
            <OliviaScheduleCard />
          </div>
        </div>
      </main>
    </div>
  );
}
