
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { 
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon 
} from '@mui/icons-material';
import urlService from '../services/urlService';
import logger from '../services/loggingMiddleware';

const StatisticsPage = () => {
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    logger.info('Loading URL statistics');
    const urlData = urlService.getAllUrls();
    setUrls(urlData);
    logger.info('Statistics loaded', { urlCount: urlData.length });
  };

  const handleViewClicks = (url) => {
    setSelectedUrl(url);
    setDialogOpen(true);
    logger.info('Viewing click details', { shortcode: url.shortcode });
  };

  const handleVisitUrl = (shortUrl, shortcode) => {
    logger.info('Visiting short URL', { shortUrl, shortcode });
    
    // Record the click
    urlService.recordClick(shortcode, 'statistics_page', 'localhost');
    
    // Get the original URL and redirect
    const urlData = urlService.getUrlByShortcode(shortcode);
    if (urlData) {
      window.open(urlData.originalUrl, '_blank');
      // Reload statistics to show updated click count
      setTimeout(() => loadStatistics(), 100);
    } else {
      logger.error('URL not found or expired', { shortcode });
    }
  };

  const isExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
  };

  const getLocationFromUserAgent = (userAgent) => {
    // Simple location detection based on user agent
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    return 'Unknown Location';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        URL Statistics
      </Typography>
      <Typography variant="body1" paragraph align="center" color="text.secondary">
        View all your shortened URLs and their click statistics
      </Typography>

      {urls.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No shortened URLs found. Create some URLs first!
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Original URL</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Short URL</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expires</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Clicks</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {urls.map((url) => (
                <TableRow key={url.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {url.originalUrl}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      /{url.shortcode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(url.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(url.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(url.expiresAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(url.expiresAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                      color={isExpired(url.expiresAt) ? 'error' : 'success'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="primary">
                        {url.clickCount}
                      </Typography>
                      {url.clickCount > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewClicks(url)}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => handleVisitUrl(url.shortUrl, url.shortcode)}
                      disabled={isExpired(url.expiresAt)}
                    >
                      Visit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Click Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon />
            Click Details for /{selectedUrl?.shortcode}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUrl && selectedUrl.clicks.length > 0 ? (
            <List>
              {selectedUrl.clicks.map((click, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`Click #${index + 1}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <strong>Time:</strong> {new Date(click.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Source:</strong> {click.source}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Location:</strong> {getLocationFromUserAgent(click.userAgent)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No clicks recorded yet.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatisticsPage;
