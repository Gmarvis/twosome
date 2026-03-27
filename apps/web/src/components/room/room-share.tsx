import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface RoomShareProps {
  code: string;
}

export function RoomShare({ code }: RoomShareProps) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${code}`;

  const handleShare = async () => {
    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "twosome.",
          url: link,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="mono-label">scan or share</p>

      {/* QR code */}
      <div className="bg-white p-4 rounded-[16px] border-[2.5px] border-ink">
        <QRCodeSVG
          value={link}
          size={180}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#1A1A1A"
        />
      </div>

      {/* Link preview + share button */}
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 bg-white border-[2px] border-ink/10 rounded-[10px] px-3 py-2.5 overflow-hidden">
          <p className="font-mono text-[11px] text-ink-50 truncate">{link}</p>
        </div>
        <button
          className="btn-sm rounded-[10px] px-4 py-2.5 whitespace-nowrap"
          onClick={handleShare}
        >
          {copied ? "copied!" : navigator.share ? "share" : "copy"}
        </button>
      </div>
    </div>
  );
}
