import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Lock, User, ArrowRight, Mail, Phone, ShieldCheck, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { maskEmail } from '../constants';
import api from '../services/api';

// Username & password validation rules
const validateCredential = (value, label) => {
  const errors = [];
  if (value.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(value)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(value)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(value)) errors.push('At least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value)) errors.push('At least one special character');
  return errors;
};

export default function Register() {
  const { register } = useAuth();
  const { error: showError, success: showSuccess } = useNotifications();
  const navigate = useNavigate();

  // ── Flow phases ──
  // 'enter_reg'    → Only register number input + Verify button
  // 'otp_email'    → Masked email shown, enter OTP (primary path)
  // 'manual_email' → "I don't have access" path: enter email manually → verify email → auto-fill
  // 'manual_otp'   → OTP sent to manual email
  // 'fill_form'    → Registration form (auto-filled academic fields + editable name/username/password)
  const [phase, setPhase] = useState('enter_reg');

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    university: '',
    college: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [registryRecord, setRegistryRecord] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  // Manual email
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // ── STEP 1: Verify register number via backend API ──
  const handleVerifyRegNumber = async () => {
    const id = formData.studentId.trim().toUpperCase();
    if (!id) {
      setErrors({ studentId: 'Register Number is required' });
      return;
    }

    setVerifying(true);
    try {
      // Call backend to verify register number
      const { data: record } = await api.get(`/auth/verify/${id}`);

      setRegistryRecord({
        name: record.full_name,
        email: record.official_email,
        university: record.university,
        college: record.college,
        department: record.department,
      });
      setMaskedEmail(maskEmail(record.official_email));

      // Send real OTP to the official email via backend
      await api.post('/auth/send-registration-otp', {
        email: record.official_email,
        register_number: id,
      });

      setOtpTimer(60);
      setEnteredOtp('');
      setOtpError('');
      setPhase('otp_email');
      showSuccess(`📧 OTP sent to ${maskEmail(record.official_email)}. Check your inbox!`);
    } catch (err) {
      if (!err.response) {
        showError('❌ Server Error: Unable to connect to the backend. Please check your internet or API URL.');
      } else {
        const msg = err?.response?.data?.detail || 'Register Number not found. Please check and try again.';
        showError(`❌ ${msg}`);
      }
    }
    setVerifying(false);
  };

  // ── Verify OTP (primary path — official email) via backend ──
  const handleVerifyOfficialOtp = async () => {
    if (!enteredOtp.trim()) { setOtpError('Please enter the OTP'); return; }

    try {
      await api.post('/auth/verify-registration-otp', {
        register_number: formData.studentId.trim().toUpperCase(),
        email: registryRecord.email,
        otp: enteredOtp,
      });

      // Auto-fill all fields from registry
      setFormData((prev) => ({
        ...prev,
        studentId: prev.studentId.toUpperCase(),
        name: registryRecord.name,
        email: registryRecord.email,
        phone: '',
        university: registryRecord.university,
        college: registryRecord.college,
        department: registryRecord.department,
      }));
      setPhase('fill_form');
      showSuccess('✅ Email verified! Complete your profile below.');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid OTP. Please try again.';
      setOtpError(msg);
    }
  };

  // ── "I don't have access to mail" → manual email path ──
  const handleNoAccessToMail = () => {
    showError('For security, OTP can only be sent to your official email linked to this register number. Please contact support if you cannot access it.');
  };

  // ── Verify manual email ──
  const handleVerifyManualEmail = async () => {
    if (!manualEmail.trim()) {
      setErrors({ manualEmail: 'Email is required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualEmail)) {
      setErrors({ manualEmail: 'Enter a valid email address' });
      return;
    }
    if (!manualPhone.trim()) {
      setErrors({ manualPhone: 'Phone number is required' });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(manualPhone)) {
      setErrors({ manualPhone: 'Enter a valid 10-digit phone number' });
      return;
    }

    setOtpSending(true);
    try {
      await api.post('/auth/send-registration-otp', {
        email: manualEmail,
        register_number: formData.studentId.trim().toUpperCase(),
      });
      setOtpTimer(60);
      setEnteredOtp('');
      setOtpError('');
      setPhase('manual_otp');
      showSuccess(`📧 OTP sent to ${manualEmail}. Check your inbox!`);
    } catch (err) {
      showError('Failed to send OTP. Please try again.');
    }
    setOtpSending(false);
  };

  // ── Verify manual email OTP via backend ──
  const handleVerifyManualOtp = async () => {
    if (!enteredOtp.trim()) { setOtpError('Please enter the OTP'); return; }

    try {
      await api.post('/auth/verify-registration-otp', {
        register_number: formData.studentId.trim().toUpperCase(),
        email: manualEmail,
        otp: enteredOtp,
      });

      // Auto-fill academic fields from registry (register number already verified)
      setFormData((prev) => ({
        ...prev,
        studentId: prev.studentId.toUpperCase(),
        name: registryRecord?.name || '',
        email: manualEmail,
        phone: manualPhone,
        university: registryRecord?.university || '',
        college: registryRecord?.college || '',
        department: registryRecord?.department || '',
      }));
      setPhase('fill_form');
      showSuccess('✅ Email verified! Academic details auto-filled. Complete your profile.');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid OTP. Please try again.';
      setOtpError(msg);
    }
  };

  // ── Resend OTP via backend ──
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setOtpSending(true);
    try {
      const email = phase === 'otp_email' ? registryRecord?.email : manualEmail;
      await api.post('/auth/send-registration-otp', {
        email: email,
        register_number: formData.studentId.trim().toUpperCase(),
      });
      setOtpTimer(60);
      setEnteredOtp('');
      setOtpError('');
      const dest = phase === 'otp_email' ? maskedEmail : manualEmail;
      showSuccess(`📧 New OTP sent to ${dest}. Check your inbox!`);
    } catch (err) {
      showError('Failed to resend OTP. Please try again.');
    }
    setOtpSending(false);
  };

  // ── Final form validation ──
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    else {
      const usernameErrs = validateCredential(formData.username, 'Username');
      if (usernameErrs.length > 0) errs.username = usernameErrs.join(', ');
    }
    if (!formData.email.trim()) errs.email = 'Email is required';
    if (!formData.password) errs.password = 'Password is required';
    else {
      const pwdErrs = validateCredential(formData.password, 'Password');
      if (pwdErrs.length > 0) errs.password = pwdErrs.join(', ');
      else if (formData.password === formData.username) errs.password = 'Password must not be the same as username';
    }
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) errs.agreeTerms = 'You must agree to the Terms & Conditions';
    return errs;
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(formData);
      showSuccess('🎉 Account created successfully!');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      if (!err.response) {
        showError('❌ Server Error: Unable to connect to the backend.');
      } else {
        const detail = err?.response?.data?.detail || err?.message || 'Registration failed. Please try again.';
        showError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  // ── Credential rules indicator component ──
  const renderRulesIndicator = (value, label, compareValue) => {
    const rules = [
      { test: (v) => v.length >= 8, label: '8+ characters' },
      { test: (v) => /[A-Z]/.test(v), label: 'Uppercase' },
      { test: (v) => /[a-z]/.test(v), label: 'Lowercase' },
      { test: (v) => /[0-9]/.test(v), label: 'Number' },
      { test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v), label: 'Special char' },
    ];
    if (compareValue !== undefined) {
      rules.push({ test: (v) => v !== compareValue || !v, label: `≠ ${label === 'Password' ? 'Username' : 'Password'}` });
    }
    if (!value) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {rules.map((rule) => (
          <span
            key={rule.label}
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
              rule.test(value)
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}
          >
            {rule.test(value) ? '✓' : '○'} {rule.label}
          </span>
        ))}
      </div>
    );
  };

  // ── OTP Input (render function, NOT component — avoids remount on state change) ──
  const renderOtpInput = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Enter 6-digit OTP <span className="text-rose-500">*</span>
      </label>
      <div className="flex gap-2 justify-center">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={enteredOtp[i] || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/, '');
              const newOtp = enteredOtp.split('');
              newOtp[i] = val;
              setEnteredOtp(newOtp.join(''));
              setOtpError('');
              if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !enteredOtp[i] && i > 0)
                document.getElementById(`otp-${i - 1}`)?.focus();
            }}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              ${otpError
                ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/10'
                : enteredOtp[i]
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              } text-gray-900 dark:text-white`}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {otpError && <p className="text-sm text-rose-500 text-center">⚠ {otpError}</p>}
    </div>
  );

  // ── Timer & Resend (render function) ──
  const renderTimerResend = () => (
    <div className="flex items-center justify-center gap-2 text-sm">
      {otpTimer > 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Resend OTP in <span className="font-bold text-indigo-600 dark:text-indigo-400">{otpTimer}s</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={otpSending}
          className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Resend OTP
        </button>
      )}
    </div>
  );

  // ── Phase title/subtitle ──
  const getTitle = () => {
    switch (phase) {
      case 'enter_reg': return 'Create Account';
      case 'otp_email': return 'Verify Email';
      case 'manual_email': return 'Alternate Verification';
      case 'manual_otp': return 'Verify Email';
      case 'fill_form': return 'Complete Registration';
      default: return 'Create Account';
    }
  };
  const getSubtitle = () => {
    switch (phase) {
      case 'enter_reg': return 'Enter your Register Number to get started';
      case 'otp_email': return `We've sent an OTP to ${maskedEmail}`;
      case 'manual_email': return 'Enter your personal email and phone for verification';
      case 'manual_otp': return `Enter the OTP sent to ${manualEmail}`;
      case 'fill_form': return 'Your academic details have been verified. Set up your credentials.';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-rose-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative text-center text-white p-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-8"
          >
            🚀
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">Join the Community</h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto">
            Create your account and start trading with students on your campus today.
          </p>
          <div className="mt-8 space-y-3 text-left max-w-xs mx-auto">
            {['Register Number verified accounts', 'Official academic records', 'Secure OTP verification', 'Campus-wide marketplace'].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-white/80"
              >
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap size={22} className="text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">UNIMART</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getTitle()}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{getSubtitle()}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════ PHASE: Enter Register Number ═══════════ */}
            {phase === 'enter_reg' && (
              <motion.div
                key="enter_reg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/30">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1">
                    <GraduationCap size={14} /> Primary Verification
                  </p>
                  <Input
                    label="Register Number"
                    name="studentId"
                    placeholder="Enter your Register Number"
                    value={formData.studentId}
                    onChange={(e) => updateField('studentId', e.target.value)}
                    error={errors.studentId}
                    icon={GraduationCap}
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyRegNumber}
                  disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </motion.div>
            )}

            {/* ═══════════ PHASE: OTP to Official Email ═══════════ */}
            {phase === 'otp_email' && (
              <motion.div
                key="otp_email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">OTP Sent</p>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                    A 6-digit verification code has been sent to <strong>{maskedEmail}</strong>. Check your inbox.
                  </p>
                </div>

                {renderOtpInput()}
                {renderTimerResend()}

                <button
                  type="button"
                  onClick={handleVerifyOfficialOtp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <ShieldCheck size={18} />
                  Verify OTP
                </button>

                {/* "I don't have access" */}
                <button
                  type="button"
                  onClick={handleNoAccessToMail}
                  className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
                >
                  <AlertTriangle size={14} />
                  I don't have access to this mail
                </button>

                <button
                  type="button"
                  onClick={() => { setPhase('enter_reg'); setEnteredOtp(''); setOtpError(''); }}
                  className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* ═══════════ PHASE: Manual Email Entry ═══════════ */}
            {phase === 'manual_email' && (
              <motion.div
                key="manual_email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Enter your personal email and phone number. We'll verify your email and pull your academic details from the official database.
                  </p>
                </div>

                <Input
                  label="Personal Email ID"
                  name="manualEmail"
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={manualEmail}
                  onChange={(e) => { setManualEmail(e.target.value); setErrors({ ...errors, manualEmail: '' }); }}
                  error={errors.manualEmail}
                  icon={Mail}
                  required
                />
                <Input
                  label="Phone Number"
                  name="manualPhone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={manualPhone}
                  onChange={(e) => { setManualPhone(e.target.value); setErrors({ ...errors, manualPhone: '' }); }}
                  error={errors.manualPhone}
                  icon={Phone}
                  required
                />

                <button
                  type="button"
                  onClick={handleVerifyManualEmail}
                  disabled={otpSending}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
                >
                  {otpSending ? 'Sending OTP...' : 'Verify Email'}
                </button>

                <button
                  type="button"
                  onClick={() => setPhase('otp_email')}
                  className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  ← Back to official email verification
                </button>
              </motion.div>
            )}

            {/* ═══════════ PHASE: Manual Email OTP ═══════════ */}
            {phase === 'manual_otp' && (
              <motion.div
                key="manual_otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">OTP Sent</p>
                  </div>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                    A 6-digit code has been sent to <strong>{manualEmail}</strong>.
                  </p>
                </div>

                {renderOtpInput()}
                {renderTimerResend()}

                <button
                  type="button"
                  onClick={handleVerifyManualOtp}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <ShieldCheck size={18} />
                  Verify & Continue
                </button>

                <button
                  type="button"
                  onClick={() => { setPhase('manual_email'); setEnteredOtp(''); setOtpError(''); }}
                  className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  ← Change email
                </button>
              </motion.div>
            )}

            {/* ═══════════ PHASE: Registration Form ═══════════ */}
            {phase === 'fill_form' && (
              <motion.form
                key="fill_form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmitRegistration}
                className="space-y-3.5"
              >
                {/* Auto-filled Official Records */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Official Records — Auto-populated from university database
                  </p>
                </div>

                {[
                  { label: 'Register Number', value: formData.studentId, icon: GraduationCap },
                  { label: 'Name', value: formData.name, icon: User },
                  { label: 'University', value: formData.university, icon: GraduationCap },
                  { label: 'College', value: formData.college, icon: GraduationCap },
                  { label: 'Department', value: formData.department, icon: User },
                  { label: 'Email', value: formData.email, icon: Mail },
                ].map((field) => (
                  <div key={field.label} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      {field.label}
                    </label>
                    <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed">
                      <field.icon size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{field.value}</span>
                      <Lock size={14} className="text-gray-400 shrink-0" />
                    </div>
                  </div>
                ))}

                {/* Phone Number */}
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  error={errors.phone}
                  icon={Phone}
                />

                {/* Editable Fields */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                    <User size={14} /> Setup Your Credentials
                  </p>
                </div>

                <div>
                  <Input
                    label="Username"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    error={errors.username}
                    icon={User}
                    required
                  />
                  {renderRulesIndicator(formData.username, 'Username')}
                </div>

                <div>
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    error={errors.password}
                    icon={Lock}
                    required
                  />
                  {renderRulesIndicator(formData.password, 'Password', formData.username)}
                </div>

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  icon={Lock}
                  required
                />

                {/* Terms */}
                <div className="space-y-1.5">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => { setAgreeTerms(e.target.checked); setErrors({ ...errors, agreeTerms: '' }); }}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Terms & Conditions
                      </Link>
                      {' '}and understand the prohibited items policy.
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-sm text-rose-500 ml-7">⚠ {errors.agreeTerms}</p>}
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={ArrowRight} iconPosition="right">
                  Create Account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
