import { useEffect, useState } from 'react'
import { Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'

interface QuotationItem {
    name: string
    category?: string
    quantity?: number
    price?: number
}

interface QuotationData {
    quotationLeadId: number
    quotationId: number
    status: 'pending' | 'sent' | 'approved' | 'rejected'
    sentAt: string
    notes?: string
    token?: string
    serviceName: string
    serviceProvided?: string
    description?: string
    quantity: number
    price: number
    terms?: number
    combo?: string
    imageUrl?: string
    items: QuotationItem[]
    lead: {
        leadId: number
        eventType?: string
    } | null
}

type AddOnService = {
    id: number
    name: string
    unitLabel: string
    defaultQty: number
    price: number
}

const ADDON_CATEGORIES = [
    "Wedding",
    "Reception",
    "Engagement",
    "Rituals",
    "Extra Complementary",
] as const

type AddonCategory = (typeof ADDON_CATEGORIES)[number]

type SelectedAddOn = AddOnService & {
    qty: number
    category: AddonCategory
}

export default function Quotation() {
    const [quotations, setQuotations] = useState<QuotationData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    // Addons state
    const [addOnServices, setAddOnServices] = useState<AddOnService[]>([])
    const [selectedAddOnsByQuotation, setSelectedAddOnsByQuotation] = useState<Record<number, SelectedAddOn[]>>({})

    // Addon Input States by Quotation
    const [selectedAddOnIdByQuotation, setSelectedAddOnIdByQuotation] = useState<Record<number, number | "">>({})
    const [addOnQtyByQuotation, setAddOnQtyByQuotation] = useState<Record<number, number>>({})
    const [addOnCategoryByQuotation, setAddOnCategoryByQuotation] = useState<Record<number, AddonCategory>>({})

    // Image preview state
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // Issue modal state (simplified)
    const [showQueryModal, setShowQueryModal] = useState(false)
    const [activeQueryId, setActiveQueryId] = useState<number | null>(null)
    const [queryTitle, setQueryTitle] = useState('')
    const [queryText, setQueryText] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchQuotations = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('ra_token')
            const res = await axios.get(`${API_URL}/quotations`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                setQuotations(res.data.data)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load quotations. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const fetchAddons = async () => {
        try {
            const token = localStorage.getItem('ra_token')
            const res = await axios.get(`${API_URL}/quotations/addons`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data.success) {
                const addons = res.data.data.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    unitLabel: a.unitLabel,
                    defaultQty: a.defaultQty,
                    price: Number(a.price),
                }))
                setAddOnServices(addons)
            }
        } catch (err) {
            console.error("Failed to load add-ons", err)
        }
    }

    useEffect(() => {
        fetchQuotations()
        fetchAddons()
    }, [])

    /* ================= Image preview scroll lock ================= */
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPreviewImage(null)
        }
        if (previewImage) window.addEventListener("keydown", handleEsc)
        const html = document.documentElement
        const body = document.body
        if (previewImage) {
            html.style.overflow = "hidden"
            body.style.overflow = "hidden"
            body.style.touchAction = "none"
        } else {
            html.style.overflow = "auto"
            body.style.overflow = "auto"
            body.style.touchAction = "auto"
        }
        return () => {
            window.removeEventListener("keydown", handleEsc)
            html.style.overflow = "auto"
            body.style.overflow = "auto"
            body.style.touchAction = "auto"
        }
    }, [previewImage])

    /* ================= Helpers ================= */
    const getImageUrl = (path: string) => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
        // avoid double //api
        return `${apiBase.replace("/api", "")}${path}`;
    }

    /* ================= Add-on logic ================= */
    const handleAddAddOn = (quotationLeadId: number) => {
        const selectedId = selectedAddOnIdByQuotation[quotationLeadId]
        if (!selectedId) return

        const addon = addOnServices.find((a) => a.id === selectedId)
        if (!addon) return

        const qty = addOnQtyByQuotation[quotationLeadId] || addon.defaultQty
        const category = addOnCategoryByQuotation[quotationLeadId] || "Wedding"

        setSelectedAddOnsByQuotation((prev) => {
            const current = prev[quotationLeadId] || []
            const exists = current.find((a) => a.id === addon.id && a.category === category)
            let updated
            if (exists) {
                updated = current.map((a) => (a.id === addon.id && a.category === category ? { ...a, qty: a.qty + qty } : a))
            } else {
                updated = [...current, { ...addon, qty, category }]
            }
            return { ...prev, [quotationLeadId]: updated }
        })

        // Reset inputs for this quotation
        setSelectedAddOnIdByQuotation(prev => ({ ...prev, [quotationLeadId]: "" }))
        setAddOnQtyByQuotation(prev => ({ ...prev, [quotationLeadId]: 1 }))
    }

    const removeAddOn = (quotationLeadId: number, id: number, category: AddonCategory) => {
        setSelectedAddOnsByQuotation((prev) => {
            const current = prev[quotationLeadId] || []
            return {
                ...prev,
                [quotationLeadId]: current.filter((a) => !(a.id === id && a.category === category))
            }
        })
    }

    const handleApprove = async (quotationLeadId: number) => {
        if (!window.confirm('Are you sure you want to approve this quotation?')) return
        setActionLoading(quotationLeadId)
        try {
            const token = localStorage.getItem('ra_token')
            const selectedAddOns = selectedAddOnsByQuotation[quotationLeadId] || []
            
            const payload = {
                status: "approved",
                addons: selectedAddOns.map(a => ({
                    addonServiceId: a.id,
                    quantity: a.qty || 1,
                    category: a.category
                }))
            }

            const q = quotations.find(q => q.quotationLeadId === quotationLeadId);
            if (!q) throw new Error("Quotation not found");

            const salesApiBase = import.meta.env.VITE_SALES_API_URL || 'http://localhost:5000/api';

            await axios.put(`${salesApiBase}/quotations/public/${q.token}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setQuotations(prev => prev.map(q =>
                q.quotationLeadId === quotationLeadId ? { ...q, status: 'approved' } : q
            ))
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve quotation.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (quotationLeadId: number) => {
        if (!window.confirm('Are you sure you want to reject this quotation?')) return
        setActionLoading(quotationLeadId)
        try {
            const token = localStorage.getItem('ra_token')
            
            const q = quotations.find(q => q.quotationLeadId === quotationLeadId);
            if (!q) throw new Error("Quotation not found");

            const salesApiBase = import.meta.env.VITE_SALES_API_URL || 'http://localhost:5000/api';

            await axios.put(`${salesApiBase}/quotations/public/${q.token}/status`, { status: "rejected" }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setQuotations(prev => prev.map(q =>
                q.quotationLeadId === quotationLeadId ? { ...q, status: 'rejected' } : q
            ))
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reject quotation.')
        } finally {
            setActionLoading(null)
        }
    }

    const handleQuerySubmit = async () => {
        if (!queryTitle.trim()) return alert('Please enter a subject for your query.')
        if (!queryText.trim()) return alert('Please describe your query.')
        if (!activeQueryId) return
        setSubmitting(true)
        try {
            const token = localStorage.getItem('ra_token')
            await axios.post(`${API_URL}/quotations/${activeQueryId}/issue`, {
                issueTitle: queryTitle,
                description: queryText,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert('Your query has been submitted to the team.')
            setShowQueryModal(false)
            setQueryTitle('')
            setQueryText('')
            setActiveQueryId(null)
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit query.')
        } finally {
            setSubmitting(false)
        }
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
                <p className="text-slate-500 font-medium">Loading your quotations...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="text-rose-500" size={40} />
                <p className="text-slate-600 font-medium">{error}</p>
                <button
                    onClick={fetchQuotations}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw size={16} /> Try Again
                </button>
            </div>
        )
    }

    if (quotations.length === 0) {
        return (
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-white shadow-sm rounded-2xl p-4 mb-4 text-center py-12">
                    <h2 className="text-lg font-bold text-slate-700 mb-2">No Quotations Yet</h2>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Your sales team hasn't sent a quotation yet. Once they do, it will appear here for your review and approval.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <div className="max-w-6xl mx-auto p-4 space-y-8">
                {quotations.map((q, idx) => {
                    const isPending = q.status === 'pending' || q.status === 'sent'
                    const isActioning = actionLoading === q.quotationLeadId
                    const basePrice = Number(q.price || 0)

                    const packageItemsTotal = (q.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
                    
                    const selectedAddOns = selectedAddOnsByQuotation[q.quotationLeadId] || []
                    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.price * a.qty, 0)
                    const grandTotal = basePrice + addOnTotal

                    const CATEGORY_ORDER: Record<string, number> = {
                        service: 0,
                        packages: 1,
                        wedding: 2,
                        shoot: 3,
                        engagement: 4,
                        reception: 5,
                        "add-ons": 100,
                        "add-on": 100,
                        addons: 100,
                        addon: 100,
                        "next service": 110,
                        deliverable: 120,
                        deliverables: 120,
                        complementary: 130,
                        complimentary: 130,
                    }

                    const allItems = [
                        ...(q.items || []),
                        ...selectedAddOns.map(a => ({
                            name: a.name,
                            category: a.category.toUpperCase(),
                            quantity: a.qty,
                            price: a.price * a.qty
                        }))
                    ]

                    const sortedItems = allItems.sort((a: any, b: any) => {
                        const aOrder = CATEGORY_ORDER[(a.category ?? "").toLowerCase()] ?? 50
                        const bOrder = CATEGORY_ORDER[(b.category ?? "").toLowerCase()] ?? 50
                        return aOrder - bOrder
                    })

                    return (
                        <div key={q.quotationLeadId} className="flex flex-col space-y-4">
                            {/* Header */}
                            <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-5 flex items-center justify-between">
                                <h1 className="text-xl font-bold text-slate-800">
                                    Quotation #{quotations.length - idx} <span className="mx-2 text-slate-300">|</span> 
                                    <span className="text-blue-600">{q.lead?.eventType || "Your Event"}</span>
                                </h1>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                      q.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                                      'bg-amber-100 text-amber-700'}`}>
                                    {q.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* ===== Left Side ===== */}
                                <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-5">
                                    {q.imageUrl && (
                                        <div className="relative mb-5 group">
                                            <img
                                                src={getImageUrl(q.imageUrl)}
                                                className="w-full max-h-[300px] object-contain rounded-xl border border-slate-100 bg-slate-50 transition-all group-hover:brightness-95"
                                                alt="Quotation cover"
                                            />
                                            <button
                                                onClick={() => setPreviewImage(getImageUrl(q.imageUrl!))}
                                                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-3.5 text-sm">
                                        <Row label="Service" value={q.serviceName} />
                                        <Row label="Description" value={q.description} />
                                        <Row label="Quantity" value={q.quantity} />
                                        <Row label="Package Price" value={`₹${(basePrice - packageItemsTotal).toLocaleString('en-IN')}`} bold />
                                        
                                        {(q.items?.length > 0 || selectedAddOns.length > 0) && (
                                            <div className="mt-5 border-t border-slate-100 pt-4 space-y-2.5">
                                                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Package Items / Add-ons</h3>
                                                {sortedItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm py-1">
                                                        <span className="text-slate-600">
                                                            {item.name} {item.category ? <span className="text-xs text-slate-400 ml-1">({item.category})</span> : ""} {item.quantity > 1 ? <span className="font-medium text-slate-500 ml-1">× {item.quantity}</span> : ""}
                                                        </span>
                                                        <span className="font-semibold text-slate-700">
                                                            {item.price ? `₹${item.price.toLocaleString('en-IN')}` : "Included"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ===== Right Side ===== */}
                                <div className="bg-white shadow-sm border border-slate-100 rounded-2xl p-5 flex flex-col">
                                    <h2 className="text-lg font-bold text-slate-800 mb-4">Add-on Services</h2>

                                    {isPending ? (
                                        <div className="flex flex-wrap gap-2 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <select
                                                value={selectedAddOnIdByQuotation[q.quotationLeadId] || ""}
                                                onChange={(e) => setSelectedAddOnIdByQuotation(prev => ({ ...prev, [q.quotationLeadId]: Number(e.target.value) }))}
                                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 min-w-[140px] bg-white"
                                            >
                                                <option value="">-- Select Add-on --</option>
                                                {addOnServices.map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name} ({a.unitLabel}) - ₹{a.price}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={addOnCategoryByQuotation[q.quotationLeadId] || "Wedding"}
                                                onChange={(e) => setAddOnCategoryByQuotation(prev => ({ ...prev, [q.quotationLeadId]: e.target.value as AddonCategory }))}
                                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-[120px] bg-white"
                                            >
                                                {ADDON_CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>

                                            <input
                                                type="number"
                                                min={1}
                                                value={addOnQtyByQuotation[q.quotationLeadId] || 1}
                                                onChange={(e) => setAddOnQtyByQuotation(prev => ({ ...prev, [q.quotationLeadId]: Number(e.target.value) }))}
                                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-[70px] bg-white text-center"
                                            />

                                            <button
                                                onClick={() => handleAddAddOn(q.quotationLeadId)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ) : (
                                        selectedAddOns.length === 0 && (
                                            <div className="text-sm text-slate-400 mb-5 italic">No add-ons selected.</div>
                                        )
                                    )}

                                    {selectedAddOns.length > 0 && (
                                        <div className="mb-5 space-y-2 overflow-y-auto max-h-[250px] pr-1 custom-scrollbar">
                                            {selectedAddOns.map((a, idx) => (
                                                <div
                                                    key={`${a.id}-${a.category}-${idx}`}
                                                    className="flex justify-between items-center border border-slate-200 rounded-xl p-3 bg-white shadow-sm"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{a.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] uppercase tracking-wide font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{a.category}</span>
                                                            <span className="text-xs text-slate-500">
                                                                ₹{a.price.toLocaleString('en-IN')} × {a.qty} = <span className="font-medium text-slate-700">₹{(a.price * a.qty).toLocaleString('en-IN')}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isPending && (
                                                        <button
                                                            onClick={() => removeAddOn(q.quotationLeadId, a.id, a.category)}
                                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-5 border-t border-slate-100">
                                        <Row label="Add-on Total" value={`₹${addOnTotal.toLocaleString('en-IN')}`} />
                                        <div className="flex justify-between items-center font-bold text-lg text-emerald-800 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl mt-3">
                                            <span>Grand Total</span>
                                            <span className="text-xl">₹{grandTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {isPending && (
                                        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2.5">
                                            <button
                                                onClick={() => handleApprove(q.quotationLeadId)}
                                                disabled={isActioning}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                {isActioning ? <Loader2 size={18} className="animate-spin" /> : null}
                                                {selectedAddOns.length > 0 ? "Approve with Add-ons" : "Approve Quotation"}
                                            </button>

                                            <div className="grid grid-cols-2 gap-2.5">
                                                <button
                                                    onClick={() => handleReject(q.quotationLeadId)}
                                                    disabled={isActioning}
                                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 w-full py-2.5 rounded-xl font-semibold transition-colors border border-rose-200 flex justify-center items-center gap-2"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => { setActiveQueryId(q.quotationLeadId); setShowQueryModal(true) }}
                                                    disabled={isActioning}
                                                    className="bg-white hover:bg-slate-50 text-slate-700 w-full py-2.5 rounded-xl font-medium transition-colors border border-slate-200"
                                                >
                                                    Raise an Issue
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ===== Full-screen Image Preview ===== */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <img
                        src={previewImage}
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
                        alt="Quotation Preview"
                    />
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2.5 text-white transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
            )}

            {/* Query Modal */}
            {showQueryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">Raise a Query</h3>
                        <p className="text-sm text-slate-500 mb-5">Have questions or concerns? Send them directly to our sales team.</p>

                        <div className="space-y-4 mb-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject *</label>
                                <input
                                    type="text"
                                    value={queryTitle}
                                    onChange={e => setQueryTitle(e.target.value)}
                                    placeholder="e.g. Pricing clarification"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Details *</label>
                                <textarea
                                    value={queryText}
                                    onChange={e => setQueryText(e.target.value)}
                                    placeholder="Describe your query or requested changes here..."
                                    rows={4}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowQueryModal(false); setQueryTitle(''); setQueryText('') }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleQuerySubmit}
                                disabled={submitting}
                                className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                                Submit Query
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ================= Helpers ================= */
const Row = ({ label, value, bold }: { label: string; value: any; bold?: boolean }) => (
    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
        <span className="text-slate-500">{label}</span>
        <span className={bold ? "font-bold text-slate-800" : "font-medium text-slate-700"}>{value || "-"}</span>
    </div>
)
