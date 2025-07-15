import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, BarChart3 } from 'lucide-react';
import { logger } from '@/utils/logger.js';
import { useEffect } from 'react';

export default function Navigation() {
  const location = useLocation();

  useEffect(() => {
    logger.info('Navigation', 'Page navigation', {
      path: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [location.pathname]);

  const handleNavClick = (path, label) => {
    logger.userAction('Navigation', 'Navigation clicked', {
      from: location.pathname,
      to: path,
      label
    });
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">URL Shortener</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={location.pathname === '/' ? 'default' : 'outline'}
              asChild
            >
              <Link to="/" onClick={() => handleNavClick('/', 'Shorten URLs')}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Shorten URLs
              </Link>
            </Button>
            <Button
              variant={location.pathname === '/statistics' ? 'default' : 'outline'}
              asChild
            >
              <Link to="/statistics" onClick={() => handleNavClick('/statistics', 'Statistics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistics
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
