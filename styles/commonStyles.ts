
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
  // Primary Colors
  background: '#000000',        // Pure Black
  backgroundAlt: '#0A0A0A',     // Dark Charcoal
  card: '#0A0A0A',              // Dark Charcoal for cards
  
  // Brand Gradient Colors
  gradientStart: '#A40028',     // Left side of gradient
  gradientEnd: '#E30052',       // Right side of gradient
  highlight: '#E30052',         // Highlight color
  
  // Text Colors
  text: '#FFFFFF',              // White
  textSecondary: '#B7B7B7',     // Soft Gray
  placeholder: '#EDEDED',       // Light Gray
  
  // Border & Divider
  border: '#333333',            // Subtle border
  divider: '#1A1A1A',           // Divider line
};

export const buttonStyles = StyleSheet.create({
  gradientButton: {
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillButton: {
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    width: '100%',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: colors.gradientEnd,
    boxShadow: `0 0 0 2px ${colors.gradientEnd}40`,
  },
});
