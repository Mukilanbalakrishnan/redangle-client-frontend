import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Users, AlertTriangle, FileText, CheckCircle2, Download } from 'lucide-react'

export default function EventDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()

    // We expect the event object to be passed via route state
    const event = location.state?.event

    if (!event) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <AlertTriangle size={32} className="mx-auto text-slate-400 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
                <p className="text-slate-500 mt-2 mb-6">We couldn't load the details for this event.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header / Back Navigation */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back to Events
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-100 text-indigo-700">
                                {event.status || 'UPCOMING'}
                            </span>
                            <span className="text-sm font-semibold text-slate-500">Event #{id}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{event.name}</h1>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Logistics & Details */}
                <div className="md:col-span-2 space-y-6">

                    {/* Time & Venue */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Time & Location</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} /> Date</p>
                                    <p className="font-semibold text-slate-900">{event.date}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{event.time}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin size={14} /> Venue</p>
                                    <p className="font-semibold text-slate-900">{event.venue}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">{event.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Google Map */}
                        <div className="h-48 bg-slate-100 relative w-full border-t border-slate-100 overflow-hidden">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${encodeURIComponent((event.venue || '') + ' ' + (event.address || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                allowFullScreen
                                title="Event Map Location"
                            ></iframe>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock className="text-indigo-500" size={20} /> Event Timeline
                        </h2>

                        <div className="space-y-6">
                            {/* Dummy Timeline Items */}
                            <div className="flex gap-4">
                                <div className="w-16 text-right shrink-0">
                                    <span className="text-xs font-bold text-slate-500">10:00 AM</span>
                                </div>
                                <div className="relative pb-6 border-l-2 border-slate-100 pl-4">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-none">Crew Call Time</h3>
                                    <p className="text-sm text-slate-500">Arrival and equipment load-in.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-16 text-right shrink-0">
                                    <span className="text-xs font-bold text-slate-500">11:30 AM</span>
                                </div>
                                <div className="relative pb-6 border-l-2 border-indigo-200 pl-4">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm shadow-indigo-500/30"></div>
                                    <h3 className="text-sm font-bold text-indigo-900 mb-1 leading-none">Decor & Setup Complete</h3>
                                    <p className="text-sm text-slate-600">Venue ready for establishing shots and B-roll.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-16 text-right shrink-0">
                                    <span className="text-xs font-bold text-slate-500">12:30 PM</span>
                                </div>
                                <div className="relative pl-4">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-none">Guest Arrival</h3>
                                    <p className="text-sm text-slate-500">Main coverage begins.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Crew & Notes */}
                <div className="space-y-6">

                    {/* Crew Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Users className="text-blue-500" size={18} /> Assigned Crew
                        </h2>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                            <p className="text-sm font-semibold text-slate-800 text-center">{event.crew}</p>
                        </div>

                        {/* Dummy Crew List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">P1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Lead Photographer</p>
                                    <p className="text-xs text-slate-500">Candid & Portraits</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">V1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Lead Videographer</p>
                                    <p className="text-xs text-slate-500">Cinematic B-Roll</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Notes */}
                    {event.notes && event.notes.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 relative overflow-hidden">
                            <AlertTriangle className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-500/10 pointer-events-none" />
                            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3 relative z-10">
                                <AlertTriangle size={16} className="text-amber-500" /> Important Notes
                            </h3>
                            <ul className="list-disc pl-4 text-xs text-amber-700 space-y-2 relative z-10">
                                {event.notes.map((note: string, idx: number) => (
                                    <li key={idx} className="leading-relaxed">{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Attached Documents */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="text-slate-400" size={18} /> Documents
                        </h2>
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-colors group text-left">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400 group-hover:text-indigo-500" />
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">Contract Annexure</span>
                                </div>
                                <Download size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-colors group text-left">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-slate-400 group-hover:text-indigo-500" />
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">Shot List Approval</span>
                                </div>
                                <Download size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}
