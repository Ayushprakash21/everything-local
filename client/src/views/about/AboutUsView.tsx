import React, { useState, useEffect } from 'react';
import {
  Store,
  Compass,
  ShoppingBag,
  Truck,
  HeartHandshake,
  ShieldCheck,
  Users,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  ArrowLeft,
  Building2,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';

interface AboutUsViewProps {
  onNavigateHome: () => void;
  onNavigateMerchant: () => void;
}

export const AboutUsView: React.FC<AboutUsViewProps> = ({
  onNavigateHome,
  onNavigateMerchant
}) => {
  // Active FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    emailOrPhone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Report Issue State
  const [issueForm, setIssueForm] = useState({
    name: '',
    contact: '',
    issueType: 'Order Support',
    description: ''
  });
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  // Synchronize document title and meta description
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'About Us — Everything Local | Your Neighbourhood. Your Marketplace.';

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalMeta = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn about Everything Local: Our story, mission, vision, and how we empower neighbourhood businesses and local commerce in Indore, India.'
      );
    }

    // Scroll to anchor if present in URL
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc && originalMeta) {
        metaDesc.setAttribute('content', originalMeta);
      }
    };
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', emailOrPhone: '', subject: 'General Inquiry', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.name || !issueForm.description) return;
    setIssueSubmitted(true);
    setTimeout(() => {
      setIssueForm({ name: '', contact: '', issueType: 'Order Support', description: '' });
      setIssueSubmitted(false);
    }, 4000);
  };

  const faqs = [
    {
      q: 'What is Everything Local and how does it work?',
      a: 'Everything Local is a digital hyperlocal commerce platform connecting customers directly with verified neighbourhood merchants, kirana stores, pharmacies, and service providers across Indore. You can explore products from local shops, compare selections, place orders, and choose between merchant delivery, store counter pickup, or verified delivery partner fulfillment.'
    },
    {
      q: 'How does Everything Local support independent neighbourhood shops?',
      a: 'Unlike centralized dark-store aggregators that compete with local retail, Everything Local provides neighbourhood retailers with free digital cataloging, real-time inventory management, unified cart checkout, and digital visibility to reach residents within their natural 3–5 km service radius.'
    },
    {
      q: 'What delivery options are available for my orders?',
      a: 'Depending on the participating merchant and location, fulfillment is handled via store direct delivery, customer counter pickup, or our localized on-demand delivery fleet. Transparent delivery windows and fee breakdowns are shown prior to payment.'
    },
    {
      q: 'How can a local store or service provider join the platform?',
      a: 'Any verified business owner in Indore with a valid shop establishment or GST/Udyam certificate can register via the "Sell on Everything Local" link in the footer or top navigation. Onboarding includes instant digital storefront setup and self-service catalog management.'
    },
    {
      q: 'What payment methods are supported on Everything Local?',
      a: 'We support all major Indian digital payment methods including UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking, and Cash on Delivery (COD) for eligible neighbourhood orders.'
    }
  ];

  return (
    <div className="bg-white min-h-screen text-slate-900">
      {/* Top Breadcrumb & Quick Return Bar */}
      <div className="border-b border-slate-100 bg-slate-50/70 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500 group-hover:text-red-600" />
            <span>Back to Marketplace</span>
          </button>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
            <a href="#story" className="hover:text-red-600 transition-colors">Our Story</a>
            <span>•</span>
            <a href="#mission-vision" className="hover:text-red-600 transition-colors">Mission & Vision</a>
            <span>•</span>
            <a href="#how-it-works" className="hover:text-red-600 transition-colors">How It Works</a>
            <span>•</span>
            <a href="#commitment" className="hover:text-red-600 transition-colors">Commitment</a>
            <span>•</span>
            <a href="#faqs" className="hover:text-red-600 transition-colors">FAQs</a>
            <span>•</span>
            <a href="#contact" className="hover:text-red-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>

      {/* SECTION A: HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200/60 text-red-700 text-xs font-bold tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>Made for India • Rooted in Local</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            About Everything Local
          </h1>

          <p className="text-lg sm:text-xl font-bold text-red-600 mb-6">
            Your Neighbourhood. Your Marketplace.
          </p>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
            Everything Local is an Indian hyperlocal commerce and neighbourhood ecosystem platform founded to bridge physical local retailers and everyday consumers. We bring the rich diversity, speed, and trust of your local bazaar into an accessible, unified digital experience — starting in Indore, Madhya Pradesh.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#how-it-works"
              className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <span>Explore How It Works</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={onNavigateMerchant}
              className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-sm transition-all shadow-2xs hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span>Partner as a Merchant</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION B: OUR STORY */}
      <section id="story" className="py-16 md:py-20 border-b border-slate-100 bg-white scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                <Compass className="w-4 h-4" />
                <span>Our Heritage & Purpose</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Our Story
              </h2>
              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Everything Local is a digital marketplace designed to connect customers with neighbourhood businesses across India. The platform aims to give independent merchants digital visibility and help customers discover products and services from local businesses through one convenient platform.
                </p>
                <p>
                  For decades, Indian neighbourhoods have thrived on the personal relationships, warmth, and reliability of their local merchants — the neighbourhood grocery store owner who knows your family’s pulse preferences, the trusted medical store around the corner, and the local service technician who arrives promptly when needed.
                </p>
                <p>
                  As digital shopping transformed consumer expectations, local merchants were frequently left behind by centralized warehouses and predatory algorithmic aggregator models. Everything Local was created to democratize technology for physical store owners, enabling them to compete, grow, and flourish alongside modern digital lifestyles.
                </p>
              </div>
            </div>

            <div className="md:col-span-5 bg-gradient-to-br from-slate-50 to-red-50/40 p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-sm">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Indore Pilot Launch</h4>
                  <p className="text-xs text-slate-500 font-medium">Madhya Pradesh, India</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Hyperlocal Radius:</strong> Focused 3–5 km clusters preserving fast delivery and relationship trust.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Multi-Category Breadth:</strong> Grocery, fresh produce, Apollo & local pharmacies, household items, and home services.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Merchant Dignity:</strong> Transparent commissions, fast settlements, and direct customer ownership.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C & D: OUR MISSION & VISION */}
      <section id="mission-vision" className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Mission & Vision
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              The foundational guiding principles powering Everything Local every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Our Mission Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-2 h-full bg-red-600 absolute left-0 top-0"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                  Our Mission
                </h3>
              </div>
              <blockquote className="text-base sm:text-lg font-bold text-slate-900 leading-snug my-4 border-l-2 border-red-500 pl-4 italic">
                “To strengthen local commerce by helping independent businesses participate in the digital economy and connect with more customers.”
              </blockquote>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                We measure our success by the resilience and revenue growth of local merchants in every neighbourhood we serve.
              </p>
            </div>

            {/* Our Vision Card */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-2 h-full bg-slate-900 absolute left-0 top-0"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                  Our Vision
                </h3>
              </div>
              <blockquote className="text-base sm:text-lg font-bold text-slate-900 leading-snug my-4 border-l-2 border-slate-900 pl-4 italic">
                “To build a connected local commerce ecosystem where neighbourhood businesses can grow digitally and customers can conveniently discover what their communities offer.”
              </blockquote>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                A sustainable, community-first commercial future where technology enriches physical neighbourhoods rather than hollowing them out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: HOW IT WORKS */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white border-b border-slate-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Simple, Transparent Commerce</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How It Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A straightforward three-step experience connecting community demand with local supply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-sm transition-all text-center group">
              <div className="w-14 h-14 rounded-2xl bg-red-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Discover
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Customers explore verified local businesses, daily staples, grocery categories, pharmacies, and trusted home service providers in their neighbourhood.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-sm transition-all text-center group">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Connect
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Customers find authentic products, check live availability, and place orders directly with participating merchants using convenient payment options.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-sm transition-all text-center group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                Shop Local
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Orders are fulfilled through supported merchant delivery, store counter pickup, or available local delivery partners based on customer preference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F: OUR COMMITMENT */}
      <section id="commitment" className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Our Commitment
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Upholding standard-setting ethics, fairness, and accountability for Indian neighbourhood commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Supporting Independent Merchants</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowering neighbourhood stores to safeguard local livelihoods, retain direct relationships, and operate with fair, predictable commission structures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Improving Digital Visibility</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Providing local merchants with digital store profiles, product catalogs, and search indexing to connect them with residents across their neighbourhood.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Making Local Discovery Easier</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enabling frictionless search across grocery, fresh produce, pharmacies, and service providers without endless phone calls or physical store hopping.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Reliable & Accessible Experience</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Providing transparent pricing, live stock accuracy, secure digital checkout, and verified merchant credentials across all orders.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/80 space-y-2.5 sm:col-span-2 lg:col-span-2">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Connecting Customers & Businesses Through Technology</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leveraging thoughtfully crafted technology rooted in Indian retail habits to strengthen local community bonds, boost economic circulation, and foster lasting neighbourhood trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G: FREQUENTLY ASKED QUESTIONS */}
      <section id="faqs" className="py-16 md:py-20 bg-white border-b border-slate-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Common answers about our marketplace, ordering, fulfillment, and merchant participation.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="border border-slate-200/80 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-red-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION H: CONTACT US & SUPPORT DESK */}
      <section id="contact" className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-100 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Contact Information */}
            <div className="md:col-span-5 space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Support & Assistance</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Contact Us
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Have questions, merchant inquiries, or need assistance with your local shopping experience? Our Indore team is ready to assist.
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <Phone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phone Support</h5>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">+91 731 400 8899</p>
                    <p className="text-[11px] text-slate-500">8:00 AM – 10:00 PM IST (Mon – Sun)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <Mail className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Email Inquiries</h5>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">support@everythinglocal.in</p>
                    <p className="text-[11px] text-slate-500">Response within 2–4 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Operational Hub</h5>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">Palasia & Vijay Nagar, Indore</p>
                    <p className="text-[11px] text-slate-500">Madhya Pradesh 452001, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Inquiry Form */}
            <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Send Us a Message
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Fill in your details below and our local support representative will get back to you promptly.
              </p>

              {contactSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Thank you for reaching out!</p>
                    <p className="text-xs text-emerald-700">Your message has been received. Our Indore support team will respond shortly.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="e.g. Vikram Sharma"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email or Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.emailOrPhone}
                        onChange={(e) => setContactForm({ ...contactForm, emailOrPhone: e.target.value })}
                        placeholder="e.g. vikram@example.com or 98260XXXXX"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Merchant Partnership">Merchant Partnership</option>
                      <option value="Customer Order Help">Customer Order Help</option>
                      <option value="Delivery Partner Program">Delivery Partner Program</option>
                      <option value="Feedback & Suggestions">Feedback & Suggestions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Please let us know how we can assist you..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION I: REPORT AN ISSUE */}
      <section id="report" className="py-16 md:py-20 bg-white border-b border-slate-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-slate-50 to-red-50/30 border border-slate-200/80 shadow-2xs">
            <div className="max-w-xl mx-auto text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Report an Issue
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                Encountered an issue with an order, a merchant listing, or website functionality? Report it directly to our quality and trust team for swift resolution.
              </p>
            </div>

            {issueSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-center gap-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Issue Report Submitted Successfully!</p>
                  <p className="text-xs text-emerald-700">Ticket Reference: #EL-INC-{Math.floor(100000 + Math.random() * 900000)}. Our support desk is reviewing your ticket.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueSubmit} className="max-w-xl mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={issueForm.name}
                      onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
                      placeholder="e.g. Ayush Prakash"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Contact Details *
                    </label>
                    <input
                      type="text"
                      required
                      value={issueForm.contact}
                      onChange={(e) => setIssueForm({ ...issueForm, contact: e.target.value })}
                      placeholder="Phone or registered email"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Category
                  </label>
                  <select
                    value={issueForm.issueType}
                    onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Order Support">Order Delayed or Damaged</option>
                    <option value="Merchant Listing">Incorrect Store / Item Information</option>
                    <option value="Payment Issue">Payment Deducted But Order Pending</option>
                    <option value="Delivery Partner">Delivery Partner Feedback</option>
                    <option value="Technical Bug">Website / App Technical Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Describe the Issue *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                    placeholder="Provide relevant details (e.g. order number, store name, or description of what occurred)..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Submit Issue Report</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsView;
