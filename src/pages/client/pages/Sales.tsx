import { useState, useEffect } from 'react'
import { Video, Calendar, Clock, Download, FileText, CreditCard, ExternalLink, Link2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function Sales() {
    const navigate = useNavigate()
    const [invoices, setInvoices] = useState<any[]>([])
    const [calls, setCalls] = useState<any[]>([])

    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [meetPurpose, setMeetPurpose] = useState('')
    const [meetDate, setMeetDate] = useState('')
    const [meetTime, setMeetTime] = useState('')
    const [meetLink, setMeetLink] = useState('')

    // Client Lead ID fallback
    const userStr = localStorage.getItem('ra_user')
    let leadId = 1
    if (userStr) {
        try {
            const user = JSON.parse(userStr)
            if(user.leadId) leadId = user.leadId
        } catch(e) {}
    }

    const fetchSalesData = async () => {
        try {
            const token = localStorage.getItem('ra_token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            
            const invoiceRes = await axios.get(`${API_URL}/invoices/lead/${leadId}`, config)
            if (invoiceRes.data?.success) setInvoices(invoiceRes.data.data)

            const callRes = await axios.get(`${API_URL}/calls/lead/${leadId}/all`, config)
            if (callRes.data?.success) setCalls(callRes.data.data)
        } catch(err) {
            console.error("Failed to fetch client sales data", err)
        }
    }

    useEffect(() => {
        fetchSalesData()
    }, [leadId])

    const handleScheduleSubmit = async () => {
        if (!meetPurpose || !meetDate || !meetTime) {
            alert("Please fill in the purpose, date, and time.")
            return
        }
        
        try {
            const token = localStorage.getItem('ra_token')
            const config = { headers: { Authorization: `Bearer ${token}` } }
            
            // combine date and time for callTime timestamp
            const callTime = new Date(`${meetDate}T${meetTime}`)

            await axios.post(`${API_URL}/calls`, {
                leadId,
                notes: meetPurpose + (meetLink ? ` (Link: ${meetLink})` : ''),
                callTime: callTime.toISOString()
            }, config)

            alert("Meeting request sent successfully!")
            setShowScheduleForm(false)
            setMeetPurpose('')
            setMeetDate('')
            setMeetTime('')
            setMeetLink('')
            fetchSalesData() // refresh list
        } catch (err: any) {
            console.error("Error creating call", err)
            alert(err.response?.data?.message || err.message)
        }
    }

    if (showScheduleForm) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <button
                        onClick={() => setShowScheduleForm(false)}
                        className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 font-medium text-sm transition-colors mb-4"
                    >
                        ← Back to Sales
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Schedule a Meeting</h1>
                    <p className="text-slate-500 mt-1">Provide the details for your 1-on-1 session.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purpose of the Meet</label>
                        <input
                            type="text"
                            placeholder="e.g. Discussing V1 Video Changes"
                            value={meetPurpose}
                            onChange={(e) => setMeetPurpose(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Calendar size={14} className="text-indigo-500" /> Date
                            </label>
                            <input
                                type="date"
                                value={meetDate}
                                onChange={(e) => setMeetDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <Clock size={14} className="text-indigo-500" /> Time
                            </label>
                            <input
                                type="time"
                                value={meetTime}
                                onChange={(e) => setMeetTime(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-slate-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Link2 size={14} className="text-indigo-500" /> Meeting Link (Optional)
                        </label>
                        <input
                            type="url"
                            placeholder="e.g. meet.google.com/abc-xyz-def"
                            value={meetLink}
                            onChange={(e) => setMeetLink(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">If left blank, your project manager will generate a internal link for you.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                        <button
                            onClick={() => setShowScheduleForm(false)}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleScheduleSubmit}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm shadow-indigo-600/30"
                        >
                            Confirm Schedule
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales & Consultations</h1>
                <p className="text-slate-500 mt-1">Manage your billing and upcoming team calls.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* INVOICES SECTION */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <CreditCard className="text-emerald-500" size={24} />
                            Billing & Invoices
                        </h2>

                        <div className="space-y-4">
                            {invoices.length === 0 && <p className="text-sm text-slate-500 italic p-2">No invoices found.</p>}
                            {invoices.map((inv) => {
                                const amount = inv.invoiceSnapshot?.totalPrice ?? 0;
                                return (
                                <div key={inv.invoiceId} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group bg-slate-50/50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">INV-{String(inv.invoiceId).padStart(6, '0')}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{new Date(inv.billingDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${inv.status?.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {inv.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-sm font-medium text-slate-600 truncate max-w-[200px]">{inv.plan || 'Service Plan'}</p>
                                        <p className="text-lg font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-4">
                                        <button className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
                                            <Download size={16} /> PDF
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/client/invoice?id=${inv.invoiceId}`)}
                                            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors group-hover:bg-indigo-50 px-3 py-1 rounded-md"
                                        >
                                            View Details <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>

                        <button className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                            <FileText size={18} /> View Contract Agreemnets
                        </button>
                    </div>
                </div>

                {/* CALLS SECTION */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white/90">
                            <Video className="text-indigo-200" size={24} />
                            Upcoming Consultations
                        </h2>

                        {calls.length === 0 && <p className="text-indigo-200 italic text-sm mb-4">No upcoming calls scheduled.</p>}
                        {calls.map((call) => {
                            const dateObj = new Date(call.callTime)
                            return (
                            <div key={call.callId} className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest bg-black/20 px-2 py-1 rounded">{call.isTaken ? 'Completed' : 'Upcoming Session'}</span>
                                </div>
                                <h3 className="font-bold text-lg mb-3">{call.notes?.split(' (Link:')[0] || 'Scheduled Meeting'}</h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <Calendar size={16} className="text-indigo-300" /> {dateObj.toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-white/80">
                                        <Clock size={16} className="text-indigo-300" /> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                                    Join Meeting <ExternalLink size={16} />
                                </button>
                            </div>
                        )})}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                        <h3 className="text-base font-bold text-slate-900 mb-2">Need to discuss changes?</h3>
                        <p className="text-sm text-slate-500 mb-6">You can schedule a 1-on-1 session with your project manager at any time during production.</p>
                        <button
                            onClick={() => setShowScheduleForm(true)}
                            className="px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Schedule New Call
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
