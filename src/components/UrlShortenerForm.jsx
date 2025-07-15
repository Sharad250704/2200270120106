import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, Link as LinkIcon } from 'lucide-react';
import { urlService } from '@/services/urlService.js';
import { useToast } from '@/hooks/use-toast.js';
import { logger } from '@/utils/logger.js';

export default function UrlShortenerForm() {
  const [urlForms, setUrlForms] = useState([{
    originalUrl: '',
    customShortcode: '',
    validityMinutes: 30
  }]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  logger.info('UrlShortenerForm', 'Component initialized', {
    initialFormCount: 1,
    timestamp: new Date().toISOString()
  });

  const addUrlForm = () => {
    if (urlForms.length < 5) {
      logger.userAction('UrlShortenerForm', 'Add URL form', {
        currentFormCount: urlForms.length,
        newFormCount: urlForms.length + 1
      });
      
      setUrlForms([...urlForms, {
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
    } else {
      logger.warn('UrlShortenerForm', 'Maximum form limit reached', {
        currentFormCount: urlForms.length,
        maxAllowed: 5
      });
    }
  };

  const removeUrlForm = (index) => {
    if (urlForms.length > 1) {
      logger.userAction('UrlShortenerForm', 'Remove URL form', {
        removedIndex: index,
        currentFormCount: urlForms.length,
        newFormCount: urlForms.length - 1
      });
      
      const newForms = urlForms.filter((_, i) => i !== index);
      setUrlForms(newForms);
    } else {
      logger.warn('UrlShortenerForm', 'Cannot remove last form', {
        currentFormCount: urlForms.length,
        minRequired: 1
      });
    }
  };

  const updateUrlForm = (index, field, value) => {
    logger.debug('UrlShortenerForm', 'Form field updated', {
      formIndex: index,
      field,
      valueLength: typeof value === 'string' ? value.length : 0,
      hasValue: !!value
    });
    
    const newForms = [...urlForms];
    newForms[index] = { ...newForms[index], [field]: value };
    setUrlForms(newForms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const startTime = Date.now();
    
    logger.info('UrlShortenerForm', 'Form submission started', {
      totalForms: urlForms.length,
      filledForms: urlForms.filter(form => form.originalUrl.trim()).length,
      timestamp: new Date().toISOString()
    });

    setError('');
    setResults([]);
    setLoading(true);

    try {
      const newResults = [];
      
      for (let i = 0; i < urlForms.length; i++) {
        const form = urlForms[i];
        
        if (!form.originalUrl.trim()) {
          logger.debug('UrlShortenerForm', 'Skipping empty form', {
            formIndex: i,
            reason: 'Empty originalUrl'
          });
          continue;
        }
        
        try {
          logger.debug('UrlShortenerForm', 'Processing form', {
            formIndex: i,
            hasCustomShortcode: !!form.customShortcode,
            validityMinutes: form.validityMinutes,
            urlLength: form.originalUrl.length
          });

          const result = urlService.createShortUrl(
            form.originalUrl,
            form.customShortcode || undefined,
            parseInt(form.validityMinutes.toString()) || 30
          );
          
          newResults.push(result);
          
          logger.info('UrlShortenerForm', 'URL shortened successfully', {
            formIndex: i,
            shortcode: result.shortcode,
            urlId: result.id
          });
        } catch (err) {
          const errorMessage = `Form ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          
          logger.error('UrlShortenerForm', 'URL shortening failed', {
            formIndex: i,
            error: err.message,
            stack: err.stack,
            formData: {
              urlLength: form.originalUrl.length,
              hasCustomShortcode: !!form.customShortcode,
              validityMinutes: form.validityMinutes
            }
          });
          
          throw new Error(errorMessage);
        }
      }

      if (newResults.length === 0) {
        logger.warn('UrlShortenerForm', 'No URLs to process', {
          totalForms: urlForms.length,
          reason: 'All forms empty'
        });
        throw new Error('Please fill in at least one URL');
      }

      const duration = Date.now() - startTime;
      
      setResults(newResults);
      toast({
        title: "Success!",
        description: `${newResults.length} URL(s) shortened successfully`,
      });
      
      logger.info('UrlShortenerForm', 'Form submission completed successfully', {
        urlsCreated: newResults.length,
        duration,
        shortcodes: newResults.map(r => r.shortcode)
      });
      
      setUrlForms([{
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
      
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      logger.error('UrlShortenerForm', 'Form submission failed', {
        error: errorMessage,
        duration,
        totalForms: urlForms.length,
        filledForms: urlForms.filter(form => form.originalUrl.trim()).length
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">URL Shortener</h1>
        <p className="text-muted-foreground">
          Shorten up to 5 URLs at once with custom shortcodes and validity periods
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Short URLs</CardTitle>
          <CardDescription>
            Enter your long URLs below to create short, shareable links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {urlForms.map((form, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">URL #{index + 1}</h3>
                  {urlForms.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeUrlForm(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <Label htmlFor={`url-${index}`}>Original URL</Label>
                    <Input
                      id={`url-${index}`}
                      type="url"
                      placeholder="https://example.com/very-long-url"
                      value={form.originalUrl}
                      onChange={(e) => updateUrlForm(index, 'originalUrl', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`validity-${index}`}>Validity (minutes)</Label>
                    <Input
                      id={`validity-${index}`}
                      type="number"
                      min="1"
                      max="525600"
                      value={form.validityMinutes}
                      onChange={(e) => updateUrlForm(index, 'validityMinutes', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`shortcode-${index}`}>Custom Shortcode (optional)</Label>
                  <Input
                    id={`shortcode-${index}`}
                    placeholder="mycode123"
                    value={form.customShortcode}
                    onChange={(e) => updateUrlForm(index, 'customShortcode', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    3-10 alphanumeric characters
                  </p>
                </div>
              </div>
            ))}

            <div className="flex gap-2 justify-center">
              {urlForms.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrlForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another URL
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                <LinkIcon className="h-4 w-4 mr-2" />
                {loading ? 'Shortening...' : 'Shorten URLs'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ URLs Shortened Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Original: {result.originalUrl}
                </p>
                <p className="text-lg font-semibold text-primary">
                  Short URL: {result.shortUrl}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires: {new Date(result.expiresAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
