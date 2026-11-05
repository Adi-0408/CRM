'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  dotColor?: string;
  badgeBg?: string;
  badgeText?: string;
  badgeBorder?: string;
}

interface StatusPillSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  options?: StatusOption[];
  disabled?: boolean;
}

const DEFAULT_OPTIONS: StatusOption[] = [
  {
    value: 'new',
    label: 'New',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  {
    value: 'completed',
    label: 'Completed',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
    dotColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
];

export default function StatusPillSelect({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  disabled = false,
}: StatusPillSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    options.find((opt) => opt.value === value) ||
    options[0] || {
      value,
      label: value,
      dotColor: 'bg-slate-400',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200',
    };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (val !== value) {
      onChange(val);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Active Pill Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all duration-150 cursor-pointer select-none active:scale-95 shadow-2xs hover:shadow-xs focus:outline-none ${
          currentOption.badgeBg
        } ${currentOption.badgeText} ${currentOption.badgeBorder} ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        title={`Status: ${currentOption.label}. Click to change.`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentOption.dotColor}`} />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 opacity-70 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-36 bg-white/95 backdrop-blur-xl rounded-xl border border-slate-200/80 shadow-[0_12px_28px_-4px_rgba(15,23,42,0.15)] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Set Status
          </div>
          <div className="p-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                    <span className="text-[11px]">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
