import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import type { ExpertiseMode, ChatMessageData } from "@shared/types";
import { DISCLAIMERS } from "@shared/types";

export default function ChatInterface() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get utils at component level (not in callbacks)
  const utils = trpc.useUtils();

  // Queries and mutations
  const { data: conversation, isLoading: loadingConversation } =
    trpc.chat.getConversation.useQuery(
      { conversationId: parseInt(conversationId || "0") },
      { enabled: !!conversationId && isAuthenticated }
    );

  const { data: conversations } = trpc.chat.listConversations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Refetch conversation to get updated messages
      utils.chat.getConversation.invalidate();
    },
  });

  const createConversationMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (newConv) => {
      navigate(`/chat/${newConv.id}`);
    },
  });

  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      navigate("/chat");
    },
  });

  const renameConversationMutation = trpc.chat.renameConversation.useMutation({
    onSuccess: () => {
      setEditingTitle(false);
      utils.chat.getConversation.invalidate();
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = async (content: string, mode?: ExpertiseMode) => {
    if (!conversationId) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: parseInt(conversationId),
        content,
        mode,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCreateConversation = async () => {
    try {
      await createConversationMutation.mutateAsync({});
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId || !confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await deleteConversationMutation.mutateAsync({
        conversationId: parseInt(conversationId),
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleRenameConversation = async () => {
    if (!conversationId || !newTitle?.trim()) return;

    try {
      await renameConversationMutation.mutateAsync({
        conversationId: parseInt(conversationId),
        title: newTitle,
      });
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Sign in required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Please sign in to access the chat interface.
          </p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Start a conversation</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create a new conversation to begin asking questions about Luxembourg HR and employment law.
          </p>
          <Button onClick={handleCreateConversation}>New Conversation</Button>
        </Card>
      </div>
    );
  }

  if (loadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Conversation not found</h2>
          <Button onClick={() => navigate("/chat")}>Back to conversations</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-2 py-1 border rounded"
                  autoFocus
                />
                <Button size="sm" onClick={handleRenameConversation}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTitle(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{conversation.conversation.title}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTitle(true);
                    setNewTitle(conversation.conversation.title || "");
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCreateConversation}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteConversation}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center max-w-md">
              <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Ask any questions about Luxembourg HR procedures, employment law, or AI support programs.
              </p>
            </Card>
          </div>
        ) : (
          <>
            {conversation.messages.map((message) => {
              const typedMessage = {
                ...message,
                mode: message.mode as any,
              };
              return <ChatMessage key={message.id} message={typedMessage} />;
            })}
            {sendMessageMutation.isPending && (
              <div className="flex gap-3">
                <div className="max-w-2xl">
                  <div className="rounded-lg px-4 py-3 bg-slate-100 dark:bg-slate-800">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Generating response...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Disclaimer */}
      {conversation.messages.length > 0 && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950 border-t text-xs text-blue-900 dark:text-blue-100">
          <strong>Disclaimer:</strong> {DISCLAIMERS.general}
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-white dark:bg-slate-900 px-6 py-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
          disabled={!conversationId}
        />
      </div>
    </div>
  );
}
