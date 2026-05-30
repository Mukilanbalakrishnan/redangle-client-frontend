import { Outlet } from 'react-router-dom'
import ClientSidebar from './components/ClientSidebar'
import ClientTopbar from './components/ClientTopbar'

export default function ClientLayout() {
    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-800">
            <ClientSidebar />
            <div
                className="flex flex-col flex-1"
                style={{ marginLeft: 'var(--sidebar-width)' }}
            >
                <ClientTopbar />
                <main
                    className="flex-1 overflow-auto border-t border-slate-100"
                    style={{ padding: '24px', backgroundColor: '#f9f8ff' }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
