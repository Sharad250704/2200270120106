
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import logger from '../services/loggingMiddleware';

const UrlShortenerForm = () => {
  const [urlForms, setUrlForms] = useState([{
    originalUrl: '',
    customShortcode: '',
    validityMinutes: 30
  }]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addUrlForm = () => {
    if (urlForms.length < 5) {
      setUrlForms([...urlForms, {
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
      logger.info('Added new URL form', { totalForms: urlForms.length + 1 });
    }
  };

  const removeUrlForm = (index) => {
    if (urlForms.length > 1) {
      const newForms = urlForms.filter((_, i) => i !== index);
      setUrlForms(newForms);
      logger.info('Removed URL form', { index, totalForms: newForms.length });
    }
  };

  const updateUrlForm = (index, field, value) => {
    const newForms = [...urlForms];
    newForms[index][field] = value;
    setUrlForms(newForms);
  };

  const validateForm = (form) => {
    if (!form.originalUrl.trim()) {
      return 'URL is required';
    }
    
    if (!urlService.isValidUrl(form.originalUrl)) {
      return 'Please enter a valid URL';
    }

    if (form.customShortcode && !urlService.isValidShortcode(form.customShortcode)) {
      return 'Shortcode must be 3-10 alphanumeric characters';
    }

    if (form.validityMinutes < 1 || form.validityMinutes > 525600) {
      return 'Validity must be between 1 minute and 1 year';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setLoading(true);

    logger.info('Starting URL shortening process', { urlCount: urlForms.length });

    try {
      const newResults = [];
      
      for (let i = 0; i < urlForms.length; i++) {
        const form = urlForms[i];
        
        // Skip empty forms
        if (!form.originalUrl.trim()) continue;
        
        // Validate form
        const validationError = validateForm(form);
        if (validationError) {
          throw new Error(`Form ${i + 1}: ${validationError}`);
        }

        try {
          const result = urlService.createShortUrl(
            form.originalUrl,
            form.customShortcode || null,
            parseInt(form.validityMinutes) || 30
          );
          newResults.push(result);
        } catch (err) {
          throw new Error(`Form ${i + 1}: ${err.message}`);
        }
      }

      if (newResults.length === 0) {
        throw new Error('Please fill in at least one URL');
      }

      setResults(newResults);
      logger.info('URLs shortened successfully', { count: newResults.length });
      
      // Reset forms
      setUrlForms([{
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
      
    } catch (err) {
      setError(err.message);
      logger.error('Error shortening URLs', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        URL Shortener
      </Typography>
      <Typography variant="body1" paragraph align="center" color="text.secondary">
        Shorten up to 5 URLs at once with custom shortcodes and validity periods
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          {urlForms.map((form, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  URL #{index + 1}
                </Typography>
                {urlForms.length > 1 && (
                  <Tooltip title="Remove this URL">
                    <IconButton onClick={() => removeUrlForm(index)} color="error">
                      <RemoveIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Original URL"
                    placeholder="https://example.com/very-long-url"
                    value={form.originalUrl}
                    onChange={(e) => updateUrlForm(index, 'originalUrl', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Custom Shortcode (optional)"
                    placeholder="mycode123"
                    value={form.customShortcode}
                    onChange={(e) => updateUrlForm(index, 'customShortcode', e.target.value)}
                    helperText="3-10 alphanumeric characters"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Validity (minutes)"
                    type="number"
                    value={form.validityMinutes}
                    onChange={(e) => updateUrlForm(index, 'validityMinutes', e.target.value)}
                    inputProps={{ min: 1, max: 525600 }}
                    helperText="Default: 30 minutes"
                  />
                </Grid>
              </Grid>

              {index < urlForms.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            {urlForms.length < 5 && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addUrlForm}
              >
                Add Another URL
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? 'Shortening...' : 'Shorten URLs'}
            </Button>
          </Box>
        </form>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom color="success.main">
            ✅ URLs Shortened Successfully!
          </Typography>
          {results.map((result, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Original: {result.originalUrl}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ my: 1 }}>
                Short URL: {result.shortUrl}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires: {new Date(result.expiresAt).toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default UrlShortenerForm;
