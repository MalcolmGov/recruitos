"use client";

import { Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { runCopilot } from "@/server/ai/copilot";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who in the pool knows React?",
  "How healthy is our pipeline?",
  "Which jobs are open right now?",
];

export function CopilotSheet() {
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
    // Keep the last 12 turns — the server validates the same bound.
    const result = await runCopilot({ messages: next.slice(-12) });
    setThinking(false);
    if (!result.ok) {
      toast.error(result.error);
      setMessages(next);
      return;
    }
    setMessages([...next, { role: "assistant", content: result.reply }]);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open AI copilot"
          className="hover:shadow-glow transition-shadow"
        >
          <span className="gradient-ai flex size-5 items-center justify-center rounded-md text-white">
            <Sparkles className="size-3" />
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="gradient-ai flex size-6 items-center justify-center rounded-lg text-white">
              <Sparkles className="size-3.5" />
            </span>
            Copilot
          </SheetTitle>
          <SheetDescription>
            Ask about your candidates, jobs, pipeline and placements.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          {messages.length === 0 ? (
            <div className="space-y-2 py-6">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="border-input hover:bg-accent w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-secondary",
                  )}
                >
                  {message.content}
                </div>
              ))}
              {thinking ? (
                <div className="bg-secondary text-muted-foreground max-w-[85%] animate-pulse rounded-xl px-3 py-2 text-sm">
                  Checking your data…
                </div>
              ) : null}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <form
          className="flex gap-2 border-t p-4"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask the copilot…"
            disabled={thinking}
          />
          <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
