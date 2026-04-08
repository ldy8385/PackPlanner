import React, {useRef, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {KAKAO_JS_KEY} from '../config/apiKeys';

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
        <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services"></script>
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
          window.onload = function() {
            if (typeof kakao !== 'undefined' && kakao.maps) {
              const mapContainer = document.getElementById('map');
              const mapOption = {
                center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                level: ${interactive ? 5 : 3}
              };
              const map = new kakao.maps.Map(mapContainer, mapOption);

              ${interactive ? `
              // 인터랙티브 모드: 지도 이동 시 중앙 좌표 전달
              let debounceTimer;
              kakao.maps.event.addListener(map, 'center_changed', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                  const center = map.getCenter();
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'centerChanged',
                    lat: center.getLat(),
                    lng: center.getLng()
                  }));
                }, 300);
              });
              ` : `
              // 읽기 전용 모드: 마커 표시
              const markerPosition = new kakao.maps.LatLng(${latitude}, ${longitude});
              const marker = new kakao.maps.Marker({ position: markerPosition });
              marker.setMap(map);
              `}
            }
          };
        </script>
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
