"use client";

import { CalendarSearch, ChartLine, Search, Send, Sparkles, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { runCopilot } from "@/server/ai/copilot";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS: { icon: LucideIcon; title: string; prompt: string }[] = [
  {
    icon: Search,
    title: "Find candidates",
    prompt: "Find strong candidates for DevOps Engineer",
  },
  {
    icon: ChartLine,
    title: "Pipeline summary",
    prompt: "Summarise my pipeline this week",
  },
  {
    icon: CalendarSearch,
    title: "Chase offers",
    prompt: "Which offers need chasing?",
  },
];

/**
 * The copilot as a first-class dashboard panel — same tenant-scoped brain as
 * the topbar sheet, embedded where the day starts.
 */
export function CopilotPanel({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setThinking(true);
    const result = await runCopilot({ messages: next.slice(-12) });
    setThinking(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMessages([...next, { role: "assistant", content: result.reply }]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  return (
    <Card className="animate-fade-up relative flex h-full flex-col overflow-hidden">
      <div className="gradient-ai absolute inset-x-0 top-0 h-0.5" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="gradient-ai flex size-7 items-center justify-center rounded-lg text-white">
            <Sparkles className="size-4" />
          </span>
          AI Recruiter Copilot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 space-y-3">
            <p className="text-sm">
              Good day, {firstName} 👋
              <span className="text-muted-foreground block text-xs">
                How can I help you today?
              </span>
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.prompt}
                  onClick={() => send(suggestion.prompt)}
                  className="border-input hover:border-primary/40 hover:bg-accent/50 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors"
                >
                  <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <suggestion.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">{suggestion.title}</span>
                    <span className="text-muted-foreground block truncate text-[11px]">
                      {suggestion.prompt}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1 pr-2">
            <div className="space-y-2.5">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-secondary",
                  )}
                >
                  {message.content}
                </div>
              ))}
              {thinking ? (
                <div className="bg-secondary text-muted-foreground max-w-[90%] animate-pulse rounded-xl px-3 py-2 text-xs">
                  Checking your data…
                </div>
              ) : null}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask AI anything…"
            disabled={thinking}
            className="h-9 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            className="gradient-ai size-9 shrink-0 border-0 text-white"
            disabled={thinking || !input.trim()}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
