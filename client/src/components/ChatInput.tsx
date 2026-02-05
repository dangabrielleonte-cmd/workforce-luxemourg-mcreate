import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import type { ExpertiseMode } from "@shared/types";
import { EXPERTISE_MODES } from "@shared/types";

interface ChatInputProps {
  onSendMessage: (content: string, mode?: ExpertiseMode) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<ExpertiseMode | "auto">("auto");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading || disabled) return;

    const selectedMode = mode === "auto" ? undefined : mode;
    await onSendMessage(content, selectedMode);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <div className="flex gap-2">
        <Select value={mode} onValueChange={(v) => setMode(v as ExpertiseMode | "auto")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            {Object.entries(EXPERTISE_MODES).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ask about HR procedures, employment law, or AI support programs..."
          className="min-h-20 resize-none"
          disabled={isLoading || disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleSubmit(e as any);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isLoading || disabled}
          className="h-20"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Ctrl+Enter to send • Auto-detect mode will classify your question automatically
      </p>
    </form>
  );
}
