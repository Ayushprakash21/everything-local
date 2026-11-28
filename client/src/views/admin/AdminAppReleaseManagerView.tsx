import React, { useState, useEffect } from 'react';
import { request } from '../../api/client';
import {
  Smartphone,
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Download,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

type AppType = 'CUSTOMER' | 'SELLER' | 'DELIVERY_PARTNER' | 'WHOLESALER';

const APP_TABS: Array<{ id: AppType; label: string }> = [
  { id: 'CUSTOMER', label: 'Customer' },
  { id: 'SELLER', label: 'Seller' },
  { id: 'DELIVERY_PARTNER', label: 'Delivery Partner' },
  { id: 'WHOLESALER', label: 'Wholesaler' }
];

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

export const AdminAppReleaseManagerView: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppType>('CUSTOMER');
  const [releases, setReleases] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState('1');
  const [minAndroidVersion, setMinAndroidVersion] = useState('7.0 (API 24)');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const res = await request<{ releases: any[]; totalDownloads: number }>('/admin/app-releases');
      setReleases(res.releases || []);
      setTotalDownloads(res.totalDownloads || 0);
    } catch (err) {
      console.error('Failed to load app releases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const appReleases = releases.filter((r) => r.appType === activeApp);
  const latestPublished = appReleases.find((r) => r.status === 'PUBLISHED' && r.isLatest);
  const draftReleases = appReleases.filter((r) => r.status === 'DRAFT');
  const appDownloads = appReleases.reduce((sum, r) => sum + (r.downloadCount || 0), 0);

  const handleUploadApk = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!apkFile) {
      setUploadError('Please select a valid .apk file');
      return;
    }
    if (!apkFile.name.toLowerCase().endsWith('.apk')) {
      setUploadError('Invalid file extension. Only .apk Android packages are allowed.');
      return;
    }
    if (!releaseNotes.trim()) {
      setUploadError('Release notes are required before uploading.');
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      // 1. Compute SHA-256 checksum locally
      const fileBuf = await apkFile.arrayBuffer();
      const hashBuf = await crypto.subtle.digest('SHA-256', fileBuf);
      const sha256Checksum = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // 2. Start R2 Multipart Upload
      const startRes = await request<{ uploadId: string; objectKey: string }>('/admin/app-releases/multipart/start', {
        method: 'POST',
        body: JSON.stringify({
          appType: activeApp,
          versionName: versionName.trim(),
          versionCode: Number(versionCode),
          fileName: apkFile.name,
          fileSizeBytes: apkFile.size
        })
      });

      // 3. Stream 5MB chunks directly to R2 multipart endpoint
      const CHUNK_SIZE = 5 * 1024 * 1024;
      const totalChunks = Math.ceil(apkFile.size / CHUNK_SIZE);
      const parts: Array<{ partNumber: number; etag: string }> = [];
      const token = localStorage.getItem('el_token');
      const apiBase =
        typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))
          ? ''
          : 'https://everything-local-api.everything-local.workers.dev';

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(apkFile.size, start + CHUNK_SIZE);
        const chunk = apkFile.slice(start, end);
        const partNumber = i + 1;

        const partUrl = `${apiBase}/api/admin/app-releases/multipart/part?objectKey=${encodeURIComponent(startRes.objectKey)}&uploadId=${encodeURIComponent(startRes.uploadId)}&partNumber=${partNumber}`;
        const partResp = await fetch(partUrl, {
          method: 'PUT',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: chunk
        });
        if (!partResp.ok) {
          const errJson = await partResp.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed uploading chunk ${partNumber}`);
        }
        const partData = await partResp.json();
        parts.push({ partNumber: partData.partNumber, etag: partData.etag });
        setUploadProgress(Math.min(95, Math.round(((i + 1) / totalChunks) * 90) + 5));
      }

      // 4. Complete Multipart Upload & create DRAFT record
      await request('/admin/app-releases/multipart/complete', {
        method: 'POST',
        body: JSON.stringify({
          objectKey: startRes.objectKey,
          uploadId: startRes.uploadId,
          parts,
          appType: activeApp,
          versionName: versionName.trim(),
          versionCode: Number(versionCode),
          releaseNotes: releaseNotes.trim(),
          minAndroidVersion: minAndroidVersion.trim(),
          visibility,
          sha256Checksum
        })
      });

      setUploadProgress(100);
      setUploadSuccess(`Uploaded ${activeApp} v${versionName} (${versionCode}) as DRAFT. Review and click Publish when ready.`);
      setApkFile(null);
      setReleaseNotes('');
      await loadReleases();
    } catch (err: any) {
      setUploadError(err.message || 'APK upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (rel: any) => {
    if (!confirm(`Publish ${rel.appName} v${rel.versionName} (${rel.versionCode}) as the live latest download?`)) return;
    try {
      await request(`/admin/app-releases/${rel.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ markAsLatest: true })
      });
      await loadReleases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnpublish = async (rel: any) => {
    if (!confirm(`Unpublish ${rel.appName} v${rel.versionName}? It will no longer be downloadable by users.`)) return;
    try {
      await request(`/admin/app-releases/${rel.id}/unpublish`, { method: 'POST' });
      await loadReleases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRollback = async (rel: any) => {
    if (!confirm(`Roll back latest public release for ${rel.appName} to v${rel.versionName} (${rel.versionCode})?`)) return;
    try {
      await request(`/admin/app-releases/${rel.id}/rollback`, { method: 'POST' });
      await loadReleases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (rel: any) => {
    if (!confirm(`Permanently delete ${rel.appName} v${rel.versionName} and remove its APK from R2?`)) return;
    try {
      await request(`/admin/app-releases/${rel.id}`, { method: 'DELETE' });
      await loadReleases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#0B1F3B]" />
            <span>App Release Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload signed Android APKs to Cloudflare R2 (`app-releases/`) and manage public releases for `/apps`. Total platform downloads: <strong>{totalDownloads}</strong>
          </p>
        </div>

        {/* 4 App Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {APP_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveApp(tab.id);
                setUploadError(null);
                setUploadSuccess(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                activeApp === tab.id
                  ? 'bg-[#0B1F3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Latest Published Version</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {latestPublished ? `v${latestPublished.versionName} (${latestPublished.versionCode})` : 'Not Published'}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Draft Releases</span>
          <span className="text-lg font-black text-amber-700 mt-1 block">{draftReleases.length}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">App Download Metrics</span>
          <span className="text-lg font-black text-emerald-700 mt-1 block">{appDownloads} downloads</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload New APK Form */}
        <form onSubmit={handleUploadApk} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 h-fit">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#0B1F3B]" />
            <span>Upload New APK ({activeApp})</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Uploads are saved as <strong>DRAFT</strong> in R2 and require explicit Publish confirmation.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Android APK File (.apk)</label>
              <input
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs"
              />
              {apkFile && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Selected: <strong>{apkFile.name}</strong> ({formatBytes(apkFile.size)})
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Version Name</label>
                <input
                  type="text"
                  required
                  placeholder="1.0.0"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Version Code</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={versionCode}
                  onChange={(e) => setVersionCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min Android Version</label>
                <input
                  type="text"
                  value={minAndroidVersion}
                  onChange={(e) => setMinAndroidVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="INTERNAL">INTERNAL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Release Notes</label>
              <textarea
                required
                rows={3}
                placeholder="What's new in this build..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            {uploading && (
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-[#0B1F3B] h-2 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-[#0B1F3B] hover:bg-slate-800 disabled:opacity-50 text-white font-black"
            >
              {uploading ? 'Uploading APK to R2...' : 'Upload APK as Draft'}
            </button>
          </div>
        </form>

        {/* Release History */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-base font-black text-slate-900">Release History ({appReleases.length})</h3>
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500">Loading releases...</div>
          ) : appReleases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-xs text-slate-500">
              No APK releases uploaded yet for {activeApp}.
            </div>
          ) : (
            appReleases.map((rel) => (
              <div key={rel.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        v{rel.versionName} (Code {rel.versionCode})
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          rel.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rel.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rel.status}
                      </span>
                      {rel.isLatest && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0B1F3B] text-amber-400 text-[10px] font-black uppercase">
                          LATEST LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Size: {formatBytes(rel.fileSizeBytes)} • Downloads: {rel.downloadCount} • Uploaded: {new Date(rel.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600 mt-1.5">{rel.releaseNotes}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {rel.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handlePublish(rel)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                      >
                        Publish
                      </button>
                    )}
                    {rel.status === 'PUBLISHED' && !rel.isLatest && (
                      <button
                        onClick={() => handleRollback(rel)}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Set Latest / Rollback
                      </button>
                    )}
                    {rel.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleUnpublish(rel)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                      >
                        Unpublish
                      </button>
                    )}
                    {!(rel.status === 'PUBLISHED' && rel.isLatest) && (
                      <button
                        onClick={() => handleDelete(rel)}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                        title="Delete Release"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
