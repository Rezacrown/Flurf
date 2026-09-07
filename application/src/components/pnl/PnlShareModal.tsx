"use client";

import React, { useRef, useState } from "react";
import { PnlCard } from "./PnlCard";
import { PnlShareData } from "@/domain/types";
import { downloadPnlCard, copyPnlCardToClipboard, openSocialIntent } from "@/lib/export-pnl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Share2, Send, Loader2 } from "lucide-react";

interface PnlShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PnlShareData | null;
}

export const PnlShareModal: React.FC<PnlShareModalProps> = ({ isOpen, onClose, data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!data) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      await downloadPnlCard(cardRef.current, `flurf-pnl-${Date.now()}.png`);
      showToast("PNG saved successfully!");
    } catch (err) {
      showToast("Download failed, please try again");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const ok = await copyPnlCardToClipboard(cardRef.current);
      if (ok) {
        setCopied(true);
        showToast("Image copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      } else {
        await navigator.clipboard.writeText(data.referralUrl);
        showToast("Referral link copied!");
      }
    } catch {
      showToast("Failed to copy image");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border-border flex flex-col items-center">
        <DialogHeader className="w-full text-center sm:text-left">
          <DialogTitle className="font-serif text-xl font-medium text-foreground">
            Share Trading Achievement
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate your verified PnL achievement card ready for X and Telegram.
          </DialogDescription>
        </DialogHeader>

        {/* Live Card Preview */}
        <div className="flex justify-center items-center w-full my-3 overflow-hidden rounded-2xl">
          <div className="transform scale-[0.88] sm:scale-100 origin-center transition">
            <PnlCard ref={cardRef} {...data} />
          </div>
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div className="px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-full">
            {feedback}
          </div>
        )}

        {/* Action Buttons Grid */}
        <div className="mt-4 w-full grid grid-cols-2 gap-2.5">
          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="rounded-xl text-xs font-semibold h-10"
          >
            {isExporting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Download className="size-3.5 mr-1.5" />}
            Download PNG
          </Button>

          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={isExporting}
            className="rounded-xl text-xs font-semibold h-10"
          >
            {copied ? <Check className="size-3.5 text-emerald-500 mr-1.5" /> : <Copy className="size-3.5 mr-1.5" />}
            {copied ? "Copied!" : "Copy Image"}
          </Button>
        </div>

        {/* Direct Social Share */}
        <div className="mt-3 flex items-center justify-between w-full pt-3 border-t border-border/40 text-xs">
          <span className="text-muted-foreground">Share link to:</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openSocialIntent(
                  "twitter",
                  `Just hit +${data.roiPercent.toFixed(1)}% ROI on "${data.marketQuestion}" via @FlurfTrade on @Somnia_Network! 🔥`,
                  data.referralUrl
                )
              }
              className="rounded-lg text-xs h-8 px-3"
            >
              <svg className="size-3 mr-1 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X / Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openSocialIntent(
                  "telegram",
                  `Check out my prediction on Flurf:`,
                  data.referralUrl
                )
              }
              className="rounded-lg text-xs h-8 px-3"
            >
              <Send className="size-3 mr-1 text-[#0088cc]" />
              Telegram
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
