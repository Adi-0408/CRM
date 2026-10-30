'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Check, Users, Sparkles } from 'lucide-react';

export interface EmployeeItem {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  avatar?: string;
  activeTasksCount?: number;
}

interface TeamMemberPickerProps {
  label?: string;
  employees: EmployeeItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  tasks?: any[];
  multiple?: boolean;
  allowedRoles?: string[];
}

export default function TeamMemberPicker({
  label = 'Assign Team Members',
  employees = [],
  selectedIds = [],
  onChange,
  tasks = [],
  multiple = true,
  allowedRoles,
}: TeamMemberPickerProps) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // 1. Data Cleanup & Deduplication by unique _id / email
  const deduplicatedEmployees = useMemo(() => {
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const cleanList: EmployeeItem[] = [];

    // Count name occurrences to detect genuine duplicate names
    const nameCounts: Record<string, number> = {};
    employees.forEach((e) => {
      if (e?.name) {
        const n = e.name.trim().toLowerCase();
        nameCounts[n] = (nameCounts[n] || 0) + 1;
      }
    });

    employees.forEach((emp) => {
      if (!emp || !emp._id) return;
      const idStr = String(emp._id);
      const emailStr = emp.email ? emp.email.trim().toLowerCase() : '';

      if (seenIds.has(idStr)) return;
      if (emailStr && seenEmails.has(emailStr)) return;

      // Optional role restriction
      if (allowedRoles && allowedRoles.length > 0) {
        const empRole = String(emp.role || '').toLowerCase().trim();
        const matchesAllowed = allowedRoles.some((ar) => {
          const arLower = ar.toLowerCase();
          return empRole === arLower || empRole.includes(arLower) || (arLower.includes('developer') && empRole.includes('dev'));
        });
        if (!matchesAllowed) return;
      }

      seenIds.add(idStr);
      if (emailStr) seenEmails.add(emailStr);

      cleanList.push(emp);
    });

    return cleanList;
  }, [employees, allowedRoles]);

  // Compute live active workload map from tasks
  const workloadMap = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.status !== 'completed' && t.assignedTo) {
        const assigneeId = String(t.assignedTo._id || t.assignedTo);
        counts[assigneeId] = (counts[assigneeId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const getWorkload = (emp: EmployeeItem) => {
    if (typeof emp.activeTasksCount === 'number') return emp.activeTasksCount;
    return workloadMap[String(emp._id)] || 0;
  };

  // Role filter chips: dynamically tailored based on allowedRoles
  const departments = useMemo(() => {
    if (allowedRoles && allowedRoles.length > 0) {
      const chips = ['All'];
      if (allowedRoles.some((r) => r.toLowerCase().includes('web'))) chips.push('Web Dev');
      if (allowedRoles.some((r) => r.toLowerCase().includes('android'))) chips.push('Android Dev');
      if (allowedRoles.some((r) => r.toLowerCase().includes('intern'))) chips.push('Interns');
      chips.push('⚡ Least Busy');
      return chips;
    }
    return [
      'All',
      'Web Dev',
      'Android Dev',
      'Interns',
      'Sales',
      'Tech Support',
      '⚡ Least Busy',
    ];
  }, [allowedRoles]);

  // Filtered & Sorted Employees
  const filteredEmployees = useMemo(() => {
    let result = deduplicatedEmployees.filter((emp) => {
      const empRole = String(emp.role || '').toLowerCase();
      const empDept = String(emp.department || '').toLowerCase();

      // Role filter chips
      if (selectedDept === 'Web Dev') {
        if (!empRole.includes('web') && !empDept.includes('web')) return false;
      } else if (selectedDept === 'Android Dev') {
        if (!empRole.includes('android') && !empRole.includes('mobile') && !empDept.includes('mobile')) return false;
      } else if (selectedDept === 'Interns') {
        if (!empRole.includes('intern') && !empDept.includes('training') && !empDept.includes('intern')) return false;
      } else if (selectedDept === 'Sales') {
        if (!empRole.includes('sales') && !empDept.includes('sales')) return false;
      } else if (selectedDept === 'Tech Support') {
        if (!empRole.includes('support') && !empDept.includes('support')) return false;
      } else if (selectedDept === '⚡ Least Busy') {
        const wl = getWorkload(emp);
        if (wl > 2) return false;
      }

      // Search query (name, email, role, department)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = emp.name?.toLowerCase().includes(q);
        const matchesEmail = emp.email?.toLowerCase().includes(q);
        const matchesRole = emp.role?.toLowerCase().includes(q);
        const matchesDept = emp.department?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesRole || matchesDept;
      }

      return true;
    });

    // If 'Least Busy' is active, sort strictly by lowest workload
    if (selectedDept === '⚡ Least Busy') {
      result = [...result].sort((a, b) => getWorkload(a) - getWorkload(b));
    }

    return result;
  }, [deduplicatedEmployees, selectedDept, search, workloadMap]);

  // Map of selected items for instant O(1) lookup
  const selectedMap = useMemo(() => {
    const map = new Set<string>();
    selectedIds.forEach((id) => map.add(String(id)));
    return map;
  }, [selectedIds]);

  const selectedEmployeesList = useMemo(() => {
    return deduplicatedEmployees.filter((e) => selectedMap.has(String(e._id)));
  }, [deduplicatedEmployees, selectedMap]);

  const toggleMember = (id: string) => {
    const idStr = String(id);
    if (!multiple) {
      if (selectedMap.has(idStr)) {
        onChange([]);
      } else {
        onChange([idStr]);
      }
      return;
    }

    if (selectedMap.has(idStr)) {
      onChange(selectedIds.filter((item) => String(item) !== idStr));
    } else {
      onChange([...selectedIds, idStr]);
    }
  };

  const handleSelectAllInFilter = () => {
    if (!multiple) return;
    const filterIds = filteredEmployees.map((e) => String(e._id));
    const merged = Array.from(new Set([...selectedIds.map(String), ...filterIds]));
    onChange(merged);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const renderWorkloadBadge = (count: number) => {
    if (count === 0) {
      return (
        <span className="bg-[#E6F7F0] text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
          0 tasks free
        </span>
      );
    }
    if (count <= 3) {
      return (
        <span className="bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
          {count} active {count === 1 ? 'task' : 'tasks'}
        </span>
      );
    }
    return (
      <span className="bg-[#FFF8EB] text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
        {count} busy
      </span>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Field Label & Top Bar */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-[#F0EEFF] text-[#635BFF] px-2 py-0.5 rounded-full border border-purple-200/60">
              {selectedIds.length} Selected
            </span>
            {selectedIds.length > 1 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* 1. Selected Assignees Bar (Top Chips) */}
      <div className="min-h-[38px] p-2 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-wrap items-center gap-1.5 transition-all">
        {selectedEmployeesList.length > 0 ? (
          selectedEmployeesList.map((emp) => {
            const initial = emp.name ? emp.name.charAt(0).toUpperCase() : 'U';
            return (
              <span
                key={String(emp._id)}
                className="bg-[#F0EEFF] text-[#635BFF] border border-[#635BFF]/20 rounded-full px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <span className="w-4 h-4 rounded-full bg-[#635BFF] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {initial}
                </span>
                <span className="max-w-[130px] truncate">{emp.name}</span>
                <button
                  type="button"
                  onClick={() => toggleMember(String(emp._id))}
                  className="w-3.5 h-3.5 rounded-full hover:bg-[#635BFF]/20 flex items-center justify-center text-[#635BFF] hover:text-indigo-900 transition-colors ml-0.5"
                  title={`Remove ${emp.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 font-medium px-1.5 py-0.5">
            No members selected yet. Search or select from the directory below.
          </p>
        )}
      </div>

      {/* 2. Instant Search + Quick Department Filter Pills */}
      <div className="space-y-1.5">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/15 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department / Quick-Select Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            {departments.map((dept) => {
              const isActive = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#635BFF] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {multiple && filteredEmployees.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllInFilter}
              className="text-[11px] font-bold text-[#635BFF] hover:text-[#5249EC] whitespace-nowrap bg-indigo-50/80 hover:bg-indigo-100/80 px-2.5 py-1 rounded-full border border-indigo-200/60 shrink-0 transition-all active:scale-95"
            >
              Select All in Filter
            </button>
          )}
        </div>
      </div>

      {/* 3. Rich Compact Employee List (Dropdown / Scrollable List) */}
      <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-inner/5">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => {
            const empIdStr = String(emp._id);
            const isSelected = selectedMap.has(empIdStr);
            const workload = getWorkload(emp);
            const initial = emp.name ? emp.name.charAt(0).toUpperCase() : 'U';

            return (
              <div
                key={empIdStr}
                onClick={() => toggleMember(empIdStr)}
                className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                  isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Left: Custom Checkbox + Avatar + Name + Subtitle */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#635BFF] border-[#635BFF] text-white shadow-xs'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  {/* Avatar Circle */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F0EEFF] text-[#635BFF] font-bold text-xs flex items-center justify-center shrink-0 border border-slate-100">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 truncate">
                    <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                      {emp.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight truncate mt-0.5">
                      <span className="text-slate-600 font-medium">{emp.department || 'General'}</span>
                      {emp.role && (
                        <span>
                          {' '}• {emp.role}
                        </span>
                      )}
                      {emp.email && (
                        <span className="text-slate-400">
                          {' '}({emp.email})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Workload Badge */}
                <div className="shrink-0 flex items-center">
                  {renderWorkloadBadge(workload)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center px-4">
            <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">No matching employees</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try adjusting your search query or department filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
