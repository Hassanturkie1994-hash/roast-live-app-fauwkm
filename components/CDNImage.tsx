
import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { cdnService } from '@/app/services/cdnService';
import { colors } from '@/styles/commonStyles';

interface CDNImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  type?: 'profile' | 'story' | 'feed' | 'thumbnail' | 'explore';
  showLoader?: boolean;
  fallbackColor?: string;
}

/**
 * CDN Image Component with automatic fallback to Supabase URLs
 * 
 * Features:
 * - Automatic CDN URL optimization
 * - Error fallback to Supabase public URLs
 * - Loading states
 * - Image transformation based on type
 * 
 * Usage:
 * <CDNImage
 *   source={{ uri: imageUrl }}
 *   type="profile"
 *   style={styles.image}
 * />
 */
export default function CDNImage({
  source,
  type,
  showLoader = true,
  fallbackColor = colors.backgroundAlt,
  style,
  ...props
}: CDNImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentUri, setCurrentUri] = useState<string>('');

  // Handle static images (require statements)
  if (typeof source === 'number') {
    return <Image source={source} style={style} {...props} />;
  }

  // Get optimized CDN URL
  React.useEffect(() => {
    if (source.uri) {
      const optimizedUrl = type
        ? cdnService.getOptimizedImageUrl(source.uri, type)
        : cdnService.getCDNUrl(source.uri);
      setCurrentUri(optimizedUrl);
    }
  }, [source.uri, type]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    console.log('CDN Image failed to load, falling back to Supabase URL:', currentUri);
    
    // If we're already using the fallback URL, mark as error
    if (hasError) {
      setIsLoading(false);
      return;
    }

    // Try fallback to Supabase URL
    const fallbackUrl = cdnService.getFallbackUrl(currentUri);
    console.log('Attempting fallback URL:', fallbackUrl);
    
    setHasError(true);
    setCurrentUri(fallbackUrl);
    setIsLoading(true);
  };

  if (!currentUri) {
    return (
      <View style={[styles.placeholder, style, { backgroundColor: fallbackColor }]}>
        {showLoader && <ActivityIndicator size="small" color={colors.textSecondary} />}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        {...props}
        source={{ uri: currentUri }}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {isLoading && showLoader && (
        <View style={[styles.loaderContainer, style]}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      )}
      {hasError && !isLoading && (
        <View style={[styles.errorContainer, style, { backgroundColor: fallbackColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
