
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { colors } from '@/styles/commonStyles';

interface WebRTCLivePublisherProps {
  rtcPublishUrl: string;
  facing?: CameraType;
  onStreamStarted?: () => void;
  onStreamError?: (error: Error) => void;
}

/**
 * WebRTC Live Publisher Component
 * 
 * This component handles WebRTC streaming to Cloudflare.
 * 
 * Note: WebRTC streaming from React Native requires native modules.
 * For Expo Go and web, this will show the camera preview but won't
 * actually stream via WebRTC. For production native builds, you would
 * need to integrate a WebRTC library like react-native-webrtc.
 * 
 * Cloudflare WebRTC streaming uses WHIP (WebRTC-HTTP Ingestion Protocol).
 */
export default function WebRTCLivePublisher({
  rtcPublishUrl,
  facing = 'front',
  onStreamStarted,
  onStreamError,
}: WebRTCLivePublisherProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const initializeWebRTCStream = useCallback(async () => {
    try {
      console.log('Initializing WebRTC stream to:', rtcPublishUrl);

      // Check if WebRTC is available (web only for now)
      if (Platform.OS === 'web' && typeof RTCPeerConnection !== 'undefined') {
        await startWebRTCStream();
      } else {
        // For native platforms, we need react-native-webrtc
        console.log('WebRTC not available on this platform');
        setError('WebRTC streaming requires native build with react-native-webrtc');
        
        // For now, we'll just show the camera preview
        // In production, you would integrate react-native-webrtc here
        if (onStreamStarted) {
          onStreamStarted();
        }
      }
    } catch (err) {
      console.error('Error initializing WebRTC:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize WebRTC');
      setError(error.message);
      if (onStreamError) {
        onStreamError(error);
      }
    }
  }, [rtcPublishUrl, onStreamStarted, onStreamError]);

  useEffect(() => {
    if (rtcPublishUrl) {
      initializeWebRTCStream();
    }

    return () => {
      cleanup();
    };
  }, [rtcPublishUrl, initializeWebRTCStream]);

  const startWebRTCStream = async () => {
    try {
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: facing === 'front' ? 'user' : 'environment',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to Cloudflare using WHIP protocol
      const response = await fetch(rtcPublishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHIP request failed: ${response.status}`);
      }

      // Get answer from Cloudflare
      const answerSdp = await response.text();
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      await peerConnection.setRemoteDescription(answer);

      setIsStreaming(true);
      console.log('WebRTC streaming started successfully');

      if (onStreamStarted) {
        onStreamStarted();
      }

      // Monitor connection state
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          const error = new Error('WebRTC connection failed');
          setError(error.message);
          if (onStreamError) {
            onStreamError(error);
          }
        }
      };
    } catch (err) {
      console.error('Error starting WebRTC stream:', err);
      throw err;
    }
  };

  const cleanup = () => {
    console.log('Cleaning up WebRTC resources');

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsStreaming(false);
  };

  // For native platforms, show camera preview
  // In production, this would be integrated with react-native-webrtc
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} />
        {error && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              Camera preview is shown. For WebRTC streaming, build a native app with react-native-webrtc.
            </Text>
          </View>
        )}
      </View>
    );
  }

  // For web, show video element with WebRTC stream
  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.streamContainer}>
          {isStreaming && (
            <View style={styles.streamingIndicator}>
              <View style={styles.streamingDot} />
              <Text style={styles.streamingText}>Streaming via WebRTC</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  streamContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  streamingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gradientEnd,
  },
  streamingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(164, 0, 40, 0.9)',
    padding: 16,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
});
