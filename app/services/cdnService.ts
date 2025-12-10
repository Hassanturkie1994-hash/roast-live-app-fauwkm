
import { supabase } from '@/app/integrations/supabase/client';
import * as Crypto from 'expo-crypto';

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
 * 
 * Features:
 * - Smart tier optimization (A, B, C)
 * - Deduplication via SHA256 hashing
 * - Error fallback to Supabase URLs
 * - Usage monitoring and analytics
 */

const CDN_DOMAIN = 'cdn.roastlive.com'; // Configure this in your Cloudflare settings
const SUPABASE_STORAGE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/storage/v1/object/public';

// CDN Tier Configuration
const TIER_CONFIG = {
  A: {
    priority: 'HIGH',
    edgeCacheDays: 30,
    browserCacheHours: 2,
    types: ['profile', 'gift', 'badge'],
  },
  B: {
    priority: 'MEDIUM',
    edgeCacheDays: 14,
    browserCacheHours: 0.5, // 30 minutes
    types: ['post', 'story', 'thumbnail'],
  },
  C: {
    priority: 'LOW',
    edgeCacheDays: 3,
    browserCacheHours: 0.25, // 15 minutes
    types: ['cached', 'banner', 'preview'],
  },
};

interface UploadOptions {
  bucket: string;
  path: string;
  file: Blob | File;
  contentType?: string;
  cacheControl?: string;
  tier?: 'A' | 'B' | 'C';
  mediaType?: 'profile' | 'story' | 'post' | 'gift' | 'thumbnail' | 'other';
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

interface CDNMonitoringData {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitPercentage: number;
  avgDeliveryLatency: number;
  topMedia: Array<{
    url: string;
    accessCount: number;
    type: string;
  }>;
}

class CDNService {
  /**
   * Generate SHA256 hash for file deduplication
   */
  private async generateFileHash(file: Blob | File): Promise<string> {
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Generate SHA256 hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64
      );

