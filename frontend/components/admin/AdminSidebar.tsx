import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function AdminSidebar({ isOpen, onClose, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { name: 'Admin Management', path: '/admin/dashboard' },
    { name: 'Role Management', path: '/admin/roles' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-xl border-r border-purple-500/30 
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-full
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Mafia Admin</h2>
            <button 
              onClick={onClose}
              className="md:hidden text-purple-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`
                  block px-4 py-3 rounded-lg transition-colors
                  ${isActive(item.path) 
                    ? 'bg-purple-600/30 text-white border border-purple-500/50' 
                    : 'text-purple-300 hover:bg-purple-900/20 hover:text-white'}
                `}
                onClick={() => onClose()}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-purple-500/20">
            <Button 
              onClick={onLogout} 
              variant="danger" 
              fullWidth
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
