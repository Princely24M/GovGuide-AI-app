import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { SupabaseAuthProvider, useSupabaseAuth } from "./contexts/SupabaseAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function ProtectedHome() {
  const [location] = useLocation();
  const auth = useSupabaseAuth();
  useEffect(() => {
    if (!auth.loading && !auth.user) window.location.replace(`/login?redirect=${encodeURIComponent(location)}`);
  }, [auth.loading, auth.user, location]);
  if (auth.loading || !auth.user) return <div className="flex min-h-screen items-center justify-center bg-[#f7fafa] text-sm font-semibold text-[#087E8B] dark:bg-[#062f3d]
">Checking your secure session…</div>;
  return <Home />;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/login"><AuthPage mode="login" /></Route>
    <Route path="/signup"><AuthPage mode="signup" /></Route>
    <Route path="/forgot-password"><AuthPage mode="forgot" /></Route>
    <Route path="/reset-password"><AuthPage mode="reset" /></Route>
    <Route path="/dashboard" component={ProtectedHome} />
    <Route path="/services" component={ProtectedHome} />
    <Route path="/services/:slug" component={ProtectedHome} />
    <Route path="/services-map" component={ProtectedHome} />
    <Route path="/ask-govguide" component={ProtectedHome} />
    <Route path="/content-generator" component={ProtectedHome} />
    <Route path="/sentiment-analyzer" component={ProtectedHome} />
    <Route path="/checklist" component={ProtectedHome} />
    <Route path="/saved-content" component={ProtectedHome} />
    <Route path="/nearby-offices" component={ProtectedHome} />
    <Route path="/settings" component={ProtectedHome} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><SupabaseAuthProvider><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></SupabaseAuthProvider></ErrorBoundary>;
}

export default App;
