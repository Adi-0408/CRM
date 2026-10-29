'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  ChevronDown,
  Paperclip,
  Send,
  Sparkles,
  RotateCcw,
  Edit2,
  Check,
  Phone,
  Video,
  MoreVertical,
  Sliders,
  MessageSquare,
  FileText,
  Clock,
  Pin,
} from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  avatar: string;
  badge: 'Up' | 'fi' | 'tg';
  badgeColor: string;
  preview: string;
  time: string;
  unread?: number;
  isStarred?: boolean;
}

export default function PrismInboxView() {
  const [selectedContact, setSelectedContact] = useState<number>(1);
  const [showSmartReply, setShowSmartReply] = useState<boolean>(true);
  const [smartReplyText, setSmartReplyText] = useState<string>(
    "Of course! I'll start by understanding your goals, creating wireframes, and refining the design in Figma, keeping communication open throughout. I offer fixed-rate and hourly pricing based on scope — share more details, and I'll provide a tailored estimate. Excited to learn more!"
  );
  const [messages, setMessages] = useState<Array<{ sender: 'client' | 'agent'; text: string; time: string }>>([
    {
      sender: 'client',
      text: 'Hi! Your portfolio is impressive. Looking for a designer for a tech startup landing page. Are you available?',
      time: 'Apr 1, 2026, 3:08 PM',
    },
    {
      sender: 'agent',
      text: "Hi! Yes, I'm available. What do you need help with?",
      time: 'Apr 1, 2026, 3:09 PM',
    },
    {
      sender: 'client',
      text: 'Great! Before we dive into details, can you tell me about your work process and pricing?',
      time: 'Apr 1, 2026, 3:09 PM',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState<string>('Smart Reply');

  const contacts: Contact[] = [
    {
      id: 1,
      name: 'Sophie T.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      badge: 'Up',
      badgeColor: 'bg-[#14a800]',
      preview: 'Great! Before we dive into details, can you tell me about...',
      time: '8 hours',
    },
    {
      id: 2,
      name: 'Liam K.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      badge: 'tg',
      badgeColor: 'bg-[#0088cc]',
      preview: "I'm thrilled to dive into our possibilities.",
      time: '1 day',
      unread: 1,
      isStarred: true,
    },
    {
      id: 3,
      name: 'Olivia R.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      badge: 'fi',
      badgeColor: 'bg-[#1dbf73]',
      preview: "Hope you're doing well! Just checking in to see how t...",
      time: '2 days',
    },
    {
      id: 4,
      name: 'Noah J.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      badge: 'Up',
      badgeColor: 'bg-[#14a800]',
      preview: "I'm excited about what we can achieve.",
      time: '4 days',
    },
    {
      id: 5,
      name: 'Sam W.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
      badge: 'tg',
      badgeColor: 'bg-[#0088cc]',
      preview: 'Let me know if you have time to go over them together.',
      time: '4 days',
    },
    {
      id: 6,
      name: 'Ava M.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      badge: 'tg',
      badgeColor: 'bg-[#0088cc]',
      preview: 'The latest version looks great! I have a few minor tweaks...',
      time: '5 days',
    },
    {
      id: 7,
      name: 'Ethan S.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      badge: 'Up',
      badgeColor: 'bg-[#14a800]',
      preview: "I'm looking forward to what we can invent.",
      time: '8 days',
      unread: 2,
    },
  ];

  const handleSendSmartReply = () => {
    setMessages((prev) => [
      ...prev,
      {
        sender: 'agent',
        text: smartReplyText,
        time: 'Just now',
      },
    ]);
    setShowSmartReply(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        sender: 'agent',
        text: inputMessage,
        time: 'Just now',
      },
    ]);
    setInputMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 min-h-[750px]">
      {/* =========================================================================
          LEFT: ACTIVE CHAT THREAD (8 of 12 columns)
         ========================================================================= */}
      <div className="lg:col-span-8 prism-card p-6 flex flex-col justify-between">
        {/* Thread Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
                  alt="Sophie T."
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#14a800] text-[8px] font-bold text-white flex items-center justify-center">
                  Up
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sophie T.</h4>
                <p className="text-[11px] text-slate-400">
                  USA | Local time: Apr 1, 2026, 3:08 PM
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              <button className="p-1.5 hover:text-amber-500 rounded-lg hover:bg-slate-50">
                <Star className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <Pin className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="py-6 space-y-4 max-h-[380px] overflow-y-auto pr-2">
            {messages.map((msg, index) => {
              const isClient = msg.sender === 'client';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.time}
                  </span>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                      isClient
                        ? 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-xs'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom AI Tools & Input Area */}
        <div className="pt-4 border-t border-slate-100 space-y-3.5">
          {/* 6 AI Smart Suggestion Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Smart Reply', icon: '📝' },
              { label: 'Tone Adjustment', icon: '🎛️' },
              { label: 'Follow-Up Suggestions', icon: '💬' },
              { label: 'Message Summarization', icon: '📋' },
              { label: 'Suggested Attachments', icon: '📎' },
              { label: 'Automated Status Updates', icon: '⚡' },
            ].map((tile) => {
              const isSelected = activeSuggestion === tile.label;
              return (
                <button
                  key={tile.label}
                  onClick={() => {
                    setActiveSuggestion(tile.label);
                    setShowSmartReply(true);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-violet-50/70 border-violet-200 text-violet-900 font-bold shadow-2xs'
                      : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">{tile.icon}</span>
                    <span className="text-[11px] truncate">{tile.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Smart Reply Draft Box */}
          {showSmartReply && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-slate-50 border border-indigo-200/80 shadow-xs relative animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Reply Draft</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {smartReplyText}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-semibold pt-1">
                    ✨ This response builds trust, shows flexibility, and keeps the conversation open.
                  </p>
                </div>

                {/* Send & Regenerate Controls */}
                <div className="flex flex-col space-y-1.5 shrink-0">
                  <button
                    onClick={handleSendSmartReply}
                    className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-xs transition"
                    title="Send Reply"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setSmartReplyText(
                        "Hi Sophie! Absolutely, I'd love to help craft your landing page. I specialize in high-converting SaaS designs. Let's schedule a brief 10-minute discovery call!"
                      )
                    }
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
                    title="Regenerate Variation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Input Bar */}
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              placeholder="Send message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-2xs"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Paperclip className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowSmartReply(true)}
                className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-full"
                title="AI Magic Assist"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          <p className="text-center text-[10px] text-slate-400">
            PrismAI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>

      {/* =========================================================================
          RIGHT: CONTACTS LIST (4 of 12 columns)
         ========================================================================= */}
      <div className="lg:col-span-4 prism-card p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">All messages</h4>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
                <span>All Platforms</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {contacts.map((contact) => {
              const isSelected = selectedContact === contact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`py-3 px-2 flex items-start space-x-3 rounded-xl cursor-pointer transition ${
                    isSelected ? 'bg-violet-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <span
                      className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold text-white flex items-center justify-center ${contact.badgeColor}`}
                    >
                      {contact.badge}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {contact.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {contact.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {contact.preview}
                    </p>
                  </div>

                  {/* Unread / Star */}
                  {contact.unread && (
                    <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 self-center">
                      {contact.unread}
                    </span>
                  )}
                  {contact.isStarred && !contact.unread && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 self-center" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
