import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { request } from '../../api/client';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Store,
  User,
  Building2,
  MapPin,
  Truck,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  ChevronRight,
  FileCheck,
  Percent,
  X,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface MerchantOnboardingWizardProps {
  initialReference?: string;
  onComplete?: (application: any) => void;
  onBackToLogin?: () => void;
}

export const MerchantOnboardingWizard: React.FC<MerchantOnboardingWizardProps> = ({
  initialReference,
  onComplete,
  onBackToLogin
}) => {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [referenceNumber, setReferenceNumber] = useState<string>(initialReference || '');
  const [token, setToken] = useState<string>(localStorage.getItem('el_token') || '');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step 1: Owner Information
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [communicationConsent, setCommunicationConsent] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Step 2: Business Information
  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [entityType, setEntityType] = useState('PROPRIETORSHIP');
  const [panNumber, setPanNumber] = useState('');
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  // Step 3: Store Information
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('Grocery & Daily Staples');
  const [description, setDescription] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Indore');
  const [district, setDistrict] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('452001');
  const [latitude, setLatitude] = useState(22.7196);
  const [longitude, setLongitude] = useState(75.8577);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [weeklyClosingDay, setWeeklyClosingDay] = useState('None');

  // Step 4: Delivery Configuration
  const [hasPickup, setHasPickup] = useState(true);
  const [hasMerchantDelivery, setHasMerchantDelivery] = useState(false);
  const [hasPlatformDelivery, setHasPlatformDelivery] = useState(true);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(3.0);
  const [minOrderValuePaise, setMinOrderValuePaise] = useState(29900);
  const [estimatedPrepMinutes, setEstimatedPrepMinutes] = useState(20);
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');

  // Step 5: Documents
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // Step 6: Bank Details
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  // Step 7: Commercial Agreement
  const [agreementDetails, setAgreementDetails] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load existing application if reference provided
  useEffect(() => {
    if (referenceNumber) {
      loadApplication(referenceNumber);
    }
    loadAgreement();
  }, [referenceNumber]);

  const loadAgreement = async () => {
    try {
      const res = await request<any>('/onboarding/agreements/current');
      setAgreementDetails(res.agreement);
    } catch (e) {
      console.error('Failed to load agreement');
    }
  };

  const loadApplication = async (ref: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await request<any>(`/onboarding/application/${ref}`);
      const app = res.application;
      setApplication(app);
      setCurrentStep(app.currentStep || 1);

      // Hydrate form state
      setOwnerName(app.ownerName || '');
      setOwnerPhone(app.ownerPhone || '');
      setOwnerEmail(app.ownerEmail || '');
      setIsPhoneVerified(app.isPhoneVerified || false);

      setBusinessName(app.businessName || '');
      setLegalName(app.legalName || '');
      setEntityType(app.entityType || 'PROPRIETORSHIP');
      setPanNumber(app.panNumber || '');
      setIsGstRegistered(app.isGstRegistered || false);
      setGstin(app.gstin || '');
      setBusinessRegistrationNumber(app.businessRegistrationNumber || '');

      setStoreName(app.storeName || '');
      setCategory(app.category || 'Grocery & Daily Staples');
      setDescription(app.description || '');
      setAddressLine(app.addressLine || '');
      setPincode(app.pincode || '452001');
      setLatitude(app.latitude || 22.7196);
      setLongitude(app.longitude || 75.8577);
      setOpeningTime(app.openingTime || '09:00');
      setClosingTime(app.closingTime || '21:00');
      setWeeklyClosingDay(app.weeklyClosingDay || 'None');

      setHasPickup(app.hasPickup ?? true);
      setHasMerchantDelivery(app.hasMerchantDelivery ?? false);
      setHasPlatformDelivery(app.hasPlatformDelivery ?? true);
      setDeliveryRadiusKm(app.deliveryRadiusKm || 3.0);
      setMinOrderValuePaise(app.minOrderValuePaise || 29900);
      setEstimatedPrepMinutes(app.estimatedPrepMinutes || 20);
      setFssaiNumber(app.fssaiNumber || '');
      setDrugLicenseNumber(app.drugLicenseNumber || '');

      if (app.documents) setUploadedDocuments(app.documents);

      if (app.bankAccount) {
        setAccountHolderName(app.bankAccount.accountHolderName || '');
        setBankName(app.bankAccount.bankName || '');
        setIfsc(app.bankAccount.ifsc || '');
        setAccountNumber(app.bankAccount.accountNumberMasked || '');
      }

      if (app.agreementAcceptance) {
        setTermsAccepted(true);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Owner Info & Initialize Application
  const handleStartApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await request<any>('/onboarding/start', {
        method: 'POST',
        body: JSON.stringify({
          ownerName,
          ownerPhone,
          ownerEmail,
          password,
          communicationConsent
        })
      });

      if (res.token) {
        localStorage.setItem('el_token', res.token);
        setToken(res.token);
      }

      setReferenceNumber(res.application.referenceNumber);
      setApplication(res.application);
      setIsOtpSent(true);
      setSuccessMsg('Registration initialized! Please enter the 4-digit verification code.');
    } catch (e: any) {
      setError(e.message || 'Failed to start onboarding');
    } finally {
      setSaving(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpInput) {
      setError('Please enter verification code');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await request<any>('/onboarding/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify({
          referenceNumber,
          otp: otpInput
        })
      });
      setIsPhoneVerified(true);
      setSuccessMsg('Phone verified successfully!');
      setCurrentStep(2);
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setSaving(false);
    }
  };

  // Save Step Progress
  const saveStep = async (stepNum: number, payload: any) => {
    if (!referenceNumber) return;
    setSaving(true);
    setError(null);
    try {
      const res = await request<any>(`/onboarding/application/${referenceNumber}/step/${stepNum}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setApplication(res.application);
      setSuccessMsg(`Step ${stepNum} saved successfully`);
      setCurrentStep(stepNum + 1);
    } catch (e: any) {
      setError(e.message || `Failed to save step ${stepNum}`);
    } finally {
      setSaving(false);
    }
  };

  // Document Upload
  const handleFileUpload = async (docType: string, file: File) => {
    if (!referenceNumber) return;
    setUploadingDocType(docType);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      const res = await request<any>(`/onboarding/application/${referenceNumber}/documents`, {
        method: 'POST',
        body: formData
      });

      setUploadedDocuments((prev) => [...prev, res.document]);
      setSuccessMsg(`${docType.replace(/_/g, ' ')} uploaded successfully`);
    } catch (e: any) {
      setError(e.message || 'Failed to upload document');
    } finally {
      setUploadingDocType(null);
    }
  };

  // Step 8: Final Submission
  const handleSubmitApplication = async () => {
    if (!referenceNumber) return;
    setSaving(true);
    setError(null);
    try {
      const res = await request<any>(`/onboarding/application/${referenceNumber}/submit`, {
        method: 'POST'
      });
      setApplication(res.application);
      setSuccessMsg('Application submitted successfully! Your application is now Under Review.');
      if (onComplete) onComplete(res.application);
    } catch (e: any) {
      setError(e.message || 'Failed to submit application');
    } finally {
      setSaving(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Owner Info', icon: User },
    { num: 2, label: 'Business', icon: Building2 },
    { num: 3, label: 'Store', icon: Store },
    { num: 4, label: 'Delivery', icon: Truck },
    { num: 5, label: 'Documents', icon: FileText },
    { num: 6, label: 'Bank', icon: CreditCard },
    { num: 7, label: 'Agreement', icon: Percent },
    { num: 8, label: 'Review', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Merchant Partner Onboarding
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Indore Pilot
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Complete your verification to start selling to neighbourhood customers
            </p>
          </div>
        </div>

        {referenceNumber && (
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-bold block">Application Ref</span>
            <span className="text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {referenceNumber}
            </span>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="overflow-x-auto pb-4 mb-6">
        <div className="flex items-center min-w-[640px] justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className={`flex flex-col items-center gap-1.5 cursor-pointer transition ${
                    isCurrent
                      ? 'text-emerald-700 font-black'
                      : isDone
                      ? 'text-slate-700 font-semibold'
                      : 'text-slate-400'
                  }`}
                  onClick={() => {
                    if (referenceNumber && (isDone || s.num <= (application?.currentStep || 1))) {
                      setCurrentStep(s.num);
                    }
                  }}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-600 ring-4 ring-emerald-50'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] whitespace-nowrap">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded ${
                      currentStep > s.num ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Notification / Error Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Owner Information */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 1: Owner Information</h2>
          <p className="text-xs text-slate-500 mb-6">
            Provide the business owner or authorized signatory details for verification.
          </p>

          <form onSubmit={handleStartApplication} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (10 digits) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="ramesh@sharmakirana.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password (min 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="consent"
                checked={communicationConsent}
                onChange={(e) => setCommunicationConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed">
                I authorize EveryBazaar to send order alerts, settlement updates, and onboarding status via WhatsApp and SMS.
              </label>
            </div>

            {!isOtpSent ? (
              <div className="pt-4 flex items-center justify-between">
                {onBackToLogin && (
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    ← Existing Merchant Login
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Continue to Verification ➔
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <label className="block text-xs font-black text-emerald-900 mb-1.5">
                    Enter 4-Digit Verification Code (Sent to +91 {ownerPhone})
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 1234"
                      className="w-48 px-3.5 py-2 rounded-lg border border-emerald-300 text-base font-mono font-bold tracking-widest outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={saving}
                      className="px-5 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition"
                    >
                      {saving ? 'Verifying...' : 'Verify Mobile OTP'}
                    </button>
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-1.5 block">
                    * In test environment, enter default pilot code <strong>1234</strong>
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* STEP 2: Business Information */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 2: Business & Legal Entity</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter statutory business details for invoicing and settlement accounts.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trading / Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sharma Kirana & General Store"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legal Entity Name *</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Sharma Retail Enterprises Pvt Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type *</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership Firm</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="PRIVATE_LIMITED">Private Limited Company</option>
                  <option value="OTHER">Other / Individual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Business PAN (10 chars) *</label>
                <input
                  type="text"
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Registration / Udyam No.</label>
                <input
                  type="text"
                  value={businessRegistrationNumber}
                  onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                  placeholder="e.g. UDYAM-MP-00-1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Are you registered under GST?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstRegistered}
                    onChange={(e) => setIsGstRegistered(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {isGstRegistered && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (15 characters) *</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="23AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    GSTIN starting with state code 23 (Madhya Pradesh).
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving || !businessName || !legalName}
                onClick={() =>
                  saveStep(2, {
                    businessName,
                    legalName,
                    entityType,
                    panNumber,
                    isGstRegistered,
                    gstin,
                    businessRegistrationNumber
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Save & Continue ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Store Information */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 3: Store & Location Details</h2>
          <p className="text-xs text-slate-500 mb-6">
            Configure how your storefront appears to customers across Indore.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Display Name *</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Sharma Kirana - Palasia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Store Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Grocery & Daily Staples">Grocery & Daily Staples</option>
                  <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                  <option value="Dairy, Bread & Eggs">Dairy, Bread & Eggs</option>
                  <option value="Bakery, Sweets & Namkeen">Bakery, Sweets & Namkeen</option>
                  <option value="Pharmacy & Wellness">Pharmacy & Wellness</option>
                  <option value="Meat, Fish & Frozen Foods">Meat, Fish & Frozen Foods</option>
                  <option value="Electronics & Electricals">Electronics & Electricals</option>
                  <option value="Personal Care & Household">Personal Care & Household</option>
                  <option value="General">General Merchant</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Short Description / Speciality</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fresh Aata, pure spices, cold-pressed oils, and daily grocery items delivered fast."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complete Store Address *</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Shop No. 12, Manorama Ganj Road, Palasia"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="452001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Off Day</label>
                <select
                  value={weeklyClosingDay}
                  onChange={(e) => setWeeklyClosingDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="None">None (Open 7 Days)</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving || !storeName || !addressLine}
                onClick={() =>
                  saveStep(3, {
                    storeName,
                    category,
                    description,
                    addressLine,
                    city,
                    district,
                    state,
                    pincode,
                    latitude,
                    longitude,
                    openingTime,
                    closingTime,
                    weeklyClosingDay
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Save & Continue ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Delivery Configuration */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 4: Delivery & Fulfilment Modes</h2>
          <p className="text-xs text-slate-500 mb-6">
            Configure how orders will be prepared and delivered to local customers.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setHasPickup(!hasPickup)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  hasPickup ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800">Store Pickup</span>
                  <input type="checkbox" checked={hasPickup} readOnly className="rounded text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500">Customer picks up order directly at your shop.</p>
              </div>

              <div
                onClick={() => setHasMerchantDelivery(!hasMerchantDelivery)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  hasMerchantDelivery ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800">Own Delivery</span>
                  <input type="checkbox" checked={hasMerchantDelivery} readOnly className="rounded text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500">Delivered using your store staff or delivery boy.</p>
              </div>

              <div
                onClick={() => setHasPlatformDelivery(!hasPlatformDelivery)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  hasPlatformDelivery ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800">EveryBazaar Fleet</span>
                  <input type="checkbox" checked={hasPlatformDelivery} readOnly className="rounded text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500">Platform-assigned verified local riders.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">Maximum Delivery Radius</label>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {deliveryRadiusKm.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Default: 3.0 km. Max allowable by platform for instant neighbourhood delivery.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Value (MOV)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={minOrderValuePaise / 100}
                      onChange={(e) => setMinOrderValuePaise(Math.max(0, parseInt(e.target.value || '0', 10) * 100))}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Average Packing / Prep Time</label>
                  <select
                    value={estimatedPrepMinutes}
                    onChange={(e) => setEstimatedPrepMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value={10}>10 minutes (Quick)</option>
                    <option value={15}>15 minutes (Standard)</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Licences */}
            {category === 'Pharmacy & Wellness' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-900 block mb-1">
                  Mandatory Statutory Pharmacy Drug License *
                </span>
                <input
                  type="text"
                  value={drugLicenseNumber}
                  onChange={(e) => setDrugLicenseNumber(e.target.value)}
                  placeholder="e.g. 20B/21B Drug License Number"
                  className="w-full px-3.5 py-2 rounded-lg border border-amber-300 text-xs font-mono font-bold outline-none bg-white"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  saveStep(4, {
                    hasPickup,
                    hasMerchantDelivery,
                    hasPlatformDelivery,
                    deliveryRadiusKm,
                    minOrderValuePaise,
                    estimatedPrepMinutes,
                    fssaiNumber,
                    drugLicenseNumber
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Save & Continue ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Document Upload */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 5: Statutory Document Upload</h2>
          <p className="text-xs text-slate-500 mb-6">
            Upload clear photos or PDF copies of your verification documents. Files are stored securely.
          </p>

          <div className="space-y-4">
            {[
              { type: 'PAN_CARD', label: 'PAN Card Copy (Proprietor / Entity)', required: true },
              { type: 'BUSINESS_REGISTRATION', label: 'Business Registration / Gumasta / Shop Act', required: true },
              { type: 'CANCELLED_CHEQUE', label: 'Bank Proof / Cancelled Cheque / Statement', required: true },
              { type: 'STORE_PHOTO', label: 'Storefront Photograph with Board', required: false }
            ].map((doc) => {
              const uploaded = uploadedDocuments.find((d) => d.documentType === doc.type);
              const isUploading = uploadingDocType === doc.type;

              return (
                <div
                  key={doc.type}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {doc.label}
                      {doc.required && <span className="text-rose-500">*</span>}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      PDF, JPEG, PNG or WebP up to 10 MB.
                    </span>
                    {uploaded && (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded: {uploaded.fileName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {isUploading ? 'Uploading...' : uploaded ? 'Replace File' : 'Choose File'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        disabled={isUploading}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(doc.type, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
              >
                Continue to Bank Details ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Bank Details */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 6: Bank & Payout Details</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter the bank account where customer order proceeds will be settled.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Account Holder Name *</label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name as registered on bank passbook"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code (11 characters) *</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number *</label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ''))}
                  placeholder="Enter full account number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\s/g, ''))}
                  placeholder="Re-enter to confirm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber && (
              <span className="text-xs font-bold text-rose-600 block">
                Account numbers do not match. Please verify.
              </span>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving || !accountHolderName || !ifsc || !accountNumber || (confirmAccountNumber && accountNumber !== confirmAccountNumber)}
                onClick={() =>
                  saveStep(6, {
                    accountHolderName,
                    bankName,
                    accountNumber,
                    ifsc
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Save & Continue ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: Commercial Agreement */}
      {currentStep === 7 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 7: Commercial Terms & Commission</h2>
          <p className="text-xs text-slate-500 mb-6">
            Review the transparent platform fees and settlement agreement for your category.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                    Your Applied Category Rate
                  </span>
                  <span className="text-xl font-black text-emerald-800">{category}</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-700">
                    {agreementDetails?.categoryRates?.[category] || 3.5}%
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block">Platform Commission</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 max-h-48 overflow-y-auto text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Summary of Terms (Version {agreementDetails?.version || 'v2026.1'}):</span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Zero upfront listing fees or software subscription charges during the Indore launch pilot.</li>
                <li>Settlement proceeds are transferred automatically via NEFT/IMPS on T+1 business days.</li>
                <li>Store agrees to maintain identical pricing for online and offline walk-in customers.</li>
                <li>Damaged, sub-standard or expired inventory claims are settled at merchant expense.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-700 font-medium leading-relaxed">
                I, on behalf of {businessName || 'the merchant'}, accept the EveryBazaar Commercial Agreement, fee structure, and merchant terms of service.
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving || !termsAccepted}
                onClick={() =>
                  saveStep(7, {
                    agreementVersion: agreementDetails?.version || 'v2026.1',
                    termsAccepted: true
                  })
                }
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Accept & Review Application ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: Review & Submit */}
      {currentStep === 8 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Step 8: Application Review & Submission</h2>
          <p className="text-xs text-slate-500 mb-6">
            Review your application summary before final submission for verification.
          </p>

          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                <span className="font-bold text-slate-500">Applicant / Owner</span>
                <span className="font-black text-slate-800">{ownerName} (+91 {ownerPhone})</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="font-bold text-slate-500">Business Name</span>
                <span className="font-black text-slate-800">{businessName} ({entityType})</span>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                <span className="font-bold text-slate-500">Storefront</span>
                <span className="font-black text-slate-800">{storeName} • {category}</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="font-bold text-slate-500">Address</span>
                <span className="font-black text-slate-800">{addressLine}, Indore ({pincode})</span>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-slate-50/50">
                <span className="font-bold text-slate-500">Delivery Radius</span>
                <span className="font-black text-slate-800">{deliveryRadiusKm} km (MOV: ₹{minOrderValuePaise / 100})</span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="font-bold text-slate-500">Bank Settlement</span>
                <span className="font-black font-mono text-slate-800">{bankName} ({ifsc})</span>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-emerald-50/50">
                <span className="font-bold text-emerald-800">Commercial Commission</span>
                <span className="font-black text-emerald-800">{agreementDetails?.categoryRates?.[category] || 3.5}%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <span className="font-bold block mb-1">Verification Notice:</span>
              Upon submission, our Indore operations team reviews documents and store coordinates. Applications are typically processed within 24 business hours.
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmitApplication}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition shadow-md flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                Submit Partner Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
