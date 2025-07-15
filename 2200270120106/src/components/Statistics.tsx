import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import DeleteIcon from '@mui/icons-material/Delete';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MouseIcon from '@mui/icons-material/Mouse';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { urlShortenerService, ShortenedUrl, ClickData } from '../services/urlShortener';
import { logger } from '../services/logger';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'hsl(var(--card))',
  boxShadow: 'var(--shadow-card)',
  borderRadius: '16px',
  border: '1px solid hsl(var(--border))',
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'var(--gradient-primary)',
  color: 'hsl(var(--primary-foreground))',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-elegant)',
  textAlign: 'center',
  padding: theme.spacing(2),
}));

const StatusChip = styled(Chip)<{ status: 'active' | 'expired' }>(({ theme, status }) => ({
  backgroundColor: status === 'active' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
  color: status === 'active' ? 'hsl(var(--accent-foreground))' : 'hsl(var(--destructive-foreground))',
  fontWeight: 600,
}));

const Statistics: React.FC = () => {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedUrl | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, totalClicks: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const allUrls = urlShortenerService.getAllUrls();
    const statsData = urlShortenerService.getStats();
    setUrls(allUrls);
    setStats(statsData);
    logger.info('Statistics data refreshed', { urlCount: allUrls.length, stats: statsData }, 'STATISTICS');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    logger.info('URL copied to clipboard from statistics', { url: text }, 'STATISTICS');
  };

  const getShortUrl = (shortCode: string) => {
    return `${window.location.origin}/${shortCode}`;
  };

  const handleDelete = (shortCode: string) => {
    if (window.confirm('Are you sure you want to delete this shortened URL?')) {
      urlShortenerService.deleteUrl(shortCode);
      loadData();
      logger.info('URL deleted from statistics', { shortCode }, 'STATISTICS');
    }
  };

  const openDetails = (url: ShortenedUrl) => {
    setSelectedUrl(url);
    setDetailsOpen(true);
    logger.info('Opened URL details', { shortCode: url.shortCode }, 'STATISTICS');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <Box>
      {/* Stats Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'var(--gradient-primary)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          mb: 4
        }}>
          📊 URL Statistics Dashboard
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatsCard>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2">Total URLs</Typography>
            </CardContent>
          </StatsCard>
          
          <StatsCard>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: 'hsl(var(--accent))' }}>
                {stats.active}
              </Typography>
              <Typography variant="body2">Active</Typography>
            </CardContent>
          </StatsCard>
          
          <StatsCard>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: 'hsl(var(--destructive))' }}>
                {stats.expired}
              </Typography>
              <Typography variant="body2">Expired</Typography>
            </CardContent>
          </StatsCard>
          
          <StatsCard>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.totalClicks}
              </Typography>
              <Typography variant="body2">Total Clicks</Typography>
            </CardContent>
          </StatsCard>
        </Box>
      </Box>

      {/* URLs Table */}
      <StyledPaper>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          All Shortened URLs
        </Typography>

        {urls.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            No URLs have been shortened yet. <a href="/" style={{ color: 'inherit' }}>Create your first one!</a>
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Short URL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Original URL</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Expires</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Clicks</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {urls.map((url) => {
                  const isExpired = url.isExpired || new Date() > url.expiresAt;
                  return (
                    <TableRow key={url.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                          {getShortUrl(url.shortCode)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {url.originalUrl}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip 
                          label={isExpired ? 'Expired' : 'Active'} 
                          status={isExpired ? 'expired' : 'active'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(url.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(url.expiresAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MouseIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {url.clicks.length}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Copy URL">
                            <IconButton size="small" onClick={() => copyToClipboard(getShortUrl(url.shortCode))}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open URL">
                            <IconButton size="small" onClick={() => window.open(getShortUrl(url.shortCode), '_blank')}>
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openDetails(url)}>
                              <AnalyticsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(url.shortCode)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>

      {/* URL Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          📈 URL Analytics: {selectedUrl?.shortCode}
        </DialogTitle>
        <DialogContent dividers>
          {selectedUrl && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  URL Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Short URL:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {getShortUrl(selectedUrl.shortCode)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Clicks:</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {selectedUrl.clicks.length}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Original URL:</Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {selectedUrl.originalUrl}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Click History ({selectedUrl.clicks.length} clicks)
              </Typography>
              
              {selectedUrl.clicks.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '12px' }}>
                  No clicks recorded yet for this URL.
                </Alert>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {selectedUrl.clicks
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((click, index) => (
                    <ListItem key={click.id} divider={index < selectedUrl.clicks.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              Click #{selectedUrl.clicks.length - index}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(click.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <LocationOnIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                Location: {click.location}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Source: {click.source} • User Agent: {click.userAgent.substring(0, 50)}...
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Statistics;