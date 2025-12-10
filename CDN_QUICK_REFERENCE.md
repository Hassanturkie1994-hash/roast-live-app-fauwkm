
# CDN System Quick Reference

## Quick Start

### Using CDN Images in Your App

```typescript
import CDNImage from '@/components/CDNImage';

// Basic usage
<CDNImage
  source={{ uri: imageUrl }}
  type="profile"
  style={styles.image}
/>

// With custom styling
<CDNImage
  source={{ uri: imageUrl }}
  type="story"
  style={{ width: 200, height: 200, borderRadius: 100 }}
  showLoader={true}
/>
```

### Uploading Media with CDN

```typescript
import { cdnService } from '@/app/services/cdnService';

// Upload profile image (Tier A - 30 day cache)
const result = await cdnService.uploadProfileImage(userId, fileBlob);

// Upload story (Tier B - 14 day cache)
const result = await cdnService.uploadStoryMedia(userId, fileBlob, false);

// Upload post (Tier B - 14 day cache)
const result = await cdnService.uploadPostMedia(userId, fileBlob);

// Check result
if (result.success) {
  console.log('CDN URL:', result.cdnUrl);
  console.log('Deduplicated:', result.deduplicated);
}
```

## CDN Tiers

| Tier | Priority | Edge Cache | Browser Cache | Content Types |
|------|----------|------------|---------------|---------------|
| **A** | HIGH | 30 days | 2 hours | Profile images, badges, receipts |
| **B** | MEDIUM | 14 days | 30 minutes | Posts, stories, thumbnails |
| **C** | LOW | 3 days | 15 minutes | Cached media, banners, previews |

## Image Optimization Types

```typescript
// Profile images: 200x200, WebP, 90% quality
cdnService.getOptimizedImageUrl(url, 'profile')

// Story images: 512px width, WebP, 85% quality
cdnService.getOptimizedImageUrl(url, 'story')

// Feed images: 640px width, WebP, 85% quality
cdnService.getOptimizedImageUrl(url, 'feed')

// Thumbnails: 320px width, WebP, 80% quality
cdnService.getOptimizedImageUrl(url, 'thumbnail')

// Explore grid: 400px width, WebP, 85% quality
cdnService.getOptimizedImageUrl(url, 'explore')
```

## Monitoring Dashboard

### Access the Dashboard
1. Go to Settings
2. Tap "Streaming Dashboard"
3. Scroll to "CDN Performance" section

### Key Metrics
- **CDN Usage:** Total requests served
- **Cache HIT %:** Percentage of cached requests (higher is better)
- **Avg Latency:** Average delivery time in milliseconds

### What to Monitor
- ✅ Cache HIT % above 85%
- ✅ Average latency below 100ms
- ✅ Top media shows your most popular content
- ⚠️ Low cache hit rate may indicate configuration issues

## Error Handling

### Automatic Fallback
The system automatically falls back to Supabase URLs if CDN fails:

```typescript
// CDNImage component handles this automatically
<CDNImage source={{ uri: url }} type="profile" />

// Manual fallback
const fallbackUrl = cdnService.getFallbackUrl(cdnUrl);
```

### Troubleshooting
1. **Image not loading?**
   - Check network connection
   - Verify URL is valid
   - Check CDN stats in dashboard

2. **Slow loading?**
   - Check average latency in dashboard
   - Verify tier configuration
   - Contact support if persistent

## Deduplication

### How It Works
- System generates SHA256 hash for each file
- Checks if identical file already exists
- Reuses existing CDN URL if found
- Saves storage and bandwidth

### Special Cases
- **Profile images:** Always overwrite previous
- **Posts & Stories:** Reuse identical files
- **Corrupted entries:** Automatic re-upload

### Check Deduplication
```typescript
const result = await cdnService.uploadMedia({...});
if (result.deduplicated) {
  console.log('File already exists, reusing CDN URL');
}
```

## Security Features

### Signed URLs for Private Content
```typescript
const signedUrl = await cdnService.generateSignedUrl(url, {
  expiresIn: 21600, // 6 hours
  sessionId: deviceId,
  watermark: 'RoastLive Premium',
});
```

### Watermarking
- **Text:** "RoastLive © {year}"
- **Opacity:** 2% (invisible normally)
- **Position:** Bottom-right
- **Applied to:** Paid content, VIP content, saved streams

## Performance Tips

### For Best Performance
1. ✅ Always use `CDNImage` component
2. ✅ Specify correct media type
3. ✅ Let system handle optimization
4. ✅ Monitor CDN stats regularly

### Avoid
1. ❌ Direct Supabase URLs in production
2. ❌ Manual image resizing
3. ❌ Bypassing CDN for static content
4. ❌ Ignoring cache hit rate warnings

## API Quick Reference

### Upload
```typescript
uploadMedia(options)
uploadProfileImage(userId, file)
uploadStoryMedia(userId, file, isVideo)
uploadPostMedia(userId, file)
```

### URL Generation
```typescript
getOptimizedImageUrl(url, type)
getCDNUrl(url, transforms?)
generateSignedUrl(url, options)
getFallbackUrl(cdnUrl)
```

### Monitoring
```typescript
getCDNMonitoringData(userId?)
getCacheHitPercentagePerUser()
trackMediaAccess(url, type, cacheHit, latency)
```

## Common Patterns

### Upload and Display
```typescript
// Upload
const result = await cdnService.uploadProfileImage(userId, file);

// Display
<CDNImage
  source={{ uri: result.cdnUrl }}
  type="profile"
  style={styles.avatar}
/>
```

### Custom Transformations
```typescript
const customUrl = cdnService.getCDNUrl(originalUrl, {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp',
  fit: 'cover',
});
```

### Track Performance
```typescript
const startTime = Date.now();
// ... load image ...
const latency = Date.now() - startTime;

await cdnService.trackMediaAccess(
  url,
  'profile',
  true, // cache hit
  latency
);
```

## Support

### Getting Help
1. Check CDN stats in dashboard
2. Review error logs
3. Contact support with:
   - CDN URL
   - Error message
   - Screenshot of issue

### Reporting Issues
- Low cache hit rate
- High latency
- Failed uploads
- Missing images

## Best Practices Summary

### DO ✅
- Use CDNImage component
- Monitor CDN stats
- Let system optimize images
- Report issues promptly

### DON'T ❌
- Bypass CDN for static content
- Ignore performance warnings
- Manual image optimization
- Direct Supabase URLs in production

---

**Need more help?** Check the full documentation in `CDN_MONITORING_IMPLEMENTATION.md`
