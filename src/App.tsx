import React, { useState, useEffect } from 'react';
import { useSyncTimer } from './lib/useSyncTimer';
import PresenterControls from './components/PresenterControls';
import ProjectorDisplay from './components/ProjectorDisplay';
import { Timer, MonitorPlay, Sparkles, Sliders, ExternalLink, RefreshCw } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'controller' | 'projector'>(() => {
    // Determine mode from query parameter if present
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    return m === 'projector' ? 'projector' : 'controller';
  });

  // Keep state and URL query in sync
  const handleModeChange = (newMode: 'controller' | 'projector') => {
    setMode(newMode);
    const url = new URL(window.location.href);
    if (newMode === 'projector') {
      url.searchParams.set('mode', 'projector');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Sync mode state if user navigates back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      setMode(m === 'projector' ? 'projector' : 'controller');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Use our real-time multi-screen sync timer hook
  const timer = useSyncTimer(mode);

  if (mode === 'projector') {
    return (
      <ProjectorDisplay
        state={timer.state}
        onBackToController={() => handleModeChange('controller')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0E] text-[#E0D8D0] flex flex-col justify-between font-sans">
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full filter blur-[100px] pointer-events-none animate-breathe" />

      {/* HEADER SECTION */}
      <header className="relative z-10 border-b border-[#2A2A2C] bg-[#09090A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-6 justify-between items-center">
          {/* Logo Ham Chơi (Left) */}
          <div className="flex-1 flex justify-start items-center w-full md:w-auto">
            <img 
              src="https://lh3.googleusercontent.com/d/1ah0RGe13kImy6WxdDFMYirAQupXX68Sl" 
              alt="Logo Ham Chơi" 
              className="h-22 w-auto object-contain drop-shadow-[0_2px_12px_rgba(212,175,55,0.15)]"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Clock Icon + TickerBox (Center) */}
          <div className="flex-1 flex justify-center items-center gap-3.5 w-full md:w-auto text-center md:text-left">
            <div className="p-2.5 bg-[#1A1A1C] rounded-lg border border-[#2A2A2C] text-[#D4AF37] shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-center md:items-start">
              <h1 className="font-serif text-xl tracking-wider text-[#D4AF37] flex items-center gap-2 font-semibold">
                <span>TickerBox</span>
              </h1>
              <p className="text-xs text-[#E0D8D0]/60 mt-0.5 font-sans">Bộ đếm thời gian</p>
            </div>
          </div>

          {/* Actions (Right) */}
          <div className="flex-1 flex justify-end items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
            <button
              onClick={() => handleModeChange('projector')}
              className="px-4 py-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-[#E0D8D0] border border-[#2A2A2C] hover:text-[#D4AF37] rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              title="Chuyển sang chế độ toàn màn hình trình chiếu ngay trong tab này"
            >
              <MonitorPlay className="w-4 h-4 text-[#D4AF37]" />
              <span className="whitespace-nowrap">Chế độ Sao chép Duplicate/ Mirror</span>
            </button>
            
            <button
              onClick={() => window.open(window.location.origin + '?mode=projector', '_blank')}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C5A030] text-[#0D0D0E] rounded-lg text-xs font-semibold tracking-wide shadow-lg shadow-[#D4AF37]/10 transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center whitespace-nowrap"
              title="Mở màn hình chiếu trong cửa sổ mới để kéo sang màn hình phụ"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="whitespace-nowrap">Chế độ Mở rộng Extend</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="relative z-10 flex-1 py-10 flex flex-col items-center">
        <PresenterControls
          state={timer.state}
          startTimer={timer.startTimer}
          pauseTimer={timer.pauseTimer}
          resetTimer={timer.resetTimer}
          setDuration={timer.setDuration}
          selectPreset={timer.selectPreset}
          toggleHideSeconds={timer.toggleHideSeconds}
          setThemeColor={timer.setThemeColor}
          setTimerTitle={timer.setTimerTitle}
          selectMusic={timer.selectMusic}
          toggleMusicPlay={timer.toggleMusicPlay}
          setMusicVolume={timer.setMusicVolume}
        />
      </main>

      {/* FOOTER & USAGE INFO */}
      <footer className="relative z-10 border-t border-[#2A2A2C] bg-[#09090A]/60 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[#E0D8D0]/60 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Trạng thái kết nối:</span>
            <span className="font-semibold text-[#D4AF37] flex items-center gap-1.5 bg-[#D4AF37]/5 px-3 py-1 rounded border border-[#D4AF37]/10">
              <span className="h-1.5 w-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
              Sẵn sàng đồng bộ không dây
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[11px] text-[#E0D8D0]/40 font-serif italic">
            <span className="flex items-center gap-1">
              <span className="font-bold text-[#D4AF37]">1.</span> Kết nối máy chiếu hoặc màn hình thứ hai
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-[#D4AF37]">2.</span> Kéo Tab &ldquo;Màn hình chiếu&rdquo; sang màn hình phụ và bật Toàn màn hình (F11)
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-[#D4AF37]">3.</span> Điều khiển tất cả thông số mượt mà từ bảng điều khiển chính này
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
