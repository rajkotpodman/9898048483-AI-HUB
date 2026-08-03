'use client';
import { useState, useEffect } from 'react';
import { X, Cloud, HardDrive, CheckCircle2, RefreshCw } from 'lucide-react';
import { useSyncEngine } from '../lib/sync/useSyncEngine';

export default function CloudBackupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isSyncing, lastSyncTime, connectGoogleDrive, connectOneDrive, triggerManualSync, logout } = useSyncEngine();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-sync-modal', handleOpen);
    return () => window.removeEventListener('open-sync-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl relative">
        <button onClick={() => setIsOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
          <Cloud className="text-blue-400" />
          Cloud Backup Settings
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect your cloud storage providers to automatically backup your conversations and generated code offline.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <HardDrive className="text-emerald-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Google Drive</h3>
                <p className="text-xs text-slate-400">Save to /AI_Hub_Vault</p>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="flex flex-col items-end">
                <span className="text-xs text-emerald-400 flex items-center gap-1 mb-1 font-medium">
                  <CheckCircle2 size={12} /> Connected
                </span>
                <button onClick={logout} className="text-[10px] text-slate-500 hover:text-slate-300">Disconnect</button>
              </div>
            ) : (
              <button 
                onClick={connectGoogleDrive}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/50 flex items-center justify-between opacity-80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Cloud className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">OneDrive (Mock)</h3>
                <p className="text-xs text-slate-400">Save to /AI_Hub_Vault</p>
              </div>
            </div>
            <button 
              onClick={connectOneDrive}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Connect
            </button>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Last synced: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </div>
            <button 
              onClick={triggerManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
