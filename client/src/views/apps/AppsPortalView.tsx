import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import {
  Smartphone,
  Download,
  CheckCircle2,
  ShieldCheck,
  Clock,
  HardDrive,
  FileCode2,
  ArrowLeft
} from 'lucide-react';

interface AppsPortalViewProps {
  onBackHome: () => void;
}

function resolveDownloadUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return path;
    }
    return `https://everything-local-api.everything-local.workers.dev${path}`;
  }
  return path;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export const AppsPortalView: React.FC<AppsPortalViewProps> = ({ onBackHome }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadApps = async () => {
      setLoading(true);
      try {
        const res = await request<{ apps: any[] }>('/apps');
        setApps(res.apps || []);
      } catch (err) {
        console.error('Failed to load apps:', err);
      } finally {
        setLoading(false);
      }
    };
    loadApps();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Hero */}
      <section className="bg-[#0B1F3B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to EveryBazaar</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-amber-300 mb-3">
                <Smartphone className="w-3.5 h-3.5" />
                <span>EveryBazaar App Download Centre • Official Android Builds</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                EveryBazaar in Your Pocket
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-2.5 max-w-2xl">
                Choose your EveryBazaar app and manage your business, deliveries or shopping from anywhere.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-white">Verified Signed APKs</p>
                <p className="text-[11px] text-slate-400">SHA-256 verified & served directly from Cloudflare R2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four App Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#0B1F3B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Checking published Android releases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map((app) => {
              const rel = app.latestRelease;
              const isPublished = Boolean(rel && rel.downloadUrl);

              return (
                <div
                  key={app.appType}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-5">
                    {/* Top: Icon + Name + Platform */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#0B1F3B] p-2 flex items-center justify-center shrink-0 border border-slate-200 shadow-xs overflow-hidden">
                        <img
                          src={app.iconPath || '/brand/everybazaar-official-logo.png'}
                          alt={app.appName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-slate-900">{app.appName}</h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                            {app.platform}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{app.description}</p>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {(app.features || []).map((feat: string) => (
                        <div key={feat} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Release Metadata Box */}
                    {isPublished ? (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Version</span>
                            <span className="font-black text-slate-900">
                              v{rel.versionName} ({rel.versionCode})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">APK Size</span>
                            <span className="font-black text-slate-900 flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-slate-500" />
                              {formatBytes(rel.fileSizeBytes)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Last Updated</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {rel.publishedAt ? new Date(rel.publishedAt).toLocaleDateString() : 'Published'}
                            </span>
                          </div>
                        </div>

                        {rel.minAndroidVersion && (
                          <p className="text-[11px] font-semibold text-slate-600">
                            Minimum Android: <strong className="text-slate-800">{rel.minAndroidVersion}</strong> • Package: <code className="text-[10px]">{app.packageId}</code>
                          </p>
                        )}

                        {rel.releaseNotes && (
                          <div className="pt-2 border-t border-slate-200/70">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedNotes((prev) => ({ ...prev, [app.appType]: !prev[app.appType] }))
                              }
                              className="text-[11px] font-black text-[#0B1F3B] hover:underline flex items-center gap-1"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                              <span>{expandedNotes[app.appType] ? 'Hide Release Notes' : 'View Release Notes'}</span>
                            </button>
                            {expandedNotes[app.appType] && (
                              <p className="text-xs text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                                {rel.releaseNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 flex items-center justify-between">
                        <span>No published APK build available yet.</span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black text-[10px] uppercase">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Download CTA */}
                  <div>
                    {isPublished ? (
                      <a
                        href={resolveDownloadUrl(rel.downloadUrl)}
                        download
                        className="w-full py-3.5 px-5 rounded-2xl bg-[#0B1F3B] hover:bg-slate-800 text-white text-sm font-black flex items-center justify-center gap-2 transition shadow-xs"
                      >
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>{app.ctaLabel}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 px-5 rounded-2xl bg-slate-200 text-slate-500 text-sm font-black cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Coming Soon</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
