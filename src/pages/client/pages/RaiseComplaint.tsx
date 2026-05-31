import { useState, useEffect } from 'react'
import { MessageSquareWarning, Send, Clock, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

export default function RaiseComplaint() {
    const [complaints, setComplaints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [subject, setSubject] = useState('')
    const [complaintText, setComplaintText] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
    const token = localStorage.getItem('ra_token')

    const fetchComplaints = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${API_URL}/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setComplaints(res.data.data)
            }
        } catch (err) {
            console.error("Failed to fetch complaints", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchComplaints()
    }, [token, API_URL])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!complaintText.trim()) return

        setSubmitting(true)
        try {
            const res = await axios.post(`${API_URL}/complaints`, {
                subject,
                complaint: complaintText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.data.success) {
                setSubject('')
                setComplaintText('')
                // Refresh list
                fetchComplaints()
            }
        } catch (err: any) {
            console.error("Failed to submit complaint", err)
            alert(err.response?.data?.message || "Failed to submit complaint")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <MessageSquareWarning className="text-red-500" size={32} />
                    Raise a Complaint
                </h1>
                <p className="text-slate-500 mt-2 text-lg">We value your feedback. Let us know if you are facing any issues, and our operational manager will address it immediately.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Submit Form */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">New Complaint</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject (Optional)</label>
                                <input 
                                    type="text" 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Brief title of the issue"
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Complaint Details</label>
                                <textarea 
                                    value={complaintText}
                                    onChange={e => setComplaintText(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                                    rows={6}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={submitting || !complaintText.trim()} 
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History List */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Complaint History</h2>
                        
                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
                            {loading ? (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
                                    <p className="text-sm text-slate-500">Loading complaints...</p>
                                </div>
                            ) : complaints.length > 0 ? (
                                complaints.map((complaint) => (
                                    <div key={complaint.id} className="border border-slate-200 rounded-xl bg-slate-50 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {complaint.subject || 'No Subject'}
                                            </h3>
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                                                complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">
                                            {complaint.complaint}
                                        </p>
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-200 pt-3 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                Submitted on {new Date(complaint.createdAt).toLocaleDateString()}
                                            </div>
                                            {complaint.status === 'Resolved' && (
                                                <div className="flex items-center gap-1.5 text-emerald-600">
                                                    <CheckCircle2 size={14} />
                                                    Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed h-full flex flex-col items-center justify-center">
                                    <CheckCircle2 size={48} className="text-slate-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-600">No Complaints Found</h3>
                                    <p className="text-sm text-slate-500 mt-2">You haven't submitted any complaints yet. We hope everything is going smoothly!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
