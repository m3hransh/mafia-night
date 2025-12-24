import { Button } from '@/components/Button';
import { AdminUser } from '@/lib/adminAuth';

interface AdminHeaderProps {
  currentUser: AdminUser | null;
  onLogout: () => void;
}

export function AdminHeader({ currentUser, onLogout }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl">
          Admin Dashboard
        </h1>
        <p className="text-lg md:text-xl text-purple-300">
          Welcome, {currentUser?.username}
        </p>
      </div>
      <Button onClick={onLogout} variant="danger" size="md" className="w-full md:w-auto">
        Logout
      </Button>
    </div>
  );
}
