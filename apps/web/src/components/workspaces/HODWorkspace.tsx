import React from 'react';
import { Navigate } from 'react-router-dom';

export const HODWorkspace: React.FC = () => {
  return <Navigate to="/app/admin" replace />;
};

export default HODWorkspace;
