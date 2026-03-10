import { supabase } from '@/shared/config/supabase';

const KPI_CLAIMS_BUCKET = import.meta.env.VITE_KPI_CLAIMS_BUCKET || 'kpi-claims';

export interface UploadClaimScreenshotParams {
  developerId: string;
  submissionId: string;
  file: File;
}

export interface UploadedClaimScreenshot {
  path: string;
}

export const claimsStorageRepository = {
  async uploadClaimScreenshot(
    params: UploadClaimScreenshotParams
  ): Promise<{ data: UploadedClaimScreenshot | null; error: string | null }> {
    const fileExt = params.file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const path = `${params.developerId}/claim_${params.submissionId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(KPI_CLAIMS_BUCKET)
      .upload(path, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    return {
      data: {
        path,
      },
      error: null,
    };
  },

  getPublicUrl(path: string): string {
    return supabase.storage.from(KPI_CLAIMS_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async createSignedUrl(
    path: string,
    expiresInSeconds = 3600
  ): Promise<{ data: string | null; error: string | null }> {
    const { data, error } = await supabase.storage
      .from(KPI_CLAIMS_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data?.signedUrl || null, error: null };
  },

  async removeClaimScreenshots(
    paths: string[]
  ): Promise<{ error: string | null }> {
    if (paths.length === 0) {
      return { error: null };
    }

    const { error } = await supabase.storage
      .from(KPI_CLAIMS_BUCKET)
      .remove(paths);

    return { error: error?.message || null };
  },
};
