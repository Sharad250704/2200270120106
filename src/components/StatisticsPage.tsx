
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Eye, Clock } from 'lucide-react';
import { urlService, UrlWithStats, ClickData } from '@/services/urlService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StatisticsPage() {
  const [urls, setUrls] = useState<UrlWithStats[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<UrlWithStats | null>(null);

  const loadStatistics = useCallback(() => {
    const urlData = urlService.getAllUrls();
    setUrls(urlData);
  }, []);

  // Load statistics on component mount
  React.useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const handleVisitUrl = (url: UrlWithStats) => {
    const urlData = urlService.getUrlByShortcode(url.shortcode);
    if (urlData) {
      urlService.recordClick(url.shortcode, 'statistics_page', 'localhost');
      window.open(urlData.originalUrl, '_blank');
      setTimeout(() => loadStatistics(), 100);
    }
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date() > new Date(expiresAt);
  };

  const getLocationFromUserAgent = (userAgent: string): string => {
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    return 'Unknown Location';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">URL Statistics</h1>
        <p className="text-muted-foreground">
          View all your shortened URLs and their click statistics
        </p>
      </div>

      {urls.length === 0 ? (
        <Alert>
          <AlertDescription>
            No shortened URLs found. Create some URLs first!
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Shortened URLs</CardTitle>
            <CardDescription>
              Manage and track your shortened URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Original URL</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.map((url) => (
                  <TableRow key={url.id}>
                    <TableCell className="max-w-xs truncate">
                      {url.originalUrl}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        /{url.shortcode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(url.createdAt).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(url.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(url.expiresAt).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          {new Date(url.expiresAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isExpired(url.expiresAt) ? 'destructive' : 'default'}>
                        {isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {url.clickCount}
                        </span>
                        {url.clickCount > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUrl(url)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Clock className="h-5 w-5" />
                                  Click Details for /{selectedUrl?.shortcode}
                                </DialogTitle>
                                <DialogDescription>
                                  Detailed analytics for this shortened URL
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-96 overflow-y-auto">
                                {selectedUrl && selectedUrl.clicks.length > 0 ? (
                                  <div className="space-y-3">
                                    {selectedUrl.clicks.map((click: ClickData, index: number) => (
                                      <div key={index} className="p-3 border rounded-lg">
                                        <div className="font-semibold">Click #{index + 1}</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                          <div><strong>Time:</strong> {new Date(click.timestamp).toLocaleString()}</div>
                                          <div><strong>Source:</strong> {click.source}</div>
                                          <div><strong>Location:</strong> {getLocationFromUserAgent(click.userAgent)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No clicks recorded yet.</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisitUrl(url)}
                        disabled={isExpired(url.expiresAt)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
