'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
} from 'lucide-react';

export default function PrismProjectsView() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="pt-6 space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Projects</h3>
        <p className="text-xs text-slate-500 mt-0.5">Delivery timelines, milestone tracking, and client progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => (
          <div key={proj._id} className="prism-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {proj.status}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  ${(proj.budget || 0).toLocaleString()}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm leading-snug">{proj.title}</h4>
              <p className="text-xs text-slate-500 mt-1">Client: {proj.client}</p>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-slate-800">{proj.progress || 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                    style={{ width: `${proj.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Deadline: {new Date(proj.deadline).toLocaleDateString()}</span>
              <button className="text-violet-600 font-bold hover:underline">Details &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
