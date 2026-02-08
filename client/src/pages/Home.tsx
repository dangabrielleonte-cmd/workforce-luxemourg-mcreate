import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  BookOpen,
  Briefcase,
  Code2,
  HelpCircle,
  Users,
  Zap,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const exampleQuestions = [
    {
      question: "How do I register as a job-seeker with ADEM?",
      mode: "procedural",
    },
    {
      question: "What are the conditions for temporary agency work in Luxembourg?",
      mode: "legal",
    },
    {
      question: "What AI support programmes are available for SMEs?",
      mode: "ai_innovation",
    },
    {
      question: "What support exists for including workers with disabilities?",
      mode: "procedural",
    },
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Official Sources",
      description: "Answers grounded in Guichet.lu and official Luxembourg sources",
    },
    {
      icon: Zap,
      title: "Smart Routing",
      description: "Automatically classifies questions into procedural, legal, or AI/innovation modes",
    },
    {
      icon: Users,
      title: "Multi-Language",
      description: "Support for English, French, and German",
    },
    {
      icon: Code2,
      title: "Embeddable",
      description: "Easy integration into your website via iframe or script tag",
    },
    {
      icon: Briefcase,
      title: "For Everyone",
      description: "Perfect for HR teams, SMEs, law firms, and job-seekers",
    },
    {
      icon: HelpCircle,
      title: "Clear Disclaimers",
      description: "Transparent about limitations and when to seek professional advice",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Workforce Luxembourg</h1>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={() => navigate("/chat")}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/integrations")}>
                  Integrations
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center space-y-6 mb-12">
          <Badge className="inline-block" variant="outline">
            AI-Powered HR Assistant
          </Badge>
          <h2 className="text-5xl font-bold tracking-tight">
            Luxembourg HR & Employment Law Assistant
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get clear, grounded answers about HR procedures, employment law, and support programmes
            using official Guichet.lu sources. Embed it in your website or use our standalone interface.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate("/chat")}>
                Open Chat <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <a href={getLoginUrl()}>Try the Assistant</a>
                </Button>
                <Button size="lg" variant="outline">
                  View Documentation
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Example Questions */}
        <div className="grid md:grid-cols-2 gap-4 mb-20">
          <h3 className="md:col-span-2 text-2xl font-bold mb-4">Example Questions</h3>
          {exampleQuestions.map((q, idx) => (
            <Card key={idx} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="flex-shrink-0">
                  {q.mode === "procedural"
                    ? "Procedural"
                    : q.mode === "legal"
                      ? "Legal"
                      : "AI/Innovation"}
                </Badge>
                <p className="text-sm">{q.question}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-slate-900 py-20 border-y">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Workforce Luxembourg?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-6">
                  <Icon className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="container max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Embed in Your Website</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              Integrate our assistant into your website with just a few lines of code. Choose between
              iframe embedding or script tag integration.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span>Fully configurable colors and branding</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span>Multi-language support (EN, FR, DE)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span>Analytics and usage tracking</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600">✓</span>
                <span>No coding required</span>
              </li>
            </ul>
            {isAuthenticated ? (
              <Button size="lg" onClick={() => navigate("/integrations")}>
                Manage Integrations
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Get Embed Code</a>
              </Button>
            )}
          </div>
          <Card className="p-8 bg-slate-100 dark:bg-slate-800">
            <pre className="text-xs overflow-x-auto">
              <code>{`<iframe
  src="https://workforce-luxembourg.manus.space/embed?siteKey=..."
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`}</code>
            </pre>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-900 text-white py-20">
        <div className="container max-w-6xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Join HR teams, SMEs, and law firms across Luxembourg using our AI assistant to provide
            accurate, grounded answers about employment law and HR procedures.
          </p>
          {isAuthenticated ? (
            <Button size="lg" variant="secondary" onClick={() => navigate("/chat")}>
              Open Dashboard
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>Sign Up Now</a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Disclaimer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <a href="https://guichet.lu" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Guichet.lu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    API Docs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>
              © 2026 Workforce Luxembourg. This is not an official service of the Luxembourg government.
              Information provided is for general guidance only and not legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
