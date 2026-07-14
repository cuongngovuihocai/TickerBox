import React, { useRef, useEffect, useState } from 'react';
import { TimerState } from '../types';
import { Maximize2, Minimize2, ArrowLeft, RotateCcw, Shrink, Expand, Eye, EyeOff, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface ProjectorDisplayProps {
  state: TimerState;
  onBackToController?: () => void;
}

export default function ProjectorDisplay({ state, onBackToController }: ProjectorDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [miniScale, setMiniScale] = useState<number>(1.0); // e.g., 1.2, 1.0, 0.8, 0.6, 0.45
  const [showControls, setShowControls] = useState<boolean>(true);
  const timeoutRef = useRef<number | null>(null);

  // Auto-hide helper cursor/back-button controls after 3 seconds of inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    // Clear timeout on unmount
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  };

  // Monitor fullscreen change events triggered by ESC key
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const themeColorsMap: Record<string, { main: string; glow: string; text: string; bgSoft: string }> = {
    emerald: { main: '#D4AF37', glow: 'rgba(212, 175, 55, 0.12)', text: 'text-[#D4AF37]', bgSoft: 'rgba(212, 175, 55, 0.02)' }, // Default Gold
    indigo: { main: '#E0D8D0', glow: 'rgba(224, 216, 208, 0.12)', text: 'text-[#E0D8D0]', bgSoft: 'rgba(224, 216, 208, 0.02)' }, // Warm Beige
    amber: { main: '#C5A030', glow: 'rgba(197, 160, 48, 0.12)', text: 'text-[#C5A030]', bgSoft: 'rgba(197, 160, 48, 0.02)' }, // Antique Gold
    rose: { main: '#A83232', glow: 'rgba(168, 50, 50, 0.12)', text: 'text-red-400', bgSoft: 'rgba(168, 50, 50, 0.02)' }, // Burgundy Red
    slate: { main: '#A19E95', glow: 'rgba(161, 158, 149, 0.12)', text: 'text-[#A19E95]', bgSoft: 'rgba(161, 158, 149, 0.02)' }, // Platinum Grey
  };

  const activeColor = themeColorsMap[state.themeColor] || themeColorsMap.emerald;

  const mins = Math.floor(state.remainingTime / 60);
  const secs = state.remainingTime % 60;
  const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const progress = state.totalDuration > 0 ? state.remainingTime / state.totalDuration : 0;
  const progressPercentage = progress * 100;

  // Render Compact/Mini view optimized for tiny window size (similar to PiP overlay)
  if (isCompact) {
    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`fixed inset-0 w-full h-full flex flex-col justify-between p-3 overflow-hidden font-sans select-none transition-all duration-300 ${
          isTransparent ? 'bg-transparent text-[#E0D8D0]' : 'bg-[#0D0D0E] text-[#E0D8D0]'
        }`}
        style={{
          cursor: showControls ? 'default' : 'none',
        }}
      >
        {/* Dynamic background progress wave (subtle fill) - Hidden when transparent */}
        {!isTransparent && (
          <div 
            className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out pointer-events-none"
            style={{
              background: `linear-gradient(90deg, ${activeColor.glow} 0%, rgba(13, 13, 14, 0) 100%)`,
              width: `${progressPercentage}%`,
              opacity: 0.35
            }}
          />
        )}

        {/* Mini Controls overlay (always top layer) */}
        <div
          className={`absolute top-2 right-2 left-2 flex justify-between items-center z-30 transition-all duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Left Side Controls: Transparency & Scaling */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTransparent(!isTransparent)}
              className={`p-1.5 border rounded-md transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold ${
                isTransparent 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                  : 'bg-[#1A1A1C]/90 border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37]'
              }`}
              title={isTransparent ? "Bật nền tối" : "Bật nền trong suốt"}
            >
              {isTransparent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isTransparent ? "Trong suốt" : "Nền tối"}</span>
            </button>

            <div className="flex items-center bg-[#1A1A1C]/90 border border-[#2A2A2C] rounded-md overflow-hidden text-[#E0D8D0]">
              <button
                onClick={() => setMiniScale(s => Math.max(0.35, s - 0.15))}
                disabled={miniScale <= 0.35}
                className="p-1.5 hover:bg-[#2A2A2C] hover:text-[#D4AF37] disabled:opacity-40 disabled:hover:text-current transition-all cursor-pointer"
                title="Thu nhỏ thêm nữa"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[9px] px-1.5 font-bold font-mono">
                {Math.round(miniScale * 100)}%
              </span>
              <button
                onClick={() => setMiniScale(s => Math.min(1.5, s + 0.15))}
                disabled={miniScale >= 1.5}
                className="p-1.5 hover:bg-[#2A2A2C] hover:text-[#D4AF37] disabled:opacity-40 disabled:hover:text-current transition-all cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Side Controls: Expand & Controller */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCompact(false)}
              className="p-1.5 bg-[#1A1A1C]/90 hover:bg-[#2A2A2C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded-md transition-all cursor-pointer"
              title="Mở rộng giao diện"
            >
              <Expand className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
            {onBackToController && (
              <button
                onClick={onBackToController}
                className="p-1.5 bg-[#1A1A1C]/90 hover:bg-[#2A2A2C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded-md transition-all cursor-pointer"
                title="Quay lại Bảng điều khiển"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            )}
          </div>
        </div>

        {/* Main compact center content */}
        <div 
          className="flex-1 flex flex-col justify-center items-center relative z-10 w-full transition-all duration-300"
          style={{ transform: `scale(${miniScale})`, transformOrigin: 'center' }}
        >
          {/* Slide Title */}
          <span className={`text-[10px] uppercase tracking-[0.15em] font-bold text-center truncate max-w-[90%] mb-3.5 ${
            isTransparent 
              ? 'text-[#F2EFE9] drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)]' 
              : 'text-[#D4AF37]'
          }`}>
            {state.title || "THUYẾT TRÌNH"}
          </span>

          {/* Elegant Circular Progress Clock */}
          <div className={`relative flex items-center justify-center h-[120px] w-[120px] rounded-full transition-all duration-300 ${
            isTransparent ? 'bg-transparent' : 'border border-[#2A2A2C]/60 bg-[#1A1A1C]/35 backdrop-blur-[1px]'
          }`}>
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="43"
                className={`${isTransparent ? 'stroke-[#E0D8D0]/10' : 'stroke-[#2A2A2C]/30'} fill-none`}
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="43"
                className="fill-none transition-all duration-300 ease-linear"
                strokeWidth="5"
                strokeDasharray="270.17"
                strokeDashoffset={270.17 - (270.17 * state.remainingTime) / state.totalDuration}
                strokeLinecap="round"
                style={{
                  stroke: state.status === 'completed' ? '#f43f5e' : activeColor.main,
                  filter: `drop-shadow(0 0 5px ${activeColor.main})`
                }}
              />
            </svg>

            {/* Core digits */}
            <div className="text-center relative z-10 flex flex-col items-center justify-center w-full px-1">
              {state.hideSeconds ? (
                <div className="flex flex-col items-center justify-center">
                  <span className={`text-3xl font-serif font-medium tracking-tight ${
                    isTransparent ? 'text-[#F2EFE9] drop-shadow-[0_2.5px_3px_rgba(0,0,0,0.95)]' : 'text-[#F2EFE9]'
                  }`}>
                    {state.remainingTime <= 0 ? '0' : mins}
                  </span>
                  <span className={`text-[8px] uppercase tracking-widest font-semibold mt-0.5 ${
                    isTransparent ? 'text-[#E0D8D0] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]' : 'text-[#E0D8D0]/60'
                  }`}>
                    phút
                  </span>
                </div>
              ) : (
                <span 
                  className={`text-2xl font-serif font-medium tracking-tight ${
                    isTransparent ? 'drop-shadow-[0_3px_4px_rgba(0,0,0,0.95)]' : ''
                  }`}
                  style={{
                    color: state.remainingTime <= 0 ? '#f43f5e' : state.remainingTime < 30 ? '#C5A030' : '#F2EFE9'
                  }}
                >
                  {displayTime}
                </span>
              )}
            </div>
          </div>
          
          {/* Status micro badge */}
          <div className="h-4 mt-2.5 flex items-center justify-center">
            {state.status === 'paused' && (
              <span className={`text-[8px] uppercase tracking-[0.2em] font-bold animate-pulse ${
                isTransparent ? 'text-[#D4AF37] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]' : 'text-[#D4AF37]'
              }`}>
                TẠM DỪNG
              </span>
            )}
            {state.status === 'completed' && (
              <span className="text-[8px] uppercase tracking-[0.2em] text-rose-500 font-bold animate-pulse">
                HẾT GIỜ
              </span>
            )}
          </div>
        </div>

        {/* Tiny thin bottom progress bar - Hidden when transparent for maximum minimalism */}
        {!isTransparent && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2A2A2C]">
            <div 
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{ 
                width: `${progressPercentage}%`,
                boxShadow: `0 0 6px #D4AF37`
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Render massive displays
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 w-full h-full bg-[#0D0D0E] text-[#E0D8D0] flex flex-col justify-between items-center overflow-hidden transition-all duration-300 font-sans"
      style={{
        cursor: showControls ? 'default' : 'none',
      }}
    >
      {/* 1. Cyber Grid background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />
      
      {/* Wave Fill Level Background */}
      <div 
        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out pointer-events-none"
        style={{
          height: `${progressPercentage}%`,
          background: `linear-gradient(180deg, ${activeColor.glow} 0%, rgba(13, 13, 14, 0) 100%)`,
          opacity: 0.5
        }}
      />

      {/* 2. Top Bar (Hover visible controls) */}
      <div
        className={`w-full max-w-7xl px-8 py-6 flex justify-between items-center relative z-20 transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          {onBackToController && (
            <button
              onClick={onBackToController}
              className="p-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded-lg transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
              title="Quay lại Màn hình chính"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">Bảng điều khiển</span>
            </button>
          )}
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#D4AF37] bg-[#1A1A1C]/80 border border-[#2A2A2C] px-3.5 py-1.5 rounded-full">
            🖥️ Màn hình trình chiếu chính
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCompact(true)}
            className="p-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded-lg transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Thu nhỏ màn hình chiếu giống cửa sổ PiP để không che slide chính"
          >
            <Shrink className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">Chế độ Thu nhỏ (Mini)</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded-lg transition-all cursor-pointer"
            title="Bật/Tắt toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. CENTER: Giant Focus Elements */}
      <div className="flex-1 flex flex-col justify-center items-center w-full px-6 relative z-10 select-none">
        {/* Dynamic Theme color ambient light behind */}
        <div 
          className="absolute h-96 w-96 rounded-full opacity-10 filter blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: activeColor.main }}
        />

        {/* Current Segment Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif tracking-[0.05em] font-medium text-[#F2EFE9] text-center mb-8 max-w-4xl truncate uppercase drop-shadow">
          {state.title}
        </h1>

        {/* Massive circle progress clock */}
        <div className="relative flex items-center justify-center h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] md:h-[460px] md:w-[460px] rounded-full border border-[#2A2A2C] shadow-2xl bg-[#1A1A1C]/20 backdrop-blur-sm">
          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              className="stroke-[#2A2A2C]/40 fill-none"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              className="fill-none transition-all duration-300 ease-linear"
              strokeWidth="5"
              strokeDasharray="1400"
              strokeDashoffset={1400 - (1400 * state.remainingTime) / state.totalDuration}
              strokeLinecap="round"
              style={{
                stroke: state.status === 'completed' ? '#f43f5e' : activeColor.main,
                filter: `drop-shadow(0 0 12px ${activeColor.main})`
              }}
            />
          </svg>

          {/* Core Numbers */}
          <div className="text-center relative z-10 flex flex-col items-center justify-center w-full">
            {state.hideSeconds ? (
              <div className="flex flex-col items-center justify-center">
                {state.remainingTime <= 0 ? (
                  <span className="text-4xl md:text-5xl font-serif font-semibold text-rose-500 tracking-wide uppercase">Hết giờ</span>
                ) : mins === 0 ? (
                  <span className="text-4xl md:text-5xl font-serif font-semibold text-[#D4AF37] tracking-wide uppercase">&lt; 1 Phút</span>
                ) : (
                  <>
                    <span className="text-[120px] md:text-[140px] font-serif font-medium text-[#F2EFE9] tracking-tight leading-none">
                      {mins}
                    </span>
                    <span className="text-[10px] font-sans tracking-[0.3em] text-[#D4AF37] font-bold uppercase mt-2 select-none">
                      Phút Còn Lại
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span 
                  className="text-7xl sm:text-8xl md:text-9xl font-serif font-medium tracking-tight leading-none text-[#F2EFE9]"
                  style={{
                    color: state.remainingTime <= 0 ? '#f43f5e' : state.remainingTime < 30 ? '#C5A030' : '#F2EFE9'
                  }}
                >
                  {displayTime}
                </span>
                {state.remainingTime <= 0 && (
                  <span className="text-xs font-semibold font-serif italic text-rose-500 tracking-widest uppercase mt-4 select-none">
                    Vui lòng kết thúc thuyết trình
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quiet visual status banner when paused or finished */}
        <div className="h-12 mt-8 flex items-center justify-center">
          {state.status === 'paused' && (
            <span className="px-4 py-2 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] font-serif italic text-xs tracking-wider animate-pulse">
              ⏸ Trình chiếu đang tạm dừng
            </span>
          )}
          {state.status === 'completed' && (
            <span className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-serif italic text-xs tracking-wider animate-pulse">
              ✓ Buổi thuyết trình hoàn thành
            </span>
          )}
          {state.status === 'running' && (
            <span className="text-[10px] font-sans tracking-[0.25em] text-[#E0D8D0]/40 uppercase font-bold">
              ● Đang đếm thời gian thực
            </span>
          )}
        </div>
      </div>

      {/* 4. Bottom screen Progress Line Bar */}
      <div className="w-full h-[3px] bg-[#1A1A1C] relative z-20">
        <div
          className="h-full transition-all duration-300 ease-linear"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: state.status === 'completed' ? '#f43f5e' : activeColor.main,
            boxShadow: `0 0 10px ${activeColor.main}`
          }}
        />
      </div>
    </div>
  );
}
