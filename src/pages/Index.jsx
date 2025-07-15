
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to the main app route since we're handling routing in App.js
  return <Navigate to="/" replace />;
};

export default Index;
