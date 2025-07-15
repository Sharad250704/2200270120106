
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import urlService from '../services/urlService';
import logger from '../services/loggingMiddleware';

const RedirectHandler = () => {
  const { shortcode } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    handleRedirect();
  }, [shortcode]);

  const handleRedirect = async () => {
    logger.info('Attempting to redirect', { shortcode });
    
    try {
      const urlData = urlService.getUrlByShortcode(shortcode);
      
      if (!urlData) {
        setError('This short URL does not exist or has expired.');
        logger.warn('URL not found or expired', { shortcode });
        setLoading(false);
        return;
      }

      // Record the click
      urlService.recordClick(shortcode, 'direct_access', 'localhost');
      
      setRedirecting(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = urlData.originalUrl;
        logger.info('Redirected successfully', { shortcode, originalUrl: urlData.originalUrl });
      }, 1000);
      
    } catch (err) {
      setError('An error occurred while processing your request.');
      logger.error('Redirect error', { shortcode, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">Processing your request...</Typography>
      </Box>
    );
  }

  if (redirecting) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh',
        gap: 2
      }}>
        <CircularProgress size={60} color="success" />
        <Typography variant="h6" color="success.main">
          Redirecting you now...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          If you are not redirected automatically, please check your browser settings.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh',
        gap: 3,
        maxWidth: 600,
        mx: 'auto',
        p: 3
      }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            URL Not Found
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
        </Alert>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  return null;
};

export default RedirectHandler;
