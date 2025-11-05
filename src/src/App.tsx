import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = {
  lat: 35.681236, // 東京駅周辺
  lng: 139.767125,
};

export const App = () => {
  const [markerList, setMarkerList] = useState<{ lat: number, lng: number, title: string, url: string }[]>([]);
  const [boundsInfo, setBoundsInfo] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  useEffect(() => {
    setMarkerList(generateRandomTokyoPoints(10000));
  }, []);

  const onLoadMap = useCallback((map: google.maps.Map) => {
    console.log("onLoadMap");

    // map
    mapRef.current = map;

    // 既存のクラスタラーがあれば削除
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Marker インスタンスを作成
    const markers = markerList.map((p) => {
      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        // title: p.title,
      });

      // ✅ InfoWindow を作成（複数行OK、HTML OK）
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-size:14px;">
            <div><b>${p.title}</b></div>
            <div>lat: ${p.lat}</div>
            <div>lng: ${p.lng}</div>
            <span>クリックでカメラ画面に遷移できます。</span>
          </div>
        `,
      });

      // ✅ hover 時に InfoWindow 表示
      marker.addListener("mouseover", () => {
        infoWindow.open({
          anchor: marker,
          map: mapRef.current!,
          shouldFocus: false,
        });
      });

      // ✅ hover 離れたら閉じる
      marker.addListener("mouseout", () => {
        infoWindow.close();
      });
      
      marker.addListener("click", () => {
        console.log(p.url);
        window.location.href = p.url;
      });

      return marker;
    });

    // MarkerClusterer を作成
    clustererRef.current = new MarkerClusterer({ map: map, markers: markers });

    // update bounds
    updateBounds(map);
  }, [markerList]);

  useEffect(() => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      console.log(bounds);
    }
  }, [mapRef]);

  const updateBounds = (map: google.maps.Map) => {
    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const info = {
      minLat: sw.lat(),
      maxLat: ne.lat(),
      minLng: sw.lng(),
      maxLng: ne.lng(),
    };

    setBoundsInfo(info);
    console.log("Current map bounds:", info);
  };

  // ✅ map移動時にboundsを更新
  const onBoundsChanged = useCallback(() => {
    if (mapRef.current) {
      updateBounds(mapRef.current);
    }
  }, []);

  return (
    <>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onLoad={onLoadMap}
          onBoundsChanged={onBoundsChanged}
        />
      </LoadScript>

      {boundsInfo && (
        <div style={{ padding: "10px", fontSize: "14px" }}>
          <h3>現在の表示範囲（Bounds）</h3>
          <div>minLat: {boundsInfo.minLat}</div>
          <div>maxLat: {boundsInfo.maxLat}</div>
          <div>minLng: {boundsInfo.minLng}</div>
          <div>maxLng: {boundsInfo.maxLng}</div>
        </div>
      )}
    </>
  )
}

const generateRandomTokyoPoints = (count: number) => {
  // Tokyo Station
  const baseLat = center.lat;
  const baseLng = center.lng;

  const points = [];

  for (let i = 0; i < count; i++) {
    const lat = baseLat + (Math.random() - 0.5) * 0.05; // ±0.0025程度
    const lng = baseLng + (Math.random() - 0.5) * 0.05;
    // 適当な文字列をタイトルにする
    const title = `Marker-${i + 1}`;
    const url = "https://example.com/" + title;
    points.push({ lat, lng, title, url });
  }

  return points;
}