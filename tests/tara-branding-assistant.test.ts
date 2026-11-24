import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/index';
import fs from 'fs';
import path from 'path';

describe('Everything Local — Tara Shopping Saathi & Official Branding Acceptance Tests', () => {
  let customerToken: string;

  beforeAll(async () => {
    // Authenticate a customer user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrPhone: 'ayush@example.com', password: 'Password@123' });
    customerToken = loginRes.body.token;
  });

  describe('1. Shopping Assistant (Tara) Backend Integration', () => {
    it('returns Tara brand identity in conversational assistant greeting', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Hello' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(res.body.reply).toContain("Namaste! I'm Tara, your local shopping saathi for Indore");
      expect(res.body.reply).toContain("Compare prices of daily groceries");
      expect(res.body.suggestedPrompts).toBeDefined();
      expect(res.body.suggestedPrompts.length).toBeGreaterThan(0);
    });

    it('retains smart recipe-to-shopping-list discovery in Indore stores', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'What ingredients do I need for Indori Poha breakfast?' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toContain('Indore Breakfast & Poha shopping list');
      expect(res.body.suggestedItems).toEqual(expect.arrayContaining(['Poha', 'Sev']));
    });

    it('preserves multi-store price comparison across local retailers', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ message: 'Compare prices of Atta and Oil' });

      expect(res.status).toBe(200);
      expect(res.body.reply).toContain('compared live prices across Indore retailers');
    });
  });

  describe('2. Brand Tagline & Customer UI Audit (Zero Copilot Regressions)', () => {
    it('ensures client/src has zero customer-facing occurrences of "AI Shopping Copilot" or "AI Copilot"', () => {
      const clientSrcDir = path.resolve(__dirname, '../client/src');

      function scanDir(dir: string, matches: string[] = []): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const fullPath = path.join(dir, e.name);
          if (e.isDirectory()) {
            scanDir(fullPath, matches);
          } else if (e.isFile() && /\.(tsx|ts|html)$/.test(e.name)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('AI Shopping Copilot') || content.includes('<span>AI Copilot</span>')) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const copilotOccurrences = scanDir(clientSrcDir);
      expect(copilotOccurrences).toEqual([]);
    });

    it('ensures official brand tagline "Made for India. Rooted in Local." is present in brand SVG logos', () => {
      const logoSvg = fs.readFileSync(
        path.resolve(__dirname, '../client/public/brand/everything-local-logo-horizontal.svg'),
        'utf8'
      );
      expect(logoSvg).toContain('Made for India. Rooted in Local.');
      expect(logoSvg).not.toContain('Shop more. Save more. Live better.');
    });

    it('ensures client index.html displays official tagline in title and meta description', () => {
      const indexHtml = fs.readFileSync(path.resolve(__dirname, '../client/index.html'), 'utf8');
      expect(indexHtml).toContain('Everything Local | Made for India. Rooted in Local.');
      expect(indexHtml).toContain('Made for India. Rooted in Local.');
    });

    it('ensures CustomerHome.tsx includes dedicated branding section and supporting copy', () => {
      const customerHome = fs.readFileSync(
        path.resolve(__dirname, '../client/src/views/customer/CustomerHome.tsx'),
        'utf8'
      );
      expect(customerHome).toContain('Made for India. Rooted in Local.');
      expect(customerHome).toContain('Discover neighbourhood stores, shop locally and get what you need.');
      expect(customerHome).toContain('100% Local Kirana Network');
    });

    it('ensures client footer displays official tagline and supporting message', () => {
      const appTsx = fs.readFileSync(path.resolve(__dirname, '../client/src/App.tsx'), 'utf8');
      expect(appTsx).toContain('Made for India. Rooted in Local.');
      expect(appTsx).toContain('Discover neighbourhood stores, shop locally and get what you need.');
      expect(appTsx).toContain('✨ Ask Tara');
    });

    it('ensures AIAssistantModal features Tara display name and welcome message', () => {
      const modal = fs.readFileSync(
        path.resolve(__dirname, '../client/src/components/AIAssistantModal.tsx'),
        'utf8'
      );
      expect(modal).toContain("Namaste! I'm Tara, your local shopping saathi. Looking for something? I can help you discover products and local stores around you.");
      expect(modal).toContain('Your Local Shopping Saathi');
      expect(modal).toContain('Ask Tara Chat');
    });
  });

  describe('3. Native Android Customer App Brand Alignment', () => {
    it('ensures Android BrandLogos.kt displays official tagline', () => {
      const brandLogos = fs.readFileSync(
        path.resolve(__dirname, '../android-native/core/designsystem/src/main/java/com/ayushp0021/everythinglocal/core/designsystem/BrandLogos.kt'),
        'utf8'
      );
      expect(brandLogos).toContain('Made for India. Rooted in Local.');
      expect(brandLogos).not.toContain('Shop more. Save more. Live better.');
    });

    it('ensures Android HomeScreen.kt has Ask Tara pill and Made for India brand ribbon', () => {
      const homeScreen = fs.readFileSync(
        path.resolve(__dirname, '../android-native/customer/app/src/main/java/com/ayushp0021/everythinglocal/ui/HomeScreen.kt'),
        'utf8'
      );
      expect(homeScreen).toContain('✨ Ask Tara');
      expect(homeScreen).toContain('Made for India. Rooted in Local.');
      expect(homeScreen).toContain('Discover neighbourhood stores, shop locally and get what you need.');
      expect(homeScreen).toContain("Namaste! I'm Tara, your local shopping saathi. Looking for something? I can help you discover products and local stores around you.");
    });

    it('ensures Android ProfileScreen.kt displays official brand tagline and mission in about section', () => {
      const profileScreen = fs.readFileSync(
        path.resolve(__dirname, '../android-native/customer/app/src/main/java/com/ayushp0021/everythinglocal/ui/ProfileScreen.kt'),
        'utf8'
      );
      expect(profileScreen).toContain('Made for India. Rooted in Local.');
      expect(profileScreen).toContain('Discover neighbourhood stores, shop locally and get what you need.');
    });
  });
});
