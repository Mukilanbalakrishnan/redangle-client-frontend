import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  crm: 'CRM',
  'event-coordinator': 'Event Coordinator',
  photographer: 'Photographer',
  videographer: 'Videographer',
  'employee-1': 'Save the Date Post',
  'employee-2': 'Save the Date Video',
  'employee-3': 'Candid Photo',
  'employee-4': 'Outdoor Retouch',
  'data-manager': 'Data Manager',
  'data-management': 'Data Management',
  client: 'Client',
};

const roleRouteMap: Record<string, string> = {
  crm: '/crm/dashboard',
  admin: '/admin/dashboard',
  'event-coordinator': '/event-coordinator/dashboard',
  photographer: '/media/dashboard',
  videographer: '/media/dashboard',
  'employee-1': '/employee/dashboard',
  'employee-2': '/employee/dashboard',
  'employee-3': '/employee/dashboard',
  'employee-4': '/employee/dashboard',
  'data-manager': '/data-manager/dashboard',
  'data-management': '/data-management/dashboard',
  client: '/client/dashboard',
};

export default function RoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roles, setRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('ra_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userRoles: string[] = user.roles && user.roles.length > 0 ? user.roles : [user.role].filter(Boolean);
        setRoles(userRoles);
        const stored = localStorage.getItem('ra_active_role');
        setActiveRole(stored && userRoles.includes(stored) ? stored : userRoles[0] || '');
      }
    } catch {
      // fallback
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Don't render for single-role users
  if (roles.length <= 1) return null;

  const isMultiRoleView = location.pathname.startsWith('/multi-role');

  const handleSwitch = (role: string) => {
    localStorage.setItem('ra_active_role', role);
    setActiveRole(role);
    setOpen(false);
    navigate(roleRouteMap[role] || '/dashboard');
  };

  const handleMultiRole = () => {
    localStorage.setItem('ra_active_role', 'multi-role');
    setActiveRole('multi-role');
    setOpen(false);
    navigate('/multi-role/dashboard');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          isMultiRoleView
            ? 'text-white bg-purple-600 hover:bg-purple-700'
            : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
        }`}
        title="Switch Role"
      >
        <ArrowLeftRight size={14} />
        <span className="hidden sm:inline">
          {isMultiRoleView ? 'Multi-Role' : (roleLabelMap[activeRole] || activeRole)}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Role</div>

          {/* Multi-Role option — always shown for multi-role users */}
          <button
            onClick={handleMultiRole}
            className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${
              isMultiRoleView
                ? 'bg-purple-50 text-purple-700'
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            Multi-Role View
          </button>

          {/* Individual roles only shown when NOT in multi-role view */}
          {!isMultiRoleView && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleSwitch(role)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    role === activeRole
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {roleLabelMap[role] || role}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
