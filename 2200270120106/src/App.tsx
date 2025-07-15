import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Index from "./pages/Index";
import StatisticsPage from "./pages/StatisticsPage";
import RedirectHandler from "./components/RedirectHandler";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Material-UI theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(217, 91%, 60%)',
    },
    secondary: {
      main: 'hsl(140, 72%, 65%)',
    },
    background: {
      default: 'hsl(210, 20%, 98%)',
      paper: 'hsl(210, 20%, 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/:shortCode" element={<RedirectHandler />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
