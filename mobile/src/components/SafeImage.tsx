import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Package } from 'lucide-react-native';

interface SafeImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  fallbackIconSize?: number;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  style,
  containerStyle,
  resizeMode = 'cover',
  fallbackIconSize = 24
}) => {
  const [loading, setLoading] = useState(Boolean(uri));
  const [hasError, setHasError] = useState(false);

  // If no URI or error occurred, render fallback
  if (!uri || hasError) {
    return (
      <View style={[styles.fallbackContainer, containerStyle, style as any]}>
        <Package size={fallbackIconSize} color="#94A3B8" />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setHasError(true);
        }}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loadingOverlay]}>
          <ActivityIndicator size="small" color="#059669" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden'
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9'
  },
  fallbackContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
