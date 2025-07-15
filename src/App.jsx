import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation.jsx";
import UrlShortenerForm from "./components/UrlShortenerForm.jsx";
import StatisticsPage from "./components/StatisticsPage.jsx";
import RedirectHandler from "./components/RedirectHandler.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { Container } from "./components/ui/container";
import { logger, logPageView } from "./utils/logger.js";
import { performanceMonitor } from "./utils/performance.js";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    logger.info('App', 'Application initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    const performanceInterval = setInterval(() => {
      performanceMonitor.logMemoryUsage({ context: 'periodic_check' });
    }, 30000);

    return () => {
      clearInterval(performanceInterval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Navigation />
              <Container>
                <Routes>
                  <Route path="/" element={<UrlShortenerForm />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/:shortcode" element={<RedirectHandler />} />
                </Routes>
              </Container>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
