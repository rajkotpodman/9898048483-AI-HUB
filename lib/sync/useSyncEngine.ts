'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { addTask, SyncTask } from './db';
import { getAccessToken, initAuth, googleSignIn, logout } from '../auth';

export function useSyncEngine() {
  const workerRef = useRef<Worker | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize Worker if crossOriginIsolated
    if (typeof window !== 'undefined' && window.crossOriginIsolated) {
      try {
        workerRef.current = new Worker(new URL('./syncWorker.ts', import.meta.url));

        workerRef.current.onmessage = (e) => {
          const { type, taskId, filename, error } = e.data;
          if (type === 'SYNC_SUCCESS') {
            console.log(`[SyncEngine] Successfully synced ${filename}`);
            setLastSyncTime(new Date());
          } else if (type === 'SYNC_ERROR') {
            console.error(`[SyncEngine] Failed to sync ${filename}: ${error}`);
          }
        };
      } catch (e) {
        console.warn("Failed to initialize sync worker:", e);
      }
    }

    // Listen to Firebase Auth state
    const unsubscribe = initAuth(
      async (user, token) => {
        setIsAuthenticated(true);
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: 'SET_TOKENS',
            payload: { googleAccessToken: token }
          });
        }
      },
      () => {
        setIsAuthenticated(false);
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: 'SET_TOKENS',
            payload: { googleAccessToken: null }
          });
        }
      }
    );

    return () => {
      workerRef.current?.terminate();
      unsubscribe();
    };
  }, []);

  const queueSync = useCallback(async (
    type: 'CONVERSATION' | 'CODE',
    filename: string,
    content: string,
    provider: 'GOOGLE_DRIVE' | 'ONEDRIVE' = 'GOOGLE_DRIVE'
  ) => {
    setIsSyncing(true);
    try {
      await addTask({
        type,
        filename,
        content,
        provider
      });
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'START_SYNC' });
      }
    } catch (e) {
      console.error('Error adding task to queue', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const triggerManualSync = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'START_SYNC' });
    }
  }, []);

  const connectGoogleDrive = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        workerRef.current?.postMessage({
          type: 'SET_TOKENS',
          payload: { googleAccessToken: result.accessToken }
        });
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to connect Google Drive', e);
    }
  };

  const connectOneDrive = async () => {
    // Mock for OneDrive auth
    const mockToken = "mock_onedrive_token";
    workerRef.current?.postMessage({
      type: 'SET_TOKENS',
      payload: { oneDriveAccessToken: mockToken }
    });
    console.log("OneDrive connected (Mock)");
  };

  return {
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    queueSync,
    triggerManualSync,
    connectGoogleDrive,
    connectOneDrive,
    logout
  };
}
