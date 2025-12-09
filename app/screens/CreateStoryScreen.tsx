
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function CreateStoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 15,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const uploadMedia = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${user?.id}_story_${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage.from('stories').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  };

  const handlePost = async () => {
    if (!user || !mediaUri) {
      Alert.alert('Error', 'Please select media to post');
      return;
    }

    setLoading(true);

    try {
      // Upload media
      const mediaUrl = await uploadMedia(mediaUri);
      if (!mediaUrl) {
        Alert.alert('Error', 'Failed to upload media');
        setLoading(false);
        return;
      }

      // Create story with 24h expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        media_url: mediaUrl,
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('Error creating story:', error);
        Alert.alert('Error', 'Failed to create story');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Story posted successfully');
      router.back();
    } catch (error) {
      console.error('Error in handlePost:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="xmark"
            android_material_icon_name="close"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {mediaUri ? (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: mediaUri }} style={styles.media} />
            <View style={styles.mediaActions}>
              <TouchableOpacity style={styles.actionButton} onPress={pickMedia}>
                <IconSymbol
                  ios_icon_name="photo"
                  android_material_icon_name="photo_library"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera_alt"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera_alt"
                size={48}
                color={colors.gradientEnd}
              />
              <Text style={styles.uploadText}>Take Photo</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.uploadOption} onPress={pickMedia}>
              <IconSymbol
                ios_icon_name="photo"
                android_material_icon_name="photo_library"
                size={48}
                color={colors.gradientEnd}
              />
              <Text style={styles.uploadText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {mediaUri && (
          <View style={styles.buttonContainer}>
            <GradientButton
              title={loading ? 'POSTING...' : 'POST STORY'}
              onPress={handlePost}
              disabled={loading}
            />
            <Text style={styles.expiryText}>Story will expire in 24 hours</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gradientEnd} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  uploadOption: {
    alignItems: 'center',
    gap: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.border,
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.backgroundAlt,
  },
  mediaActions: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
