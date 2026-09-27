import { X, Sparkles, Send, ArrowUpRight } from 'lucide-react';

const suggestions = [
  'What are my active safety rules?',
  'Show recent blocks',
  "What's my spending limit?",
  'Do you block subscriptions?',
];

export default function CopilotDrawer({ messages, input, setInput, isTyping, onSend, onClose, messagesEndRef }) {
  return (
    <div className="fixed inset-0 z-50 flex animate-fade justify-end bg-ink/30 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="copilot-title">
      <button type="button" className="flex-1 cursor-default" aria-label="Close copilot" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md animate-slide-in-right flex-col border-l-2 border-ink bg-paper">
        <header className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-paper">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime text-ink">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="copilot-title" className="font-display text-lg font-extrabold leading-tight">Spendwall Copilot</h2>
              <p className="flex items-center gap-1.5 text-xs text-paper/70">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
                Knows your rules and audit trail
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close copilot" className="rounded-full border-2 border-paper/20 p-1.5 transition hover:rotate-90 hover:border-lime">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
          {messages.map((msg, index) => (
            <div key={index} className={`flex animate-rise ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-md bg-ink text-paper'
                    : 'rounded-bl-md border-2 border-ink/10 bg-white text-ink'
                }`}
              >
                <p>{msg.content}</p>
                <span className={`mt-1.5 block text-[10px] ${msg.role === 'user' ? 'text-right text-paper/60' : 'text-muted'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex">
              <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border-2 border-ink/10 bg-white px-4 py-3.5" aria-label="Copilot is typing">
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink [animation-delay:0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border-2 border-ink/15 bg-white px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ink hover:bg-lime"
            >
              {s}
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
        </div>

        <form onSubmit={onSend} className="flex gap-2 border-t-2 border-ink/10 bg-white p-4">
          <label htmlFor="copilot-input" className="sr-only">Ask Copilot</label>
          <input
            id="copilot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault();
            }}
            placeholder="Ask about your rules or recent checks..."
            className="flex-1 rounded-full border-2 border-ink/10 bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 transition focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-lime text-ink transition hover:-rotate-12 hover:shadow-pop"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </div>
  );
}
