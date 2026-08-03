import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncTask {
  id?: number;
  type: 'CONVERSATION' | 'CODE';
  filename: string;
  content: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'DONE';
  provider: 'GOOGLE_DRIVE' | 'ONEDRIVE';
  retryCount: number;
  createdAt: number;
}

interface SyncDB extends DBSchema {
  sync_queue: {
    key: number;
    value: SyncTask;
    indexes: { 'by-status': string };
  };
}

export async function initDB(): Promise<IDBPDatabase<SyncDB>> {
  return openDB<SyncDB>('ai-hub-sync-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('sync_queue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('by-status', 'status');
    },
  });
}

export async function addTask(task: Omit<SyncTask, 'id' | 'status' | 'retryCount' | 'createdAt'>) {
  const db = await initDB();
  await db.add('sync_queue', {
    ...task,
    status: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
  });
}

export async function getPendingTasks() {
  const db = await initDB();
  return db.getAllFromIndex('sync_queue', 'by-status', 'PENDING');
}

export async function updateTask(task: SyncTask) {
  const db = await initDB();
  await db.put('sync_queue', task);
}

export async function clearDoneTasks() {
  const db = await initDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const index = tx.store.index('by-status');
  let cursor = await index.openCursor('DONE');
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
