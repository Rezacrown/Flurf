import { toPng, toJpeg, toBlob } from "html-to-image";

interface ExportOptions {
  pixelRatio?: number;
  quality?: number;
}

async function prepareAndRenderNode<T>(
  node: HTMLElement,
  renderFn: (node: HTMLElement, options: any) => Promise<T>,
  options: ExportOptions = { pixelRatio: 2, quality: 0.95 }
): Promise<T> {
  if (typeof window !== "undefined" && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Safari font rasterization warmup
  try {
    await toPng(node, { cacheBust: true });
  } catch {
    // ignore warmup error
  }

  return await renderFn(node, {
    cacheBust: true,
    pixelRatio: options.pixelRatio ?? 2,
    quality: options.quality ?? 0.95,
  });
}

export async function downloadPnlCard(
  node: HTMLElement,
  filename = "flurf-pnl-card.png"
): Promise<void> {
  const dataUrl = await prepareAndRenderNode(node, toPng);
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyPnlCardToClipboard(node: HTMLElement): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error("Clipboard API not supported");
    }

    const blobPromise = prepareAndRenderNode(node, toBlob);

    const item = new ClipboardItem({
      "image/png": blobPromise.then((b) => {
        if (!b) throw new Error("Blob generation failed");
        return b;
      }),
    });

    await navigator.clipboard.write([item]);
    return true;
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error);
    return false;
  }
}

export function openSocialIntent(
  platform: "twitter" | "telegram",
  text: string,
  url: string
): void {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  let shareUrl = "";
  if (platform === "twitter") {
    shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  } else if (platform === "telegram") {
    shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  }

  if (typeof window !== "undefined") {
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }
}
