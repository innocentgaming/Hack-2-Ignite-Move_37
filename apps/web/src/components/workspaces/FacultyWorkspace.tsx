import React from 'react';
import { Navigate } from 'react-router-dom';

export const FacultyWorkspace: React.FC = () => {
  return <Navigate to="/app/mentor" replace />;
};

export default FacultyWorkspace;
