
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import Navigation from './components/Navigation';
import UrlShortenerForm from './components/UrlShortenerForm';
import StatisticsPage from './components/StatisticsPage';
import RedirectHandler from './components/RedirectHandler';
import logger from './services/loggingMiddleware';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  React.useEffect(() => {
    logger.info('URL Shortener App initialized');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Navigation />
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<UrlShortenerForm />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/:shortcode" element={<RedirectHandler />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
