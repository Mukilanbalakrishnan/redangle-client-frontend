import axios from "axios";

export const createNotification = async (data: {
    type: string;
    title: string;
    detail?: string;
    lead_id?: number | string;
    from_role?: string;
    from_name?: string;
    target_roles: string[];
}) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await axios.post(`${API_URL}/notifications`, data);
    return res.data;
};

export const getNotifications = async (role: string) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('ra_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_URL}/notifications?role=${role}`, { headers });
    return res.data;
};

export const markNotificationRead = async (id: number) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('ra_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { headers });
    return res.data;
};

export const markAllNotificationsRead = async (role: string) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('ra_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.patch(`${API_URL}/notifications/read-all`, { role }, { headers });
    return res.data;
};
