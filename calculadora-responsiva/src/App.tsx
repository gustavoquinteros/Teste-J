/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';

type Operator = '+' | '-' | '*' | '/' | null;

export default function App() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string>('');

  const calculate = (first: number, second: number, op: Operator): number => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return second !== 0 ? first / second : 0;
      default: return second;
    }
  };

  const handleDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const handleOperator = useCallback((nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setHistory(`${inputValue} ${nextOperator}`);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setPreviousValue(result);
      setDisplay(String(result));
      setHistory(`${result} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, previousValue, operator]);

  const handleEqual = useCallback(() => {
    const inputValue = parseFloat(display);

    if (operator && previousValue !== null) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setHistory('');
    }
  }, [display, operator, previousValue]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistory('');
  }, []);

  const handleBackspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  const handleDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const handleToggleSign = useCallback(() => {
    setDisplay(String(parseFloat(display) * -1));
  }, [display]);

  const handlePercent = useCallback(() => {
    setDisplay(String(parseFloat(display) / 100));
  }, [display]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === '.') handleDecimal();
      if (e.key === '+') handleOperator('+');
      if (e.key === '-') handleOperator('-');
      if (e.key === '*') handleOperator('*');
      if (e.key === '/') handleOperator('/');
      if (e.key === 'Enter' || e.key === '=') handleEqual();
      if (e.key === 'Escape') handleClear();
      if (e.key === 'Backspace') handleBackspace();
      if (e.key === '%') handlePercent();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOperator, handleEqual, handleClear, handleBackspace, handlePercent]);

  const Button = ({ 
    children, 
    onClick, 
    className = '', 
    variant = 'default' 
  }: { 
    children: ReactNode; 
    onClick: () => void; 
    className?: string;
    variant?: 'default' | 'operator' | 'special' | 'equals'
  }) => {
    const variants = {
      default: 'bg-white hover:bg-slate-50 text-slate-900',
      special: 'bg-[#F5F5F7] hover:bg-[#E5E5EA] text-slate-900 font-medium',
      operator: 'bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#007AFF] font-semibold',
      equals: 'bg-[#007AFF] hover:bg-[#0066D6] text-white'
    };

    return (
      <button
        onClick={onClick}
        className={`flex items-center justify-center text-2xl transition-colors duration-150 active:opacity-70 ${variants[variant]} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-[#1C1C1E] font-sans overflow-hidden">
      {/* Header Area */}
      <header className="px-10 pt-6 flex justify-between items-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#8E8E93]">
          Standard Calculator
        </div>
        <div className="text-xl text-[#007AFF] cursor-pointer">
          <RotateCcw size={20} className="opacity-70 hover:opacity-100 transition-opacity" onClick={handleClear} />
        </div>
      </header>

      {/* Display Area */}
      <div className="flex-[0_0_35%] flex flex-col justify-end items-end px-10 pb-10 space-y-2 text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={history}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-2xl font-normal text-[#8E8E93]"
          >
            {history}
          </motion.div>
        </AnimatePresence>
        <motion.div 
          key={display}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          className="text-8xl sm:text-9xl font-light tracking-tighter truncate max-w-full leading-none"
        >
          {display}
        </motion.div>
      </div>

      {/* Buttons Grid (Keypad) */}
      <div className="flex-1 grid grid-cols-4 gap-[1px] bg-[#D1D1D6] border-t border-[#D1D1D6]">
        {/* Row 1 */}
        <Button variant="special" onClick={handleClear}>AC</Button>
        <Button variant="special" onClick={handleToggleSign}>+/-</Button>
        <Button variant="special" onClick={handlePercent}>%</Button>
        <Button variant="operator" onClick={() => handleOperator('/')}>&divide;</Button>

        {/* Row 2 */}
        <Button onClick={() => handleDigit('7')}>7</Button>
        <Button onClick={() => handleDigit('8')}>8</Button>
        <Button onClick={() => handleDigit('9')}>9</Button>
        <Button variant="operator" onClick={() => handleOperator('*')}>&times;</Button>

        {/* Row 3 */}
        <Button onClick={() => handleDigit('4')}>4</Button>
        <Button onClick={() => handleDigit('5')}>5</Button>
        <Button onClick={() => handleDigit('6')}>6</Button>
        <Button variant="operator" onClick={() => handleOperator('-')}>&minus;</Button>

        {/* Row 4 */}
        <Button onClick={() => handleDigit('1')}>1</Button>
        <Button onClick={() => handleDigit('2')}>2</Button>
        <Button onClick={() => handleDigit('3')}>3</Button>
        <Button variant="operator" onClick={() => handleOperator('+')}>+</Button>

        {/* Row 5 */}
        <Button onClick={() => handleDigit('0')}>0</Button>
        <Button onClick={handleDecimal}>.</Button>
        <Button onClick={handleBackspace} className="text-lg font-medium text-[#8E8E93]">DEL</Button>
        <Button variant="equals" onClick={handleEqual}>=</Button>
      </div>
    </div>
  );
}
