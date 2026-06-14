import { BadRequestException } from '@nestjs/common';

/** Expected prefix for user-owned uploads: uploads/{userId}/... */
export function storageKeyPrefix(userId: string): string {
  return `uploads/${userId}/`;
}

export function isStorageKeyOwned(userId: string, storageKey: string): boolean {
  const key = storageKey.trim();
  return key.startsWith(storageKeyPrefix(userId)) && key.length > storageKeyPrefix(userId).length;
}

export function assertStorageKeyOwned(userId: string, storageKey: string): void {
  if (!isStorageKeyOwned(userId, storageKey)) {
    throw new BadRequestException('Invalid storageKey for this user');
  }
}
