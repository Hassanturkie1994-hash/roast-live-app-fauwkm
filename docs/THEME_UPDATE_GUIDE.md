
# Theme Update Guide for Developers

## Quick Start

To update a screen or component to support theme switching:

### Step 1: Import the Theme Hook

```typescript
import { useTheme } from '@/contexts/ThemeContext';
```

### Step 2: Use the Hook in Your Component

```typescript
export default function MyScreen() {
  const { colors, theme } = useTheme();
  
  // Rest of your component...
}
```

### Step 3: Replace Static Colors

Replace all instances of:
- `colors.background` → `colors.background` (from useTheme)
- `colors.text` → `colors.text` (from useTheme)
- `colors.card` → `colors.card` (from useTheme)
- etc.

### Step 4: Apply Dynamic Styles

```typescript
// Before:
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

// After:
<View style={[styles.container, { backgroundColor: colors.background }]}>
  <Text style={[styles.title, { color: colors.text }]}>Hello</Text>
</View>
```

## Complete Example

### Before (Static Colors)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Content here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
```

### After (Dynamic Theme)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function MyScreen() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.text, { color: colors.textSecondary }]}>Content here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
  },
});
```

## Available Theme Colors

```typescript
interface ThemeColors {
  // Backgrounds
  background: string;        // Main background
  backgroundAlt: string;     // Secondary background
  card: string;              // Card background
  
  // Brand
  brandPrimary: string;      // #A40028 (same in both themes)
  gradientStart: string;     // Gradient start
  gradientEnd: string;       // Gradient end
  highlight: string;         // Highlight color
  
  // Text
  text: string;              // Primary text
  textSecondary: string;     // Secondary text
  placeholder: string;       // Placeholder text
  
  // Borders
  border: string;            // Border color
  divider: string;           // Divider line color
  
  // Status Bar
  statusBarStyle: 'light' | 'dark';
}
```

## Common Patterns

### Pattern 1: Container with Background

```typescript
<View style={[styles.container, { backgroundColor: colors.background }]}>
```

### Pattern 2: Text with Color

```typescript
<Text style={[styles.text, { color: colors.text }]}>
```

### Pattern 3: Card with Border

```typescript
<View style={[styles.card, { 
  backgroundColor: colors.card, 
  borderColor: colors.border 
}]}>
```

### Pattern 4: Input Field

```typescript
<TextInput
  style={[styles.input, { 
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.text
  }]}
  placeholderTextColor={colors.placeholder}
/>
```

### Pattern 5: Button

```typescript
<TouchableOpacity 
  style={[styles.button, { 
    backgroundColor: colors.brandPrimary 
  }]}
>
  <Text style={styles.buttonText}>Button</Text>
</TouchableOpacity>
```

## Tips & Best Practices

1. **Remove color from StyleSheet**: Keep layout/sizing in StyleSheet, apply colors dynamically

2. **Use array syntax**: `style={[styles.static, { color: colors.dynamic }]}`

3. **Don't hardcode colors**: Always use theme colors, never `#FFFFFF` or `#000000`

4. **Test both themes**: Always test your changes in both Light and Dark mode

5. **Brand color is consistent**: `colors.brandPrimary` is `#A40028` in both themes

6. **White text on buttons**: Buttons with `brandPrimary` background should have white text

## Checklist for Each File

- [ ] Import `useTheme` hook
- [ ] Get `colors` from hook
- [ ] Update all `backgroundColor` properties
- [ ] Update all `color` properties (text)
- [ ] Update all `borderColor` properties
- [ ] Update `placeholderTextColor` for inputs
- [ ] Test in Light Mode
- [ ] Test in Dark Mode
- [ ] Verify text is readable
- [ ] Verify buttons are visible

## Need Help?

If you're unsure about a specific component, check these reference files:
- `app/(tabs)/profile.tsx` - Fully updated example
- `app/screens/AccountSettingsScreen.tsx` - Settings screen example
- `app/screens/AppearanceSettingsScreen.tsx` - Theme selector example
