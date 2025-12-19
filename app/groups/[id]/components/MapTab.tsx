"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useSession } from "next-auth/react";

// 地圖容器樣式
const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

// 預設中心位置（可以設定為台北或其他城市）
const defaultCenter = {
  lat: 25.0330,
  lng: 121.5654,
};

// 預設縮放級別
const defaultZoom = 13;

// 地圖選項（深色主題支援）
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
  ],
};

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "bookstore" | "cafe" | "other";
  description?: string;
}

interface MemberLocation {
  userId: string;
  userName: string;
  userImage?: string;
  role: "owner" | "admin" | "member";
  lat: number;
  lng: number;
  address: string;
  updatedAt: string;
}

interface MapTabProps {
  groupId: string;
  isScriptLoaded?: boolean; // 從父組件傳入腳本載入狀態
}

export default function MapTab({ groupId, isScriptLoaded = false }: MapTabProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedMemberLocation, setSelectedMemberLocation] = useState<MemberLocation | null>(null);
  const [hoveredMemberLocation, setHoveredMemberLocation] = useState<MemberLocation | null>(null);
  const [map, setMap] = useState<any>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("roadmap");
  const [locations, setLocations] = useState<Location[]>([]);
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [filterType, setFilterType] = useState<"all" | "bookstore" | "cafe">("all");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<any>(null);

  // 取得 Google Maps API Key（從環境變數）
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // 使用父組件傳入的腳本載入狀態
  const isLoaded = isScriptLoaded;
  const loadError = false; // 錯誤處理由父組件負責

  // 地圖載入完成回調
  const onLoad = useCallback((map: any) => {
    mapRef.current = map;
    setMap(map);
  }, []);

  // 地圖卸載回調
  const onUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  // 標記點擊處理
  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setSelectedMemberLocation(null);
  };

  // 成員位置標記點擊處理
  const handleMemberMarkerClick = (memberLocation: MemberLocation) => {
    setSelectedMemberLocation(memberLocation);
    setSelectedLocation(null);
    setHoveredMemberLocation(null); // 點擊時關閉 hover 提示
  };

  // 成員位置標記 hover 處理
  const handleMemberMarkerMouseOver = (memberLocation: MemberLocation) => {
    // 只有在沒有選中資訊視窗時才顯示 hover 提示
    if (!selectedMemberLocation) {
      setHoveredMemberLocation(memberLocation);
    }
  };

  // 成員位置標記 hover 離開處理
  const handleMemberMarkerMouseOut = () => {
    setHoveredMemberLocation(null);
  };

  // 關閉資訊視窗
  const handleInfoWindowClose = () => {
    setSelectedLocation(null);
    setSelectedMemberLocation(null);
    setHoveredMemberLocation(null);
  };

  const { data: session } = useSession();

  // 格式化更新時間（顯示相對時間或絕對時間）
  const formatUpdateTime = (updatedAt: string): string => {
    const now = new Date();
    const updateTime = new Date(updatedAt);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "剛剛";
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      // 超過一週顯示完整日期時間
      return updateTime.toLocaleString("zh-TW", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // 切換地圖類型
  const handleMapTypeChange = (type: "roadmap" | "satellite" | "hybrid" | "terrain") => {
    setMapType(type);
    if (map) {
      map.setMapTypeId(type);
    }
  };

  // 載入群組成員位置
  const fetchMemberLocations = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/location`);
      if (response.ok) {
        const data = await response.json();
        setMemberLocations(data.locations || []);
      }
    } catch (error) {
      console.error("Error fetching member locations:", error);
    }
  }, [groupId]);

  // 獲取使用者當前位置
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // 使用 Google Geocoding API 獲取地址（可選，需要額外的 API）
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) return "";

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=zh-TW`
      );
      const data = await response.json();
      
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return "";
    } catch (error) {
      console.error("Error getting address:", error);
      return "";
    }
  };

  // 更新位置
  const handleUpdateLocation = async () => {
    if (!session?.user?.userId) {
      alert("請先登入");
      return;
    }

    setIsUpdatingLocation(true);
    try {
      // 獲取當前位置
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // 獲取地址（可選）
      const address = await getAddressFromCoordinates(lat, lng);

      // 更新到伺服器
      const response = await fetch(`/api/groups/${groupId}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat,
          lng,
          address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUserLocation({ lat, lng });
        
        // 重新載入成員位置
        await fetchMemberLocations();

        // 將地圖中心移動到新位置
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(15);
        }

        alert("位置已更新！");
      } else {
        const error = await response.json();
        alert(error.error || "更新位置失敗");
      }
    } catch (error: any) {
      console.error("Error updating location:", error);
      if (error.message.includes("Geolocation")) {
        alert("無法獲取您的位置。請確保已允許瀏覽器存取位置資訊。");
      } else {
        alert("更新位置時發生錯誤：" + error.message);
      }
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // 組件載入時獲取成員位置
  useEffect(() => {
    if (isLoaded && groupId) {
      fetchMemberLocations();
    }
  }, [isLoaded, groupId, fetchMemberLocations]);

  // 如果沒有 API Key，顯示提示
  if (!apiKey) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">Google Maps API Key 未設定</p>
        <p className="text-sm mb-4">請在環境變數中設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-left max-w-2xl mx-auto">
          <h3 className="font-semibold mb-2">設定步驟：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>前往 Google Cloud Console</li>
            <li>建立新專案或選擇現有專案</li>
            <li>啟用 Maps JavaScript API</li>
            <li>建立 API Key</li>
            <li>在 .env.local 中新增 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key</li>
          </ol>
        </div>
      </div>
    );
  }

  // 過濾位置
  const filteredLocations = filterType === "all" 
    ? locations 
    : locations.filter(loc => loc.type === filterType);

  // 如果腳本載入錯誤，顯示錯誤訊息
  if (loadError) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">地圖載入失敗</p>
        <p className="text-sm">請檢查 Google Maps API Key 設定</p>
      </div>
    );
  }

  // 如果腳本尚未載入完成，顯示載入中
  if (!isLoaded) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg mb-2">載入地圖中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-2 items-center">
          {/* 更新位置按鈕 */}
          <button
            onClick={handleUpdateLocation}
            disabled={isUpdatingLocation}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUpdatingLocation
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isUpdatingLocation ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                更新中...
              </>
            ) : (
              "📍 更新位置"
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === "all"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilterType("bookstore")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === "bookstore"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            📚 書店
          </button>
          <button
            onClick={() => setFilterType("cafe")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === "cafe"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            ☕ 咖啡廳
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMapTypeChange("roadmap")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapType === "roadmap"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            地圖
          </button>
          <button
            onClick={() => handleMapTypeChange("satellite")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapType === "satellite"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            衛星
          </button>
          <button
            onClick={() => handleMapTypeChange("hybrid")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mapType === "hybrid"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            混合
          </button>
        </div>
      </div>

      {/* 地圖容器 */}
      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            ...mapOptions,
            mapTypeId: mapType,
          }}
          >
            {/* 顯示成員位置標記 */}
            {memberLocations.map((memberLocation) => (
              <Marker
                key={memberLocation.userId}
                position={{ lat: memberLocation.lat, lng: memberLocation.lng }}
                onClick={() => handleMemberMarkerClick(memberLocation)}
                onMouseOver={() => handleMemberMarkerMouseOver(memberLocation)}
                onMouseOut={handleMemberMarkerMouseOut}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: { width: 40, height: 40 },
                }}
                title={memberLocation.userName}
                // 使用原生 Google Maps 事件
                onLoad={(marker) => {
                  // 綁定原生 Google Maps 事件
                  if (marker && typeof window !== 'undefined' && window.google) {
                    const googleMarker = marker as any;
                    googleMarker.addListener('mouseover', () => {
                      handleMemberMarkerMouseOver(memberLocation);
                    });
                    googleMarker.addListener('mouseout', () => {
                      handleMemberMarkerMouseOut();
                    });
                  }
                }}
              />
            ))}

            {/* 顯示其他標記（書店、咖啡廳等） */}
            {filteredLocations.map((location) => (
              <Marker
                key={location.id}
                position={{ lat: location.lat, lng: location.lng }}
                onClick={() => handleMarkerClick(location)}
                icon={{
                  url: location.type === "bookstore" 
                    ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    : location.type === "cafe"
                    ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: { width: 32, height: 32 },
                }}
              />
            ))}

            {/* Hover 提示視窗（顯示名字和更新時間） */}
            {hoveredMemberLocation && !selectedMemberLocation && (
              <InfoWindow
                position={{ lat: hoveredMemberLocation.lat, lng: hoveredMemberLocation.lng }}
                options={{
                  disableAutoPan: true,
                  pixelOffset: { width: 0, height: -40 },
                }}
              >
                <div className="p-2">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    {hoveredMemberLocation.userName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    上次更新：{formatUpdateTime(hoveredMemberLocation.updatedAt)}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* 成員位置資訊視窗（點擊時顯示完整資訊） */}
            {selectedMemberLocation && (
              <InfoWindow
                position={{ lat: selectedMemberLocation.lat, lng: selectedMemberLocation.lng }}
                onCloseClick={handleInfoWindowClose}
              >
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMemberLocation.userImage && (
                      <img
                        src={selectedMemberLocation.userImage}
                        alt={selectedMemberLocation.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{selectedMemberLocation.userName}</h3>
                      <span className="text-xs text-gray-500">
                        {selectedMemberLocation.role === "owner" ? "👑 群主" : 
                         selectedMemberLocation.role === "admin" ? "⭐ 管理員" : "👤 成員"}
                      </span>
                    </div>
                  </div>
                  {selectedMemberLocation.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      📍 {selectedMemberLocation.address}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    更新時間：{new Date(selectedMemberLocation.updatedAt).toLocaleString("zh-TW")}
                  </p>
                </div>
              </InfoWindow>
            )}

            {/* 其他位置資訊視窗 */}
            {selectedLocation && (
              <InfoWindow
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                onCloseClick={handleInfoWindowClose}
              >
                <div className="p-2">
                  <h3 className="font-semibold text-lg mb-1">{selectedLocation.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedLocation.address}
                  </p>
                  {selectedLocation.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {selectedLocation.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {selectedLocation.type === "bookstore" ? "📚 書店" : "☕ 咖啡廳"}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
        </GoogleMap>
      </div>

      {/* 位置列表（可選） */}
      {filteredLocations.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-3">位置列表 ({filteredLocations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedLocation(location);
                  if (map) {
                    map.setCenter({ lat: location.lat, lng: location.lng });
                    map.setZoom(15);
                  }
                }}
              >
                <h4 className="font-medium mb-1">{location.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成員位置列表 */}
      {memberLocations.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-3">群組成員位置 ({memberLocations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberLocations.map((memberLocation) => (
              <div
                key={memberLocation.userId}
                className="p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  handleMemberMarkerClick(memberLocation);
                  if (map) {
                    map.setCenter({ lat: memberLocation.lat, lng: memberLocation.lng });
                    map.setZoom(15);
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {memberLocation.userImage && (
                    <img
                      src={memberLocation.userImage}
                      alt={memberLocation.userName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{memberLocation.userName}</h4>
                    <span className="text-xs text-gray-500">
                      {memberLocation.role === "owner" ? "👑 群主" : 
                       memberLocation.role === "admin" ? "⭐ 管理員" : "👤 成員"}
                    </span>
                  </div>
                </div>
                {memberLocation.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{memberLocation.address}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(memberLocation.updatedAt).toLocaleString("zh-TW")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空狀態 */}
      {filteredLocations.length === 0 && memberLocations.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">暫無位置標記</p>
          <p className="text-sm mb-4">點擊「更新位置」按鈕來分享您的位置</p>
        </div>
      )}
    </div>
  );
}

