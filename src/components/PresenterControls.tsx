import React, { useState } from 'react';
import { TimerState, Preset } from '../types';
import { PRESETS } from '../lib/useSyncTimer';
import {
  Play,
  Pause,
  RotateCcw,
  Music,
  Volume2,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
  Layers,
  FileAudio,
  Timer,
  MonitorPlay
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
}: PresenterControlsProps) {
  const [customMin, setCustomMin] = useState<string>('10');
  const [customSec, setCustomSec] = useState<string>('00');
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>(state.title);

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

  const musicTracks = [
    { id: 'none', title: 'Không phát nhạc nền', desc: 'Chỉ đếm ngược trong tĩnh lặng' },
    { id: 'ambient', title: '🌌 Không Gian Tập Trung (Ambient Drone)', desc: 'Tiếng đệm không gian êm ái, nâng cao sự tập trung' },
    { id: 'rain', title: '🌧️ Tiếng Mưa Tĩnh Lặng (Rain Synth)', desc: 'Tiếng mưa rào tự nhiên, thanh lọc tiếng ồn xung quanh' },
    { id: 'stream', title: '🍃 Tiếng Suối Chảy & Chim Hót (Nature Stream)', desc: 'Tiếng suối chảy róc rách kết hợp tiếng chim hót tự nhiên' },
    { id: 'energetic', title: '⚡ Nhạc Hào Hứng, Năng Động (Upbeat Synth)', desc: 'Giai điệu điện tử tươi vui, tràn đầy năng lượng tích cực' },
    { id: 'metronome', title: '⏱️ Nhịp Lofi Đơn Giản (Lofi Pulse)', desc: 'Tiết tấu lofi gõ nhịp nhẹ nhàng, giữ nhịp thuyết trình' },
  ];

  const themeColors = [
    { name: 'emerald', bg: 'bg-emerald-500', text: 'Emerald' },
    { name: 'indigo', bg: 'bg-indigo-500', text: 'Indigo' },
    { name: 'amber', bg: 'bg-amber-500', text: 'Amber' },
    { name: 'rose', bg: 'bg-rose-500', text: 'Rose' },
    { name: 'slate', bg: 'bg-slate-500', text: 'Slate' },
  ];

  const mins = Math.floor(state.remainingTime / 60);
  const secs = state.remainingTime % 60;
  const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const themeColorClassMap: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    rose: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    slate: 'text-slate-400 border-slate-500/20 bg-slate-500/5',
  };

  const progressPercentage = (state.remainingTime / state.totalDuration) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto p-4 sm:p-6 text-[#E0D8D0]">
      
      {/* LEFT: Live Preview & Quick Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Visual Live Preview Card */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-2xl">
          {/* Decorative Radial Background inside Card */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2A2A2C_0%,_transparent_75%)] opacity-35 pointer-events-none"></div>

          {/* Wave Background Indicator */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[#D4AF37]/5 transition-all duration-1000 ease-out pointer-events-none"
            style={{ height: `${progressPercentage}%` }}
          />

          <div className="relative z-10 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]/80">
              BẢNG TRỰC QUAN
            </span>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${state.status === 'running' ? 'bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#E0D8D0]/50">
                {state.status === 'running' ? 'Đang chạy' : 'Tạm dừng'}
              </span>
            </div>
          </div>

          {/* Core Large Countdown display */}
          <div className="relative z-10 flex flex-col items-center justify-center my-6">
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-4 w-full max-w-[240px]">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="bg-[#09090A] text-[#F2EFE9] px-3 py-1.5 rounded border border-[#2A2A2C] text-sm w-full outline-none focus:border-[#D4AF37]"
                  maxLength={40}
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="text-xs bg-[#D4AF37] text-[#0D0D0E] px-3 py-1.5 rounded hover:bg-[#C5A030] font-semibold">Lưu</button>
              </div>
            ) : (
              <h2 
                onClick={() => { setTempTitle(state.title); setEditingTitle(true); }}
                className="text-sm uppercase tracking-[0.2em] text-[#E0D8D0]/60 mb-1 hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5"
                title="Nhấp để thay đổi tiêu đề"
              >
                <span>{state.title}</span>
                <Sparkles className="w-3 h-3 text-[#D4AF37]/50" />
              </h2>
            )}

            {/* Elegantly styled timer font with gold underline progress bar as requested by the Sophisticated Dark theme */}
            <div className="flex flex-col items-center justify-center my-4 py-2">
              {state.hideSeconds ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[100px] font-serif font-medium leading-none tracking-tight text-[#F2EFE9]">
                    {mins}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] mt-3">Phút Còn Lại</span>
                </div>
              ) : (
                <span className="text-[84px] sm:text-[96px] font-serif font-medium leading-none tracking-tighter text-[#F2EFE9] opacity-95">
                  {displayTime}
                </span>
              )}

              {/* Visual Time Progress Underline (from design theme HTML) */}
              <div className="w-64 h-[1px] bg-[#2A2A2C] mt-6 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls button layout mimicking the beautiful circular play design of the theme */}
          <div className="relative z-10 flex items-center justify-center gap-6 mt-4">
            <button
              onClick={resetTimer}
              className="p-3 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-[#E0D8D0]/60 hover:text-[#D4AF37] rounded-full border border-[#2A2A2C] transition-all cursor-pointer"
              title="Đặt lại bộ đếm"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {state.status === 'running' ? (
              <button
                onClick={pauseTimer}
                className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0E] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                title="Tạm dừng"
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="w-14 h-14 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0D0D0E] transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-pulse"
                title="Bắt đầu"
              >
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Multi-Screen Integration Hub in Sophisticated style */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <MonitorPlay className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif text-sm tracking-wider font-semibold text-[#F2EFE9]">LIÊN KẾT ĐA MÀN HÌNH</h3>
          </div>
          <p className="text-xs text-[#E0D8D0]/60 leading-relaxed font-sans">
            Mở màn hình chiếu siêu phẳng, cực kỳ sang trọng để hiển thị trên màn hình phụ hoặc máy chiếu. Tự động đồng bộ không có độ trễ.
          </p>
          <PictureInPictureButton state={state} onOpenProjectorTab={openProjectorTab} />
        </div>
      </div>

      {/* RIGHT: Detailed Configuration Panels */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Section 1: Presets & Custom Times */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Timer className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif text-sm tracking-wider font-semibold text-[#F2EFE9]">CẤU HÌNH THỜI GIAN</h3>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => adjustMinutes(1)}
              className="px-3 py-1.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-xs font-medium text-[#E0D8D0] rounded-lg border border-[#2A2A2C] flex items-center gap-1 cursor-pointer hover:text-[#D4AF37]"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>1 phút</span>
            </button>
            <button
              onClick={() => adjustMinutes(5)}
              className="px-3 py-1.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-xs font-medium text-[#E0D8D0] rounded-lg border border-[#2A2A2C] flex items-center gap-1 cursor-pointer hover:text-[#D4AF37]"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>5 phút</span>
            </button>
            <button
              onClick={() => adjustMinutes(-1)}
              className="px-3 py-1.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-xs font-medium text-[#E0D8D0] rounded-lg border border-[#2A2A2C] flex items-center gap-1 cursor-pointer hover:text-[#D4AF37]"
            >
              <Minus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>1 phút</span>
            </button>
            <button
              onClick={() => adjustMinutes(-5)}
              className="px-3 py-1.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-xs font-medium text-[#E0D8D0] rounded-lg border border-[#2A2A2C] flex items-center gap-1 cursor-pointer hover:text-[#D4AF37]"
            >
              <Minus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>5 phút</span>
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40 block mb-2.5">Thời gian mẫu (Presets)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESETS.map((p) => {
                const isActive = state.currentPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      isActive
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                        : 'border-[#2A2A2C] bg-[#1A1A1C]/40 hover:bg-[#2A2A2C]/60 hover:border-[#2A2A2C]'
                    }`}
                  >
                    <span className="text-xs font-semibold truncate w-full text-[#E0D8D0] font-sans">
                      {p.title}
                    </span>
                    <span className="text-xs font-serif italic text-[#D4AF37] font-bold">
                      {p.duration / 60}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Input Form */}
          <form onSubmit={handleApplyCustomTime} className="border-t border-[#2A2A2C]/80 pt-4 flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40 block">Tự thiết lập thời lượng</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center bg-[#09090A] border border-[#2A2A2C] rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="599"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="bg-transparent text-[#F2EFE9] font-mono text-center text-lg w-full outline-none"
                  placeholder="Min"
                />
                <span className="text-[10px] font-medium text-[#E0D8D0]/50 select-none ml-2 font-serif italic">phút</span>
              </div>
              <span className="text-[#2A2A2C] text-lg font-mono">:</span>
              <div className="flex-1 flex items-center bg-[#09090A] border border-[#2A2A2C] rounded-xl px-3 py-2">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSec}
                  onChange={(e) => setCustomSec(e.target.value)}
                  className="bg-transparent text-[#F2EFE9] font-mono text-center text-lg w-full outline-none"
                  placeholder="Sec"
                />
                <span className="text-[10px] font-medium text-[#E0D8D0]/50 select-none ml-2 font-serif italic">giây</span>
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-[#D4AF37] hover:bg-[#C5A030] text-[#0D0D0E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cài đặt
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Visual Themes & Settings */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif text-sm tracking-wider font-semibold text-[#F2EFE9]">TÙY CHỌN TRÌNH CHIẾU</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Theme Coloring selection */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40">Tông màu hiển thị</span>
              <div className="flex items-center gap-2.5">
                {themeColors.map((color) => {
                  const isActive = state.themeColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setThemeColor(color.name)}
                      className={`h-9 w-9 rounded-full ${color.bg} transition-all relative flex items-center justify-center cursor-pointer hover:scale-105 ${
                        isActive ? 'ring-4 ring-[#D4AF37]/30 ring-offset-2 ring-offset-[#1A1A1C] scale-105' : ''
                      }`}
                      title={color.text}
                    >
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet mode - Hide Seconds (Sự tập trung tuyệt đối) */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40">Chế độ hiển thị giây</span>
              <button
                onClick={toggleHideSeconds}
                className="flex items-center justify-between p-3 bg-[#1A1A1C] hover:bg-[#2A2A2C] rounded-xl border border-[#2A2A2C] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {state.hideSeconds ? (
                    <EyeOff className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#E0D8D0]/60" />
                  )}
                  <span className="text-xs font-semibold text-[#E0D8D0]/80">
                    {state.hideSeconds ? 'Đang ẩn giây (Tập trung)' : 'Đang hiện giây'}
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider bg-[#09090A] border border-[#2A2A2C] px-2 py-1 rounded text-[#D4AF37] font-bold">
                  Bấm để đổi
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#E0D8D0]/60 bg-[#09090A] p-3.5 rounded-lg border border-[#2A2A2C] leading-relaxed font-serif italic">
            💡 <strong>Mẹo trình bày:</strong> Khi ẩn chữ số giây, khán giả sẽ tập trung tối đa vào thông điệp của slide thay vì bị phân tâm bởi đếm số nhảy liên tục, trong khi dải sáng bên dưới vẫn thông báo trạng thái một cách tinh tế.
          </p>
        </div>

        {/* Section 3: Background Audio Controller */}
        <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Music className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-serif text-sm tracking-wider font-semibold text-[#F2EFE9]">THƯ VIỆN NHẠC NỀN CHUYÊN NGHIỆP</h3>
          </div>

          <p className="text-xs text-[#E0D8D0]/60 leading-relaxed font-sans">
            Âm thanh nền thông minh giúp kiểm soát tốt nhịp độ buổi thuyết trình và giữ sự chú ý của thính giả trong các phần thảo luận tự do hoặc hoạt động nhóm.
          </p>

          <div className="flex flex-col gap-3.5 mt-2">
            {/* Track selector */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40">Chọn bản nhạc</span>
              <div className="flex flex-col gap-1.5">
                {musicTracks.map((track) => {
                  const isSelected = state.selectedMusicId === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => selectMusic(track.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                          : 'border-[#2A2A2C] bg-[#09090A]/40 hover:bg-[#1A1A1C]/80'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#E0D8D0] font-sans">{track.title}</span>
                        <span className="text-[10px] text-[#E0D8D0]/50 mt-0.5 font-serif italic">{track.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] px-2.5 py-1 rounded border border-[#D4AF37]/20 font-bold uppercase tracking-wider">
                          Đã chọn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Music controls and volume */}
            {state.selectedMusicId !== 'none' && (
              <div className="flex items-center gap-5 bg-[#09090A] p-4 rounded-xl border border-[#2A2A2C]">
                <button
                  type="button"
                  onClick={toggleMusicPlay}
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    state.musicPlaying
                      ? 'bg-[#D4AF37] text-[#0D0D0E] border-[#D4AF37] hover:bg-[#C5A030]'
                      : 'bg-[#1A1A1C] text-[#D4AF37] border-[#2A2A2C] hover:bg-[#2A2A2C]'
                  }`}
                  title={state.musicPlaying ? "Nhấp để dừng phát" : "Nhấp để cho phép phát"}
                >
                  {state.musicPlaying ? (
                    <FileAudio className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#E0D8D0]/40">Đang phát</span>
                      <span className="text-xs font-serif italic text-[#F2EFE9] font-medium">
                        {musicTracks.find((m) => m.id === state.selectedMusicId)?.title.split(' (')[0]}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#E0D8D0]/50">
                      {Math.round(state.musicVolume * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-[#E0D8D0]/40" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={state.musicVolume}
                      onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                      className="w-full h-[2px] bg-[#2A2A2C] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
