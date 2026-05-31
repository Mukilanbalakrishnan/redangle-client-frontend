import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import axios from 'axios'
// import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const ALL_STEPS = [
    // Phase 1: Onboarding
    { step: 1, phase: 'Onboarding', label: 'Lead', desc: 'Project inquiry created and assigned', status: 'waiting' },
    { step: 2, phase: 'Onboarding', label: 'Quotation', desc: 'Quotation sent for approval', status: 'waiting' },
    { step: 3, phase: 'Onboarding', label: 'Confirmation', desc: 'Quotation approved and advance paid', status: 'waiting' },
    { step: 4, phase: 'Onboarding', label: 'Finalised', desc: 'Project officially finalised for production', status: 'waiting' },

    // Phase 2: Production
    { step: 5, phase: 'Production', label: 'Team Assigned', desc: 'Photographer and videographer assigned for the shoot', status: 'waiting' },
    { step: 6, phase: 'Production', label: 'Outdoor Shoot Tracking', desc: 'Outdoor shoot schedule confirmed and team dispatched', status: 'waiting' },
    { step: 7, phase: 'Production', label: 'Shoot Completed', desc: 'Outdoor shoot completed by assigned team', status: 'waiting' },
    { step: 8, phase: 'Production', label: 'Photographer Upload', desc: 'Raw images uploaded by photographer', status: 'waiting' },
    { step: 9, phase: 'Production', label: 'Videographer Upload', desc: 'Raw videos uploaded by videographer', status: 'waiting' },
    { step: 10, phase: 'Production', label: 'Data Manager Verification', desc: 'Raw images and videos verified by data manager', status: 'waiting' },
    { step: 11, phase: 'Production', label: 'Assigned to CRM', desc: 'Raw data assigned to CRM for editing & quality check', status: 'waiting' },
    { step: 12, phase: 'Production', label: 'CRM Verified', desc: 'CRM team verifies edited content for quality and completeness', status: 'waiting' },
    { step: 13, phase: 'Production', label: 'Pre-production CRM Deliverables', desc: 'CRM prepares and delivers pre-production assets to the client', status: 'waiting' },

    // Phase 3: Deliverables
    { step: 14, phase: 'Deliverables', label: 'Deliverables', desc: 'Final deliverables (Posts, Videos, Candid, Retouch) being processed', status: 'waiting' },
]

const STAGE_ORDER = ['Lead', 'Quotation', 'Confirmation', 'Finalised'];

const stepStyle: any = {
    done: { bg: '#22c55e', text: '#fff' },
    in_progress: { bg: '#fbbf24', text: '#fff' },
    reupload: { bg: '#fbbf24', text: '#fff' },
    waiting: { bg: '#e5e7eb', text: '#9ca3af' },
}

const stepBadge: any = {
    done: { bg: '#dcfce7', color: '#16a34a', label: 'Done' },
    in_progress: { bg: '#fef3c7', color: '#d97706', label: 'In Progress' },
    reupload: { bg: '#fef3c7', color: '#d97706', label: 'Re-upload' },
    waiting: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
}

const deliverableEmployees: Record<string, { name: string; role: string; status: string }[]> = {
    'Save the Date Post': [
        { name: 'Kavitha Rao', role: 'Designer', status: 'Designing post layout' },
        { name: 'Arjun Nair', role: 'Editor', status: 'Color correction' },
    ],
    'Save the Date Video': [
        { name: 'Vikram Sinha', role: 'Video Editor', status: 'Editing highlight clips' },
        { name: 'Sneha Mehta', role: 'CRM Manager', status: 'Reviewing draft video' },
    ],
    'Candid': [
        { name: 'Rahul Kumar', role: 'Photographer', status: 'Selecting best candid shots' },
        { name: 'Priya Desai', role: 'Assistant', status: 'Organizing image files' },
    ],
    'Retouch': [
        { name: 'Kavitha Rao', role: 'Photo Editor', status: 'Skin retouching and color grading' },
    ],
}

