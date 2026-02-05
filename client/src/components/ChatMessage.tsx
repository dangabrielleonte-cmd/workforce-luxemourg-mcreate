import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { Streamdown } from "streamdown";
import type { ChatMessageData, ExpertiseMode } from "@shared/types";
import { EXPERTISE_MODES } from "@shared/types";

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-2xl ${isUser ? "order-2" : "order-1"}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          <Streamdown>{message.content}</Streamdown>
        </div>

        {/* Mode badge and sources for assistant messages */}
        {!isUser && (
          <div className="mt-3 space-y-2">
            {message.mode && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {EXPERTISE_MODES[message.mode as ExpertiseMode]?.label || message.mode}
                </Badge>
              </div>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Sources:
                </p>
                <div className="space-y-1">
                  {message.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                    >
                      <Badge
                        variant="secondary"
                        className="flex-shrink-0 text-xs"
                      >
                        {source.sourceType === "guichet" ? "Guichet.lu" : source.sourceType === "official" ? "Official" : "Source"}
                      </Badge>
                      <span className="truncate flex-1">{source.sourceTitle}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
