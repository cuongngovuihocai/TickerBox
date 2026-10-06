import React, { useState, useEffect, useRef } from 'react';
import { TimerState, Preset } from '../types';
import { PRESETS } from '../lib/useSyncTimer';
import { synthEngine } from '../lib/synthAudio';
import {
  Play,
  Pause,
  RotateCcw,
  Music,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  Plus,
  Minus,
  Pencil,
  Layers,
  FileAudio,
  Timer,
  ChevronDown,
  Check,
  Radio,
  Sliders
} from 'lucide-react';
import PictureInPictureButton from './PictureInPictureButton';

interface PresenterControlsProps {
  state: TimerState;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setDuration: (seconds: number) => void;
  selectPreset: (preset: Preset) => void;
  toggleHideSeconds: () => void;
  setThemeColor: (color: string) => void;
  setTimerTitle: (title: string) => void;
  selectMusic: (musicId: string) => void;
  toggleMusicPlay: () => void;
  setMusicVolume: (vol: number) => void;
  onSwitchToMirrorMode?: () => void;
}

export default function PresenterControls({
  state,
  startTimer,
  pauseTimer,
  resetTimer,
  setDuration,
  selectPreset,
  toggleHideSeconds,
  setThemeColor,
  setTimerTitle,
  selectMusic,
  toggleMusicPlay,
  setMusicVolume,
  onSwitchToMirrorMode,
}: PresenterControlsProps) {
  const [customMin, setCustomMin] = useState<string>('10');
  const [customSec, setCustomSec] = useState<string>('00');
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>(state.title);

  // Dropdown states
  const [isMusicOpen, setIsMusicOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  const musicDropdownRef = useRef<HTMLDivElement | null>(null);
  const presetsDropdownRef = useRef<HTMLDivElement | null>(null);

  const musicTracks = [
    { id: 'none', title: 'Không phát nhạc nền', desc: 'Chỉ đếm ngược trong tĩnh lặng', icon: '🔇' },
    { id: 'ambient', title: 'Không Gian Tập Trung (Ambient Drone)', desc: 'Tiếng đệm không gian êm ái, nâng cao sự tập trung', icon: '🌌' },
    { id: 'rain', title: 'Tiếng Mưa Tĩnh Lặng (Rain Synth)', desc: 'Tiếng mưa rào tự nhiên, thanh lọc tiếng ồn', icon: '🌧️' },
    { id: 'stream', title: 'Tiếng Suối Chảy & Chim Hót (Nature Stream)', desc: 'Tiếng suối róc rách kết hợp tiếng chim hót', icon: '🍃' },
    { id: 'energetic', title: 'Nhạc Hào Hứng, Năng Động (Upbeat Synth)', desc: 'Giai điệu điện tử tươi vui, tràn đầy năng lượng', icon: '⚡' },
    { id: 'metronome', title: 'Nhịp Lofi Đơn Giản (Lofi Pulse)', desc: 'Tiết tấu lofi gõ nhịp nhẹ nhàng, giữ nhịp thuyết trình', icon: '⏱️' },
  ];

  const themeColors = [
    { name: 'emerald', bg: 'bg-emerald-500', text: 'Emerald (Xanh ngọc)', hex: '#10B981' },
    { name: 'indigo', bg: 'bg-indigo-500', text: 'Indigo (Xanh chàm)', hex: '#6366F1' },
    { name: 'amber', bg: 'bg-amber-500', text: 'Amber (Vàng hổ phách)', hex: '#D4AF37' },
    { name: 'rose', bg: 'bg-rose-500', text: 'Rose (Đỏ hồng)', hex: '#F43F5E' },
    { name: 'slate', bg: 'bg-slate-500', text: 'Slate (Xám thanh lịch)', hex: '#94A3B8' },
  ];

  const themeColorsMap: Record<string, { main: string; glow: string; textClass: string; bgSoft: string }> = {
    emerald: { main: '#10B981', glow: 'rgba(16, 185, 129, 0.25)', textClass: 'text-emerald-400', bgSoft: 'rgba(16, 185, 129, 0.08)' },
    indigo: { main: '#6366F1', glow: 'rgba(99, 102, 241, 0.25)', textClass: 'text-indigo-400', bgSoft: 'rgba(99, 102, 241, 0.08)' },
    amber: { main: '#D4AF37', glow: 'rgba(212, 175, 55, 0.25)', textClass: 'text-[#D4AF37]', bgSoft: 'rgba(212, 175, 55, 0.08)' },
    rose: { main: '#F43F5E', glow: 'rgba(244, 63, 94, 0.25)', textClass: 'text-rose-400', bgSoft: 'rgba(244, 63, 94, 0.08)' },
    slate: { main: '#94A3B8', glow: 'rgba(148, 163, 184, 0.25)', textClass: 'text-slate-300', bgSoft: 'rgba(148, 163, 184, 0.08)' },
  };

  const currentTheme = themeColorsMap[state.themeColor] || themeColorsMap.emerald;

  // Handle click outside to close dropdowns and stop preview
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (musicDropdownRef.current && !musicDropdownRef.current.contains(e.target as Node)) {
        if (isMusicOpen) {
          setIsMusicOpen(false);
          handleStopPreview();
        }
      }
      if (presetsDropdownRef.current && !presetsDropdownRef.current.contains(e.target as Node)) {
        setIsPresetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMusicOpen, isPresetsOpen, state.status, state.musicPlaying, state.selectedMusicId]);

  // Audio Preview Handling (Hover or Click)
  const handlePreviewTrack = (trackId: string) => {
    if (previewTrackId === trackId) return;
    setPreviewTrackId(trackId);
    if (trackId === 'none') {
      synthEngine.stop();
    } else {
      synthEngine.start(trackId as any);
      synthEngine.setVolume(state.musicVolume);
    }
  };

  const handleStopPreview = () => {
    setPreviewTrackId(null);
    // If timer is running and background music is active, restore the active track
    if (state.status === 'running' && state.musicPlaying && state.selectedMusicId !== 'none') {
      synthEngine.start(state.selectedMusicId as any);
      synthEngine.setVolume(state.musicVolume);
    } else {
      synthEngine.stop();
    }
  };

  const handleSelectTrack = (trackId: string) => {
    selectMusic(trackId);
    setIsMusicOpen(false);
    setPreviewTrackId(null);
    if (state.status === 'running' && state.musicPlaying) {
      if (trackId === 'none') {
        synthEngine.stop();
      } else {
        synthEngine.start(trackId as any);
        synthEngine.setVolume(state.musicVolume);
      }
    } else {
      synthEngine.stop();
    }
  };

  const handleVolumeChange = (vol: number) => {
    setMusicVolume(vol);
    synthEngine.setVolume(vol);
  };

  const handleApplyCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(customMin, 10) || 0;
    const seconds = parseInt(customSec, 10) || 0;
    const total = minutes * 60 + seconds;
    if (total > 0) {
      setDuration(total);
    }
  };

  const adjustMinutes = (amount: number) => {
    const currentMins = Math.floor(state.totalDuration / 60);
    const remainingSecs = state.totalDuration % 60;
    const newMins = Math.max(1, currentMins + amount);
    setDuration(newMins * 60 + remainingSecs);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setTimerTitle(tempTitle.trim());
    }
    setEditingTitle(false);
  };

  const openProjectorTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'projector');
    window.open(url.toString(), '_blank');
  };

  const mins = Math.floor(state.remainingTime / 60);
  const secs = state.remainingTime % 60;
  const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const progressPercentage = (state.remainingTime / state.totalDuration) * 100;

  const currentPreset = PRESETS.find((p) => p.id === state.currentPresetId);
  const selectedTrack = musicTracks.find((m) => m.id === state.selectedMusicId) || musicTracks[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full max-w-6xl mx-auto text-[#E0D8D0] items-stretch">
      
      {/* LEFT: Live Preview & Core Controller (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-3">
        {/* Visual Live Preview Card */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl flex-1 min-h-[360px]">
          {/* Subtle Radial Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2A2A2C_0%,_transparent_75%)] opacity-35 pointer-events-none" />

          {/* Wave Background Indicator */}
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out pointer-events-none"
            style={{ 
              height: `${progressPercentage}%`,
              backgroundColor: currentTheme.bgSoft
            }}
          />

          {/* Header of Preview Card */}
          <div className="relative z-10 flex justify-between items-center">
            <span 
              className="text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300"
              style={{ color: currentTheme.main }}
            >
              BẢNG TRỰC QUAN
            </span>
            <div className="flex items-center gap-2">
              <span 
                className={`h-2 w-2 rounded-full transition-all duration-300 ${state.status === 'running' ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: state.status === 'running' ? currentTheme.main : '#475569',
                  boxShadow: state.status === 'running' ? `0 0 8px ${currentTheme.main}` : 'none'
                }}
              />
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#E0D8D0]/50">
                {state.status === 'running' ? 'Đang chạy' : 'Tạm dừng'}
              </span>
            </div>
          </div>

          {/* Countdown Display Center */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-2 w-full max-w-[220px]">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="bg-[#09090A] text-[#F2EFE9] px-2.5 py-1 rounded border border-[#2A2A2C] text-xs w-full outline-none"
                  style={{ borderColor: currentTheme.main }}
                  maxLength={40}
                  autoFocus
                />
                <button 
                  onClick={handleSaveTitle} 
                  className="text-xs text-[#0D0D0E] px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer"
                  style={{ backgroundColor: currentTheme.main }}
                >
                  Lưu
                </button>
              </div>
            ) : (
              <h2 
                onClick={() => { setTempTitle(state.title); setEditingTitle(true); }}
                className="text-xs uppercase tracking-[0.2em] text-[#E0D8D0]/60 mb-1 hover:text-[#F2EFE9] transition-all cursor-pointer flex items-center gap-1.5"
                title="Nhấp để thay đổi tiêu đề"
              >
                <span>{state.title}</span>
                <Pencil className="w-3 h-3 transition-colors duration-300" style={{ color: currentTheme.main }} />
              </h2>
            )}

            {/* Digits */}
            <div className="flex flex-col items-center justify-center">
              {state.hideSeconds ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[88px] sm:text-[96px] font-serif font-medium leading-none tracking-tight text-[#F2EFE9]">
                    {mins}
                  </span>
                  <span 
                    className="text-[9px] uppercase tracking-[0.3em] mt-2 font-semibold transition-colors duration-300"
                    style={{ color: currentTheme.main }}
                  >
                    Phút Còn Lại
                  </span>
                </div>
              ) : (
                <span className="text-[76px] sm:text-[88px] font-serif font-medium leading-none tracking-tighter text-[#F2EFE9] opacity-95">
                  {displayTime}
                </span>
              )}

              {/* Progress Line Underline */}
              <div className="w-56 h-[1.5px] bg-[#2A2A2C] mt-4 relative">
                <div 
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: currentTheme.main,
                    boxShadow: `0 0 12px ${currentTheme.main}`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="relative z-10 flex items-center justify-center gap-5 mt-2">
            <button
              onClick={resetTimer}
              className="p-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-[#E0D8D0]/60 hover:text-[#F2EFE9] rounded-full border border-[#2A2A2C] transition-all cursor-pointer"
              title="Đặt lại bộ đếm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {state.status === 'running' ? (
              <button
                onClick={pauseTimer}
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg"
                style={{
                  borderColor: currentTheme.main,
                  color: currentTheme.main,
                  boxShadow: `0 0 16px ${currentTheme.glow}`
                }}
                title="Tạm dừng"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg animate-pulse"
                style={{
                  borderColor: currentTheme.main,
                  color: currentTheme.main,
                  boxShadow: `0 0 16px ${currentTheme.glow}`
                }}
                title="Bắt đầu"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Integrated Multi-Screen Strip */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-xl p-3 shadow-md">
          <PictureInPictureButton 
            state={state} 
            onOpenProjectorTab={openProjectorTab} 
            onSwitchToMirrorMode={onSwitchToMirrorMode} 
          />
        </div>
      </div>

      {/* RIGHT: Consolidated Simplified Settings Panels (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-between gap-3">
        
        {/* 1. CẤU HÌNH THỜI GIAN (Menu Sổ Xuống + Tùy Biến Nhanh) */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif text-xs tracking-wider font-semibold text-[#F2EFE9] uppercase">
                Cấu hình Thời gian
              </h3>
            </div>
            <span className="text-[10px] text-[#E0D8D0]/40 font-mono">
              Tổng: {Math.floor(state.totalDuration / 60)} phút {state.totalDuration % 60 > 0 ? `${state.totalDuration % 60}s` : ''}
            </span>
          </div>

          {/* Row 1: Presets Dropdown */}
          <div className="relative w-full" ref={presetsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#09090A] hover:bg-[#141416] border border-[#2A2A2C] hover:border-[#D4AF37]/50 rounded-xl text-xs transition-all cursor-pointer"
            >
              <span className="truncate font-medium text-[#F2EFE9]">
                {currentPreset ? `⏱️ ${currentPreset.title} (${Math.round(currentPreset.duration / 60)}m)` : `⏱️ Chọn mẫu: ${Math.floor(state.totalDuration / 60)} phút`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#D4AF37] transition-transform ${isPresetsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Presets Dropdown Menu */}
            {isPresetsOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#121214] border border-[#2A2A2C] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-xl animate-fadeIn">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#D4AF37]/70 tracking-wider border-b border-[#2A2A2C]/60 mb-0.5">
                  Thời gian mẫu (Presets)
                </div>
                {PRESETS.map((p) => {
                  const isSelected = state.currentPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        selectPreset(p);
                        setIsPresetsOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold border border-[#D4AF37]/30'
                          : 'hover:bg-[#1C1C20] text-[#E0D8D0]/80'
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-[#09090A] px-1.5 py-0.5 rounded border border-[#2A2A2C] ml-2 text-[#D4AF37]">
                        {p.duration / 60}m
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 2: Quick Adjustment Pills & Custom Input Form */}
          <div className="flex items-center justify-between gap-2.5 pt-0.5 flex-wrap sm:flex-nowrap">
            {/* Quick Adjustment Pills */}
            <div className="flex items-center bg-[#09090A] border border-[#2A2A2C] rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => adjustMinutes(-5)}
                className="px-2.5 py-1 hover:bg-[#1A1A1C] hover:text-[#D4AF37] rounded text-[11px] font-mono text-[#E0D8D0]/70 cursor-pointer transition-colors"
                title="Giảm 5 phút"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={() => adjustMinutes(-1)}
                className="px-2.5 py-1 hover:bg-[#1A1A1C] hover:text-[#D4AF37] rounded text-[11px] font-mono text-[#E0D8D0]/70 cursor-pointer transition-colors"
                title="Giảm 1 phút"
              >
                -1m
              </button>
              <div className="h-3 w-[1px] bg-[#2A2A2C] mx-0.5" />
              <button
                type="button"
                onClick={() => adjustMinutes(1)}
                className="px-2.5 py-1 hover:bg-[#1A1A1C] hover:text-[#D4AF37] rounded text-[11px] font-mono text-[#E0D8D0]/70 cursor-pointer transition-colors"
                title="Tăng 1 phút"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => adjustMinutes(5)}
                className="px-2.5 py-1 hover:bg-[#1A1A1C] hover:text-[#D4AF37] rounded text-[11px] font-mono text-[#E0D8D0]/70 cursor-pointer transition-colors"
                title="Tăng 5 phút"
              >
                +5m
              </button>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleApplyCustomTime} className="flex items-center gap-1.5 bg-[#09090A] border border-[#2A2A2C] rounded-xl px-2.5 py-1 shrink-0">
              <span className="text-[10px] text-[#E0D8D0]/40 uppercase font-sans mr-0.5">Tự nhập:</span>
              <input
                type="number"
                min="0"
                max="599"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-8 bg-transparent text-center font-mono text-xs text-[#F2EFE9] outline-none border-b border-[#2A2A2C] focus:border-[#D4AF37]"
                placeholder="10"
                title="Phút"
              />
              <span className="text-[#E0D8D0]/30 text-xs font-mono">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSec}
                onChange={(e) => setCustomSec(e.target.value)}
                className="w-7 bg-transparent text-center font-mono text-xs text-[#F2EFE9] outline-none border-b border-[#2A2A2C] focus:border-[#D4AF37]"
                placeholder="00"
                title="Giây"
              />
              <button
                type="submit"
                className="ml-1 px-2.5 py-0.5 bg-[#D4AF37] hover:bg-[#C5A030] text-[#0D0D0E] text-[10px] font-bold uppercase rounded cursor-pointer transition-all"
                title="Áp dụng thời gian tùy chỉnh"
              >
                Đặt
              </button>
            </form>
          </div>
        </div>

        {/* 2. THƯ VIỆN NHẠC NỀN (Menu Sổ Xuống + Nghe Thử Trực Tiếp Khi Rê Chuột) */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif text-xs tracking-wider font-semibold text-[#F2EFE9] uppercase">
                Thư viện Nhạc Nền
              </h3>
            </div>
            {previewTrackId && (
              <span className="text-[10px] text-[#D4AF37] font-semibold animate-pulse flex items-center gap-1">
                <Radio className="w-3 h-3" />
                Đang nghe thử...
              </span>
            )}
          </div>

          {/* Music Control Bar: Dropdown Trigger + Play Toggle + Volume Slider */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Music Dropdown Trigger */}
            <div className="relative flex-1 min-w-[220px]" ref={musicDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (isMusicOpen) {
                    handleStopPreview();
                  }
                  setIsMusicOpen(!isMusicOpen);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#09090A] hover:bg-[#141416] border border-[#2A2A2C] hover:border-[#D4AF37]/50 rounded-xl text-xs transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{selectedTrack.icon}</span>
                  <span className="truncate font-medium text-[#F2EFE9]">
                    {selectedTrack.title}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#D4AF37] shrink-0 transition-transform ${isMusicOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Music Dropdown Menu */}
              {isMusicOpen && (
                <div 
                  onMouseLeave={handleStopPreview}
                  className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#121214] border border-[#2A2A2C] rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-xl animate-fadeIn"
                >
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#D4AF37]/80 tracking-wider border-b border-[#2A2A2C]/60 mb-0.5 flex justify-between items-center">
                    <span>Chọn bản nhạc nền</span>
                    <span className="text-[9px] text-[#E0D8D0]/50 lowercase font-normal italic">
                      🎧 rê chuột để nghe thử
                    </span>
                  </div>

                  {musicTracks.map((track) => {
                    const isSelected = state.selectedMusicId === track.id;
                    const isPreviewing = previewTrackId === track.id;
                    return (
                      <div
                        key={track.id}
                        onMouseEnter={() => handlePreviewTrack(track.id)}
                        onClick={() => handleSelectTrack(track.id)}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                            : isPreviewing
                            ? 'bg-[#222228] text-white border border-[#2A2A2C]'
                            : 'hover:bg-[#1C1C20] text-[#E0D8D0]/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-sm shrink-0">{track.icon}</span>
                          <div className="flex flex-col truncate">
                            <span className="font-semibold truncate">{track.title}</span>
                            <span className="text-[10px] text-[#E0D8D0]/50 font-serif italic truncate">
                              {track.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isPreviewing && (
                            <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded font-mono font-semibold animate-pulse">
                              Nghe thử 🎧
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[9px] bg-[#D4AF37] text-[#0D0D0E] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              Đã chọn
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Play/Pause Music Toggle */}
            {state.selectedMusicId !== 'none' && (
              <button
                type="button"
                onClick={toggleMusicPlay}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  state.musicPlaying
                    ? 'bg-[#D4AF37] text-[#0D0D0E] border-[#D4AF37] shadow-sm'
                    : 'bg-[#09090A] text-[#D4AF37] border-[#2A2A2C] hover:bg-[#1A1A1C]'
                }`}
                title={state.musicPlaying ? "Tạm dừng phát nhạc" : "Bật phát nhạc nền"}
              >
                {state.musicPlaying ? (
                  <FileAudio className="w-4 h-4 animate-pulse" />
                ) : (
                  <Music className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Volume Slider Inline */}
            {state.selectedMusicId !== 'none' && (
              <div className="flex items-center gap-2 bg-[#09090A] border border-[#2A2A2C] rounded-xl px-2.5 py-1.5 shrink-0">
                {state.musicVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#E0D8D0]/40" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#E0D8D0]/60" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={state.musicVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-18 h-[3px] bg-[#2A2A2C] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  title={`Âm lượng: ${Math.round(state.musicVolume * 100)}%`}
                />
                <span className="font-mono text-[10px] text-[#E0D8D0]/50 w-6 text-right">
                  {Math.round(state.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. TÙY CHỌN TRÌNH CHIẾU & GIAO DIỆN */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          {/* Theme Colors selection */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-wider text-[#E0D8D0]/50 font-bold">
                Tông màu:
              </span>
            </div>
            <div className="flex items-center gap-2">
              {themeColors.map((color) => {
                const isActive = state.themeColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setThemeColor(color.name)}
                    className={`h-7 w-7 rounded-full ${color.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-115 ${
                      isActive ? 'ring-2 ring-offset-2 ring-offset-[#1A1A1C] scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={isActive ? { boxShadow: `0 0 12px ${color.hex}` } : undefined}
                    title={color.text}
                  >
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle Hide Seconds */}
          <button
            type="button"
            onClick={toggleHideSeconds}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              state.hideSeconds
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
                : 'bg-[#09090A] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#141416]'
            }`}
            title="Bấm để ẩn hoặc hiện chữ số giây"
          >
            {state.hideSeconds ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]">
              {state.hideSeconds ? 'Đang ẩn giây (Tập trung)' : 'Đang hiện giây'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
