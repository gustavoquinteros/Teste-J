/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Timer, List } from 'lucide-react';

interface Lap {
  id: number;
  time: number;
  overall: number;
}

export default function App() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return {
      m: minutes.toString().padStart(2, '0'),
      s: seconds.toString().padStart(2, '0'),
      c: centiseconds.toString().padStart(2, '0'),
    };
  };

  const animate = (now: number) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = now - time;
    }
    const elapsed = now - startTimeRef.current;
    setTime(elapsed);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      startTimeRef.current = 0;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning]);

  const toggleStart = () => setIsRunning(!isRunning);

  const reset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    startTimeRef.current = 0;
  };

  const addLap = () => {
    const lastLapOverall = laps.length > 0 ? laps[0].overall : 0;
    const newLap: Lap = {
      id: laps.length + 1,
      time: time - lastLapOverall,
      overall: time,
    };
    setLaps([newLap, ...laps]);
  };

  const { m, s, c } = formatTime(time);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-[#fcfcfc] p-10 font-sans">
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col items-center justify-center gap-12">
        {/* Header */}
        <header className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#888]">
          <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${isRunning ? 'bg-[#4caf50]' : 'bg-zinc-300'}`} />
          {isRunning ? 'Sessão Ativa' : 'Sessão Pausada'}
        </header>

        {/* Timer Display */}
        <section className="flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-[30vw] font-[200] tabular-nums leading-none tracking-[-0.05em] text-[#1a1a1a] md:text-[160px]"
          >
            {m}:{s}<span className="text-[0.4em] opacity-30">:{c}</span>
          </motion.div>
        </section>

        {/* Controls */}
        <section className="flex flex-col items-center gap-12 w-full">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="flex h-[50px] w-[120px] items-center justify-center rounded-[25px] border border-[#e0e0e0] bg-white text-[14px] font-medium text-[#1a1a1a] transition-all hover:bg-zinc-50 active:scale-95 md:w-[140px]"
            >
              Reiniciar
            </button>

            <button
              onClick={toggleStart}
              className={`flex h-[50px] w-[120px] items-center justify-center rounded-[25px] text-[14px] font-medium transition-all active:scale-95 md:w-[140px] ${
                isRunning 
                  ? 'bg-[#1a1a1a] text-white' 
                  : 'bg-[#1a1a1a] text-white'
              }`}
            >
              {isRunning ? 'Pausar' : 'Iniciar'}
            </button>

            <button
              onClick={addLap}
              disabled={!isRunning && time === 0}
              className="flex h-[50px] w-[120px] items-center justify-center rounded-[25px] border border-[#e0e0e0] bg-white text-[14px] font-medium text-[#1a1a1a] transition-all hover:bg-zinc-50 disabled:opacity-30 active:scale-95 md:w-[140px]"
            >
              Volta
            </button>
          </div>

          {/* Laps List */}
          <div className="w-full max-w-[400px] border-t border-[#eee] pt-8">
            <div className="h-48 overflow-y-auto scrollbar-hide pr-2">
              <AnimatePresence initial={false}>
                {laps.map((lap) => {
                  const lapTime = formatTime(lap.time);
                  return (
                    <motion.div
                      key={lap.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between border-b border-[#f5f5f5] py-3 text-[14px]"
                    >
                      <span className="text-[#999]">Volta {lap.id.toString().padStart(2, '0')}</span>
                      <span className="font-mono font-semibold text-[#1a1a1a]">
                        {lapTime.m}:{lapTime.s}:{lapTime.c}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {laps.length === 0 && (
                <div className="flex h-full items-center justify-center text-[12px] uppercase tracking-widest text-zinc-300">
                  Sem registros
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

