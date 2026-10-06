import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1A1A1C] border border-amber-500/50 px-3 py-2 text-xs font-medium text-amber-300 shadow-2xl backdrop-blur-md animate-fadeIn">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Chế độ ngoại tuyến (Offline) — Dữ liệu và bộ đếm vẫn hoạt động hoàn hảo.</span>
    </div>
  );
};
