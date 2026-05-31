import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Database,
    Download,
    ExternalLink,
    FileText,
    Film,
    FolderOpen,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    WalletCards,
    UserRound,
    X,
} from 'lucide-react'

type Delivery = {
    id: number
    deliveryType: string
    driveLink?: string | null
    videoDriveLink?: string | null
    dronePhotoLink?: string | null
    droneVideoLink?: string | null
    status: string
    notes?: string | null
    queryCount?: number
    createdAt?: string
}

type TrackingStep = {
    label: string
    status: 'completed' | 'in_progress' | 'pending' | string
    detail: string
}

type Work = {
    id: string
    type: string
    title: string
    status: string
    priority?: string
    createdAt?: string
    deadline?: string
    estimatedDuration?: number | null
    description?: string
    assignedTo?: {
        name: string
        role?: string
        email?: string | null
        phone?: string | null
        location?: string | null
    }
    events: any[]
    tracking: TrackingStep[]
    incomingData: Delivery[]
    finalDelivery: Delivery[]
    project?: {
        clientName?: string
        email?: string | null
        phone?: string | null
        address?: string | null
        eventType?: string | null
        eventDate?: string | null
        leadSource?: string | null
        leadStatus?: string | null
        currentStage?: string | null
        budget?: number
        paidAmount?: number
        discount?: number
        balance?: number
        deliveryStatus?: {
            incomingTotal: number
            incomingPending: number
            incomingApproved: number
            finalTotal: number
            finalPending: number
            finalApproved: number
        }
    }
}

type TabKey = 'details' | 'tracking' | 'incoming' | 'final'
type DeliveryAction = { delivery: Delivery; type: 'incoming' | 'final' }

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'

const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'tracking', label: 'Work Tracking', icon: Clock },
    { key: 'incoming', label: 'Incoming Data', icon: Database },
    { key: 'final', label: 'Final Delivery', icon: Download },
]

const formatDate = (date?: string | null) => {
    if (!date) return 'Not scheduled'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return 'Not scheduled'
    return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const pretty = (value?: string | null) =>
    String(value || 'pending')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase())

const formatMoney = (amount?: number | null) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(amount || 0))

