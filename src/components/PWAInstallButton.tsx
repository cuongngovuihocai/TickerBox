import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-102"
        title="Cài đặt TickerBox về máy tính hoặc điện thoại như một ứng dụng độc lập"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cài đặt ứng dụng PWA</span>
        <span className="sm:hidden">Cài đặt PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1C] hover:bg-[#2A2A2C] text-[#E0D8D0] border border-[#2A2A2C] text-xs font-medium transition-all cursor-pointer"
          title="Hướng dẫn cài đặt TickerBox trên iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Cài trên iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl bg-[#141416] border border-[#2A2A2C] p-5 shadow-2xl text-[#E0D8D0] relative flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#2A2A2C] pb-3">
                <h3 className="text-sm font-semibold text-[#F2EFE9] flex items-center gap-2">
                  <span>📱 Cài đặt trên iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#E0D8D0]/50 hover:text-white hover:bg-[#2A2A2C] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#E0D8D0]/80">
                <div className="flex items-start gap-2.5 bg-[#09090A] p-3 rounded-xl border border-[#2A2A2C]">
                  <Share className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Bước 1:</strong> Bấm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng của trình duyệt Safari.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#09090A] p-3 rounded-xl border border-[#2A2A2C]">
                  <PlusSquare className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Bước 2:</strong> Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-[#D4AF37] hover:bg-[#C5A030] text-[#0D0D0E] font-semibold text-xs rounded-xl transition cursor-pointer mt-1"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
