
import { supabase } from '@/app/integrations/supabase/client';

/**
 * Cloudflare CDN Service
 * 
 * Handles all static asset uploads and delivery through Cloudflare CDN.
 * This service does NOT modify any live-streaming API logic.
 * 
 * CDN integration applies only to:
 * - Profile images
 * - Story media (images & short videos)
 * - Post media
 * - Gift icons & animations
 * - UI assets
 * - Saved stream cover images
 * - User-uploaded thumbnails
 */

const CDN_DOMAIN = 'cdn.roastlive.com'; // Configure this in your Cloudflare settings
const SUPABASE_STORAGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/storage/v1/object/public';

interface UploadOptions {
  bucket: string;
  path: string;
  file: Blob | File;
  contentType?: string;
  cacheControl?: string;
}

interface CDNTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

interface SignedURLOptions {
  expiresIn?: number; // seconds, default 6 hours
  sessionId?: string;
  watermark?: string;
}

class CDNService {
  /**
   * Upload media to Supabase storage and return CDN URL
   */
  async uploadMedia(options: UploadOptions): Promise<{
    success: boolean;
    cdnUrl?: string;
    supabaseUrl?: string;
    error?: string;
  }> {
    try {
      const { bucket, path, file, contentType, cacheControl } = options;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || 'image/jpeg',
          cacheControl: cacheControl || 'public, max-age=3600', // 1 hour browser cache
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const supabaseUrl = urlData.publicUrl;

      // Convert to CDN URL
      const cdnUrl = this.convertToCDNUrl(supabaseUrl);

      console.log('✅ Media uploaded successfully:', {
        supabaseUrl,
        cdnUrl,
      });

      return {
        success: true,
        cdnUrl,
        supabaseUrl,
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Convert Supabase storage URL to CDN URL
   */
  convertToCDNUrl(supabaseUrl: string): string {
    // Extract the path after /storage/v1/object/public/
    const match = supabaseUrl.match(/\/storage\/v1\/object\/public\/(.+)/);
    
    if (!match) {
      console.warn('Could not parse Supabase URL, returning original:', supabaseUrl);
      return supabaseUrl;
    }

    const path = match[1];
    
    // Return CDN URL
    // In production, this would be: https://cdn.roastlive.com/${path}
    // For now, we'll use the Supabase URL as fallback
    return `https://${CDN_DOMAIN}/${path}`;
  }

  /**
   * Get CDN URL with transformations
   */
  getCDNUrl(
    originalUrl: string,
    transforms?: CDNTransformOptions
  ): string {
    const cdnUrl = this.isCDNUrl(originalUrl) 
      ? originalUrl 
      : this.convertToCDNUrl(originalUrl);

    if (!transforms) {
      return cdnUrl;
    }

    // Build transformation query string
    const params = new URLSearchParams();

    if (transforms.width) params.append('width', transforms.width.toString());
    if (transforms.height) params.append('height', transforms.height.toString());
    if (transforms.quality) params.append('quality', transforms.quality.toString());
    if (transforms.format) params.append('format', transforms.format);
    if (transforms.fit) params.append('fit', transforms.fit);

    const queryString = params.toString();
    return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
  }

  /**
   * Get optimized image URL for specific use cases
   */
  getOptimizedImageUrl(
    originalUrl: string,
    type: 'profile' | 'story' | 'feed' | 'thumbnail' | 'explore'
  ): string {
    const transformations: Record<typeof type, CDNTransformOptions> = {
      profile: {
        width: 200,
        height: 200,
        quality: 90,
        format: 'webp',
        fit: 'cover',
      },
      story: {
        width: 512,
        quality: 85,
        format: 'webp',
      },
      feed: {
        width: 640,
        quality: 85,
        format: 'webp',
      },
      thumbnail: {
        width: 320,
        quality: 80,
        format: 'webp',
      },
      explore: {
        width: 400,
        quality: 85,
        format: 'webp',
        fit: 'cover',
      },
    };

    return this.getCDNUrl(originalUrl, transformations[type]);
  }

  /**
   * Generate signed URL for private/restricted content
   */
  async generateSignedUrl(
    url: string,
    options: SignedURLOptions = {}
  ): Promise<string> {
    const {
      expiresIn = 21600, // 6 hours default
      sessionId,
      watermark = 'RoastLive Premium',
    } = options;

    try {
      // Calculate expiration timestamp
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

      // Create signature payload
      const payload = {
        url,
        expiresAt,
        sessionId: sessionId || 'anonymous',
        watermark,
      };

      // In production, this would use a secret key to sign the URL
      // For now, we'll create a simple hash
      const signature = await this.createSignature(JSON.stringify(payload));

      // Build signed URL
      const signedUrl = new URL(url);
      signedUrl.searchParams.append('expires', expiresAt.toString());
      signedUrl.searchParams.append('signature', signature.substring(0, 32));
      signedUrl.searchParams.append('watermark', encodeURIComponent(watermark));

      return signedUrl.toString();
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return url; // Fallback to original URL
    }
  }

  /**
   * Create a simple signature (in production, use proper HMAC)
   */
  private async createSignature(data: string): Promise<string> {
    // Simple hash for demo purposes
    // In production, use crypto.subtle.sign with a secret key
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if URL is already a CDN URL
   */
  isCDNUrl(url: string): boolean {
    return url.includes(CDN_DOMAIN);
  }

  /**
   * Get fallback URL (Supabase direct URL)
   */
  getFallbackUrl(cdnUrl: string): string {
    if (!this.isCDNUrl(cdnUrl)) {
      return cdnUrl;
    }

    // Convert CDN URL back to Supabase URL
    const path = cdnUrl.replace(`https://${CDN_DOMAIN}/`, '');
    return `${SUPABASE_STORAGE_URL}/${path}`;
  }

  /**
   * Upload profile image with CDN optimization
   */
  async uploadProfileImage(
    userId: string,
    file: Blob | File
  ): Promise<{
    success: boolean;
    cdnUrl?: string;
    error?: string;
  }> {
    const path = `avatars/${userId}/${Date.now()}.jpg`;
    
    return this.uploadMedia({
      bucket: 'media',
      path,
      file,
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=86400', // 24 hours
    });
  }

  /**
   * Upload story media with CDN optimization
   */
  async uploadStoryMedia(
    userId: string,
    file: Blob | File,
    isVideo: boolean = false
  ): Promise<{
    success: boolean;
    cdnUrl?: string;
    error?: string;
  }> {
    const extension = isVideo ? 'mp4' : 'jpg';
    const path = `stories/${userId}/${Date.now()}.${extension}`;
    
    return this.uploadMedia({
      bucket: 'media',
      path,
      file,
      contentType: isVideo ? 'video/mp4' : 'image/jpeg',
      cacheControl: 'public, max-age=86400', // 24 hours
    });
  }

  /**
   * Upload post media with CDN optimization
   */
  async uploadPostMedia(
    userId: string,
    file: Blob | File
  ): Promise<{
    success: boolean;
    cdnUrl?: string;
    error?: string;
  }> {
    const path = `posts/${userId}/${Date.now()}.jpg`;
    
    return this.uploadMedia({
      bucket: 'media',
      path,
      file,
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=86400', // 24 hours
    });
  }

  /**
   * Set cache control headers for aggressive caching
   */
  getCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'public, max-age=2592000', // 30 days edge cache
      'CDN-Cache-Control': 'max-age=2592000',
      'Cloudflare-CDN-Cache-Control': 'max-age=2592000',
    };
  }

  /**
   * Preload critical images for better performance
   */
  preloadImages(urls: string[]): void {
    if (typeof window === 'undefined') return;

    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.getOptimizedImageUrl(url, 'thumbnail');
      document.head.appendChild(link);
    });
  }
}

export const cdnService = new CDNService();