const statusClass = (status?: string) => {
    const normalized = String(status || '').toLowerCase()
    if (['completed', 'client_approved', 'approved'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (['in_progress', 'pending', 'query_raised', 'client_review', 'final_review', 'post_production'].includes(normalized)) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-50 text-slate-600 border-slate-200'
}

const parseDeliveryNotes = (notes?: string | null) => {
    const raw = String(notes || '').trim()
    if (!raw) return { subject: '', message: '', history: [] as string[] }

    const blocks = raw.split(/\n{2,}/).map(block => block.trim()).filter(Boolean)
    const subjectBlock = blocks.find(block => /^subject:/i.test(block))
    const subject = subjectBlock?.replace(/^subject:\s*/i, '').trim() || ''
    const history = blocks.filter(block => /^client\s+(approval|query)\s*\(/i.test(block))
    const message = blocks.find(block => block !== subjectBlock && !history.includes(block)) || ''

    if (!subject && !message && /^subject:/i.test(raw)) {
        const [, parsedSubject = '', parsedMessage = ''] = raw.match(/^subject:\s*(.+?)(?:\s+message:\s+|\n+|$)([\s\S]*)/i) || []
        return {
            subject: parsedSubject.trim(),
            message: parsedMessage.trim(),
            history,
        }
    }

    return { subject, message, history }
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <FolderOpen size={30} className="mx-auto mb-3 text-slate-300" />
            <h3 className="font-bold text-slate-700">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    )
}

function DeliveryList({
    items,
    type,
    onApproveClick,
    onQueryClick,
    approvingId,
    submittingQuery,
}: {
    items: Delivery[]
    type: 'incoming' | 'final'
    onApproveClick: (action: DeliveryAction) => void
    onQueryClick: (action: DeliveryAction) => void
    approvingId: number | null
    submittingQuery: boolean
}) {
    if (items.length === 0) {
        return (
            <EmptyState
                title={type === 'incoming' ? 'No incoming data yet' : 'No final delivery yet'}
                description={type === 'incoming' ? 'Raw files for review will appear here.' : 'Final deliverables will appear here when ready.'}
            />
        )
    }

    return (
        <div className="space-y-4">
            {items.map(item => {
                const approved = String(item.status || '').toLowerCase() === 'client_approved'
                const querySlotsLeft = Math.max(0, 2 - Number(item.queryCount || 0))
                const notes = parseDeliveryNotes(item.notes)
                const fileLinks = [
                    { label: 'Photos / Files', url: item.driveLink },
                    { label: 'Videos', url: item.videoDriveLink },
                    { label: 'Drone Photos', url: item.dronePhotoLink },
                    { label: 'Drone Videos', url: item.droneVideoLink },
                ].filter(link => link.url)

                return (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                                    {type === 'incoming' ? <Database size={18} className="text-blue-500" /> : <Film size={18} className="text-purple-500" />}
                                    {type === 'incoming' ? 'Incoming Data for Approval' : 'Final Delivery'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">Review the linked files and respond with approval or a query.</p>
                            </div>
                            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClass(item.status)}`}>
                                {pretty(item.status)}
                            </span>
                        </div>

                        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[180px_1fr]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sent Subject</p>
                                <p className="mt-1 text-sm font-bold text-slate-900">{notes.subject || (type === 'incoming' ? 'Incoming data review' : 'Final delivery review')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                                    {notes.message || 'Review the linked files and approve when everything looks correct.'}
                                </p>
                            </div>
                            {notes.history.length > 0 && (
                                <div className="sm:col-span-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Client Comments</p>
                                    <div className="mt-2 space-y-2">
                                        {notes.history.map((entry, index) => (
                                            <p key={`${item.id}-history-${index}`} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                                                {entry}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {fileLinks.map(link => (
                                <button
                                    key={link.label}
                                    type="button"
                                    onClick={() => window.open(link.url || '', '_blank')}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
                                >
                                    <ExternalLink size={15} />
                                    {link.label}
                                </button>
                            ))}
                            {fileLinks.length === 0 && (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 sm:col-span-2">
                                    No file links were included with this delivery.
                                </div>
                            )}
                        </div>

                        {!approved && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {querySlotsLeft > 0 && (
                                    <button
                                        type="button"
                                        disabled={submittingQuery || approvingId === item.id}
                                        onClick={() => onQueryClick({ delivery: item, type })}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100"
                                    >
                                        <MessageSquare size={16} />
                                        Raise Query ({querySlotsLeft} left)
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={approvingId === item.id || submittingQuery}
                                    onClick={() => onApproveClick({ delivery: item, type })}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <CheckCircle2 size={16} />
                                    {approvingId === item.id ? 'Approving...' : type === 'incoming' ? 'Approve Incoming Data' : 'Approve Final Delivery'}
                                </button>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function DeliveryActionModal({
    mode,
    action,
    comment,
    setComment,
    submitting,
    onClose,
    onSubmit,
}: {
    mode: 'approve' | 'query'
    action: DeliveryAction
    comment: string
    setComment: (value: string) => void
    submitting: boolean
    onClose: () => void
    onSubmit: () => void
}) {
    const isApprove = mode === 'approve'
    const isIncoming = action.type === 'incoming'
    const title = isApprove
        ? isIncoming ? 'Approve Incoming Data' : 'Approve Final Delivery'
        : isIncoming ? 'Raise Query for Incoming Data' : 'Raise Query for Final Delivery'
    const submitLabel = isApprove ? 'Approve Footage' : 'Submit Query'
    const disabled = submitting || (!isApprove && !comment.trim())

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{pretty(action.delivery.deliveryType)}</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
                    </div>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">
                    <label htmlFor={`${mode}-comment`} className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {isApprove ? 'Client comments (optional)' : 'Query comments'}
                    </label>
                    <textarea
                        id={`${mode}-comment`}
                        value={comment}
                        onChange={event => setComment(event.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        placeholder={isApprove ? 'Add any approval notes for the CRM team...' : 'Describe the correction, missing file, or change needed...'}
                    />
                    {!isApprove && !comment.trim() && (
                        <p className="mt-2 text-xs font-semibold text-amber-700">Query comments are required.</p>
                    )}
                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={onSubmit}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        >
                            {isApprove ? <CheckCircle2 size={16} /> : <MessageSquare size={16} />}
                            {submitting ? (isApprove ? 'Approving...' : 'Submitting...') : submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Works() {
    const [works, setWorks] = useState<Work[]>([])
    const [client, setClient] = useState<any>(null)
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedId, setSelectedId] = useState('')
    const [activeTab, setActiveTab] = useState<TabKey>('details')
    const [approvingId, setApprovingId] = useState<number | null>(null)
    const [approvalAction, setApprovalAction] = useState<DeliveryAction | null>(null)
    const [approvalComment, setApprovalComment] = useState('')
    const [queryAction, setQueryAction] = useState<DeliveryAction | null>(null)
    const [queryText, setQueryText] = useState('')
    const [submittingQuery, setSubmittingQuery] = useState(false)

    const selectedWork = useMemo(() => works.find(work => work.id === selectedId) || works[0], [works, selectedId])

    const fetchWorks = async () => {
        const token = localStorage.getItem('ra_token')
        if (!token) return

        setLoading(true)
        setError('')
        try {
            const res = await axios.get(`${API_URL}/works`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.data.success) {
                const data = res.data.data
                setWorks(data.works || [])
                setClient(data.client)
                setSummary(data.summary)
                setSelectedId((current) => current || data.works?.[0]?.id || '')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load works')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWorks()
    }, [])

    const approveDelivery = async () => {
        const token = localStorage.getItem('ra_token')
        if (!token || !approvalAction) return

        const deliveryId = approvalAction.delivery.id
        setApprovingId(deliveryId)
        try {
            const comment = approvalComment.trim()
            await axios.patch(`${API_URL}/deliveries/${deliveryId}/approve`, { comment: comment || undefined }, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setApprovalAction(null)
            setApprovalComment('')
            await fetchWorks()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to approve delivery')
        } finally {
            setApprovingId(null)
        }
    }

    const raiseQuery = async () => {
        const token = localStorage.getItem('ra_token')
        if (!token || !queryAction || !queryText.trim()) return

        setSubmittingQuery(true)
        try {
            await axios.post(`${API_URL}/deliveries/${queryAction.delivery.id}/query`, { queryMessage: queryText.trim() }, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setQueryAction(null)
            setQueryText('')
            await fetchWorks()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit query')
        } finally {
            setSubmittingQuery(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
                <div className="flex items-center gap-2 font-bold"><AlertCircle size={18} /> {error}</div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">Works</h1>
                    <p className="mt-1 text-slate-500">Review assigned work, progress, incoming approvals, and final delivery in one place.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="px-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Works</p>
                        <p className="text-lg font-black text-slate-950">{summary?.totalWorks || 0}</p>
                    </div>
                    <div className="border-l border-slate-100 px-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Incoming</p>
                        <p className="text-lg font-black text-amber-600">{summary?.incomingPending || 0}</p>
                    </div>
                    <div className="border-l border-slate-100 px-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Final</p>
                        <p className="text-lg font-black text-purple-600">{summary?.finalPending || 0}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">Client Work Hub</p>
                <h2 className="mt-2 text-2xl font-black">{client?.name || 'Client'}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-indigo-50">
                    <span className="rounded-full bg-white/10 px-3 py-1">{client?.leadSerialNumber || `Lead #${client?.leadId}`}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{client?.eventType || 'Event'}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">{formatDate(client?.eventDate)}</span>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-bold text-slate-950">Assigned Works</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{works.length}</span>
                    </div>
                    <div className="space-y-3">
                        {works.map(work => {
                            const active = selectedWork?.id === work.id
                            const completed = work.tracking.filter(step => step.status === 'completed').length
                            const total = work.tracking.length || 1
                            return (
                                <button
                                    key={work.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedId(work.id)
                                        setActiveTab('details')
                                    }}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-950">{work.title}</p>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{work.assignedTo?.name || 'Red Angle team'}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(work.status)}`}>
                                            {pretty(work.status)}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="h-2 flex-1 rounded-full bg-slate-100">
                                            <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.round((completed / total) * 100)}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{completed}/{total}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {selectedWork && (
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-6">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-950">{selectedWork.title}</h2>
                                    <p className="mt-1 text-sm text-slate-500">{selectedWork.description}</p>
                                </div>
                                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClass(selectedWork.status)}`}>
                                    {pretty(selectedWork.status)}
                                </span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {tabs.map(tab => {
                                    const Icon = tab.icon
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab.key ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            <Icon size={15} />
                                            {tab.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'details' && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {(() => {
                                        const project = selectedWork.project || {}
                                        const details = [
                                            { label: 'Client', value: project.clientName || client?.name, icon: UserRound },
                                            { label: 'Event', value: project.eventType || client?.eventType || selectedWork.type, icon: FileText },
                                            { label: 'Event Date', value: formatDate(project.eventDate || client?.eventDate), icon: CalendarDays },
                                            { label: 'Current Stage', value: pretty(project.currentStage || client?.currentStage || selectedWork.status), icon: Clock },
                                            { label: 'Assigned to', value: selectedWork.assignedTo?.name, icon: UserRound },
                                            { label: 'Role', value: selectedWork.assignedTo?.role, icon: FileText },
                                            { label: 'Deadline', value: formatDate(selectedWork.deadline), icon: CalendarDays },
                                            { label: 'Priority', value: selectedWork.priority || 'Normal', icon: AlertCircle },
                                            { label: 'Phone', value: project.phone || client?.phone || '-', icon: Phone },
                                            { label: 'Email', value: project.email || client?.email || '-', icon: Mail },
                                            { label: 'Address', value: project.address || client?.address || '-', icon: MapPin },
                                            { label: 'Balance', value: formatMoney(project.balance), icon: WalletCards },
                                        ]

                                        return details.map(item => {
                                            const Icon = item.icon
                                            return (
                                                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                                        <Icon size={14} />
                                                        {item.label}
                                                    </div>
                                                    <p className="break-words font-bold text-slate-950">{item.value || '-'}</p>
                                                </div>
                                            )
                                        })
                                    })()}

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:col-span-2">
                                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Delivery Readiness</p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Database size={16} className="text-blue-500" /> Incoming Data</span>
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                        {selectedWork.project?.deliveryStatus?.incomingTotal || 0} sent
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {selectedWork.project?.deliveryStatus?.incomingPending || 0} pending approval, {selectedWork.project?.deliveryStatus?.incomingApproved || 0} approved
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Film size={16} className="text-purple-500" /> Final Delivery</span>
                                                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                                                        {selectedWork.project?.deliveryStatus?.finalTotal || 0} sent
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {selectedWork.project?.deliveryStatus?.finalPending || 0} pending approval, {selectedWork.project?.deliveryStatus?.finalApproved || 0} approved
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:col-span-2">
                                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Linked Events</p>
                                        {selectedWork.events.length > 0 ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {selectedWork.events.map(event => (
                                                    <div key={event.eventId} className="rounded-xl bg-white p-3 shadow-sm">
                                                        <p className="font-bold text-slate-900">{event.eventName}</p>
                                                        <p className="mt-1 text-sm text-slate-500">{formatDate(event.eventDatetime)} · {pretty(event.status)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">No event linked to this work yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tracking' && (
                                <div className="space-y-4">
                                    {selectedWork.tracking.map((step, index) => {
                                        const done = step.status === 'completed'
                                        const current = step.status === 'in_progress'
                                        return (
                                            <div key={step.label} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${done ? 'bg-emerald-500 text-white' : current ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        {done ? <CheckCircle2 size={18} /> : index + 1}
                                                    </div>
                                                    {index < selectedWork.tracking.length - 1 && <div className="mt-2 h-8 w-0.5 bg-slate-200" />}
                                                </div>
                                                <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="font-bold text-slate-950">{step.label}</p>
                                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(step.status)}`}>{pretty(step.status)}</span>
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {activeTab === 'incoming' && (
                                <DeliveryList
                                    items={selectedWork.incomingData}
                                    type="incoming"
                                    onApproveClick={(action) => {
                                        setApprovalAction(action)
                                        setApprovalComment('')
                                    }}
                                    onQueryClick={(action) => {
                                        setQueryAction(action)
                                        setQueryText('')
                                    }}
                                    approvingId={approvingId}
                                    submittingQuery={submittingQuery}
                                />
                            )}

                            {activeTab === 'final' && (
                                <DeliveryList
                                    items={selectedWork.finalDelivery}
                                    type="final"
                                    onApproveClick={(action) => {
                                        setApprovalAction(action)
                                        setApprovalComment('')
                                    }}
                                    onQueryClick={(action) => {
                                        setQueryAction(action)
                                        setQueryText('')
                                    }}
                                    approvingId={approvingId}
                                    submittingQuery={submittingQuery}
                                />
                            )}
                        </div>
                    </section>
                )}
            </div>

            {approvalAction && (
                <DeliveryActionModal
                    mode="approve"
                    action={approvalAction}
                    comment={approvalComment}
                    setComment={setApprovalComment}
                    submitting={approvingId === approvalAction.delivery.id}
                    onClose={() => {
                        if (approvingId) return
                        setApprovalAction(null)
                        setApprovalComment('')
                    }}
                    onSubmit={approveDelivery}
                />
            )}

            {queryAction && (
                <DeliveryActionModal
                    mode="query"
                    action={queryAction}
                    comment={queryText}
                    setComment={setQueryText}
                    submitting={submittingQuery}
                    onClose={() => {
                        if (submittingQuery) return
                        setQueryAction(null)
                        setQueryText('')
                    }}
                    onSubmit={raiseQuery}
                />
            )}
        </div>
    )
}
