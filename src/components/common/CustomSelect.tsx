'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption | string>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  align?: 'left' | 'right';
  position?: 'bottom' | 'top';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
}

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  optionClassName = '',
  align = 'left',
  position = 'bottom',
  size = 'md',
  icon,
  renderOption,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width: number;
    placement: 'bottom' | 'top';
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize options into { value, label } format
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Position calculation with automatic flip if near bottom
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Close if the button is scrolled out of viewport
      if (rect.bottom < 0 || rect.top > viewportHeight) {
        setIsOpen(false);
        return;
      }

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 220;

      let placement: 'bottom' | 'top' = position;
      if (position === 'bottom' && spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        placement = 'top';
      } else if (position === 'top' && spaceAbove < menuHeight && spaceBelow > spaceAbove) {
        placement = 'bottom';
      }

      const minWidth = Math.max(rect.width, 130);

      const coords: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        width: number;
        placement: 'bottom' | 'top';
      } = {
        width: minWidth,
        placement,
      };

      if (placement === 'bottom') {
        coords.top = rect.bottom + 6;
      } else {
        coords.bottom = viewportHeight - rect.top + 6;
      }

      if (align === 'right') {
        coords.right = viewportWidth - rect.right;
      } else {
        const clampedLeft = Math.max(8, Math.min(viewportWidth - minWidth - 8, rect.left));
        coords.left = clampedLeft;
      }

      setMenuCoords(coords);
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, position, align]);

  // Close on outside click (considering both the trigger button and the portaled menu)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string, isOptDisabled?: boolean) => {
    if (isOptDisabled) return;
    onChange(optValue);
    setIsOpen(false);
  };

  // Size styling classes
  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] rounded-lg gap-1.5',
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-2',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
  }[size];

  const chevronSizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border border-slate-200/90 bg-white font-semibold text-slate-800 shadow-2xs hover:border-[#635BFF]/70 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all cursor-pointer select-none ${sizeStyles} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center space-x-1.5 truncate">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`${chevronSizeStyles} text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-[#635BFF]' : ''
          }`}
        />
      </button>

      {/* Styled Dropdown Menu Portaled to Document Body so it never gets clipped by parent card/table */}
      {mounted &&
        isOpen &&
        menuCoords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : 'auto',
              bottom:
                menuCoords.bottom !== undefined
                  ? `${menuCoords.bottom}px`
                  : 'auto',
              left:
                menuCoords.left !== undefined ? `${menuCoords.left}px` : 'auto',
              right:
                menuCoords.right !== undefined
                  ? `${menuCoords.right}px`
                  : 'auto',
              minWidth: `${menuCoords.width}px`,
              zIndex: 99999,
            }}
            className={`fixed bg-white rounded-2xl border border-slate-200/90 shadow-[0_16px_40px_-6px_rgba(15,23,42,0.18),0_6px_16px_-3px_rgba(15,23,42,0.08)] py-1.5 max-h-64 overflow-y-auto scrollbar-thin transition-all animate-in fade-in-0 zoom-in-95 duration-100 select-none ${menuClassName}`}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3.5 py-2 text-xs text-slate-400 text-center font-medium">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                if (renderOption) {
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value, opt.disabled);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-[#F0EEFF] text-[#635BFF] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                    } ${optionClassName}`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            opt.badgeColor || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
