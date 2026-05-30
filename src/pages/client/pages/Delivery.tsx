import { useState, useEffect } from 'react'
import { Download, Info, Film, Database, FolderArchive, CheckCircle2, ArrowRight } from 'lucide-react'
import axios from 'axios'

export default function Delivery() {
    const [deliveries, setDeliveries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [queryDeliveryId, setQueryDeliveryId] = useState<number | null>(null)
    const [queryText, setQueryText] = useState('')
    const [submittingQuery, setSubmittingQuery] = useState(false)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
    const token = localStorage.getItem('ra_token')

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const res = await axios.get(`${API_URL}/deliveries`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.data.success) {
                    setDeliveries(res.data.data)
                }
            } catch (err) {
                console.error("Failed to fetch deliveries", err)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchDeliveries()
    }, [token, API_URL])

    const rawDeliveries = deliveries.filter(d => d.deliveryType === 'RAW_DATA' || d.deliveryType === 'EVENT_RAW_DATA')
    const pendingRaw = rawDeliveries.filter(d => d.status === 'pending')
    const approvedRaw = rawDeliveries.filter(d => d.status === 'client_approved')

    const finalDeliveries = deliveries.filter(d => d.deliveryType === 'FINAL_DELIVERABLES')
    const pendingFinal = finalDeliveries.filter(d => d.status === 'pending' || d.status === 'query_raised')
    const approvedFinal = finalDeliveries.filter(d => d.status === 'client_approved')

    const handleApprove = async (id: number) => {
        try {
            await axios.patch(`${API_URL}/deliveries/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'client_approved' } : d))
        } catch (err) {
            console.error("Failed to approve delivery", err)
            alert("Failed to approve delivery")
        }
    }

    const handleRaiseQuery = async (id: number) => {
        if (!queryText.trim()) return;
        setSubmittingQuery(true)
        try {
            await axios.post(`${API_URL}/deliveries/${id}/query`, { queryMessage: queryText }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setDeliveries(prev => prev.map(d => {
                if (d.id === id) {
                    return { ...d, status: 'query_raised', queryCount: (d.queryCount || 0) + 1, notes: (d.notes ? d.notes + '\n\n' : '') + `Client Query: ${queryText}` }
                }
                return d;
            }))
            setQueryDeliveryId(null)
            setQueryText('')
            alert("Query submitted successfully! Our team will get back to you.")
        } catch (err: any) {
            console.error("Failed to submit query", err)
            alert(err.response?.data?.message || "Failed to submit query")
        } finally {
            setSubmittingQuery(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reviews & Delivery</h1>
                <p className="text-slate-500 mt-1">Review active edits, submit feedback, and download your final files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-2 space-y-6">
                    {/* RAW DATA APPROVAL */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Database className="text-blue-500" size={24} />
                                Raw Data Approval
                            </h2>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest rounded-full">Action Required</span>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                                    <p className="text-sm text-slate-500">Loading deliveries...</p>
                                </div>
                            ) : pendingRaw.length > 0 ? pendingRaw.map(delivery => (
                                <div key={delivery.id} className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <FolderArchive className="text-blue-500" size={20} />
                                                {delivery.deliveryType === 'EVENT_RAW_DATA' ? 'Event Raw Data Delivery' : 'Pre-production Raw Data Delivery'}
                                            </h3>
                                            <p className="text-sm font-semibold text-slate-500 mt-1">Unedited Footage</p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Pending Your Review</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                        {delivery.notes || "Please review the raw footage and confirm receipt. Note: Raw files are unedited and may contain unusable takes."}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {delivery.driveLink && (
                                            <button onClick={() => window.open(delivery.driveLink, '_blank')} className="flex-1 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-blue-200">
                                                <Database size={16} /> Photos Drive
                                            </button>
                                        )}
                                        {delivery.videoDriveLink && (
                                            <button onClick={() => window.open(delivery.videoDriveLink, '_blank')} className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-indigo-200">
                                                <Film size={16} /> Videos Drive
                                            </button>
                                        )}
                                        <button onClick={() => handleApprove(delivery.id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                            <CheckCircle2 size={16} /> Approve Raw Data
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <Info size={32} className="mx-auto text-slate-300 mb-3" />
                                    <h3 className="font-semibold text-slate-600">No Raw Data Pending</h3>
                                    <p className="text-sm text-slate-500 mt-1">When raw data is ready for review, it will appear here.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Approval History</h3>
                            <div className="space-y-3">
                                {approvedRaw.length > 0 ? approvedRaw.map(delivery => (
                                    <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                <CheckCircle2 size={14} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">Raw Data Approved</h4>
                                                <p className="text-xs text-slate-500">Approved on {new Date(delivery.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-400" />
                                    </div>
                                )) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-slate-400">No previous approvals.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FINAL APPROVAL */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Film className="text-purple-500" size={24} />
                                Final Approval
                            </h2>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest rounded-full">Action Required</span>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                                    <p className="text-sm text-slate-500">Loading deliveries...</p>
                                </div>
                            ) : pendingFinal.length > 0 ? pendingFinal.map(delivery => (
                                <div key={delivery.id} className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Film className="text-purple-500" size={20} />
                                                Final Deliverables
                                            </h3>
                                            <p className="text-sm font-semibold text-slate-500 mt-1">Edited Content Ready</p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                            {delivery.status === 'query_raised' ? 'Query Submitted' : 'Pending Your Review'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6 leading-relaxed whitespace-pre-wrap">
                                        {delivery.notes || "Please review the final deliverables. If you are satisfied with the edits, click Approve."}
                                    </p>
                                    
                                    {queryDeliveryId === delivery.id ? (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <h4 className="text-sm font-bold text-slate-700 mb-2">Raise a Query</h4>
                                            <textarea 
                                                value={queryText}
                                                onChange={e => setQueryText(e.target.value)}
                                                placeholder="Describe the changes or issues you noticed..."
                                                className="w-full text-sm p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 mb-3"
                                                rows={3}
                                            />
                                            <div className="flex gap-3">
                                                <button onClick={() => handleRaiseQuery(delivery.id)} disabled={submittingQuery || !queryText.trim()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                                                    Submit Query
                                                </button>
                                                <button onClick={() => { setQueryDeliveryId(null); setQueryText(''); }} disabled={submittingQuery} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {delivery.driveLink && (
                                                <button onClick={() => window.open(delivery.driveLink, '_blank')} className="flex-1 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-purple-200">
                                                    <Database size={16} /> View Photos/Albums
                                                </button>
                                            )}
                                            {delivery.videoDriveLink && (
                                                <button onClick={() => window.open(delivery.videoDriveLink, '_blank')} className="flex-1 py-2.5 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-fuchsia-200">
                                                    <Film size={16} /> View Videos
                                                </button>
                                            )}
                                            {(delivery.queryCount || 0) < 2 && (
                                                <button onClick={() => setQueryDeliveryId(delivery.id)} className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-amber-200">
                                                    Raise Query ({(2 - (delivery.queryCount || 0))} left)
                                                </button>
                                            )}
                                            <button onClick={() => handleApprove(delivery.id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                                <CheckCircle2 size={16} /> Approve Final Edits
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                                    <Info size={32} className="mx-auto text-slate-300 mb-3" />
                                    <h3 className="font-semibold text-slate-600">No Final Deliverables Pending</h3>
                                    <p className="text-sm text-slate-500 mt-1">When final edits are ready for review, they will appear here.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Review History</h3>
                            <div className="space-y-3">
                                {approvedFinal.length > 0 ? approvedFinal.map(delivery => (
                                    <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                <CheckCircle2 size={14} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">Final Deliverables Approved</h4>
                                                <p className="text-xs text-slate-500">Approved on {new Date(delivery.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-400" />
                                    </div>
                                )) : (
                                    <div className="p-4 text-center">
                                        <p className="text-sm text-slate-400">No previous reviews.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINAL DELIVERABLES (Sidebar) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-white/90">
                            <Download className="text-indigo-200" size={24} />
                            Final Deliverables
                        </h2>

                        <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-center">
                            <Database size={32} className="mx-auto text-indigo-200 mb-3 opacity-50" />
                            <h3 className="font-semibold text-white mb-2">No Files Yet</h3>
                            <p className="text-xs text-indigo-100/70 mb-4">Your high-res exports and source files will appear here when ready.</p>
                            <button disabled className="w-full py-2.5 bg-white/20 text-white/50 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                <Download size={16} /> Open Drive Link
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Info size={20} className="text-slate-400" /> Need Raw Footage?
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            A hard drive containing all RAW files requires a separate buyout clause in your contract.
                        </p>
                        <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors mt-auto">
                            Request RAW Buyout
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
