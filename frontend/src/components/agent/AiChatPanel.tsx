import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  X, Send, Bot, User, Sparkles, Check, Copy, 
  Terminal, ShieldCheck, Loader2, ArrowRight, ChevronDown, 
  ChevronUp, Square, RotateCcw 
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
  isError?: boolean;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ isOpen, onClose, initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "### 🎯 Welcome to NexusCommerce AI Agent\nI'm your intelligent analytics assistant — powered by a **resilient multi-tier AI orchestrator (Groq + Gemini)** with verified parameterized tools, live database queries, and zero synthetic metrics.\n\nAsk me about **6-month revenue trends**, **top product categories**, **geographic consumer demand across Brazil**, or **operational delivery performance**.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "What are our top 3 revenue categories and unit prices?",
    "Analyze customer review satisfaction and 1-star ratings",
    "Which Brazilian states account for top customer demand?",
    "What is our unique customer repeat purchase rate and retention baseline?",
    "Identify on-time delivery performance and carrier turnaround bottlenecks",
    "Give me an executive summary of overall e-commerce performance"
  ];

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

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

  const toggleToolExpanded = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setCurrentStatus('');
    }
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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ message: q })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retry = response.headers.get('Retry-After') || '60';
          throw new Error(`Rate limit exceeded. Please retry after ${retry} seconds.`);
        }
        throw new Error(`Agent returned HTTP ${response.status}: ${response.statusText}`);
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
                if (!toolList.includes(data.name)) {
                  toolList.push(data.name);
                }
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
      if (err.name === 'AbortError') {
        // User aborted manually
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? { ...m, text: `⚠️ **Agent Error**: ${err.message || 'Service unavailable.'}`, isError: true }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setCurrentStatus('');
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-bento-card dark:bg-bento-darkCard h-full shadow-2xl flex flex-col border-l border-bento-border dark:border-bento-darkBorder animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-bento-border dark:border-bento-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shadow-bento-hero">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-bento-text dark:text-bento-darkText flex items-center gap-2">
                NexusCommerce AI Agent
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-bento-muted dark:text-bento-darkMuted flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                Zero Raw SQL • Verified Parameterized Tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-bento-muted hover:text-bento-text transition-bento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isToolExpanded = Boolean(expandedTools[m.id]);
            const uniqueTools = Array.from(new Set(m.toolsUsed || []));
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'agent' && (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-brand-orange dark:text-brand-neon flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 shadow-sm relative group ${
                    m.sender === 'user'
                      ? 'bg-brand-orange text-white rounded-br-none'
                      : 'bg-neutral-50 dark:bg-neutral-900/80 border border-bento-border dark:border-bento-darkBorder text-bento-text dark:text-bento-darkText rounded-bl-none'
                  }`}
                >
                  {/* Deduplicated Collapsible Tools Expander */}
                  {uniqueTools.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleToolExpanded(m.id)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 text-brand-orange dark:text-brand-neon hover:bg-orange-500/20 transition-bento border border-orange-500/20"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>⚡ Used {uniqueTools.length} analytics tool{uniqueTools.length === 1 ? '' : 's'}</span>
                        {isToolExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </button>

                      {isToolExpanded && (
                        <div className="mt-2 p-2 rounded-xl bg-black/40 border border-neutral-700 space-y-1 animate-in fade-in">
                          {uniqueTools.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-neutral-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span className="font-bold text-brand-neon">{t}</span>
                              <span className="text-neutral-500 text-[9px]">(parameterized)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Message Text via ReactMarkdown with custom styling */}
                  {m.sender === 'user' ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => <h3 className="font-bold text-sm text-brand-orange dark:text-brand-neon mt-2 mb-1" {...props} />,
                          h2: ({ node, ...props }) => <h4 className="font-bold text-xs text-brand-orange dark:text-brand-neon mt-2 mb-1" {...props} />,
                          h3: ({ node, ...props }) => <h5 className="font-bold text-xs text-brand-orange dark:text-brand-neon mt-2 mb-1 flex items-center gap-1.5" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                          ul: ({ node, ...props }) => <ul className="space-y-1 my-2 pl-4 list-none" {...props} />,
                          li: ({ node, ...props }) => (
                            <li className="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-brand-orange before:font-bold" {...props} />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="my-2.5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                              <table className="w-full text-left text-[11px] divide-y divide-neutral-200 dark:divide-neutral-800" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead className="bg-neutral-100 dark:bg-neutral-800/80 font-bold text-bento-text dark:text-bento-darkText" {...props} />,
                          tbody: ({ node, ...props }) => <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50" {...props} />,
                          th: ({ node, ...props }) => <th className="px-2.5 py-1.5" {...props} />,
                          td: ({ node, ...props }) => <td className="px-2.5 py-1.5 font-mono text-[11px]" {...props} />,
                          code: ({ inline, className, children, ...props }: any) => {
                            if (inline) {
                              return (
                                <code className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 font-mono text-[10px] text-brand-orange font-semibold" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <pre className="p-2.5 my-2 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-[10px] overflow-x-auto border border-neutral-800" {...props}>
                                <code>{children}</code>
                              </pre>
                            );
                          }
                        }}
                      >
                        {m.text || (isStreaming ? 'Thinking...' : '')}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Copy Button */}
                  {m.sender === 'agent' && m.text && (
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 transition-bento"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Retry Button if error */}
                  {m.isError && (
                    <button
                      onClick={handleRetryLast}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry query
                    </button>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time status indicator bubble */}
          {currentStatus && (
            <div className="flex items-center gap-2 text-xs text-brand-orange bg-orange-500/10 border border-brand-orange/20 px-3 py-2 rounded-xl animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{currentStatus}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-neutral-50/50 dark:bg-neutral-900/40 border-t border-bento-border dark:border-bento-darkBorder">
          <p className="text-[10px] text-bento-muted dark:text-bento-darkMuted font-bold uppercase tracking-wider mb-1.5">
            Suggested Prompts
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={isStreaming}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-bento-card dark:bg-bento-darkCard border border-bento-border dark:border-bento-darkBorder text-[11px] text-neutral-600 dark:text-neutral-300 hover:border-brand-orange hover:text-brand-orange transition-bento flex items-center gap-1 shadow-sm"
              >
                <span>{s}</span>
                <ArrowRight className="w-2.5 h-2.5 text-brand-orange" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Stop & Send */}
        <div className="p-4 border-t border-bento-border dark:border-bento-darkBorder bg-bento-card dark:bg-bento-darkCard">
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
              className="flex-1 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-bento-text dark:text-bento-darkText focus:outline-none focus:ring-2 focus:ring-brand-orange/40 transition-bento"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white flex items-center justify-center shadow transition-bento"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white text-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-brand-orange hover:bg-brand-orangeDark disabled:opacity-40 text-white flex items-center justify-center shadow-bento-hero transition-bento"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};
