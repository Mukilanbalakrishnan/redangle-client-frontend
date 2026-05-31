import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Users, CheckCircle2, Calendar, MessageSquare, Briefcase, UserPlus, FileText, Camera, Send } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../hooks/useNotifications';

// Map notification types to icons and colors
const getNotificationStyles = (type: string) => {
    switch (type) {
        case 'query':
            return { icon: MessageSquare, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' };
        case 'assignment_accepted':
            return { icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600' };
        case 'client':
        case 'new_client':
            return { icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' };
        case 'leave':
        case 'leave_request':
            return { icon: Calendar, iconBg: 'bg-red-100', iconColor: 'text-red-500' };
        case 'employee':
        case 'new_employee':
            return { icon: UserPlus, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' };
        case 'delivery':
        case 'client_delivery':
            return { icon: Send, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' };
        case 'work_assigned':
        case 'assignment':
            return { icon: FileText, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
        case 'shoot':
        case 'shoot_assigned':
            return { icon: Camera, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' };
        default:
            return { icon: Briefcase, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' };
    }
};

// Format time distance
const timeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
};

interface NotificationDropdownProps {
    role: string;
    bellSize?: number;
    notificationsPath: string;
}

export default function NotificationDropdown({ role, bellSize = 20, notificationsPath }: NotificationDropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { notifications, loading, unreadCount, handleMarkRead, handleMarkAllRead } = useNotifications(role);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayNotifications = notifications.slice(0, 10); // Show latest 10 in dropdown

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2 rounded-xl transition-colors ${showDropdown ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                title="Notifications"
            >
                <Bell size={bellSize} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    className="absolute top-full right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-gray-200"
                    style={{ animation: 'notifPopIn 0.2s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold">
                                    {unreadCount} New
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[380px] overflow-y-auto">
                        {loading ? (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
                        ) : displayNotifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {displayNotifications.map((note: NotificationItem) => {
                                    const { icon: Icon, iconBg, iconColor } = getNotificationStyles(note.type);
                                    const noteId = note.id || note.notification_id || 0;
                                    return (
                                        <div
                                            key={noteId}
                                            onClick={() => { if (!note.is_read) handleMarkRead(noteId); }}
                                            className={`px-5 py-3.5 flex gap-3 cursor-pointer transition-colors ${!note.is_read ? 'bg-purple-50/40 hover:bg-purple-50/70' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                                                <Icon size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[13px] leading-tight ${!note.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {note.title}
                                                </p>
                                                {note.detail && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{note.detail}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] text-gray-400">{timeAgo(note.created_at)}</span>
                                                    {note.from_name && (
                                                        <span className="text-[11px] text-gray-400">
                                                            &middot; from {note.from_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!note.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                navigate(notificationsPath);
                            }}
                            className="text-xs font-bold text-purple-600 hover:text-purple-800 uppercase tracking-wider transition-colors"
                        >
                            View All Notifications
                        </button>
                    </div>

                    <style>{`
                        @keyframes notifPopIn {
                            0% { opacity: 0; transform: translateY(8px) scale(0.96); }
                            100% { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
