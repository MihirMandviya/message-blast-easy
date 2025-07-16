import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-96" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}