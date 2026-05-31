import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import gsap from 'gsap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function SetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    // Animation Ref
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing setup token. Please use the link provided in your email.");
        }
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
        );
    }, [token])

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        
        if (!token) {
            setError("Missing token. Cannot secure account.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true)

        try {
            const res = await axios.post(`${API_URL}/client-auth/set-password`, {
                token,
                newPassword: password,
            })

            if (res.data.success) {
                setSuccess(true)
                const { token: jwtToken, user, data } = res.data
                // Use data or user struct depending on what is returned 
                const authData = data || user
                if (jwtToken && authData) {
                    localStorage.setItem('ra_token', jwtToken)
                    localStorage.setItem('ra_user', JSON.stringify(authData))
                } else if (res.data.data.token) {
                    localStorage.setItem('ra_token', res.data.data.token)
                    localStorage.setItem('ra_user', JSON.stringify(res.data.data))
                }

                setTimeout(() => {
                    navigate('/client/dashboard')
                }, 2000)
            } else {
                setError(res.data.message || 'Failed to setup password.')
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Unable to connect to server. Ensure link is valid.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const Spinner = () => (
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
        </svg>
    )
    const hexPattern = `url("data:image/svg+xml,%3Csvg width='60' height='103.92305' viewBox='0 0 60 103.92305' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92305L0 86.60254V51.96152L30 34.64102l30 17.3205v34.64102L30 103.92305zM30 0l30 17.32051v34.64102M0 17.32051L30 0 M0 51.96152V17.32051' fill='none' stroke='%23e9d5ff' stroke-width='2' stroke-opacity='0.6'/%3E%3C/svg%3E")`;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans"
            style={{
                backgroundColor: '#faf5ff',
                backgroundImage: hexPattern,
                backgroundSize: '100px 173.205px',
                backgroundPosition: 'center'
            }}
        >
            <div className="w-full max-w-[420px] grid grid-cols-1 gap-12 relative z-10">
                <div className="flex items-center justify-center">
                    <div
                        ref={cardRef}
                        className="w-full bg-white rounded-[1.75rem] p-8 shadow-[0_20px_60px_-15px_rgba(109,40,217,0.15)] relative border border-white/60"
                    >
                        <div className="flex items-center justify-center mb-8">
                            <img src="/red_angle_logo.png" alt="RED ANGLE STUDIO" className="h-[40px] w-auto object-contain" />
                        </div>

                        {success ? (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Account Secured!</h3>
                                <p className="text-sm text-slate-500 mb-6">Your password is set and you are now logged in securely.</p>
                                <p className="text-xs text-slate-400">Redirecting to your dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-slate-900 text-center">Setup Password</h2>
                                <p className="text-sm text-slate-500 mt-2 mb-8 text-center">Secure your new client account to continue</p>

                                <form onSubmit={handleSetPassword} className="space-y-5">
                                    {error && (
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                                            <AlertCircle size={16} className="shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2 relative">
                                        <label className="block text-xs font-semibold text-slate-700">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                disabled={!token}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className="w-full pl-4 pr-12 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 font-medium tracking-widest focus:tracking-normal"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            required
                                            disabled={!token}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full px-4 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400 font-medium tracking-widest focus:tracking-normal"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !token}
                                        className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                                    >
                                        {loading ? <><Spinner /> Securing...</> : 'Set Password'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
