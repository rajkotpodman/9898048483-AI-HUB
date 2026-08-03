import { getPendingTasks, updateTask, clearDoneTasks } from './db';

// This file will run in a Web Worker context.
let googleAccessToken: string | null = null;
let oneDriveAccessToken: string | null = null;
let isSyncing = false;

// Simple chunked upload mock for Google Drive to show auto-resume chunking.
async function uploadToGoogleDrive(filename: string, content: string, token: string, folderId?: string) {
  const metadata = {
    name: filename,
    parents: folderId ? [folderId] : [],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/plain' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Google Drive API error: ${err.error?.message || res.statusText}`);
  }

  return await res.json();
}

async function ensureGoogleDriveFolder(folderName: string, parentId: string | null, token: string): Promise<string> {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' ${parentId ? `and '${parentId}' in parents` : 'and \'root\' in parents'} and trashed=false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to query folder');
  
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    })
  });

  if (!createRes.ok) throw new Error('Failed to create folder');
  const createData = await createRes.json();
  return createData.id;
}

async function uploadToOneDrive(filename: string, content: string, token: string) {
  await new Promise(r => setTimeout(r, 1000));
  console.log(`[OneDrive Mock] Uploaded ${filename}`);
  return { id: 'onedrive-mock-id' };
}

async function processQueue() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await getPendingTasks();
    if (pending.length === 0) {
      isSyncing = false;
      return;
    }

    let gDriveBaseFolderId: string | null = null;
    let gDriveConversationsFolderId: string | null = null;
    let gDriveCodeFolderId: string | null = null;

    if (googleAccessToken) {
      try {
        gDriveBaseFolderId = await ensureGoogleDriveFolder('AI_Hub_Vault', null, googleAccessToken);
        gDriveConversationsFolderId = await ensureGoogleDriveFolder('Conversations', gDriveBaseFolderId, googleAccessToken);
        gDriveCodeFolderId = await ensureGoogleDriveFolder('Code', gDriveBaseFolderId, googleAccessToken);
      } catch (err) {
        console.error('Failed to initialize Google Drive folders', err);
      }
    }

    for (const task of pending) {
      try {
        task.status = 'SYNCING';
        await updateTask(task);

        if (task.provider === 'GOOGLE_DRIVE') {
          if (!googleAccessToken) {
            throw new Error('No Google Access Token');
          }
          const folderId = task.type === 'CONVERSATION' ? gDriveConversationsFolderId : gDriveCodeFolderId;
          await uploadToGoogleDrive(task.filename, task.content, googleAccessToken, folderId || undefined);
        } else if (task.provider === 'ONEDRIVE') {
          if (!oneDriveAccessToken) {
            throw new Error('No OneDrive Access Token');
          }
          await uploadToOneDrive(task.filename, task.content, oneDriveAccessToken);
        }

        task.status = 'DONE';
        await updateTask(task);
        self.postMessage({ type: 'SYNC_SUCCESS', taskId: task.id, filename: task.filename });
      } catch (err: any) {
        console.error(`Sync task failed: ${err.message}`);
        task.retryCount += 1;
        task.status = task.retryCount > 5 ? 'FAILED' : 'PENDING';
        await updateTask(task);
        self.postMessage({ type: 'SYNC_ERROR', taskId: task.id, filename: task.filename, error: err.message });
      }
    }
    await clearDoneTasks();
  } catch (err) {
    console.error('Queue processing error', err);
  } finally {
    isSyncing = false;
  }
}

self.onmessage = (event) => {
  const { type, payload } = event.data;
  switch (type) {
    case 'SET_TOKENS':
      if (payload.googleAccessToken !== undefined) googleAccessToken = payload.googleAccessToken;
      if (payload.oneDriveAccessToken !== undefined) oneDriveAccessToken = payload.oneDriveAccessToken;
      processQueue();
      break;
    case 'START_SYNC':
      processQueue();
      break;
  }
};
