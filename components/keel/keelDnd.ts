export const KEEL_MIME = "application/x-keel-asset";

export type AttachedAsset = {
  id: string;
  ticker: string;
  name: string;
  /** Locked chips come from the page (asset detail) and cannot be removed. */
  locked?: boolean;
};

export function encodeAsset(asset: AttachedAsset): string {
  return JSON.stringify({ id: asset.id, ticker: asset.ticker, name: asset.name });
}

export function decodeAsset(transfer: DataTransfer): AttachedAsset | null {
  const raw = transfer.getData(KEEL_MIME) || transfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AttachedAsset>;
    if (typeof parsed.id !== "string" || typeof parsed.ticker !== "string") return null;
    return {
      id: parsed.id.slice(0, 30),
      ticker: parsed.ticker.slice(0, 12),
      name: typeof parsed.name === "string" ? parsed.name.slice(0, 80) : parsed.ticker,
    };
  } catch {
    return null;
  }
}

export function hasKeelPayload(transfer: DataTransfer | null): boolean {
  return Boolean(transfer && Array.from(transfer.types).includes(KEEL_MIME));
}

export function startAssetDrag(event: React.DragEvent, asset: AttachedAsset): void {
  event.dataTransfer.setData(KEEL_MIME, encodeAsset(asset));
  event.dataTransfer.setData("text/plain", encodeAsset(asset));
  event.dataTransfer.effectAllowed = "copy";
}
