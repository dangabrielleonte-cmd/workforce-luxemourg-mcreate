import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.demo.login.useMutation({
    onSuccess: () => {
      // Refresh auth state and redirect
      navigate("/chat");
    },
    onError: (error) => {
      setError(error.message || "Login failed");
    },
  });

  const credentialQuery = trpc.demo.getCredentials.useQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    loginMutation.mutate({ username, password });
  };

  const handleDemoLogin = () => {
    if (credentialQuery.data) {
      setUsername(credentialQuery.data.username);
      setPassword(credentialQuery.data.password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Workforce Luxembourg
            </h1>
            <p className="text-slate-600">
              HR & Employment Law Assistant
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                {showPassword ? "Hide" : "Show"} password
              </button>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          {credentialQuery.data && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                Demo Credentials:
              </p>
              <div className="space-y-2 text-sm text-blue-800 mb-4">
                <p>
                  <strong>Email:</strong> <code className="bg-white px-2 py-1 rounded">{credentialQuery.data.username}</code>
                </p>
                <p>
                  <strong>Password:</strong> <code className="bg-white px-2 py-1 rounded">{credentialQuery.data.password}</code>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDemoLogin}
                className="w-full"
              >
                Auto-fill Demo Credentials
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-600">
              This is a demo account for testing the Workforce Luxembourg HR & Employment Law Assistant. 
              Use the credentials above to access the full application.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
