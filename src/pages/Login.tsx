import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, Mail, KeyRound, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import gsap from 'gsap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type ForgotStep = 'email' | 'otp' | 'reset' | 'success'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Forgot password state
    const [showForgot, setShowForgot] = useState(false)
    const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
    const [forgotEmail, setForgotEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [forgotError, setForgotError] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    // Animation Ref
    const cardRef = useRef<HTMLDivElement>(null)
    const leftContentRef = useRef<HTMLDivElement>(null)
    const girlRef = useRef<HTMLImageElement>(null)
    const flashRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Simple entrance animation
        gsap.fromTo(leftContentRef.current,
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }
        );
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
        );

        // Camera zoom & flash effect
        const timer1 = setTimeout(() => {
            if (girlRef.current) {
                girlRef.current.style.transform = "scale(1.1)";
            }

            const timer2 = setTimeout(() => {
                if (flashRef.current) {
                    flashRef.current.style.opacity = "1";
                }

                const timer3 = setTimeout(() => {
                    if (flashRef.current) {
                        flashRef.current.style.opacity = "0";
                    }
                }, 200);

                return () => clearTimeout(timer3);
            }, 500);

            return () => clearTimeout(timer2);
        }, 2000);

        return () => clearTimeout(timer1);
    }, [])

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('ra_token')
        const userStr = localStorage.getItem('ra_user')
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr)
                
                // If user doesn't have the client role, clear their token to prevent accessing the portal with a wrong role.
                if (user.role && user.role !== 'client') {
                    localStorage.removeItem('ra_token')
                    localStorage.removeItem('ra_user')
                    return
                }

                // If user is a client, safely navigate to their redirect path or dashboard.
                if (user.redirectPath && user.redirectPath.startsWith('/client')) {
                    navigate(user.redirectPath)
                } else {
                    navigate('/client/dashboard')
                }
            } catch (e) {
                console.error("Failed to parse user data", e)
            }
        }
    }, [navigate])

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await axios.post(`${API_URL}/client-auth/login`, {
                email: email.toLowerCase().trim(),
                password,
            })

            if (res.data.success) {
                const { token, redirectPath } = res.data.data
                const authData = res.data.data
                
                localStorage.setItem('ra_token', token)
                localStorage.setItem('ra_user', JSON.stringify(authData))
                navigate(redirectPath || '/client/dashboard')
            } else {
                setError(res.data.message || 'Login failed. Please try again.')
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Unable to connect to server. Please try again.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    // ─── Forgot Password Handlers ────────────────────────────

    const openForgotPassword = () => {
        setShowForgot(true)
        setForgotStep('email')
        setForgotEmail('')
        setOtp(['', '', '', '', '', ''])
        setNewPassword('')
        setConfirmPassword('')
        setForgotError('')
        setCountdown(0)
    }

    const closeForgotPassword = () => {
        setShowForgot(false)
        setForgotError('')
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setForgotError('')
        setForgotLoading(true)

        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, {
                email: forgotEmail.toLowerCase().trim(),
            })

            if (res.data.success) {
                setForgotStep('otp')
                setCountdown(300) // 5 minutes
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
            } else {
                setForgotError(res.data.message)
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // only digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // single digit only
        setOtp(newOtp)
        setForgotError('')

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length === 6) {
            setOtp(pasted.split(''))
            otpRefs.current[5]?.focus()
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            setForgotError('Please enter all 6 digits')
            return
        }

        setForgotError('')
        setForgotLoading(true)

        try {
            const res = await axios.post(`${API_URL}/auth/verify-otp`, {
                email: forgotEmail.toLowerCase().trim(),
                otp: otpCode,
            })

            if (res.data.success) {
                setForgotStep('reset')
            } else {
                setForgotError(res.data.message)
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Invalid or expired OTP.')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword.length < 6) {
            setForgotError('Password must be at least 6 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            setForgotError('Passwords do not match')
            return
        }

        setForgotError('')
        setForgotLoading(true)

        try {
            const res = await axios.post(`${API_URL}/auth/reset-password`, {
                email: forgotEmail.toLowerCase().trim(),
                newPassword,
            })

            if (res.data.success) {
                setForgotStep('success')
            } else {
                setForgotError(res.data.message)
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Password reset failed.')
        } finally {
            setForgotLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (countdown > 0) return
        setForgotError('')
        setForgotLoading(true)
        setOtp(['', '', '', '', '', ''])

        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, {
                email: forgotEmail.toLowerCase().trim(),
            })

            if (res.data.success) {
                setCountdown(300)
                setTimeout(() => otpRefs.current[0]?.focus(), 100)
            } else {
                setForgotError(res.data.message)
            }
        } catch (err: any) {
            setForgotError(err.response?.data?.message || 'Failed to resend OTP.')
        } finally {
            setForgotLoading(false)
        }
    }

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // Step indicator
    const steps: { key: ForgotStep; label: string; icon: typeof Mail }[] = [
        { key: 'email', label: 'Email', icon: Mail },
        { key: 'otp', label: 'Verify', icon: ShieldCheck },
        { key: 'reset', label: 'Reset', icon: KeyRound },
    ]
    const stepIndex = steps.findIndex(s => s.key === forgotStep)

    // Spinner SVG
    const Spinner = () => (
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
        </svg>
    )

    // ─── Forgot Password Card Content ────────────────────────

    const renderForgotContent = () => {
        if (forgotStep === 'success') {
            return (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h3>
                    <p className="text-sm text-slate-500 mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
                    <button
                        onClick={closeForgotPassword}
                        className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                    >
                        Back to Sign In
                    </button>
                </div>
            )
        }

        return (
            <>
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((step, i) => {
                        const Icon = step.icon
                        const isActive = i === stepIndex
                        const isDone = i < stepIndex
                        return (
                            <div key={step.key} className="flex items-center gap-2">
                                {i > 0 && (
                                    <div className={`w-8 h-0.5 rounded ${isDone ? 'bg-purple-500' : 'bg-slate-200'}`} />
                                )}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                    isActive ? 'bg-purple-100 text-purple-700' : isDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    <Icon size={13} />
                                    {step.label}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Error Alert */}
                {forgotError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100 mb-5">
                        <AlertCircle size={16} className="shrink-0" />
                        {forgotError}
                    </div>
                )}

                {/* Step 1: Email */}
                {forgotStep === 'email' && (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Forgot your password?</h3>
                            <p className="text-sm text-slate-500 mt-1">Enter your registered email to receive an OTP</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                            <input
                                type="email"
                                required
                                value={forgotEmail}
                                onChange={e => { setForgotEmail(e.target.value); setForgotError('') }}
                                placeholder="name@example.com"
                                autoFocus
                                className="w-full px-4 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={forgotLoading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                        >
                            {forgotLoading ? <><Spinner /> Sending OTP...</> : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {forgotStep === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Enter verification code</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                We sent a 6-digit code to <span className="font-semibold text-purple-600">{forgotEmail}</span>
                            </p>
                        </div>

                        {/* OTP Inputs */}
                        <div className="flex justify-center gap-2.5">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    onPaste={i === 0 ? handleOtpPaste : undefined}
                                    className="w-11 h-13 text-center text-xl font-bold bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-slate-900 transition-all outline-none"
                                />
                            ))}
                        </div>

                        {/* Timer & Resend */}
                        <div className="text-center">
                            {countdown > 0 ? (
                                <p className="text-xs text-slate-500">
                                    OTP expires in <span className="font-semibold text-purple-600">{formatCountdown(countdown)}</span>
                                </p>
                            ) : (
                                <p className="text-xs text-red-500 font-medium">OTP expired</p>
                            )}
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={forgotLoading || countdown > 240}
                                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors mt-1 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                {countdown > 240 ? `Resend in ${formatCountdown(countdown - 240)}` : 'Resend OTP'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={forgotLoading || otp.join('').length !== 6}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                        >
                            {forgotLoading ? <><Spinner /> Verifying...</> : 'Verify OTP'}
                        </button>
                    </form>
                )}

                {/* Step 3: New Password */}
                {forgotStep === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="text-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Set new password</h3>
                            <p className="text-sm text-slate-500 mt-1">Create a strong password for your account</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setForgotError('') }}
                                    placeholder="Min. 6 characters"
                                    autoFocus
                                    className="w-full pl-4 pr-12 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors bg-white px-2 py-1 rounded-md shadow-sm border border-slate-200"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={e => { setConfirmPassword(e.target.value); setForgotError('') }}
                                placeholder="Re-enter your password"
                                className="w-full px-4 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400"
                            />
                        </div>

                        {/* Password match indicator */}
                        {confirmPassword && (
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                {newPassword === confirmPassword ? (
                                    <><CheckCircle2 size={13} /> Passwords match</>
                                ) : (
                                    <><AlertCircle size={13} /> Passwords do not match</>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={forgotLoading}
                            className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                        >
                            {forgotLoading ? <><Spinner /> Resetting...</> : 'Reset Password'}
                        </button>
                    </form>
                )}
            </>
        )
    }

    // Hexagon outline pattern for background
    const hexPattern = `url("data:image/svg+xml,%3Csvg width='60' height='103.92305' viewBox='0 0 60 103.92305' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92305L0 86.60254V51.96152L30 34.64102l30 17.3205v34.64102L30 103.92305zM30 0l30 17.32051v34.64102M0 17.32051L30 0 M0 51.96152V17.32051' fill='none' stroke='%23e9d5ff' stroke-width='2' stroke-opacity='0.6'/%3E%3C/svg%3E")`;

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans"
            style={{
                backgroundColor: '#faf5ff', // Very light purple background
                backgroundImage: hexPattern,
                backgroundSize: '100px 173.205px', // Scales up the hexagon slightly
                backgroundPosition: 'center'
            }}
        >
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">

                {/* --- LEFT DESCRIPTIVE SIDE --- */}
                <div ref={leftContentRef} className="flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left mt-10 lg:mt-0">
                    <h1 className="text-4xl lg:text-[2.75rem] font-bold text-slate-900 tracking-tight leading-tight mb-4">
                        Red Angle Studio
                    </h1>
                    <p className="text-slate-500 text-base max-w-md mx-auto lg:mx-0 mb-12 leading-relaxed">
                        Manage your workspace and collaborate with your team seamlessly with our intuitive platform.
                    </p>

                    <style>{`
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-15px); }
                            100% { transform: translateY(0px); }
                        }
                        .animate-float {
                            animation: float 3s ease-in-out infinite;
                        }
                    `}</style>
                    <div className="w-full max-w-sm mx-auto lg:mx-0 relative pt-10 px-6">
                        {/* Soft glow behind illustration */}
                        <div className="absolute inset-x-8 bottom-0 top-10 bg-purple-200/50 rounded-t-full blur-3xl -z-10"></div>

                        {/* Illustration Wrapper */}
                        <div className="relative overflow-visible pb-2">
                            <img
                                ref={girlRef}
                                src="/login_illustration.png"
                                alt="Photographer Character"
                                className="w-[120%] -ml-[10%] max-w-none h-auto animate-float transition-transform duration-500 pointer-events-none origin-bottom mix-blend-multiply"
                            />
                        </div>

                        {/* Flash overlay */}
                        <div
                            ref={flashRef}
                            className="fixed top-0 left-0 w-full h-full bg-white pointer-events-none transition-opacity duration-200 z-[100]"
                            style={{ opacity: 0 }}
                        />
                    </div>
                </div>

                {/* --- RIGHT CARD SIDE --- */}
                <div className="flex items-center justify-center order-1 lg:order-2">
                    <div
                        ref={cardRef}
                        className="w-full max-w-[400px] bg-white rounded-[1.75rem] p-8 shadow-[0_20px_60px_-15px_rgba(109,40,217,0.15)] relative border border-white/60"
                    >
                        {/* Logo header inside card */}
                        <div className="flex items-center justify-center lg:justify-end gap-3 mb-10">
                            <img src="/red_angle_logo.png" alt="RED ANGLE STUDIO" className="h-[40px] w-auto object-contain" />
                        </div>

                        {showForgot ? (
                            /* ─── FORGOT PASSWORD VIEW ─── */
                            <>
                                {forgotStep !== 'success' && (
                                    <button
                                        type="button"
                                        onClick={closeForgotPassword}
                                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-6"
                                    >
                                        <ArrowLeft size={16} />
                                        Back to login
                                    </button>
                                )}
                                {renderForgotContent()}
                            </>
                        ) : (
                            /* ─── LOGIN VIEW ─── */
                            <>
                                {/* Titles */}
                                <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
                                <p className="text-sm text-slate-500 mt-2 mb-8">Enter your credentials to continue</p>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    {/* Error Alert */}
                                    {error && (
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100 animate-fade-in">
                                            <AlertCircle size={16} className="shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setError('') }}
                                            placeholder="name@example.com"
                                            className="w-full px-4 py-3.5 bg-[#f4f7fb] border-2 border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm text-slate-900 transition-all outline-none placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2 relative">
                                        <label className="block text-xs font-semibold text-slate-700">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setError('') }}
                                                placeholder="••••••••"
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

                                    {/* Forgot password */}
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={openForgotPassword}
                                            className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_8px_20px_-6px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner />
                                                Authenticating...
                                            </>
                                        ) : 'Continue'}
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
