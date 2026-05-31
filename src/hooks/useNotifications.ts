import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notification.api';

export interface NotificationItem {
    id: number;
    notification_id?: number;
    type: string;
    title: string;
    detail: string | null;
    lead_id: number | null;
    from_role: string | null;
    from_name: string | null;
    target_roles: string[];
    is_read: boolean;
    created_at: string;
}

export function useNotifications(role: string) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await getNotifications(role);
            if (res.success) {
                if (role === 'client') {
                    const readIds = JSON.parse(localStorage.getItem('client_read_notifications') || '[]');
                    const parsedData = res.data.map((n: any) => ({ ...n, is_read: readIds.includes(n.id) }));
                    setNotifications(parsedData);
                } else {
                    setNotifications(res.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Compute unread count safely
    const unreadCount = notifications.filter(n => {
        if (role === 'client') {
            const readIds = JSON.parse(localStorage.getItem('client_read_notifications') || '[]');
            return !readIds.includes(n.id);
        }
        return !n.is_read;
    }).length;

    const handleMarkRead = async (id: number) => {
        try {
            if (role === 'client') {
                const readIds = JSON.parse(localStorage.getItem('client_read_notifications') || '[]');
                if (!readIds.includes(id)) {
                    readIds.push(id);
                    localStorage.setItem('client_read_notifications', JSON.stringify(readIds));
                }
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            } else {
                await markNotificationRead(id);
                setNotifications(prev =>
                    prev.map(n => (n.id === id || n.notification_id === id) ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            if (role === 'client') {
                const allIds = notifications.map(n => n.id);
                localStorage.setItem('client_read_notifications', JSON.stringify(allIds));
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } else {
                await markAllNotificationsRead(role);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        handleMarkRead,
        handleMarkAllRead,
        refetch: fetchNotifications,
    };
}
