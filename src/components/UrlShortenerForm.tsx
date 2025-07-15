
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Minus, Link as LinkIcon } from 'lucide-react';
import { urlService, UrlWithStats } from '@/services/urlService';
import { useToast } from '@/hooks/use-toast';

interface UrlForm {
  originalUrl: string;
  customShortcode: string;
  validityMinutes: number;
}

export default function UrlShortenerForm() {
  const [urlForms, setUrlForms] = useState<UrlForm[]>([{
    originalUrl: '',
    customShortcode: '',
    validityMinutes: 30
  }]);
  const [results, setResults] = useState<UrlWithStats[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addUrlForm = () => {
    if (urlForms.length < 5) {
      setUrlForms([...urlForms, {
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
    }
  };

  const removeUrlForm = (index: number) => {
    if (urlForms.length > 1) {
      const newForms = urlForms.filter((_, i) => i !== index);
      setUrlForms(newForms);
    }
  };

  const updateUrlForm = (index: number, field: keyof UrlForm, value: string | number) => {
    const newForms = [...urlForms];
    newForms[index] = { ...newForms[index], [field]: value };
    setUrlForms(newForms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setLoading(true);

    try {
      const newResults: UrlWithStats[] = [];
      
      for (let i = 0; i < urlForms.length; i++) {
        const form = urlForms[i];
        
        if (!form.originalUrl.trim()) continue;
        
        try {
          const result = urlService.createShortUrl(
            form.originalUrl,
            form.customShortcode || undefined,
            parseInt(form.validityMinutes.toString()) || 30
          );
          newResults.push(result);
        } catch (err) {
          throw new Error(`Form ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (newResults.length === 0) {
        throw new Error('Please fill in at least one URL');
      }

      setResults(newResults);
      toast({
        title: "Success!",
        description: `${newResults.length} URL(s) shortened successfully`,
      });
      
      setUrlForms([{
        originalUrl: '',
        customShortcode: '',
        validityMinutes: 30
      }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
