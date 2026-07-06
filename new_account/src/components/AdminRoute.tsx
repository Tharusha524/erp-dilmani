import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { User, validateUser } from '../api/userApi';
import PermissionDenied from './PermissionDenied';
import PageLoader from './PageLoader';

const AdminRoute = () => {
  const location = useLocation();
  const { data: user, status } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: validateUser,
  });

  // Show loader while fetching user
  if (status === 'pending') {
    return <PageLoader />;
  }

  // If not admin, show denied (and optionally redirect or log)
  if (!user || user.role !== 'Admin') {
    return <PermissionDenied />;
  }

  // If admin, render child routes
  return <Outlet />;
};

export default AdminRoute;