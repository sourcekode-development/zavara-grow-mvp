import { claimsStorageRepository } from '../repository/claims-storage.repository';

export const claimsStorageApi = {
  async getSignedScreenshotUrl(path: string): Promise<string | null> {
    const { data } = await claimsStorageRepository.createSignedUrl(path, 60 * 60);
    return data;
  },
};
