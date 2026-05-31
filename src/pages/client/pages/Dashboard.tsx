import { Bell, Phone, FileText, Download, Building2, User, Mail, Compass, Camera, Film, ChevronRight, Clock, IndianRupee } from 'lucide-react'
import { Link } from 'react-router-dom'

// Dummy Data
const clientDetails = {
    name: 'Acme Corporation',
    contactPerson: 'Jane Smith',
    email: 'jane.smith@acme.com',
    phone: '+1 (555) 123-4567',
    package: 'Premium Corporate Video',
    location: 'New York, NY',
    startDate: 'Mar 15, 2026',
}

const recentNotifications = [
    { id: 1, text: 'V1 Video edit has been uploaded for your review.', time: '2 hours ago', type: 'delivery', unread: true },
    { id: 2, text: 'Shoot day completed successfully! Raw footage is being ingested.', time: 'Mar 25', type: 'update', unread: false },
    { id: 3, text: 'Your invoice #INV-2049 has been marked as Paid.', time: 'Mar 15', type: 'billing', unread: false },
]

export default function Dashboard() {
    return (
        <div className="p-6 pb-20 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Overview</h1>
                    <p className="text-slate-500 mt-1">Welcome back. Here is the high-level summary of your project.</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100 shadow-sm">
                    <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    Status: Initial Editing
                </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Link to="/client/tracker" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <Compass size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Timeline</h3>
                    <p className="text-xs text-slate-500 mt-1">Track production</p>
                </Link>
                <Link to="/client/preproduction" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
                        <Camera size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Preproduction</h3>
                    <p className="text-xs text-slate-500 mt-1">Shoot details</p>
                </Link>
                <Link to="/client/postproduction" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group relative overflow-hidden">
                    {/* Active pulse for reviews */}
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                        <Film size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Review Edits</h3>
                    <p className="text-xs text-slate-500 mt-1">Action required</p>
                </Link>
                <Link to="/client/invoice" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <IndianRupee size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Financials</h3>
                    <p className="text-xs text-slate-500 mt-1">Invoices & Calls</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* 2. DETAILS SECTION */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                        <FileText className="text-purple-600" size={20} />
                        Project Details
                    </h2>

                    <div className="flex-1 space-y-5">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Package</h3>
                            <p className="font-semibold text-slate-900">{clientDetails.package}</p>
                        </div>

                        <div className="space-y-4 px-2">
                            <div className="flex items-center gap-3">
                                <Building2 size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Company</p>
                                    <p className="text-sm font-semibold text-slate-800">{clientDetails.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Contact Person</p>
                                    <p className="text-sm font-semibold text-slate-800">{clientDetails.contactPerson}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Email</p>
                                    <p className="text-sm font-semibold text-slate-800">{clientDetails.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Phone</p>
                                    <p className="text-sm font-semibold text-slate-800">{clientDetails.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                        <Download size={16} /> View Proposal/Contract
                    </button>
                </div>

                {/* 2. NOTIFICATION SECTION */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Bell className="text-orange-500" size={20} />
                            Recent activity
                        </h2>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                            Mark all as read
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentNotifications.map(nav => (
                            <div key={nav.id} className={`p-4 rounded-xl border flex items-start gap-4 transition-colors hover:bg-slate-50 cursor-pointer ${nav.unread ? 'bg-orange-50/30 border-orange-100' : 'bg-white border-slate-100'}`}>
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${nav.unread ? 'bg-orange-500' : 'bg-transparent'}`} />
                                <div className="flex-1">
                                    <p className={`text-sm ${nav.unread ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'}`}>{nav.text}</p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {nav.time}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 self-center" />
                            </div>
                        ))}
                    </div>
                </div>



            </div>
        </div>
    )
}
