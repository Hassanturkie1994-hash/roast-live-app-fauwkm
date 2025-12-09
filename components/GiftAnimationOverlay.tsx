
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getGiftTier } from '@/app/services/giftService';

const { width, height } = Dimensions.get('window');

interface GiftAnimationOverlayProps {
  giftName: string;
  senderUsername: string;
  amount: number;
  onAnimationComplete: () => void;
}

export default function GiftAnimationOverlay({
  giftName,
  senderUsername,
  amount,
  onAnimationComplete,
}: GiftAnimationOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Particle animations for medium/high tier gifts
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  
  // Shimmer effect for high tier gifts
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const tier = getGiftTier(amount);

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Hold
      Animated.delay(2000),
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationComplete();
    });

    // Particle animations for medium and high tier
    if (tier === 'medium' || tier === 'high') {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle1, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle1, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(particle2, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(particle3, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(particle4, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle4, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }

    // Shimmer effect for high tier
    if (tier === 'high') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [tier]);

  const renderParticles = () => {
    if (tier === 'cheap') return null;

    const particles = [particle1, particle2, particle3, particle4];
    const positions = [
      { left: '20%', top: '30%' },
      { right: '20%', top: '40%' },
      { left: '30%', bottom: '35%' },
      { right: '30%', bottom: '40%' },
    ];

    return particles.map((particle, index) => (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          positions[index],
          {
            opacity: particle,
            transform: [
              {
                translateY: particle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
              {
                scale: particle.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.5, 0],
                }),
              },
            ],
          },
        ]}
      >
        <IconSymbol
          ios_icon_name="sparkles"
          android_material_icon_name="auto_awesome"
          size={tier === 'high' ? 32 : 24}
          color={tier === 'high' ? '#FFD700' : colors.gradientEnd}
        />
      </Animated.View>
    ));
  };

  const renderShimmer = () => {
    if (tier !== 'high') return null;

    return (
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {renderShimmer()}
      {renderParticles()}
      
      <Animated.View
        style={[
          styles.giftNotification,
          tier === 'high' && styles.giftNotificationHigh,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <View style={styles.giftIcon}>
          <IconSymbol
            ios_icon_name="gift.fill"
            android_material_icon_name="card_giftcard"
            size={tier === 'high' ? 48 : tier === 'medium' ? 36 : 28}
            color={tier === 'high' ? '#FFD700' : colors.gradientEnd}
          />
        </View>
        
        <View style={styles.giftTextContainer}>
          <Text style={[styles.giftText, tier === 'high' && styles.giftTextHigh]}>
            <Text style={styles.senderName}>{senderUsername}</Text>
            {' sent '}
            <Text style={styles.giftName}>{giftName}</Text>
          </Text>
          <Text style={[styles.giftAmount, tier === 'high' && styles.giftAmountHigh]}>
            worth {amount} kr!
          </Text>
        </View>
      </Animated.View>

      {tier === 'high' && (
        <Animated.View
          style={[
            styles.confettiContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][
                    Math.floor(Math.random() * 5)
                  ],
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, height],
                      }),
                    },
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${Math.random() * 720}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
  },
  particle: {
    position: 'absolute',
  },
  giftNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 16,
    paddingHorizontal: 20,
    maxWidth: width * 0.85,
    borderWidth: 2,
    borderColor: colors.gradientEnd,
    boxShadow: '0px 8px 24px rgba(227, 0, 82, 0.4)',
    elevation: 8,
  },
  giftNotificationHigh: {
    borderColor: '#FFD700',
    boxShadow: '0px 12px 32px rgba(255, 215, 0, 0.6)',
    elevation: 12,
  },
  giftIcon: {
    marginRight: 12,
  },
  giftTextContainer: {
    flex: 1,
  },
  giftText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  giftTextHigh: {
    fontSize: 18,
    fontWeight: '700',
  },
  senderName: {
    color: colors.gradientEnd,
    fontWeight: '700',
  },
  giftName: {
    color: '#FFD700',
    fontWeight: '700',
  },
  giftAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gradientEnd,
  },
  giftAmountHigh: {
    fontSize: 16,
    color: '#FFD700',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: -50,
  },
});
