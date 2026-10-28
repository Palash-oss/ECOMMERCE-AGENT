import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Bot, User, Sparkles, Check, Copy, 
  Terminal, ShieldCheck, Loader2, ArrowRight 
} from 'lucide-react';

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  statusLogs?: string[];
  toolsUsed?: string[];
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ isOpen, onClose, initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "👋 **Hello! I'm NexusCommerce AI**, your enterprise e-commerce assistant. I query the live CockroachDB cluster using verified analytical tools with zero raw SQL execution. What would you like to explore?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "What are our top 3 revenue categories and unit prices?",
    "Analyze customer review satisfaction and 1-star root causes",
    "Which Brazilian states account for 65% of customer orders?",
    "Detect any fulfillment delivery delay bottlenecks",
  ];

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStatus]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (questionToSend?: string) => {
    const q = questionToSend || input;
    if (!q.trim() || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const agentMsgId = `agent_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q },
      { id: agentMsgId, sender: 'agent', text: '', statusLogs: [], toolsUsed: [] }
    ]);
    setInput('');
    setIsStreaming(true);
    setCurrentStatus('Connecting to AI agent...');

    try {
      const response = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retry = response.headers.get('Retry-After') || '60';
          throw new Error(`Rate limit exceeded. Please retry after ${retry} seconds.`);
        }
        throw new Error('Agent failed to respond.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) throw new Error('No readable stream available.');

      let accumulatedText = '';
      let statusLogList: string[] = [];
      let toolList: string[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'status') {
                setCurrentStatus(data.text);
                statusLogList.push(data.text);
              } else if (data.type === 'tool_call') {
                toolList.push(data.name);
              } else if (data.type === 'token') {
                accumulatedText += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === agentMsgId
                      ? { ...m, text: accumulatedText, statusLogs: [...statusLogList], toolsUsed: [...toolList] }
                      : m
                  )
                );
              } else if (data.type === 'done') {
                setCurrentStatus('');
              }
            } catch {
              // Ignore line parse artifacts
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? { ...m, text: `⚠️ **Agent Error**: ${err.message || 'Service unavailable.'}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setCurrentStatus('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-bento-card dark:bg-bento-darkCard h-full shadow-2xl flex flex-col border-l border-white/60 dark:border-bento-darkBorder animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-violet text-white flex items-center justify-center shadow-bento-hero">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText flex items-center gap-2">
                NexusCommerce AI Agent
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-brand-emerald">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-bento-muted flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-indigo" />
                Zero Raw SQL • Verified Parameterized Tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-bento-muted hover:text-bento-text transition-bento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'agent' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                  m.sender === 'user'
                    ? 'bg-brand-indigo text-white rounded-br-none'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-bento-text dark:text-bento-darkText rounded-bl-none'
                }`}
              >
                {/* Tools Badge */}
                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {m.toolsUsed.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-brand-indigoDark dark:text-indigo-300"
                      >
                        <Terminal className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Markdown text representation */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.text || (isStreaming ? 'Thinking...' : '')}
                </div>

                {/* Copy Button */}
                {m.sender === 'agent' && m.text && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-bento"
                    title="Copy response"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-brand-emerald" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Real-time status bubble */}
          {currentStatus && (
            <div className="flex items-center gap-2 text-xs text-brand-indigo bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 px-3 py-2 rounded-xl animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{currentStatus}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-bento-muted font-bold uppercase tracking-wider mb-1.5">
            Suggested Prompts
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={isStreaming}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 hover:border-brand-indigo hover:text-brand-indigo transition-bento flex items-center gap-1 shadow-sm"
              >
                <span>{s}</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-bento-card dark:bg-bento-darkCard">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              disabled={isStreaming}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about sales, categories, freight, or reviews..."
              className="flex-1 text-xs bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-bento-text dark:text-bento-darkText focus:outline-none focus:ring-2 focus:ring-brand-indigo/30 transition-bento"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 rounded-xl bg-brand-indigo hover:bg-brand-indigoDark disabled:opacity-40 text-white flex items-center justify-center shadow-bento-hero transition-bento"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
