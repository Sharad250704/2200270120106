import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { urlShortenerService, ShortenedUrl, ShortenUrlRequest } from '../services/urlShortener';
import { logger } from '../services/logger';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'hsl(var(--card))',
  boxShadow: 'var(--shadow-card)',
  borderRadius: '16px',
  border: '1px solid hsl(var(--border))',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%)',
  color: 'hsl(var(--primary-foreground))',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-elegant)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'var(--gradient-primary)',
  color: 'hsl(var(--primary-foreground))',
  '&:hover': {
    background: 'var(--gradient-primary)',
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-elegant)',
  },
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 4),
  transition: 'var(--transition-smooth)',
}));

interface UrlFormData {
  originalUrl: string;
  validityMinutes: string;
  customShortCode: string;
}

const UrlShortenerForm: React.FC = () => {
  const [forms, setForms] = useState<UrlFormData[]>([
    { originalUrl: '', validityMinutes: '', customShortCode: '' }
  ]);
  const [results, setResults] = useState<ShortenedUrl[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addForm = () => {
    if (forms.length < 5) {
      setForms([...forms, { originalUrl: '', validityMinutes: '', customShortCode: '' }]);
      logger.info('Added new URL form', { totalForms: forms.length + 1 }, 'URL_FORM');
    }
  };

  const removeForm = (index: number) => {
    if (forms.length > 1) {
      const newForms = forms.filter((_, i) => i !== index);
      setForms(newForms);
      logger.info('Removed URL form', { formIndex: index, totalForms: newForms.length }, 'URL_FORM');
    }
  };

  const updateForm = (index: number, field: keyof UrlFormData, value: string) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);
  };

  const validateForm = (form: UrlFormData): string | null => {
    if (!form.originalUrl.trim()) {
      return 'URL is required';
    }

    try {
      new URL(form.originalUrl);
    } catch {
      return 'Invalid URL format';
    }

    if (form.validityMinutes && (isNaN(Number(form.validityMinutes)) || Number(form.validityMinutes) <= 0)) {
      return 'Validity must be a positive number';
    }

    if (form.customShortCode && !/^[a-zA-Z0-9]{3,12}$/.test(form.customShortCode)) {
      return 'Short code must be 3-12 alphanumeric characters';
    }

    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);
    setResults([]);

    const newResults: ShortenedUrl[] = [];
    const newErrors: string[] = [];

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      
      if (!form.originalUrl.trim()) continue;

      const validationError = validateForm(form);
      if (validationError) {
        newErrors.push(`Form ${i + 1}: ${validationError}`);
        continue;
      }

      try {
        const request: ShortenUrlRequest = {
          originalUrl: form.originalUrl,
          validityMinutes: form.validityMinutes ? Number(form.validityMinutes) : undefined,
          customShortCode: form.customShortCode || undefined
        };

        const result = urlShortenerService.shortenUrl(request);
        newResults.push(result);
        logger.info('URL shortened successfully in form', { formIndex: i, shortCode: result.shortCode }, 'URL_FORM');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        newErrors.push(`Form ${i + 1}: ${errorMessage}`);
        logger.error('Failed to shorten URL in form', { formIndex: i, error: errorMessage }, 'URL_FORM');
      }
    }

    setResults(newResults);
    setErrors(newErrors);
    setLoading(false);

    if (newResults.length > 0) {
      // Clear successful forms
      const clearedForms = forms.map((form, index) => {
        const wasSuccessful = newResults.some(result => 
          forms[index].originalUrl === result.originalUrl
        );
        return wasSuccessful 
          ? { originalUrl: '', validityMinutes: '', customShortCode: '' }
          : form;
      });
      setForms(clearedForms);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    logger.info('URL copied to clipboard', { url: text }, 'URL_FORM');
  };

  const getShortUrl = (shortCode: string) => {
    return `${window.location.origin}/${shortCode}`;
  };

  return (
    <Box>
      <StyledPaper>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}>
            Shorten Your URLs
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Create up to 5 shortened URLs at once with custom options
          </Typography>
        </Box>

        {forms.map((form, index) => (
          <Box key={index} sx={{ mb: 3, p: 3, border: '1px solid hsl(var(--border))', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                URL {index + 1}
              </Typography>
              {forms.length > 1 && (
                <IconButton onClick={() => removeForm(index)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Original URL"
                placeholder="https://example.com/very-long-url"
                value={form.originalUrl}
                onChange={(e) => updateForm(index, 'originalUrl', e.target.value)}
                variant="outlined"
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Validity (minutes)"
                  placeholder="30"
                  type="number"
                  value={form.validityMinutes}
                  onChange={(e) => updateForm(index, 'validityMinutes', e.target.value)}
                  variant="outlined"
                  helperText="Default: 30 minutes"
                />
                <TextField
                  fullWidth
                  label="Custom Short Code (optional)"
                  placeholder="mycode123"
                  value={form.customShortCode}
                  onChange={(e) => updateForm(index, 'customShortCode', e.target.value)}
                  variant="outlined"
                  helperText="3-12 alphanumeric characters"
                />
              </Box>
            </Box>
          </Box>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Button
            onClick={addForm}
            disabled={forms.length >= 5}
            startIcon={<AddIcon />}
            variant="outlined"
            sx={{ borderRadius: '12px' }}
          >
            Add URL ({forms.length}/5)
          </Button>

          <GradientButton
            onClick={handleSubmit}
            disabled={loading || forms.every(form => !form.originalUrl.trim())}
            size="large"
          >
            {loading ? 'Shortening...' : 'Shorten URLs'}
          </GradientButton>
        </Box>
      </StyledPaper>

      {errors.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" sx={{ mb: 1, borderRadius: '12px' }}>
              {error}
            </Alert>
          ))}
        </Box>
      )}

      {results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            ✨ Success! Your shortened URLs are ready:
          </Typography>
          
          {results.map((result, index) => (
            <StyledCard key={result.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {getShortUrl(result.shortCode)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Original: {result.originalUrl}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Chip 
                        label={`Expires: ${result.expiresAt.toLocaleString()}`}
                        size="small"
                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                      />
                      {result.customShortCode && (
                        <Chip 
                          label="Custom Code"
                          size="small"
                          sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Copy URL">
                      <IconButton 
                        onClick={() => copyToClipboard(getShortUrl(result.shortCode))}
                        sx={{ color: 'inherit' }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Open URL">
                      <IconButton 
                        onClick={() => window.open(getShortUrl(result.shortCode), '_blank')}
                        sx={{ color: 'inherit' }}
                      >
                        <LaunchIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default UrlShortenerForm;