export default function Tracker() {
    const [expandedStep, setExpandedStep] = useState<number | null>(null)
    const [clientInfo, setClientInfo] = useState<any>({ name: 'Loading...', event: 'Loading...', eventDate: '-', leadFollowedBy: '-' })
    const [loading, setLoading] = useState(true)

    const [stepStatuses, setStepStatuses] = useState<Record<string, 'waiting'|'in_progress'|'reupload'|'done'>>({})
    const [doneSteps, setDoneSteps] = useState<string[]>([])
    const [teamAssigned, setTeamAssigned] = useState<any[]>([])
    const [dynamicDeliverableEmployees, setDynamicDeliverableEmployees] = useState<Record<string, any[]>>({})

    // const navigate = useNavigate()

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const token = localStorage.getItem('ra_token')
                if(!token) return
                
                const res = await axios.get(`${API_URL}/client-auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if(res.data.success) {
                    const lead = res.data.data;
                    setClientInfo({
                        name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Client',
                        event: lead.eventType || 'Event',
                        eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString() : 'TBD',
                        leadFollowedBy: lead.leadFollowedBy || 'Not Assigned'
                    });

                    let calculatedStatuses: Record<string, 'waiting'|'in_progress'|'reupload'|'done'> = {};
                    ALL_STEPS.forEach(s => calculatedStatuses[s.label] = 'waiting');

                    // Phase 1: Onboarding logic
                    let calculatedDoneSteps: string[] = [];

                    // Phase 1: Onboarding logic based on LeadStage enum
                    const stage = lead.currentStage;
                    const index = STAGE_ORDER.indexOf(stage);
                    const currentStageIndex = index !== -1 ? index : 0;
                    
                    for (let i = 0; i <= currentStageIndex; i++) {
                        calculatedStatuses[STAGE_ORDER[i]] = 'done';
                    }
                    if (currentStageIndex < STAGE_ORDER.length - 1) {
                         calculatedStatuses[STAGE_ORDER[currentStageIndex + 1]] = 'in_progress';
                    // Mark all stages up to the current stage index as done
                    for (let i = 0; i <= currentStageIndex; i++) {
                        calculatedDoneSteps.push(STAGE_ORDER[i]);
                    }

                    let team: any[] = [];
                    const isProjectComplete = currentStageIndex === STAGE_ORDER.length - 1; // Finalised
                    
                    if (isProjectComplete) {
                        // Team Assigned
                        if (lead.leadEmployee && lead.leadEmployee.length > 0) {
                            const hasProductionTeam = lead.leadEmployee.some((le: any) => {
                                const t = le.taskName?.toLowerCase() || '';
                                return !t.includes('post') && !t.includes('video') && !t.includes('retouch') && !t.includes('candid');
                            });
                            
                            if (hasProductionTeam) {
                                calculatedStatuses['Team Assigned'] = 'done';
                            } else {
                                calculatedStatuses['Team Assigned'] = 'in_progress';
                            }

                    // Phase 2: Production logic
                    if (isProjectComplete) {
                        if (lead.leadEmployee && lead.leadEmployee.length > 0) {
                            calculatedDoneSteps.push('Team Assigned');
                            team = lead.leadEmployee.map((le: any) => ({
                                name: `${le.employee?.firstName || ''} ${le.employee?.lastName || ''}`.trim(),
                                role: le.employee?.position || 'Team Member',
                                date: new Date(le.createdAt).toLocaleDateString(),
                                notes: le.taskName || 'Assigned to shoot',
                                uiColor: 'done' // standard production team
                            }));
                        } else {
                            calculatedStatuses['Team Assigned'] = 'in_progress';
                        }

                        if (calculatedStatuses['Team Assigned'] === 'done') {
                            if (lead.events && lead.events.length > 0) {
                                const hasCompleted = lead.events.some((e: any) => e.status === 'completed' || e.status === 'approved');
                                const hasInProgress = lead.events.some((e: any) => e.status === 'inprogress');
                                
                                if (hasCompleted) {
                                    calculatedStatuses['Outdoor Shoot Tracking'] = 'done';
                                    calculatedStatuses['Shoot Completed'] = 'done';
                                } else if (hasInProgress) {
                                    calculatedStatuses['Outdoor Shoot Tracking'] = 'in_progress';
                                    calculatedStatuses['Shoot Completed'] = 'waiting';
                                } else {
                                    calculatedStatuses['Outdoor Shoot Tracking'] = 'in_progress';
                                }
                            } else {
                                calculatedStatuses['Outdoor Shoot Tracking'] = 'in_progress';
                            }
                        }

                        if (calculatedStatuses['Shoot Completed'] === 'done') {
                            const photoDelivery = lead.clientDeliveries?.find((cd: any) => cd.deliveryType.toLowerCase().includes('raw image'));
                            const videoDelivery = lead.clientDeliveries?.find((cd: any) => cd.deliveryType.toLowerCase().includes('raw video'));
                            
                            if (photoDelivery) {
                                const status = photoDelivery.status.toLowerCase();
                                if (status === 'rework') calculatedStatuses['Photographer Upload'] = 'reupload';
                                else if (['completed', 'approved', 'verified'].includes(status)) calculatedStatuses['Photographer Upload'] = 'done';
                                else calculatedStatuses['Photographer Upload'] = 'in_progress';
                            } else {
                                calculatedStatuses['Photographer Upload'] = 'in_progress';
                            }

                            if (videoDelivery) {
                                const status = videoDelivery.status.toLowerCase();
                                if (status === 'rework') calculatedStatuses['Videographer Upload'] = 'reupload';
                                else if (['completed', 'approved', 'verified'].includes(status)) calculatedStatuses['Videographer Upload'] = 'done';
                                else calculatedStatuses['Videographer Upload'] = 'in_progress';
                            } else {
                                calculatedStatuses['Videographer Upload'] = 'in_progress';
                            }
                        }

                        if (calculatedStatuses['Photographer Upload'] === 'done' || calculatedStatuses['Videographer Upload'] === 'done') {
                            const isAllUploadedDone = (calculatedStatuses['Photographer Upload'] === 'done' || calculatedStatuses['Photographer Upload'] === 'waiting') && 
                                                      (calculatedStatuses['Videographer Upload'] === 'done' || calculatedStatuses['Videographer Upload'] === 'waiting');
                            if (isAllUploadedDone) {
                                calculatedStatuses['Data Manager Verification'] = 'in_progress';
                            }
                        }

                        const crmTasks = lead.leadEmployee?.filter((le: any) => 
                                notes: le.taskName || 'Assigned to shoot'
                            }));
                        }
                        
                        if (lead.events && lead.events.length > 0) {
                            calculatedDoneSteps.push('Outdoor Shoot Tracking');
                            if (lead.events.some((e: any) => e.status === 'completed' || e.status === 'approved')) {
                                calculatedDoneSteps.push('Shoot Completed', 'Photographer Upload', 'Videographer Upload', 'Data Manager Verification', 'Assigned to CRM');
                            }
                        }

                        // Complete 'Work Status' if CRM tasks exist
                        const hasCrmTasks = lead.leadEmployee?.some((le: any) => 
                            le.taskName && (le.taskName.toLowerCase().includes('retouch') || 
                                            le.taskName.toLowerCase().includes('post') || 
                                            le.taskName.toLowerCase().includes('video') || 
                                            le.taskName.toLowerCase().includes('candid'))
                        ) || [];
                        
                        if (crmTasks.length > 0) {
                            calculatedStatuses['Data Manager Verification'] = 'done';
                            calculatedStatuses['Assigned to CRM'] = 'done';
                            calculatedStatuses['Pre-production CRM Deliverables'] = 'in_progress';
                        } else if (calculatedStatuses['Data Manager Verification'] === 'in_progress') {
                            calculatedStatuses['Assigned to CRM'] = 'in_progress';
                        }
                    }

                    let delivMap: Record<string, any[]> = {};
                    if (lead.leadEmployee && lead.leadEmployee.length > 0) {
                        let crmTaskCount = 0;
                        let crmDoneCount = 0;

                        lead.leadEmployee.forEach((le: any) => {
                            if (!le.taskName) return;
                            const tName = le.taskName.toLowerCase();
                            
                            let category = '';
                            if (tName.includes('post') || tName.includes('save the date')) category = 'Save the Date Post';
                            else if (tName.includes('video') || tName.includes('teaser')) category = 'Save the Date Video';
                            else if (tName.includes('candid') || tName.includes('photo')) category = 'Candid';
                            else if (tName.includes('retouch') || tName.includes('edit')) category = 'Retouch';

                            if (category) {
                                crmTaskCount++;
                                const relatedDelivery = lead.clientDeliveries?.find((cd: any) => cd.deliveryType.toLowerCase().includes(category.toLowerCase()));
                                const statusFromDb = relatedDelivery ? relatedDelivery.status.toLowerCase() : 'pending';
                                
                                let mappedStatus = 'Pending';
                                let uiColor = 'in_progress';
                                
                                if (['completed', 'approved', 'verified'].includes(statusFromDb)) {
                                    mappedStatus = 'Completed';
                                    uiColor = 'done';
                                    crmDoneCount++;
                                } else if (statusFromDb === 'rework') {
                                    mappedStatus = 'Re-upload';
                                    uiColor = 'reupload';
                                }

                                const empDetail = {
                                    name: `${le.employee?.firstName || ''} ${le.employee?.lastName || ''}`.trim(),
                                    role: le.employee?.position || 'Team Member',
                                    status: mappedStatus,
                                    uiColor: uiColor,
                                    date: new Date(le.createdAt).toLocaleDateString(),
                                    notes: le.description || `Assigned for ${le.taskName}`,
                                    category: category
                                };

                                if (!delivMap[category]) delivMap[category] = [];
                                delivMap[category].push(empDetail);
                            }
                        });

                        if (crmTaskCount > 0) {
                            if (crmDoneCount === crmTaskCount) {
                                calculatedStatuses['CRM Verified'] = 'done';
                                calculatedStatuses['Pre-production CRM Deliverables'] = 'done';
                                calculatedStatuses['Deliverables'] = 'done';
                            } else {
                                const hasRework = Object.values(delivMap).flat().some(emp => emp.uiColor === 'reupload');
                                if (hasRework) {
                                    calculatedStatuses['Deliverables'] = 'reupload';
                                    calculatedStatuses['Pre-production CRM Deliverables'] = 'reupload';
                                } else {
                                    calculatedStatuses['Deliverables'] = 'in_progress';
                                }
                            }
                        }
                    }

                    setStepStatuses(calculatedStatuses);

                        )
                        
                        if (hasCrmTasks && calculatedDoneSteps.includes('Assigned to CRM')) {
                            calculatedDoneSteps.push('CRM Verified', 'Pre-production CRM Deliverables');
                        }
                    }

                    // Phase 3: Deliverables logic
                    let delivMap: Record<string, any[]> = {};
                    if (lead.leadEmployee && lead.leadEmployee.length > 0) {
                        lead.leadEmployee.forEach((le: any) => {
                            if (!le.taskName) return;
                            const tName = le.taskName.toLowerCase();
                            const empDetail = {
                                name: `${le.employee?.firstName || ''} ${le.employee?.lastName || ''}`.trim(),
                                role: le.employee?.position || 'Team Member',
                                status: `Working on ${le.taskName}`,
                                date: new Date(le.createdAt).toLocaleDateString(),
                                notes: `Assigned for ${le.taskName}`,
                                category: ''
                            };

                            if (tName.includes('post') || tName.includes('save the date')) {
                                empDetail.category = 'Save the Date Post'
                                if (!delivMap['Save the Date Post']) delivMap['Save the Date Post'] = [];
                                delivMap['Save the Date Post'].push(empDetail);
                            }
                            if (tName.includes('video') || tName.includes('teaser')) {
                                empDetail.category = 'Save the Date Video'
                                if (!delivMap['Save the Date Video']) delivMap['Save the Date Video'] = [];
                                delivMap['Save the Date Video'].push(empDetail);
                            }
                            if (tName.includes('candid') || tName.includes('photo')) {
                                empDetail.category = 'Candid'
                                if (!delivMap['Candid']) delivMap['Candid'] = [];
                                delivMap['Candid'].push(empDetail);
                            }
                            if (tName.includes('retouch') || tName.includes('edit')) {
                                empDetail.category = 'Retouch'
                                if (!delivMap['Retouch']) delivMap['Retouch'] = [];
                                delivMap['Retouch'].push(empDetail);
                            }
                        })
                    }

                    // If work status is complete, and we have ANY deliverable assignment, 
                    // we mark 'Deliverables' as done. 
                    // Wait, maybe we just mark it done if assignmentCount >= 4, 
                    // or in progress if it's < 4? Let's just say it's done if there are 4 types.
                    if (calculatedDoneSteps.includes('Pre-production CRM Deliverables')) {
                        const assignmentCount = Object.keys(delivMap).length;
                        if (assignmentCount >= 4) {
                            calculatedDoneSteps.push('Deliverables');
                        }
                    }

                    setDoneSteps(calculatedDoneSteps);
                    setTeamAssigned(team);
                    setDynamicDeliverableEmployees(delivMap);
                }
            } catch (err) {
                console.error("Failed to load client tracker data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchClientData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#5B5FC7] border-t-transparent" />
            </div>
        )
    }

    const doneCount = Object.values(stepStatuses).filter(v => v === 'done').length;
    const progressPct = Math.round((doneCount / ALL_STEPS.length) * 100);
    const progressPct = Math.round((doneSteps.length / ALL_STEPS.length) * 100)

    const getStageEmployees = (label: string) => {
        if (label === 'Team Assigned') return teamAssigned;
        if (label === 'Deliverables') {
            // Aggregate all deliverable employees
            let all: any[] = [];
            const categories = ['Save the Date Post', 'Save the Date Video', 'Candid', 'Retouch'];
            categories.forEach(cat => {
                const arr = dynamicDeliverableEmployees[cat] || [];
                const arr = dynamicDeliverableEmployees[cat] || deliverableEmployees[cat] || [];
                arr.forEach(emp => {
                    all.push({ ...emp, category: cat });
                });
            });
            return all;
        }
        if (STAGE_ORDER.includes(label) && label === 'Lead') {
            return [{
                name: clientInfo.leadFollowedBy,
                role: 'Sales Executive',
                date: clientInfo.eventDate,
                notes: 'Lead Manager assigned to you'
            }];
        }
        return [];
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Production Tracker</h1>
                    <p className="text-slate-500 mt-1">Unified view of your project lifecycle.</p>
                </div>
            </div>

            {/* Active Client Banner */}
            <div className="rounded-2xl p-5 mb-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
                <div className="font-bold text-lg mb-1">{clientInfo.name}</div>
                <div className="flex items-center gap-3 text-sm" style={{ opacity: 0.9 }}>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{clientInfo.event}</span>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>📅 {clientInfo.eventDate}</span>
                </div>
            </div>

            {/* Unified Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-lg font-bold text-slate-900">Project Status</p>
                    <div className="flex items-center gap-3 w-1/2 justify-end">
                        <div className="w-full max-w-[200px] h-2.5 rounded-full" style={{ background: '#F3F4F6' }}>
                            <div className="h-2.5 rounded-full transition-all duration-500 ease-out" style={{ background: '#22c55e', width: `${progressPct}%` }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>{doneCount}/{ALL_STEPS.length}</span>
                        <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>{doneSteps.length}/{ALL_STEPS.length}</span>
                    </div>
                </div>

                <div className="relative">
                    {ALL_STEPS.map((s, i) => {
                        const stepStatus = stepStatuses[s.label] || 'waiting';
                        const isDone = doneSteps.includes(s.label)
                        const isCurrent = i === doneSteps.length
                        const isReupload = isCurrent && s.label === 'Videographer Upload'; // example static logic if needed
                        
                        let stepStatus = 'waiting'
                        if (isDone) stepStatus = 'done'
                        else if (isReupload) stepStatus = 'reupload'
                        else if (isCurrent) stepStatus = 'in_progress'

                        const isExpanded = expandedStep === i
                        const employees = getStageEmployees(s.label)

                        // Visual groupings
                        const showPhaseHeader = i === 0 || s.phase !== ALL_STEPS[i - 1].phase;

                        return (
                            <div key={i}>
                                {showPhaseHeader && (
                                    <div className="flex items-center gap-4 mt-6 mb-4">
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.phase} Phase</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>
                                )}
                                <div className="flex gap-4 mb-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white`}
                                            style={{ background: stepStyle[stepStatus].bg, color: stepStyle[stepStatus].text }}>
                                            {stepStatus === 'done' ? '✓' : stepStatus === 'reupload' ? '↺' : s.step}
                                        </div>
                                        {i < ALL_STEPS.length - 1 && <div className="w-0.5 mt-2" style={{ background: '#E5E7EB', minHeight: isExpanded ? '100%' : '24px' }} />}
                                    </div>
                                    <div className="flex-1 mt-0.5">
                                        <div
                                            className="bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md border border-slate-100"
                                            style={{ border: isExpanded ? '1px solid #c4b5fd' : undefined }}
                                            onClick={() => setExpandedStep(isExpanded ? null : i)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Step {s.step}</span>
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: stepBadge[stepStatus].bg, color: stepBadge[stepStatus].color }}>
                                                        {stepBadge[stepStatus].label}
                                                    </span>
                                                </div>
                                                <ChevronDown
                                                    size={16}
                                                    style={{
                                                        color: '#9CA3AF',
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                />
                                            </div>
                                            <p className="text-base font-bold text-slate-900">{s.label}</p>
                                            <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="mt-3 rounded-xl p-5 shadow-inner" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                                                {employees.length === 0 ? (
                                                    <p className="text-sm italic" style={{ color: '#9CA3AF' }}>No team data or additional details available for this stage.</p>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="text-sm font-bold" style={{ color: '#5B5FC7' }}>👥 Assigned Team</span>
                                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                                                {employees.length} {employees.length === 1 ? 'member' : 'members'}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {employees.map((emp: any, ei: number) => (
                                                                <div key={ei} className="flex items-start gap-4 rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #f3f4f6' }}>
                                                                    <div
                                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                                                                        style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                                                    >
                                                                        {emp.name.charAt(0)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-bold" style={{ color: '#111827' }}>{emp.name}</span>
                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: '#f3f4f6', color: '#6B7280' }}>{emp.role}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${emp.uiColor === 'done' ? 'bg-green-500' : emp.uiColor === 'reupload' ? 'bg-yellow-500' : emp.uiColor === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                                                                            <p className="text-sm" style={{ color: '#6B7280' }}>{emp.status || emp.notes}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 mt-2">
                                                                        <p className="text-sm mb-1" style={{ color: '#6B7280' }}>{emp.status || emp.notes}</p>
                                                                        <div className="flex items-center gap-3">
                                                                           <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>📅 {emp.date || 'TBD'}</p>
                                                                           {emp.category && (
                                                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                                                                {emp.category}
                                                                              </span>
                                                                           )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
