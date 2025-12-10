
import { cdnService } from '@/app/services/cdnService';

/**
 * SEO Utilities for CDN Edge Optimization
 * 
 * Features:
 * - Generate SEO metadata for public profiles, posts, and stories
 * - Use CDN URLs for og:image
 * - Only expose public content (no private/paid/VIP media)
 * - Do NOT apply metadata to livestream endpoints
 */

interface SEOMetadataInput {
  type: 'profile' | 'post' | 'story';
  username?: string;
  title?: string;
  description?: string;
  mediaUrl?: string;
  profileUrl?: string;
  isPublic?: boolean;
  isPaid?: boolean;
  isVIP?: boolean;
}

/**
 * Generate SEO metadata for content
 */
export function generateSEOMetadata(input: SEOMetadataInput) {
  const {
    type,
    username,
    title,
    description,
    mediaUrl,
    profileUrl,
    isPublic = true,
    isPaid = false,
    isVIP = false,
  } = input;

  // Check if content should have SEO metadata
  const shouldGenerate = cdnService.shouldGenerateSEO(type, isPublic, isPaid, isVIP);

  if (!shouldGenerate) {
    return null;
  }

  // Generate metadata
  const metadata = cdnService.generateSEOMetadata(type, {
    username,
    title,
    description,
    mediaUrl,
    profileUrl,
  });

  return metadata;
}

/**
 * Get SEO meta tags as HTML string
 */
export function getSEOMetaTags(input: SEOMetadataInput): string | null {
  const metadata = generateSEOMetadata(input);

  if (!metadata) {
    return null;
  }

  return cdnService.getSEOMetaTags(metadata);
}

/**
 * Inject SEO meta tags into document head (web only)
 */
export function injectSEOMetaTags(input: SEOMetadataInput): void {
  if (typeof document === 'undefined') return;

  const metaTags = getSEOMetaTags(input);

  if (!metaTags) return;

  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = metaTags;

  // Append meta tags to head
  Array.from(container.children).forEach(child => {
    document.head.appendChild(child);
  });
}

/**
 * Remove SEO meta tags from document head (web only)
 */
export function removeSEOMetaTags(): void {
  if (typeof document === 'undefined') return;

  // Remove all og: and twitter: meta tags
  const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
  metaTags.forEach(tag => tag.remove());
}

/**
 * Update SEO meta tags dynamically (web only)
 */
export function updateSEOMetaTags(input: SEOMetadataInput): void {
  removeSEOMetaTags();
  injectSEOMetaTags(input);
}