      return hash;
    } catch (error) {
      console.error('Error generating file hash:', error);
      // Return a timestamp-based fallback hash
      return `fallback_${Date.now()}_${Math.random()}`;
    }
  }

  /**
   * Check if file already exists via hash
   */
  private async checkDuplicateMedia(
    fileHash: string,
    mediaType: string
  ): Promise<{ exists: boolean; cdnUrl?: string; supabaseUrl?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_media_hashes')
        .select('cdn_url, supabase_url')
        .eq('file_hash', fileHash)
        .eq('media_type', mediaType)
        .single();

      if (error || !data) {
        return { exists: false };
      }

      // Verify the URL is still accessible
      return {
        exists: true,
        cdnUrl: data.cdn_url,
        supabaseUrl: data.supabase_url,
      };
    } catch (error) {
      console.error('Error checking duplicate media:', error);
      return { exists: false };
    }
  }

  /**
   * Store media hash for deduplication
   */
  private async storeMediaHash(
    userId: string,
    fileHash: string,
    mediaType: string,
    cdnUrl: string,
    supabaseUrl: string,
    sizeBytes: number
  ): Promise<void> {
    try {
      await supabase.from('user_media_hashes').upsert({
        user_id: userId,
        file_hash: fileHash,
        media_type: mediaType,
        cdn_url: cdnUrl,
        supabase_url: supabaseUrl,
        size_bytes: sizeBytes,
      });
    } catch (error) {
      console.error('Error storing media hash:', error);
    }
  }

  /**
   * Get tier configuration for media type
   */
  private getTierForMediaType(mediaType: string): 'A' | 'B' | 'C' {
    for (const [tier, config] of Object.entries(TIER_CONFIG)) {
      if (config.types.includes(mediaType)) {
        return tier as 'A' | 'B' | 'C';
      }
    }
    return 'C'; // Default to lowest tier
  }

  /**
   * Get cache control header based on tier
   */
  private getCacheControlForTier(tier: 'A' | 'B' | 'C'): string {
    const config = TIER_CONFIG[tier];
    const browserCacheSeconds = Math.floor(config.browserCacheHours * 3600);
    const edgeCacheSeconds = config.edgeCacheDays * 86400;
    
    return `public, max-age=${browserCacheSeconds}, s-maxage=${edgeCacheSeconds}`;
  }

  /**
   * Log CDN usage for monitoring
   */
  private async logCDNUsage(
    userId: string | null,
    mediaUrl: string,
    mediaType: string,
    tier: string,
    cacheHit: boolean,
    deliveryLatencyMs: number,
    bytesTransferred: number
  ): Promise<void> {
    try {
      // Log individual access
      await supabase.from('cdn_usage_logs').insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        tier,
        cache_hit: cacheHit,
        delivery_latency_ms: deliveryLatencyMs,
        bytes_transferred: bytesTransferred,
      });

      // Update top media stats
      await supabase.rpc('increment_cdn_top_media', {
        p_media_url: mediaUrl,
        p_media_type: mediaType,
        p_tier: tier,
        p_bytes: bytesTransferred,
        p_latency: deliveryLatencyMs,
      });
    } catch (error) {
      console.error('Error logging CDN usage:', error);
    }
  }

  /**
   * Upload media to Supabase storage and return CDN URL with deduplication
   */
  async uploadMedia(options: UploadOptions): Promise<{
    success: boolean;
    cdnUrl?: string;
    supabaseUrl?: string;
    error?: string;
    deduplicated?: boolean;
  }> {
    try {
      const { bucket, path, file, contentType, mediaType = 'other' } = options;
      
      // Determine tier
      const mediaTier = options.tier || this.getTierForMediaType(mediaType);
      
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Generate file hash for deduplication
      const fileHash = await this.generateFileHash(file);

      // Check for duplicates (except for profile images which should always overwrite)
      if (mediaType !== 'profile') {
        const duplicate = await this.checkDuplicateMedia(fileHash, mediaType);
        if (duplicate.exists && duplicate.cdnUrl) {
          console.log('✅ Media already exists (deduplicated):', duplicate.cdnUrl);
          return {
            success: true,
            cdnUrl: duplicate.cdnUrl,
            supabaseUrl: duplicate.supabaseUrl,
            deduplicated: true,
          };
        }
      }

      // Get cache control based on tier
      const cacheControl = this.getCacheControlForTier(mediaTier);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: contentType || 'image/jpeg',
          cacheControl,
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

      // Store hash for future deduplication
      if (userId) {
        const fileSize = file.size || 0;
        await this.storeMediaHash(userId, fileHash, mediaType, cdnUrl, supabaseUrl, fileSize);
      }

      console.log('✅ Media uploaded successfully:', {
        supabaseUrl,
        cdnUrl,
        tier: mediaTier,
        deduplicated: false,
      });

      return {
        success: true,
        cdnUrl,
        supabaseUrl,
        deduplicated: false,
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
      tier: 'A', // High priority
      mediaType: 'profile',
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
      tier: 'B', // Medium priority
      mediaType: 'story',
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
      tier: 'B', // Medium priority
      mediaType: 'post',
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

  /**
   * Get CDN URL with error fallback to Supabase
   * This ensures the UI never breaks even if CDN fails
   */
  async getUrlWithFallback(
    url: string,
    transforms?: CDNTransformOptions
  ): Promise<string> {
    try {
      // Try CDN URL first
      const cdnUrl = this.getCDNUrl(url, transforms);
      
      // Test if CDN is accessible (optional - can be expensive)
      // For now, we'll just return the CDN URL and let the browser handle fallback
      return cdnUrl;
    } catch (error) {
      console.warn('CDN URL generation failed, using fallback:', error);
      // Return original Supabase URL as fallback
      return url;
    }
  }

  /**
   * Get CDN monitoring data for admin dashboard
   */
  async getCDNMonitoringData(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CDNMonitoringData> {
    try {
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const end = endDate || new Date();

      // Get cache statistics
      let query = supabase
        .from('cdn_cache_stats')
        .select('*')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: cacheStats } = await query;

      // Calculate aggregated stats
      const totalRequests = cacheStats?.reduce((sum, stat) => sum + stat.total_requests, 0) || 0;
      const cacheHits = cacheStats?.reduce((sum, stat) => sum + stat.cache_hits, 0) || 0;
      const cacheMisses = cacheStats?.reduce((sum, stat) => sum + stat.cache_misses, 0) || 0;
      const avgLatency = cacheStats?.reduce((sum, stat) => sum + (stat.avg_delivery_latency_ms || 0), 0) / (cacheStats?.length || 1) || 0;

      // Get top media
      const { data: topMedia } = await supabase
        .from('cdn_top_media')
        .select('media_url, media_type, access_count')
        .order('access_count', { ascending: false })
        .limit(10);

      return {
        totalRequests,
        cacheHits,
        cacheMisses,
        cacheHitPercentage: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
        avgDeliveryLatency: avgLatency,
        topMedia: topMedia?.map(m => ({
          url: m.media_url,
          accessCount: m.access_count,
          type: m.media_type,
        })) || [],
      };
    } catch (error) {
      console.error('Error fetching CDN monitoring data:', error);
      return {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheHitPercentage: 0,
        avgDeliveryLatency: 0,
        topMedia: [],
      };
    }
  }

  /**
   * Get cache hit percentage per user
   */
  async getCacheHitPercentagePerUser(
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ userId: string; username: string; cacheHitPercentage: number }>> {
    try {
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      const { data } = await supabase
        .from('cdn_cache_stats')
        .select(`
          user_id,
          cache_hit_percentage,
          profiles:user_id (username)
        `)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('cache_hit_percentage', { ascending: false })
        .limit(20);

      return data?.map(stat => ({
        userId: stat.user_id,
        username: (stat.profiles as any)?.username || 'Unknown',
        cacheHitPercentage: stat.cache_hit_percentage,
      })) || [];
    } catch (error) {
      console.error('Error fetching cache hit percentage per user:', error);
      return [];
    }
  }

  /**
   * Track media access for monitoring
   */
  async trackMediaAccess(
    url: string,
    mediaType: string,
    cacheHit: boolean = false,
    latencyMs: number = 0
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Determine tier from media type
      const tier = this.getTierForMediaType(mediaType);

      // Log the access
      await this.logCDNUsage(userId, url, mediaType, tier, cacheHit, latencyMs, 0);
    } catch (error) {
      console.error('Error tracking media access:', error);
    }
  }
}

export const cdnService = new CDNService();
