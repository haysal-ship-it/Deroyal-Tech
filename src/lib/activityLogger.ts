import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
  id?: string;
  action: string;
  actorUid: string;
  actorName: string;
  actorRole?: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: any;
}

export async function logActivity({
  action,
  actorUid,
  actorName,
  actorRole,
  targetId,
  targetName,
  details,
}: {
  action: string;
  actorUid: string;
  actorName: string;
  actorRole?: string;
  targetId?: string;
  targetName?: string;
  details: string;
}) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      actorUid: actorUid || 'system',
      actorName: actorName || 'System',
      actorRole: actorRole || '',
      targetId: targetId || '',
      targetName: targetName || '',
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn('Failed to record activity log in Firestore:', err);
  }
}
