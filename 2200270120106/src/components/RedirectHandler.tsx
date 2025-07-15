import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { urlShortenerService } from '../services/urlShortener';
import { logger } from '../services/logger';

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'hsl(var(--background))',
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const RedirectHandler: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) {
      setError('Invalid short code');
      setLoading(false);
      return;
    }

    logger.info('Redirect request received', { shortCode }, 'REDIRECT');

    // Simulate a brief loading period for better UX
    const timer = setTimeout(() => {
      const url = urlShortenerService.getUrl(shortCode);
      
      if (!url) {
        setError('Short URL not found. It may have been deleted or never existed.');
        logger.warn('Short URL not found for redirect', { shortCode }, 'REDIRECT');
        setLoading(false);
        return;
      }

      if (url.isExpired || new Date() > url.expiresAt) {
        setError('This short URL has expired and is no longer valid.');
        logger.warn('Expired URL access attempt', { shortCode, expiresAt: url.expiresAt }, 'REDIRECT');
        setLoading(false);
        return;
      }

      // Record the click
      const clickRecorded = urlShortenerService.recordClick(shortCode, 'direct');
      
      if (clickRecorded) {
        logger.info('Click recorded successfully for redirect', { shortCode, originalUrl: url.originalUrl }, 'REDIRECT');
        setRedirectUrl(url.originalUrl);
        
        // Redirect after a brief moment
        setTimeout(() => {
          window.location.href = url.originalUrl;
        }, 1000);
      } else {
        setError('Failed to process the redirect request.');
        logger.error('Failed to record click for redirect', { shortCode }, 'REDIRECT');
      }
      
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [shortCode]);

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={60} sx={{ color: 'hsl(var(--primary))', mb: 3 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Redirecting...
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please wait while we redirect you to your destination
        </Typography>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <LoadingContainer>
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', maxWidth: 500 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/'}
            sx={{
              background: 'var(--gradient-primary)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Create New Short URL
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/statistics'}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            View Statistics
          </Button>
        </Box>
      </LoadingContainer>
    );
  }

  if (redirectUrl) {
    return (
      <LoadingContainer>
        <Box sx={{ 
          p: 4, 
          background: 'hsl(var(--card))', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-card)',
          maxWidth: 500,
          width: '100%'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'hsl(var(--accent))' }}>
            ✅ Success!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Redirecting you to: <strong>{redirectUrl}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you're not redirected automatically, 
            <a href={redirectUrl} style={{ color: 'hsl(var(--primary))', marginLeft: 4 }}>
              click here
            </a>
          </Typography>
        </Box>
      </LoadingContainer>
    );
  }

  return <Navigate to="/" replace />;
};

export default RedirectHandler;