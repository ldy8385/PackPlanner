import React, {useRef, useCallback, useImperativeHandle, forwardRef, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {GOOGLE_MAPS_API_KEY} from '@env';

export interface KakaoMapHandle {
  moveTo: (lat: number, lng: number) => void;
}

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  height?: number;
  interactive?: boolean;
  showCenterPin?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(({
  latitude,
  longitude,
  height = 200,
  interactive = false,
  showCenterPin = false,
  onLocationChange,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useImperativeHandle(ref, () => ({
    moveTo: (lat: number, lng: number) => {
      webViewRef.current?.injectJavaScript(
        `if(window._map){window._map.panTo(new google.maps.LatLng(${lat},${lng}));}true;`
      );
    },
  }));

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'centerChanged' && onLocationChangeRef.current) {
        onLocationChangeRef.current(data.lat, data.lng);
      }
    } catch {}
  }, []);

  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; overflow: hidden; }
          #map { width: 100%; height: 100%; }
          ${showCenterPin ? `
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
        ${showCenterPin ? '<div class="center-pin">📍</div>' : ''}
        <script>
          function initMap() {
            const center = { lat: ${latitude}, lng: ${longitude} };
            const map = window._map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: ${interactive ? 12 : 14},
              disableDefaultUI: true,
              zoomControl: ${interactive},
              gestureHandling: '${interactive ? 'greedy' : 'none'}',
            });

            ${!showCenterPin ? 'new google.maps.Marker({ position: center, map: map });' : ''}

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
            ` : ''}
          }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
      </body>
    </html>
  `, [latitude, longitude, interactive, showCenterPin]);

  return (
    <View style={[styles.container, height ? {height} : {flex: 1}]}>
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
        overScrollMode="never"
      />
    </View>
  );
});

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
