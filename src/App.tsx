import React, { useState, useEffect } from 'react';
import { useSyncTimer } from './lib/useSyncTimer';
import PresenterControls from './components/PresenterControls';
import ProjectorDisplay from './components/ProjectorDisplay';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-row justify-between items-center gap-4">
          {/* Clock Icon + TickerBox (Left) */}
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 sm:p-3 bg-[#1A1A1C] rounded-xl border border-[#2A2A2C] text-[#D4AF37] shrink-0 shadow-md">
              <Timer className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex flex-col items-start">
              <h1 className="font-serif text-2xl sm:text-3xl tracking-wider text-[#D4AF37] flex items-center gap-2 font-bold leading-none">
                <span>TickerBox</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#E0D8D0]/60 font-sans mt-1">Bộ đếm thời gian</p>
            </div>
          </div>

          {/* Right Section: PWA Install Button + Logo Ham Chơi */}
          <div className="flex items-center gap-3.5">
            <PWAInstallButton />
            <img 
              src="https://lh3.googleusercontent.com/d/1ah0RGe13kImy6WxdDFMYirAQupXX68Sl" 
              alt="Logo Ham Chơi" 
              className="h-24 w-auto object-contain drop-shadow-[0_2px_16px_rgba(212,175,55,0.2)]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-4 overflow-visible w-full">
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
          onSwitchToMirrorMode={() => handleModeChange('projector')}
        />
      </main>

      {/* FOOTER & USAGE INFO */}
      <footer className="relative z-10 border-t border-[#2A2A2C] bg-[#09090A]/80 backdrop-blur-sm py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-[#E0D8D0]/60 text-[11px]">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Trạng thái:</span>
            <span className="font-semibold text-[#D4AF37] flex items-center gap-1.5 bg-[#D4AF37]/5 px-2.5 py-0.5 rounded border border-[#D4AF37]/10 text-[10px]">
              <span className="h-1.5 w-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
              Đồng bộ đa màn hình sẵn sàng
            </span>
          </div>
        </div>
      </footer>

      {/* PWA Offline indicator toast */}
      <OfflineIndicator />
    </div>
  );
}
