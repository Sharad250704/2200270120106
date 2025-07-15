
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Home, ExternalLink } from 'lucide-react';
import { urlService } from '@/services/urlService';

export default function RedirectHandler() {
  const { shortcode } = useParams<{ shortcode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (shortcode) {
      handleRedirect();
    }
  }, [shortcode]);

  const handleRedirect = async () => {
    if (!shortcode) return;
    
    try {
      const urlData = urlService.getUrlByShortcode(shortcode);
      
      if (!urlData) {
        setError('This short URL does not exist or has expired.');
        setLoading(false);
        return;
      }

      urlService.recordClick(shortcode, 'direct_access', 'localhost');
      
      setRedirecting(true);
      setLoading(false);
      
      setTimeout(() => {
        window.location.href = urlData.originalUrl;
      }, 1000);
      
    } catch (err) {
      setError('An error occurred while processing your request.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <CardTitle>Processing your request...</CardTitle>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <CardTitle className="text-green-600">Redirecting you now...</CardTitle>
            <CardDescription className="text-center">
              If you are not redirected automatically, please check your browser settings.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">URL Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
