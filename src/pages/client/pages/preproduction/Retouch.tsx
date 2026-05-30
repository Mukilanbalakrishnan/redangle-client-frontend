import { useState } from 'react';
import { ExternalLink, Send, Scissors } from 'lucide-react';
import { toast } from 'sonner';

export default function Retouch() {
    const [retouchCount, setRetouchCount] = useState('');
    const [imageNumbers, setImageNumbers] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardcoded link for UI demonstration
    const driveLink = "https://drive.google.com/drive/folders/sample-raw-data-link";

    const handleSendToEditor = () => {
        if (!retouchCount.trim()) {
            toast.error("Please specify how many photos you need retouched.");
            return;
        }
        if (!imageNumbers.trim()) {
            toast.error("Please enter the image numbers.");
            return;
        }
        
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            toast.success("Retouch details sent to the editor successfully!");
            setRetouchCount('');
            setImageNumbers('');
            setIsSubmitting(false);
        }, 1000);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Retouch Selection</h1>
                    <p className="text-slate-500 mt-1">Review raw data and provide instructions for photo retouching.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Drive Link */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Scissors size={100} />
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                        Raw Data Link
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        Review the uploaded raw photos to select which ones you want professionally retouched.
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

                {/* Section 2: Quantity Input */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                        Retouch Quantity
                    </h2>
                    <p className="text-sm text-slate-500 mb-6 flex-1">
                        How many photos do you need retouched? (e.g., 15, 20)
                    </p>

                    <div className="mt-auto">
                        <input 
                            type="text"
                            value={retouchCount}
                            onChange={(e) => setRetouchCount(e.target.value)}
                            placeholder="Enter number (e.g., 15 to 20)"
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm text-slate-700 outline-none"
                        />
                    </div>
                </div>

                {/* Section 3: Image Selection */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                        Submit Image Numbers
                    </h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Type the file numbers of the images you want to be retouched based on your quantity above.
                    </p>

                    <div className="flex-1 flex flex-col">
                        <textarea 
                            value={imageNumbers}
                            onChange={(e) => setImageNumbers(e.target.value)}
                            placeholder="Enter image numbers here...&#10;Example: IMG_1405, IMG_1406, IMG_1410"
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
