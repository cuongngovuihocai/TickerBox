import React, { useRef, useEffect, useState } from 'react';
import { TimerState } from '../types';
import { Layers, MonitorPlay, ExternalLink, Sliders, Eye, EyeOff, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, Type } from 'lucide-react';

interface PiPProps {
  state: TimerState;
  onOpenProjectorTab: () => void;
}

// Helper to determine if a hex color is light or dark
function isColorLight(hex: string) {
  const color = hex.replace('#', '');
  if (color.length !== 6) return false;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // HSP equation
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp > 127.5;
}

export default function PictureInPictureButton({ state, onOpenProjectorTab }: PiPProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Customization States for PiP Window
  const [pipBgType, setPipBgType] = useState<'dark' | 'light' | 'transparent' | 'chroma' | 'custom'>('dark');
  const [pipCustomBgColor, setPipCustomBgColor] = useState<string>('#ffffff');
  const [pipScale, setPipScale] = useState<number>(0.85); // Default is 0.85 to leave nice outer margins
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [showCircle, setShowCircle] = useState<boolean>(true);
  const [showStatus, setShowStatus] = useState<boolean>(true);

  const animationFrameId = useRef<number | null>(null);

  // Check if browser supports canvas-to-video Picture-in-Picture
  useEffect(() => {
    const video = document.createElement('video');
    const supportsPiP = !!document.pictureInPictureEnabled && !!(video as any).requestPictureInPicture;
    setIsSupported(supportsPiP);
  }, []);

  // Update canvas on every frame if active
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      drawTimerCanvas(ctx, canvas.width, canvas.height, state);
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isActive, state, pipBgType, pipCustomBgColor, pipScale, showTitle, showCircle, showStatus]);

  // Handle PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLeavePiP = () => {
      setIsActive(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };

    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, []);

  // Sophisticated Theme colors mapping for canvas
  const themeColorsMap: Record<string, string> = {
    emerald: '#D4AF37', // Default Gold
    indigo: '#E0D8D0',  // Warm Beige
    amber: '#C5A030',   // Antique Gold
    rose: '#A83232',    // Burgundy Red
    slate: '#A19E95',   // Platinum Grey
  };

  const drawTimerCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    s: TimerState
  ) => {
    // 1. Determine background color
    let bgColor = '#0F0F10'; // Slate dark
    if (pipBgType === 'light') {
      bgColor = '#ffffff';
    } else if (pipBgType === 'chroma') {
      bgColor = '#00ff00';
    } else if (pipBgType === 'custom') {
      bgColor = pipCustomBgColor;
    }

    // 2. Clear background or fill with color
    if (pipBgType === 'transparent') {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Determine content colors based on background
    const isLightBg = pipBgType === 'light' || (pipBgType === 'custom' && isColorLight(pipCustomBgColor));
    const textColorMain = isLightBg ? '#1A1A1C' : '#F2EFE9';
    const textColorMuted = isLightBg ? 'rgba(26, 26, 28, 0.6)' : 'rgba(242, 239, 233, 0.5)';
    const gridColor = isLightBg ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';

    const activeColor = themeColorsMap[s.themeColor] || '#D4AF37';

    // 3. Save Context & Apply translation scale centered
    ctx.save();
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Scale drawings centered
    ctx.translate(centerX, centerY);
    ctx.scale(pipScale, pipScale);
    ctx.translate(-centerX, -centerY);

    // 4. Draw subtle background grid (hidden in transparent to look cleaner)
    if (pipBgType !== 'transparent') {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
    }

    const radius = Math.min(width, height) * 0.35;

    // 5. Draw Outer Circle Clock (if enabled)
    if (showCircle) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = isLightBg ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 12;
      ctx.stroke();

      // Draw active timer progress ring
      const progress = s.totalDuration > 0 ? s.remainingTime / s.totalDuration : 0;
      const startAngle = -0.5 * Math.PI; // Top Center
      const endAngle = startAngle + 2 * Math.PI * progress;

      if (progress > 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        
        // Dynamic glow filter on dark backgrounds
        if (!isLightBg && pipBgType !== 'transparent') {
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    }

    // 6. Draw Slide Title (if enabled)
    if (showTitle) {
      ctx.fillStyle = textColorMuted;
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Let's add extra shadow on transparent background for contrast
      if (pipBgType === 'transparent') {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }
      ctx.fillText(s.title.toUpperCase(), centerX, centerY - radius - 24);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 7. Draw Central Timer text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const mins = Math.floor(s.remainingTime / 60);
    const secs = s.remainingTime % 60;

    if (pipBgType === 'transparent') {
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
    }

    if (s.hideSeconds) {
      if (s.remainingTime <= 0) {
        ctx.font = '500 40px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('HẾT GIỜ', centerX, centerY);
      } else if (mins === 0) {
        ctx.font = '500 32px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#C5A030';
        ctx.fillText('< 1 PHÚT', centerX, centerY);
      } else {
        ctx.font = '500 58px "Playfair Display", Georgia, serif';
        ctx.fillStyle = textColorMain;
        ctx.fillText(`${mins}`, centerX, centerY - 10);
        
        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.fillStyle = textColorMuted;
        ctx.fillText('PHÚT', centerX, centerY + 28);
      }
    } else {
      const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      ctx.font = '500 52px "Playfair Display", Georgia, serif';
      
      if (s.remainingTime <= 0) {
        ctx.fillStyle = '#f43f5e';
      } else if (s.remainingTime < 30) {
        ctx.fillStyle = '#C5A030'; // Warning gold/amber
      } else {
        ctx.fillStyle = textColorMain;
      }
      ctx.fillText(displayTime, centerX, centerY);
    }

    // Restore text shadows
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 8. Draw Status text at bottom (if enabled)
    if (showStatus) {
      ctx.fillStyle = s.status === 'running' ? activeColor : textColorMuted;
      ctx.font = 'bold 10px "Inter", sans-serif';
      
      if (pipBgType === 'transparent') {
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }

      const statusText =
        s.status === 'running'
          ? '● ĐANG TRÌNH CHIẾU'
          : s.status === 'paused'
          ? '⏸ ĐANG TẠM DỪNG'
          : s.status === 'completed'
          ? '✓ HOÀN THÀNH'
          : '■ SẴN SÀNG';
      ctx.fillText(statusText, centerX, centerY + radius + 24);
    }

    ctx.restore();
  };

  const handleTogglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      try {
        await (document as any).exitPictureInPicture();
        setIsActive(false);
      } catch (err) {
        console.error('Error exiting PiP:', err);
      }
    } else {
      setIsActive(true);
      setTimeout(async () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) return;

          // Capture canvas stream at 12 fps
          const stream = (canvas as any).captureStream 
            ? (canvas as any).captureStream(12) 
            : (canvas as any).mozCaptureStream 
            ? (canvas as any).mozCaptureStream(12) 
            : null;
            
          if (!stream) {
            alert('Trình duyệt của bạn không hỗ trợ tính năng stream canvas.');
            setIsActive(false);
            return;
          }

          video.srcObject = stream;
          await video.play();
          await (video as any).requestPictureInPicture();
        } catch (err) {
          console.error('Error entering PiP:', err);
          setIsActive(false);
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenProjectorTab}
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-[#E0D8D0] border border-[#2A2A2C] hover:text-[#D4AF37] rounded-lg text-xs font-semibold transition-all cursor-pointer"
          title="Mở màn hình trình chiếu chính trong tab mới để kéo ra màn hình thứ hai"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Màn hình chiếu</span>
        </button>

        {isSupported ? (
          <button
            onClick={handleTogglePiP}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-amber-500/20 text-[#D4AF37] border-amber-500 shadow-md shadow-amber-500/10'
                : 'bg-[#1A1A1C] text-[#E0D8D0] border-[#2A2A2C] hover:bg-[#2A2A2C] hover:text-[#D4AF37]'
            }`}
            title="Mở cửa sổ nổi Picture-in-Picture để đè lên slide Powerpoint hoặc trình duyệt khác"
          >
            <Layers className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse text-[#D4AF37]' : 'text-[#D4AF37]'}`} />
            <span>{isActive ? 'Đóng cửa sổ nổi' : 'Cửa sổ nổi PiP'}</span>
          </button>
        ) : (
          <div className="flex items-center justify-center text-center px-2 py-1 bg-red-950/20 border border-red-900/30 rounded-lg text-[10px] text-red-400">
            PiP không hỗ trợ trên trình duyệt này
          </div>
        )}
      </div>

      {/* Advanced Customizer Panel Toggle */}
      {isSupported && (
        <div className="border border-[#2D2D30] rounded-xl bg-[#131314] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1C1C1E] transition-all text-xs font-semibold text-[#E0D8D0] border-b border-[#2D2D30]/30"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Cấu hình Cửa sổ nổi PiP cao cấp</span>
            </div>
            <span className="text-[10px] text-[#D4AF37] hover:underline font-normal">
              {showSettings ? 'Thu gọn' : 'Thiết lập'}
            </span>
          </button>

          {/* Settings Detail Section */}
          <div 
            className={`transition-all duration-300 ease-in-out ${
              showSettings ? 'max-h-[500px] p-4 opacity-100' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
            } flex flex-col gap-4 text-xs`}
          >
            {/* Explanatory banner about native transparency constraint */}
            <div className="p-2.5 bg-[#1A1A1C] border border-[#2A2A2C] text-[#E0D8D0]/70 text-[10px] leading-relaxed rounded-md">
              💡 <strong className="text-[#D4AF37]">Mẹo cực hay:</strong> Hệ điều hành và trình duyệt mặc định <strong className="text-white">không hỗ trợ</strong> nền trong suốt 100% cho cửa sổ nổi của hệ thống. Để có giao diện hòa hợp nhất, hãy chọn <strong className="text-white">màu nền khớp với màu nền trang Slide</strong> của bạn (Ví dụ: Trắng cho slide sáng, hoặc nhập mã màu tự chỉnh).
            </div>

            {/* 1. Background type & color choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-[#E0D8D0]/50 flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-[#D4AF37]" />
                Màu nền cửa sổ nổi
              </label>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => setPipBgType('dark')}
                  className={`py-1 text-[10px] font-semibold border rounded transition-all ${
                    pipBgType === 'dark' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#2A2A2C]'
                  }`}
                  title="Nền tối xanh đen"
                >
                  Tối
                </button>
                <button
                  type="button"
                  onClick={() => setPipBgType('light')}
                  className={`py-1 text-[10px] font-semibold border rounded transition-all ${
                    pipBgType === 'light' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#2A2A2C]'
                  }`}
                  title="Nền sáng trắng"
                >
                  Sáng
                </button>
                <button
                  type="button"
                  onClick={() => setPipBgType('transparent')}
                  className={`py-1 text-[10px] font-semibold border rounded transition-all ${
                    pipBgType === 'transparent' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#2A2A2C]'
                  }`}
                  title="Không nền (Dành cho trình duyệt hỗ trợ kênh alpha)"
                >
                  K.Nền
                </button>
                <button
                  type="button"
                  onClick={() => setPipBgType('chroma')}
                  className={`py-1 text-[10px] font-semibold border rounded transition-all ${
                    pipBgType === 'chroma' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#2A2A2C]'
                  }`}
                  title="Xanh lá Chroma Key để lọc ghép livestream"
                >
                  Phông
                </button>
                <button
                  type="button"
                  onClick={() => setPipBgType('custom')}
                  className={`py-1 text-[10px] font-semibold border rounded transition-all ${
                    pipBgType === 'custom' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/70 hover:bg-[#2A2A2C]'
                  }`}
                  title="Nhập màu tùy chỉnh trùng màu slide"
                >
                  Màu..
                </button>
              </div>

              {pipBgType === 'custom' && (
                <div className="flex items-center gap-2 mt-1.5 animate-fadeIn">
                  <span className="text-[10px] text-[#E0D8D0]/60">Mã HEX:</span>
                  <input
                    type="color"
                    value={pipCustomBgColor}
                    onChange={(e) => setPipCustomBgColor(e.target.value)}
                    className="w-6 h-6 rounded border border-[#2A2A2C] cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={pipCustomBgColor}
                    onChange={(e) => setPipCustomBgColor(e.target.value)}
                    className="flex-1 bg-[#1A1A1C] border border-[#2A2A2C] rounded px-2 py-1 text-xs text-[#E0D8D0] font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              )}
            </div>

            {/* 2. Scale adjust (Micro-size inside the native window) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-[#E0D8D0]/50">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="w-3 h-3 text-[#D4AF37]" />
                  Độ thu nhỏ nội dung vẽ ({Math.round(pipScale * 100)}%)
                </span>
                <span className="text-[9px] text-[#D4AF37]">Cực kỳ nhỏ</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPipScale(s => Math.max(0.4, s - 0.1))}
                  disabled={pipScale <= 0.4}
                  className="p-1.5 bg-[#1A1A1C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded disabled:opacity-40"
                  title="Thu nhỏ hơn nữa"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="1.2"
                  step="0.05"
                  value={pipScale}
                  onChange={(e) => setPipScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#D4AF37] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setPipScale(s => Math.min(1.2, s + 0.1))}
                  disabled={pipScale >= 1.2}
                  className="p-1.5 bg-[#1A1A1C] border border-[#2A2A2C] text-[#E0D8D0] hover:text-[#D4AF37] rounded disabled:opacity-40"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-[#E0D8D0]/50 leading-relaxed">
                *Vì hệ điều hành giới hạn kích thước tối thiểu của cửa sổ nổi, bạn có thể kéo thanh này sang trái để thu nhỏ các chữ số và vòng tròn thời gian bên trong cửa sổ, giúp tiết kiệm diện tích tối đa!
              </p>
            </div>

            {/* 3. Toggle items */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-[#E0D8D0]/50 flex items-center gap-1.5">
                <Type className="w-3 h-3 text-[#D4AF37]" />
                Bật/Tắt các thành phần hiển thị
              </label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowTitle(!showTitle)}
                  className={`py-1 text-[9px] font-semibold border rounded transition-all flex items-center justify-center gap-1 ${
                    showTitle ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/40'
                  }`}
                >
                  {showTitle && <Check className="w-2.5 h-2.5" />}
                  <span>Tiêu đề</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCircle(!showCircle)}
                  className={`py-1 text-[9px] font-semibold border rounded transition-all flex items-center justify-center gap-1 ${
                    showCircle ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/40'
                  }`}
                >
                  {showCircle && <Check className="w-2.5 h-2.5" />}
                  <span>Vòng tròn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatus(!showStatus)}
                  className={`py-1 text-[9px] font-semibold border rounded transition-all flex items-center justify-center gap-1 ${
                    showStatus ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-[#1A1A1C] border-[#2A2A2C] text-[#E0D8D0]/40'
                  }`}
                >
                  {showStatus && <Check className="w-2.5 h-2.5" />}
                  <span>Trạng thái</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden elements used for stream capture and PiP playback */}
      <div className="hidden" aria-hidden="true">
        <canvas ref={canvasRef} width={400} height={400} />
        <video ref={videoRef} width={400} height={400} muted playsInline />
      </div>
    </div>
  );
}
