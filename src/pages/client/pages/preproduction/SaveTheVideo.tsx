import { useState } from 'react';
import { ExternalLink, Send, Video as VideoIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SaveTheVideo() {
    const [referenceLink, setReferenceLink] = useState('');
    const [videoNumbers, setVideoNumbers] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardcoded link for UI demonstration
    const driveLink = "https://drive.google.com/drive/folders/sample-raw-video-data-link";

    const handleSendToEditor = () => {
        if (!videoNumbers.trim()) {
            toast.error("Please enter video clip numbers first.");
            return;
        }
        
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            toast.success("Details sent to the editor successfully!");
            setReferenceLink('');
            setVideoNumbers('');
            setIsSubmitting(false);
        }, 1000);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Save the Video</h1>
                    <p className="text-slate-500 mt-1">Review raw video data and provide references for your Save the Date video.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Drive Link */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <VideoIcon size={100} />
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                        Raw Data Link
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Your production team has uploaded the raw video clips. Please review them using the secure link below.
                    </p>
                    
                    <a 
                        href={driveLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all text-indigo-700 font-medium text-sm mt-auto"
                    >
                        <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                <ExternalLink size={16} className="text-indigo-600" />
                            </div>
                            <span className="truncate">View on Google Drive</span>
                        </div>
                    </a>
                </div>

                {/* Section 2: Reference Link Input */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <LinkIcon size={100} />
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                        Reference Style
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Paste a link to any reference videos or Instagram reels you want the editor to match.
                    </p>

                    <div className="mt-auto">
                        <input 
                            type="text"
                            value={referenceLink}
                            onChange={(e) => setReferenceLink(e.target.value)}
                            placeholder="Paste reference link here (optional)..."
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm text-slate-700 outline-none"
                        />
                    </div>
                </div>

                {/* Section 3: Video Selection */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                        Submit Selection
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Type the file numbers of the video clips you'd like us to use for the Save the Date video (e.g., VID_2042, VID_2088).
                    </p>

                    <div className="flex-1 flex flex-col">
                        <textarea 
                            value={videoNumbers}
                            onChange={(e) => setVideoNumbers(e.target.value)}
                            placeholder="Enter video clip numbers here...&#10;Example: 2405, 2406, 2410"
                            className="w-full flex-1 min-h-[120px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none text-sm text-slate-700 mb-4 outline-none"
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSendToEditor}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B5FC7] text-white font-bold text-sm hover:bg-[#4f46e5] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                                Send to Editor
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
