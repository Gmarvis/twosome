import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2 } from "lucide-react";

interface RoomShareProps {
  code: string;
}

export function RoomShare({ code }: RoomShareProps) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "twosome.", url: link });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    await copyLink();
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

      {/* Copy / share buttons */}
      <div className="w-full flex items-center gap-2">
        <button
          className="btn-pop flex-1 flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px]"
          onClick={copyLink}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "copied!" : "copy link"}
        </button>
        <button
          className="btn-pop flex-1 flex items-center justify-center gap-2 rounded-[10px] py-2.5 text-[13px]"
          onClick={handleShare}
        >
          <Share2 size={16} />
          share
        </button>
      </div>
    </div>
  );
}
