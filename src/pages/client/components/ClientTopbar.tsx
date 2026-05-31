import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function ClientTopbar() {
    const userStr = localStorage.getItem('ra_user')
    const user = userStr ? JSON.parse(userStr) : null

    return (
        <header className="h-[var(--topbar-height)] bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-all duration-300">
            {/* Left side (Page Title context if needed) */}
            <div>
                <p className="text-[10px] text-purple-600 font-bold tracking-widest uppercase bg-purple-50 px-2 py-1 rounded inline-block">CLIENT PORTAL</p>
            </div>

            {/* Right side Actions */}
            <div className="flex items-center gap-4 relative">

                {/* QUICK CONTACTS */}
                <a
                    href="mailto:hello@redangle.com"
                    className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-full transition-colors hidden sm:block"
                    title="Email Us"
                >
                    <Mail size={20} strokeWidth={2} />
                </a>
                <a
                    href="https://wa.me/15551234567"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-500 bg-slate-50 hover:bg-emerald-50 rounded-full transition-colors hidden sm:block"
                    title="WhatsApp"
                >
                    <MessageCircle size={20} strokeWidth={2} />
                </a>

                <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                {/* NOTIFICATIONS */}
                <NotificationDropdown role="client" bellSize={20} notificationsPath="/client/notifications" />
                <RoleSwitcher />

                <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 leading-none group-hover:text-purple-600 transition-colors uppercase">
                            {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || 'Client'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 uppercase">{user?.role || 'Welcome'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border-2 border-transparent group-hover:border-purple-200 transition-all overflow-hidden">
                        {user?.profile_image ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${user.profile_image}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="font-bold text-sm">{(user?.first_name || user?.name || 'C').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>

            </div>
        </header>
    )
}
