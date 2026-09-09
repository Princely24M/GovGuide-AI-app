import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Home} />
      <Route path="/services" component={Home} />
      <Route path="/services/:slug" component={Home} />
      <Route path="/services-map" component={Home} />
      <Route path="/ask-govguide" component={Home} />
      <Route path="/content-generator" component={Home} />
      <Route path="/sentiment-analyzer" component={Home} />
      <Route path="/checklist" component={Home} />
      <Route path="/saved-content" component={Home} />
      <Route path="/nearby-offices" component={Home} />
      <Route path="/settings" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
