'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  ChevronDown,
  Search,
  FileText,
  ChevronRight,
  MoreVertical,
  Bot,
  Send,
  Paperclip,
  CheckCircle2,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';

interface PrismOverviewViewProps {
  onNavigateToInbox: () => void;
  onNavigateToProjects: () => void;
  onOpenCreateTask: () => void;
}

export default function PrismOverviewView({
  onNavigateToInbox,
  onNavigateToProjects,
  onOpenCreateTask,
}: PrismOverviewViewProps) {
  const [activeProjectFilter, setActiveProjectFilter] = useState<'priority' | 'active' | 'completed' | 'canceled' | 'recommended'>('priority');
  const [activeAIModel, setActiveAIModel] = useState<'PrismAI' | 'GPT Chat' | 'DeepSeek'>('PrismAI');
  const [promptInput, setPromptInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisNote, setAnalysisNote] = useState('Better client communication can boost tips and repeat work. Try faster responses and follow-ups!');

  // Projects data matching the video
  const projectsData = [
    {
      id: 1,
      client: {
        name: 'Sophie T.',
        handle: '@sophie.turner',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        badge: 'Up',
      },
      task: {
        title: 'Garden Grove Designs',
        subtitle: 'Mobile Application Design',
      },
      dueOn: 'Apr 2',
      price: '$25',
      status: 'Draft',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      id: 2,
      client: {
        name: 'Sam S.',
        handle: '@sam.smith',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        badge: 'fi',
      },
      task: {
        title: 'Flora & Fauna Studio',
        subtitle: 'Online Shopping Platform',
      },
      dueOn: 'Apr 1',
      price: '$50',
      status: 'In Progress',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 3,
      client: {
        name: 'Olivia P.',
        handle: '@olivia.peterson',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        initials: 'OR',
        badge: 'fi',
      },
      task: {
        title: 'Vibrant Vases Studio',
        subtitle: 'Digital Commerce Platform',
      },
      dueOn: 'Apr 1',
      price: '$225',
      status: 'On review',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  ];

  // Dot matrix columns for Revenue Analytics
  const dotMatrixData = [
    { day: 'Mar 1', dots: 2 },
    { day: 'Mar 3', dots: 3 },
    { day: 'Mar 5', dots: 4 },
    { day: 'Mar 7', dots: 2 },
    { day: 'Mar 10', dots: 5 },
    { day: 'Mar 12', dots: 4 },
    { day: 'Mar 14', dots: 9, isHighlight: true, amount: '$220' },
    { day: 'Mar 15', dots: 6 },
    { day: 'Mar 18', dots: 3 },
    { day: 'Mar 20', dots: 4 },
    { day: 'Mar 22', dots: 5 },
    { day: 'Mar 25', dots: 3 },
    { day: 'Mar 28', dots: 7 },
    { day: 'Mar 31', dots: 4 },
  ];

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisNote('AI Analysis: Lead response time dropped by 34%. Projected conversion rate increased to 28% for upcoming Q2 contracts!');
    }, 800);
  };

  const handleQuickPrompt = (title: string) => {
    setPromptInput(`Help me with ${title.toLowerCase()} for upcoming deliverables...`);
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setAiResponse(`PrismAI: Generating automated recommendations based on your active clients and revenue forecasts for "${promptInput}". Everything is synced with Sangli HQ.`);
    setPromptInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
      {/* =========================================================================
          LEFT / MAIN COLUMN (8 of 12 columns)
         ========================================================================= */}
      <div className="lg:col-span-8 space-y-6">
        {/* 1. Top 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card: Clients */}
          <div className="prism-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Clients</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +4
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">14</h3>
              <span className="text-[11px] font-medium text-slate-400">
                Compare 10 (last month)
              </span>
            </div>
          </div>

          {/* Card: Revenue */}
          <div className="prism-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Revenue</span>
              <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                -8%
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                $3 552.00
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                $3 720.00 (last month)
              </span>
            </div>
          </div>

          {/* Card: Projects */}
          <div className="prism-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Projects</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +6
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">22</h3>
              <span className="text-[11px] font-medium text-slate-400">
                Compare 16 (last month)
              </span>
            </div>
          </div>
        </div>

        {/* 2. Revenue Analytics Dot-Matrix Card */}
        <div className="prism-card p-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Revenue Analytics</h4>
              {/* Legend */}
              <div className="flex items-center space-x-4 mt-1.5 text-xs">
                <span className="flex items-center space-x-1.5 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Actual</span>
                </span>
                <span className="flex items-center space-x-1.5 font-semibold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-300" />
                  <span>AI Projected</span>
                </span>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>Earnings</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <span>Last 30 Days</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Graph Body & AI Insight Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
            {/* Left AI Callout */}
            <div className="md:col-span-4 flex flex-col justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {analysisNote}
                </p>
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="mt-4 w-full py-2.5 px-4 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {analyzing ? 'Analyzing Trends...' : 'Run Analysis'}
              </button>
            </div>

            {/* Right Dot-Matrix Column Visualization */}
            <div className="md:col-span-8 flex flex-col justify-end">
              {/* Y-Axis & Dots */}
              <div className="flex items-end justify-between h-48 px-2 pb-2 border-b border-slate-100">
                {dotMatrixData.map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center group relative">
                    {/* Tooltip for highlighted Mar 14 */}
                    {col.isHighlight && (
                      <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-md animate-bounce">
                        {col.amount}
                      </div>
                    )}

                    {/* Dot column */}
                    <div className="flex flex-col-reverse gap-1.5">
                      {Array.from({ length: 9 }).map((_, dotIdx) => {
                        const filled = dotIdx < col.dots;
                        const isColHighlight = col.isHighlight;
                        return (
                          <span
                            key={dotIdx}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              filled
                                ? isColHighlight
                                  ? 'bg-indigo-600 ring-2 ring-indigo-200 scale-110'
                                  : 'bg-emerald-300 group-hover:bg-emerald-400'
                                : 'bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* X-Axis Dates */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-2 px-1">
                <span>Mar 1</span>
                <span>Mar 5</span>
                <span>Mar 10</span>
                <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                  Mar 14
                </span>
                <span>Mar 20</span>
                <span>Mar 25</span>
                <span>Mar 31</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Manage Projects Table Card */}
        <div className="prism-card p-6">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <h4 className="text-base font-bold text-slate-900">Manage Projects</h4>
            <div className="flex items-center space-x-2 overflow-x-auto text-xs">
              {[
                { id: 'priority', label: 'Priority', count: 3 },
                { id: 'active', label: 'Active', count: 4 },
                { id: 'completed', label: 'Completed' },
                { id: 'canceled', label: 'Canceled' },
                { id: 'recommended', label: 'Recommended', count: 3 },
              ].map((tab) => {
                const isSelected = activeProjectFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProjectFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={onNavigateToProjects}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="Search & Filter"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Task</th>
                  <th className="pb-3 font-semibold">Note</th>
                  <th className="pb-3 font-semibold">Due on</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectsData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Client Column with Avatar & Handle */}
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <img
                            src={row.client.avatar}
                            alt={row.client.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span
                            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white ${
                              row.client.badge === 'Up'
                                ? 'bg-[#14a800]'
                                : 'bg-[#1dbf73]'
                            }`}
                          >
                            {row.client.badge}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{row.client.name}</p>
                          <p className="text-[10px] text-slate-400">{row.client.handle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Task Column */}
                    <td className="py-3.5 pr-3">
                      <p className="font-bold text-slate-800">{row.task.title}</p>
                      <p className="text-[10px] text-slate-400">{row.task.subtitle}</p>
                    </td>

                    {/* Note Icon */}
                    <td className="py-3.5 pr-3 text-slate-400">
                      <FileText className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 pr-3 text-slate-700 font-medium">
                      {row.dueOn}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 pr-3 font-bold text-slate-900">
                      {row.price}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 pr-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.statusColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60" />
                        {row.status}
                      </span>
                    </td>

                    {/* More Menu */}
                    <td className="py-3.5 text-right text-slate-400">
                      <button className="p-1 hover:text-slate-600 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN (4 of 12 columns)
         ========================================================================= */}
      <div className="lg:col-span-4 space-y-6">
        {/* 1. Priority Tasks Card */}
        <div className="prism-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Priority tasks</h4>
            <button
              onClick={onNavigateToProjects}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              See all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              {
                title: 'Follow-ups',
                due: 'Apr 1',
                progress: '3/4 completed',
                desc: 'AI reminders for client follow-ups and check-ins.',
              },
              {
                title: 'Contract Review',
                due: 'Apr 1',
                progress: '1/2 completed',
                desc: 'AI review and approval of contracts.',
              },
              {
                title: 'Invoices',
                due: 'Apr 2',
                progress: '1/5 paid',
                desc: 'Notify customers about payment.',
              },
              {
                title: 'View new offers',
                due: 'Apr 2',
                progress: '3/4 paid',
                desc: 'A quick response to an offer increases trust.',
              },
            ].map((task, i) => (
              <div
                key={i}
                onClick={onOpenCreateTask}
                className="py-3 flex items-start justify-between group cursor-pointer hover:bg-slate-50/60 rounded-xl px-1.5 transition"
              >
                <div className="flex items-start space-x-3">
                  {/* Circular Ring Indicator */}
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin-slow shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center space-x-2 text-xs">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        📅 {task.due}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        ✨ {task.progress}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {task.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 transition" />
              </div>
            ))}
          </div>
        </div>

        {/* 2. PrismAI Assistant Card ("How can I help you?") */}
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50 border border-indigo-100/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-center pb-4">
              <span className="text-xs font-semibold text-slate-500">Hi, Aditya 👋</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                How can I help you?
              </h3>
            </div>

            {/* Model Switcher Pills */}
            <div className="flex items-center justify-center space-x-1.5 bg-white p-1 rounded-full border border-slate-200/80 mb-5 shadow-2xs">
              {(['PrismAI', 'GPT Chat', 'DeepSeek'] as const).map((model) => {
                const isSelected = activeAIModel === model;
                return (
                  <button
                    key={model}
                    onClick={() => setActiveAIModel(model)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {model}
                  </button>
                );
              })}
            </div>

            {/* 4 Quick Prompt Tiles */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { title: 'Text Assistance', icon: '📝', color: 'text-emerald-700 bg-emerald-50/90' },
                { title: 'Process Automation', icon: '⚙️', color: 'text-rose-700 bg-rose-50/90' },
                { title: 'Schedule Optimization', icon: '⏱️', color: 'text-amber-700 bg-amber-50/90' },
                { title: 'Smart Response', icon: '⚡', color: 'text-purple-700 bg-purple-50/90' },
              ].map((tile) => (
                <button
                  key={tile.title}
                  onClick={() => handleQuickPrompt(tile.title)}
                  className="p-3 rounded-2xl bg-white border border-slate-200/70 text-left hover:border-indigo-300 hover:shadow-xs transition active:scale-95 group"
                >
                  <span className="text-base">{tile.icon}</span>
                  <p className="text-[11px] font-bold text-slate-800 mt-1 leading-snug group-hover:text-indigo-600 transition">
                    {tile.title}
                  </p>
                </button>
              ))}
            </div>

            {/* Response Area */}
            {aiResponse && (
              <div className="mb-4 p-3 rounded-xl bg-white border border-indigo-200 text-xs text-slate-700 font-medium leading-relaxed">
                {aiResponse}
              </div>
            )}
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSendPrompt} className="relative mt-2">
            <input
              type="text"
              placeholder="Ask something..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full pl-4 pr-20 py-2.5 rounded-full bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                title="Attach file"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xs transition"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
