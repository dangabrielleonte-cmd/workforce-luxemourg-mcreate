import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Copy, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Integrations() {
  const { user, isAuthenticated } = useAuth();
  const [siteName, setSiteName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [defaultMode, setDefaultMode] = useState("procedural");
  const [isOpen, setIsOpen] = useState(false);

  const { data: integrations, isLoading } = trpc.integrations.listIntegrations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.integrations.createIntegration.useMutation({
    onSuccess: () => {
      setSiteName("");
      setPrimaryColor("#2563eb");
      setDefaultLanguage("en");
      setDefaultMode("procedural");
      setIsOpen(false);
      trpc.useUtils().integrations.listIntegrations.invalidate();
      toast.success("Integration created successfully");
    },
    onError: () => {
      toast.error("Failed to create integration");
    },
  });

  const deleteMutation = trpc.integrations.deleteIntegration.useMutation({
    onSuccess: () => {
      trpc.useUtils().integrations.listIntegrations.invalidate();
      toast.success("Integration deleted");
    },
    onError: () => {
      toast.error("Failed to delete integration");
    },
  });

  const handleCreateIntegration = async () => {
    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    await createMutation.mutateAsync({
      siteName,
      config: {
        primaryColor,
        defaultLanguage: defaultLanguage as any,
        defaultMode: defaultMode as any,
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p>Please sign in to manage integrations</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage embedded widgets for your websites
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Integration</DialogTitle>
                <DialogDescription>
                  Set up a new embedded widget for your website
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Site Name</label>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g., My HR Portal"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Default Language</label>
                  <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Default Mode</label>
                  <Select value={defaultMode} onValueChange={setDefaultMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procedural">Procedural HR</SelectItem>
                      <SelectItem value="legal">Employment Law</SelectItem>
                      <SelectItem value="ai_innovation">AI & Innovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateIntegration}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Integrations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : integrations && integrations.length > 0 ? (
          <div className="grid gap-6">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onDelete={() =>
                  deleteMutation.mutate({
                    siteKey: integration.siteKey,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No integrations yet. Create one to get started!
            </p>
            <Button onClick={() => setIsOpen(true)}>Create First Integration</Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onDelete,
}: {
  integration: any;
  onDelete: () => void;
}) {
  const [embedType, setEmbedType] = useState<"iframe" | "script">("iframe");
  const [showEmbed, setShowEmbed] = useState(false);

  const { data: embedCode, isLoading: loadingEmbed } =
    trpc.integrations.generateEmbedCode.useQuery(
      {
        siteKey: integration.siteKey,
        embedType,
      },
      { enabled: showEmbed }
    );

  const handleCopyCode = () => {
    if (embedCode?.code) {
      navigator.clipboard.writeText(embedCode.code);
      toast.success("Embed code copied to clipboard");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{integration.siteName}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
            {integration.siteKey}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEmbed} onOpenChange={setShowEmbed}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Embed Code</DialogTitle>
                <DialogDescription>
                  Copy and paste this code into your website
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={embedType} onValueChange={(v) => setEmbedType(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iframe">iframe</SelectItem>
                      <SelectItem value="script">Script Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loadingEmbed ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : embedCode ? (
                  <>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto text-xs">
                      <code>{embedCode.code}</code>
                    </pre>
                    <Button onClick={handleCopyCode} className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-600 dark:text-slate-400">Language</p>
          <Badge>{integration.config?.defaultLanguage || "en"}</Badge>
        </div>
        <div>
          <p className="text-slate-600 dark:text-slate-400">Mode</p>
          <Badge>{integration.config?.defaultMode || "procedural"}</Badge>
        </div>
        <div>
          <p className="text-slate-600 dark:text-slate-400">Color</p>
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded border"
              style={{ backgroundColor: integration.config?.primaryColor || "#2563eb" }}
            />
            <span className="font-mono text-xs">{integration.config?.primaryColor || "#2563eb"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
