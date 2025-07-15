import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, Paper } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import LinkIcon from '@mui/icons-material/Link';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'hsl(var(--primary))',
  boxShadow: 'var(--shadow-elegant)',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  background: 'hsl(var(--background))',
}));

const NavButton = styled(Button)<{ active?: boolean }>(({ theme, active }) => ({
  marginLeft: theme.spacing(2),
  backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  color: 'hsl(var(--primary-foreground))',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <>
      <StyledAppBar position="static">
        <Toolbar>
          <LinkIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            URL Shortener Pro
          </Typography>
          <NavButton
            {...({ component: RouterLink, to: "/" } as any)}
            active={location.pathname === '/'}
            startIcon={<LinkIcon />}
          >
            Shorten URLs
          </NavButton>
          <NavButton
            {...({ component: RouterLink, to: "/statistics" } as any)}
            active={location.pathname === '/statistics'}
            startIcon={<AnalyticsIcon />}
          >
            Statistics
          </NavButton>
        </Toolbar>
      </StyledAppBar>
      
      <StyledContainer maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          {children}
        </Box>
      </StyledContainer>
    </>
  );
};

export default Layout;