import React from 'react';
import { ChevronRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (pathAndHash: string) => void;
  onOpenMerchant?: () => void;
  onOpenRider?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenMerchant,
  onOpenRider
}) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent, pathAndHash: string) => {
    e.preventDefault();
    onNavigate(pathAndHash);
  };

  return (
    <footer className="w-full bg-white border-t border-slate-200/80 mt-16 sm:mt-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        {/* Main 5-Column Navigation Grid with Clean Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-0 md:divide-x md:divide-slate-200/80 items-start">
          
          {/* COLUMN 1 — BRAND */}
          <div className="md:pr-6 lg:pr-8 flex flex-col items-start space-y-2">
            <button
              onClick={(e) => handleLinkClick(e, '/')}
              className="group flex flex-col items-start text-left focus:outline-none cursor-pointer"
              title="EveryBazaar — Home"
            >
              {/* EveryBazaar Brand Logo Symbol */}
              <div className="flex items-center gap-2 mb-1.5 group-hover:scale-105 transition-transform">
                <img
                  src="/brand/everybazaar-symbol.svg"
                  alt="EveryBazaar Symbol"
                  className="w-10 h-10 object-contain drop-shadow-2xs shrink-0"
                />
              </div>

              {/* Brand Name */}
              <span className="text-slate-900 font-extrabold text-lg tracking-tight group-hover:text-amber-500 transition-colors">
                Every<span className="text-[#F5B82E]">Bazaar</span>
              </span>
            </button>

            {/* Brand Tagline */}
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Shop more. Save more. Live better.
            </p>
          </div>

          {/* COLUMN 2 — ABOUT US */}
          <div className="md:px-6 lg:px-8 flex flex-col items-start">
            <button
              onClick={(e) => handleLinkClick(e, '/about-us')}
              className="group inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors cursor-pointer"
            >
              <span>About Us</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </button>
            {/* Visual Orange Accent Underline Bar */}
            <div className="w-12 h-0.5 bg-[#F5B82E] mt-1 mb-3.5 rounded-full"></div>

            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#story')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#mission-vision')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Mission & Vision
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#how-it-works')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 — HELP & SUPPORT */}
          <div className="md:px-6 lg:px-8 flex flex-col items-start">
            <h4 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
              Help & Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#faqs')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#contact')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/about-us#report')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Report an Issue
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 — FOR BUSINESSES */}
          <div className="md:px-6 lg:px-8 flex flex-col items-start">
            <h4 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
              For Businesses
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  onClick={() => {
                    if (onOpenMerchant) onOpenMerchant();
                    else onNavigate('/#merchant');
                  }}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Sell on EveryBazaar
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onOpenMerchant) onOpenMerchant();
                    else onNavigate('/#merchant');
                  }}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Merchant Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onOpenRider) onOpenRider();
                    else onNavigate('/#rider');
                  }}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer"
                >
                  Partner with Us
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/wholesale')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer font-semibold text-slate-800"
                >
                  Wholesale Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLinkClick(e, '/apps')}
                  className="hover:text-amber-600 transition-colors text-left cursor-pointer font-semibold text-amber-700"
                >
                  Download Apps
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 5 — FOLLOW US */}
          <div className="md:pl-6 lg:pl-8 flex flex-col items-start">
            <h4 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
              Follow Us
            </h4>
            
            {/* Social Media Icons Row */}
            <div className="flex items-center gap-2.5">
              {/* YouTube */}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="w-7 h-7 rounded-md bg-[#FF0000] text-white flex items-center justify-center hover:scale-110 hover:shadow-xs transition-all duration-150"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 hover:shadow-xs transition-all duration-150"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-7 h-7 rounded-md bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 hover:shadow-xs transition-all duration-150"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="w-7 h-7 rounded-md bg-[#0A66C2] text-white flex items-center justify-center hover:scale-110 hover:shadow-xs transition-all duration-150"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                title="X"
                className="w-7 h-7 rounded-md bg-[#000000] text-white flex items-center justify-center hover:scale-110 hover:shadow-xs transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <hr className="border-t border-slate-200/80 mt-10 mb-6" />

        {/* COPYRIGHT SECTION */}
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-500 font-normal tracking-wide">
            © {currentYear} <span className="font-bold text-slate-900">Every<span className="text-[#F5B82E]">Bazaar</span></span>. All Rights Reserved to{' '}
            <span className="font-semibold text-slate-900">Ayush Prakash</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
