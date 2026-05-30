import { Bell, Users, CheckCircle2, Calendar, MessageSquare, Briefcase, UserPlus, FileText, Camera, Send } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../hooks/useNotifications';

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

const timeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hrs ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
};

interface NotificationsPageProps {
    role: string;
}

export default function NotificationsPage({ role }: NotificationsPageProps) {
    const { notifications, loading, unreadCount, handleMarkRead, handleMarkAllRead } = useNotifications(role);

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in zoom-in-95 duration-300">
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 border-b pb-4 border-gray-100 font-sans">Notifications</h1>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-8">
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                    <h2 className="text-[15px] font-bold text-gray-900 font-sans flex items-center gap-3">
                        <Bell size={18} className="text-gray-500" />
                        All Notifications
                        {unreadCount > 0 && (
                            <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">{unreadCount} New</span>
                        )}
                    </h2>
                    <button
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0 || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[12px] font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <CheckCircle2 size={14} strokeWidth={2.5} /> Mark all as read
                    </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-sm text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell size={36} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-500">No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.map((note: NotificationItem) => {
                            const { icon: Icon, iconBg, iconColor } = getNotificationStyles(note.type);
                            const noteId = note.id || note.notification_id || 0;
                            return (
                                <div
                                    key={noteId}
                                    onClick={() => { if (!note.is_read) handleMarkRead(noteId); }}
                                    className={`flex items-center justify-between p-5 rounded-2xl transition-all cursor-pointer border
                                        ${!note.is_read ? 'bg-[#dfd5f6] border-[#dfd5f6] shadow-sm' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-100'}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`p-3 rounded-xl bg-white/60 ${iconColor} ${iconBg} shadow-sm shrink-0`}>
                                            <Icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-gray-900 tracking-wide">{note.title}</h3>
                                            <p className="text-[12px] font-medium text-gray-600 mt-0.5">{note.detail}</p>
                                            {note.from_name && (
                                                <p className="text-[11px] text-gray-400 mt-1">from {note.from_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[12px] font-bold whitespace-nowrap ml-4 ${!note.is_read ? 'text-gray-700' : 'text-gray-400'}`}>
                                        {timeAgo(note.created_at)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
