import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { History, Search, Filter, Clock, User, Shield, AlertTriangle, Trash2, Key, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export interface ActivityItem {
  id: string;
  action: string;
  actorUid: string;
  actorName: string;
  actorRole?: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: any;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'sales' | 'repairs'>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ActivityItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ActivityItem);
      });
      setActivities(list);
      setLoading(false);
    }, (err) => {
      console.error('Error loading activity logs:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredActivities = activities.filter((item) => {
    // Filter by type
    if (filterType === 'users' && !item.action.toLowerCase().includes('user') && !item.action.toLowerCase().includes('password')) {
      return false;
    }
    if (filterType === 'sales' && !item.action.toLowerCase().includes('sale')) {
      return false;
    }
    if (filterType === 'repairs' && !item.action.toLowerCase().includes('repair')) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = item.actorName?.toLowerCase().includes(q);
      const matchAction = item.action?.toLowerCase().includes(q);
      const matchDetails = item.details?.toLowerCase().includes(q);
      const matchTarget = item.targetName?.toLowerCase().includes(q);
      return matchActor || matchAction || matchDetails || matchTarget;
    }

    return true;
  });

  const getActionBadge = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('created')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Created</span>;
    }
    if (lower.includes('deactivated')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Deactivated</span>;
    }
    if (lower.includes('reactivated')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Reactivated</span>;
    }
    if (lower.includes('deleted')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Deleted</span>;
    }
    if (lower.includes('password')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Password</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{action}</span>;
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1 flex items-center gap-2">
            <History size={20} className="text-[#0561FC]" />
            Audit & Activity Log
          </h2>
          <p className="text-gray-500 text-[14px]">
            Real-time chronological record of user management, security events, and deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={cn("px-3 py-1.5 rounded-md transition-colors", filterType === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('users')}
              className={cn("px-3 py-1.5 rounded-md transition-colors", filterType === 'users' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              Users
            </button>
            <button
              onClick={() => setFilterType('sales')}
              className={cn("px-3 py-1.5 rounded-md transition-colors", filterType === 'sales' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              Sales
            </button>
            <button
              onClick={() => setFilterType('repairs')}
              className={cn("px-3 py-1.5 rounded-md transition-colors", filterType === 'repairs' ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}
            >
              Repairs
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter activity log by actor, action, or details..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Performed By</th>
                <th className="px-6 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredActivities.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400 shrink-0" />
                    {formatTimestamp(item.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}
                      <span className="text-xs font-semibold text-gray-900">{item.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {item.actorName ? item.actorName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{item.actorName || 'Admin'}</div>
                        {item.actorRole && (
                          <div className="text-[10px] text-gray-500">{item.actorRole}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-700 max-w-md">
                    <p className="line-clamp-2">{item.details}</p>
                  </td>
                </tr>
              ))}

              {filteredActivities.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                    <History size={36} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-700">No activity logs recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Actions such as user creation, deactivations, and item deletions will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
