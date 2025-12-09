
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  expires_at: string;
  created_at: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
}

export default function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);

  const fetchStories = useCallback(async () => {
    if (!user) return;

    try {
      // Get stories from followed users that haven't expired
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      if (data) {
        // Group stories by user and take the first one for each user
        const uniqueStories = data.reduce((acc: Story[], story: any) => {
          if (!acc.find((s) => s.user_id === story.user_id)) {
            acc.push(story);
          }
          return acc;
        }, []);

        setStories(uniqueStories);
      }
    } catch (error) {
      console.error('Error in fetchStories:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleCreateStory = () => {
    router.push('/screens/CreateStoryScreen');
  };

  const handleViewStory = (story: Story) => {
    // Navigate to story viewer (to be implemented)
    console.log('View story:', story.id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button */}
        <TouchableOpacity style={styles.storyItem} onPress={handleCreateStory}>
          <View style={styles.addStoryContainer}>
            <View style={styles.addStoryButton}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color={colors.text}
              />
            </View>
          </View>
          <Text style={styles.storyUsername}>Your Story</Text>
        </TouchableOpacity>

        {/* Stories from followed users */}
        {stories.map((story, index) => (
          <TouchableOpacity
            key={index}
            style={styles.storyItem}
            onPress={() => handleViewStory(story)}
          >
            <View style={styles.storyAvatarContainer}>
              <Image
                source={{
                  uri: story.profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                }}
                style={styles.storyAvatar}
              />
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.profile.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    width: 70,
  },
  addStoryContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addStoryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    background: `linear-gradient(45deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
    marginBottom: 4,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.background,
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
