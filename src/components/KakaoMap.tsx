import React, {useRef, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {GOOGLE_MAPS_API_KEY} from '@env';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  height?: number;
  interactive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

const KakaoMap: React.FC<KakaoMapProps> = ({
  latitude,
  longitude,
  height = 200,
  interactive = false,
  onLocationChange,
}) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'centerChanged' && onLocationChange) {
          onLocationChange(data.lat, data.lng);
        }
      } catch {}
    },
    [onLocationChange],
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          html { height: 100%; }
          #map { width: 100%; height: 100%; }
          ${interactive ? `
          .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 10;
            font-size: 36px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            pointer-events: none;
          }
          ` : ''}
        </style>
      </head>
      <body>
        <div id="map"></div>
        ${interactive ? '<div class="center-pin">📍</div>' : ''}
        <script>
          function initMap() {
            const center = { lat: ${latitude}, lng: ${longitude} };
            const map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: ${interactive ? 12 : 14},
              disableDefaultUI: true,
              zoomControl: ${interactive},
              gestureHandling: '${interactive ? 'greedy' : 'none'}',
            });

            ${interactive ? `
            let debounceTimer;
            map.addListener('center_changed', function() {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(function() {
                const c = map.getCenter();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'centerChanged',
                  lat: c.lat(),
                  lng: c.lng()
                }));
              }, 300);
            });
            ` : `
            new google.maps.Marker({ position: center, map: map });
            `}
          }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, {height}]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{html: htmlContent}}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default KakaoMap;
