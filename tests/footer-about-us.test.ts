import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('EveryBazaar — Footer Navigation & Dedicated About Us Page Suite', () => {
  const footerFilePath = path.resolve(__dirname, '../client/src/components/layout/Footer.tsx');
  const aboutUsFilePath = path.resolve(__dirname, '../client/src/views/about/AboutUsView.tsx');
  const appFilePath = path.resolve(__dirname, '../client/src/App.tsx');
  const currentYear = new Date().getFullYear();

  describe('1. Footer Navigation Structure & Column Requirements', () => {
    it('verifies Footer component file exists', () => {
      expect(fs.existsSync(footerFilePath)).toBe(true);
    });

    const footerContent = fs.existsSync(footerFilePath)
      ? fs.readFileSync(footerFilePath, 'utf8')
      : '';

    it('Column 1: Brand includes logo, brand name and exact EveryBazaar tagline', () => {
      expect(footerContent).toContain('Every');
      expect(footerContent).toContain('Bazaar');
      expect(footerContent).toContain('Shop more. Save more. Live better.');
      expect(footerContent).toContain('everybazaar-symbol.svg');
    });

    it('Column 2: About Us includes header and functional section anchors', () => {
      expect(footerContent).toContain('About Us');
      expect(footerContent).toContain('/about-us');
      expect(footerContent).toContain('Our Story');
      expect(footerContent).toContain('/about-us#story');
      expect(footerContent).toContain('Mission & Vision');
      expect(footerContent).toContain('/about-us#mission-vision');
      expect(footerContent).toContain('How It Works');
      expect(footerContent).toContain('/about-us#how-it-works');
    });

    it('Column 3: Help & Support includes non-dead navigation destinations', () => {
      expect(footerContent).toContain('Help & Support');
      expect(footerContent).toContain('FAQs');
      expect(footerContent).toContain('/about-us#faqs');
      expect(footerContent).toContain('Contact Us');
      expect(footerContent).toContain('/about-us#contact');
      expect(footerContent).toContain('Report an Issue');
      expect(footerContent).toContain('/about-us#report');
    });

    it('Column 4: For Businesses links to onboarding and partner destinations', () => {
      expect(footerContent).toContain('For Businesses');
      expect(footerContent).toContain('Sell on EveryBazaar');
      expect(footerContent).toContain('Merchant Support');
      expect(footerContent).toContain('Partner with Us');
    });

    it('Column 5: Follow Us contains verified social media platforms', () => {
      expect(footerContent).toContain('Follow Us');
      expect(footerContent).toContain('https://www.youtube.com');
      expect(footerContent).toContain('https://www.instagram.com');
      expect(footerContent).toContain('https://www.facebook.com');
      expect(footerContent).toContain('https://www.linkedin.com');
      expect(footerContent).toContain('https://x.com');
    });

    it('enforces column divider styling', () => {
      expect(footerContent).toContain('md:divide-x');
    });

    it('renders exact copyright statement with dynamic year and emphasized name', () => {
      expect(footerContent).toContain('{currentYear}');
      expect(footerContent).toContain('All Rights Reserved to');
      expect(footerContent).toContain('Ayush Prakash');
      expect(footerContent).toContain('Every');
      expect(footerContent).toContain('Bazaar');
    });
  });

  describe('2. Dedicated About Us Page Content & Structure (/about-us)', () => {
    it('verifies AboutUsView file exists', () => {
      expect(fs.existsSync(aboutUsFilePath)).toBe(true);
    });

    const aboutContent = fs.existsSync(aboutUsFilePath)
      ? fs.readFileSync(aboutUsFilePath, 'utf8')
      : '';

    it('A. Hero Section has exact heading, subtitle and introductory narrative', () => {
      expect(aboutContent).toContain('About EveryBazaar');
      expect(aboutContent).toContain('Shop more. Save more. Live better.');
      expect(aboutContent).toContain('Hyperlocal');
    });

    it('B. Our Story section connects customers with neighbourhood businesses', () => {
      expect(aboutContent).toContain('id="story"');
      expect(aboutContent).toContain('Our Story');
      expect(aboutContent).toContain(
        'EveryBazaar is a digital marketplace designed to connect customers with neighbourhood businesses across India.'
      );
      expect(aboutContent).toContain(
        'The platform aims to give independent merchants digital visibility'
      );
    });

    it('C. Our Mission contains verbatim required statement', () => {
      expect(aboutContent).toContain('Our Mission');
      expect(aboutContent).toContain(
        'To strengthen local commerce by helping independent businesses participate in the digital economy and connect with more customers.'
      );
    });

    it('D. Our Vision contains verbatim required statement', () => {
      expect(aboutContent).toContain('Our Vision');
      expect(aboutContent).toContain(
        'To build a connected local commerce ecosystem where neighbourhood businesses can grow digitally and customers can conveniently discover what their communities offer.'
      );
    });

    it('E. How It Works details 3 honest steps without artificial 10-minute promises', () => {
      expect(aboutContent).toContain('id="how-it-works"');
      expect(aboutContent).toContain('Discover');
      expect(aboutContent).toContain('Connect');
      expect(aboutContent).toContain('Shop Local');
      expect(aboutContent).not.toContain('10-minute delivery');
      expect(aboutContent).not.toContain('guaranteed lowest price');
    });

    it('F. Our Commitment covers merchant support, digital visibility & technology', () => {
      expect(aboutContent).toContain('id="commitment"');
      expect(aboutContent).toContain('Our Commitment');
      expect(aboutContent).toContain('Supporting Independent Merchants');
      expect(aboutContent).toContain('Improving Digital Visibility');
      expect(aboutContent).toContain('Making Local Discovery Easier');
      expect(aboutContent).toContain('Reliable & Accessible Experience');
      expect(aboutContent).toContain('Connecting Customers & Businesses Through Technology');
    });

    it('G. FAQs, H. Contact Us & I. Report Issue sections are implemented with functional details', () => {
      expect(aboutContent).toContain('id="faqs"');
      expect(aboutContent).toContain('Frequently Asked Questions');
      expect(aboutContent).toContain('id="contact"');
      expect(aboutContent).toContain('Contact Us');
      expect(aboutContent).toContain('+91 731 400 8899');
      expect(aboutContent).toContain('support@everybazaar.in');
      expect(aboutContent).toContain('Palasia & Vijay Nagar, Indore');
      expect(aboutContent).toContain('id="report"');
      expect(aboutContent).toContain('Report an Issue');
    });

    it('updates document title and meta description dynamically for SEO', () => {
      expect(aboutContent).toContain('About Us — EveryBazaar | Shop more. Save more. Live better.');
      expect(aboutContent).toContain('meta[name="description"]');
    });
  });

  describe('3. Application Routing & Integration (/about-us route)', () => {
    const appContent = fs.existsSync(appFilePath) ? fs.readFileSync(appFilePath, 'utf8') : '';

    it('integrates AboutUsView and modern Footer in App.tsx', () => {
      expect(appContent).toContain("import { AboutUsView } from './views/about/AboutUsView'");
      expect(appContent).toContain("import { Footer } from './components/layout/Footer'");
    });

    it('handles /about-us route with HTML5 history and scroll support', () => {
      expect(appContent).toContain("currentRoute === 'about'");
      expect(appContent).toContain('/about-us');
      expect(appContent).toContain('popstate');
      expect(appContent).toContain('hashchange');
      expect(appContent).toContain('window.history.pushState');
    });

    it('ensures old footer copyright statement is purged from App.tsx', () => {
      expect(appContent).not.toContain('Everything Local Technologies Pvt Ltd. All rights reserved.');
    });
  });
});
