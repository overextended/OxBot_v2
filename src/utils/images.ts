import imghash from 'imghash';
import { Attachment } from 'discord.js';
import { logger } from './logger';

const SIMILARITY_THRESHOLD = 5;

export function calculateDistance(hash1: string, hash2: string): number {
  let distance = 0;
  const bin1 = BigInt(`0x${hash1}`).toString(2).padStart(64, '0');
  const bin2 = BigInt(`0x${hash2}`).toString(2).padStart(64, '0');

  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) distance++;
  }
  return distance;
}

export async function computeAttachmentHash(attachment: Attachment): Promise<string | null> {
  if (!attachment.contentType?.startsWith('image/')) return null;

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generates an 8x8 (64-bit) binary/hex pHash
    return await imghash.hash(buffer, 8, 'hex');
  } catch (err) {
    logger.warn(`[Anti-Scam] Failed to calculate pHash for attachment ${attachment.id}:`, (err as Error).message);
    return null;
  }
}
