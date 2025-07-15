
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import UrlShortenerForm from "./components/UrlShortenerForm";
import StatisticsPage from "./components/StatisticsPage";
import RedirectHandler from "./components/RedirectHandler";
import { Container } from "./components/ui/container";

const queryClient = new QueryClient();

const App = () => (
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
);

export default App;
