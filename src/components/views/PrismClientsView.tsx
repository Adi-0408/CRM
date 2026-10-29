'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Mail,
  Phone,
  DollarSign,
  UserCheck,
  Building,
  MoreVertical,
} from 'lucide-react';

export default function PrismClientsView() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Clients &amp; Accounts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer relationships, contract status, and communication logs</p>
        </div>
      </div>

      <div className="prism-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3 font-semibold">Client Name</th>
                <th className="pb-3 font-semibold">Company</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Deal Value</th>
                <th className="pb-3 font-semibold">Channel</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.length > 0 ? (
                clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'CL'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 font-medium text-slate-700">{c.company || 'Enterprise'}</td>
                    <td className="py-3.5 pr-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-bold text-slate-900">
                      ₹{(c.value || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-500">{c.source || 'Direct'}</td>
                    <td className="py-3.5 text-right text-slate-400">
                      <button className="p-1 hover:text-slate-600 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading clients from MongoDB Atlas...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
