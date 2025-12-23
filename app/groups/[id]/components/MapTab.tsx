"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, Autocomplete } from "@react-google-maps/api";
import { useSession } from "next-auth/react";
import LocationFormModal from "./LocationFormModal";

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
  placeName?: string;
  placeId?: string;
  placeTypes?: string[];
  studyUntil?: string;
  crowdedness?: 'empty' | 'quiet' | 'moderate' | 'busy' | 'very-busy';
  hasOutlet?: boolean;
  hasWifi?: boolean;
  updatedAt: string;
}

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types?: string[];
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
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [isRemovingLocation, setIsRemovingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
  const [searchMode, setSearchMode] = useState<"nearby" | "global">("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [favoritePlaces, setFavoritePlaces] = useState<Set<string>>(new Set());
  const [isFavoriting, setIsFavoriting] = useState(false);
  const mapRef = useRef<any>(null);
  const searchAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 取得 Google Maps API Key（從環境變數）
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // 使用父組件傳入的腳本載入狀態
  const isLoaded = isScriptLoaded;
  const loadError = false; // 錯誤處理由父組件負責

  // 地圖載入完成回調
  const onLoad = useCallback((map: any) => {
    mapRef.current = map;
    setMap(map);
    // 初始化 Places Service
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    }
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

  // 格式化擁擠程度
  const formatCrowdedness = (crowdedness?: string): string => {
    const map: Record<string, { emoji: string; label: string }> = {
      'empty': { emoji: '🟢', label: '空曠' },
      'quiet': { emoji: '🟡', label: '安靜' },
      'moderate': { emoji: '🟠', label: '普通' },
      'busy': { emoji: '🔴', label: '擁擠' },
      'very-busy': { emoji: '⛔', label: '非常擁擠' },
    };
    return crowdedness && map[crowdedness] 
      ? `${map[crowdedness].emoji} ${map[crowdedness].label}`
      : '';
  };

  // 格式化預計時間
  const formatStudyUntil = (studyUntil?: string): string => {
    if (!studyUntil) return '';
    const date = new Date(studyUntil);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 0) {
      return '已過期';
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘後`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時後`;
    } else {
      return date.toLocaleString("zh-TW", {
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

  // 獲取當前位置並打開表單
  const handleOpenLocationForm = async () => {
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

      setCurrentUserLocation({ lat, lng });
      setShowLocationForm(true);

      // 將地圖中心移動到新位置
      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(15);
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      if (error.message.includes("Geolocation")) {
        alert("無法獲取您的位置。請確保已允許瀏覽器存取位置資訊。");
      } else {
        alert("獲取位置時發生錯誤：" + error.message);
      }
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // 提交位置資訊
  const handleSubmitLocation = async (formData: {
    placeName: string;
    studyUntil: string;
    crowdedness: 'empty' | 'quiet' | 'moderate' | 'busy' | 'very-busy' | '';
    hasOutlet: boolean;
    hasWifi: boolean;
    placeId?: string;
    placeLat?: number;
    placeLng?: number;
    placeTypes?: string[];
    selectedGroups?: string[];
  }) => {
    if (!session?.user?.userId) {
      alert("請先登入");
      return;
    }

    // 如果有選擇地標，使用地標座標；否則使用當前 GPS 位置
    const lat = formData.placeLat ?? currentUserLocation?.lat;
    const lng = formData.placeLng ?? currentUserLocation?.lng;

    if (!lat || !lng) {
      alert("請先獲取位置或選擇地標");
      return;
    }

    // 檢查是否選擇了群組
    const targetGroups = formData.selectedGroups && formData.selectedGroups.length > 0 
      ? formData.selectedGroups 
      : [groupId]; // 如果沒選擇，預設只更新當前群組

    setIsUpdatingLocation(true);
    try {
      // 獲取地址
      const address = await getAddressFromCoordinates(lat, lng);

      const locationData = {
        lat,
        lng,
        address,
        placeName: formData.placeName || undefined,
        studyUntil: formData.studyUntil || undefined,
        crowdedness: formData.crowdedness || undefined,
        hasOutlet: formData.hasOutlet,
        hasWifi: formData.hasWifi,
        placeId: formData.placeId,
        placeTypes: formData.placeTypes,
      };

      // 批次更新多個群組
      const updatePromises = targetGroups.map(gId =>
        fetch(`/api/groups/${gId}/location`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(locationData),
        })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // 計算成功和失敗的數量
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        // 重新載入成員位置（當前群組）
        await fetchMemberLocations();
        setShowLocationForm(false);
        setCurrentUserLocation(null);
        
        if (failCount === 0) {
          alert(`位置已成功發布到 ${successCount} 個群組！`);
        } else {
          alert(`位置已發布到 ${successCount} 個群組，${failCount} 個群組更新失敗`);
        }
      } else {
        alert("所有群組的位置更新都失敗了");
      }
    } catch (error: any) {
      console.error("Error updating location:", error);
      alert("發布位置時發生錯誤：" + error.message);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // 取消發布位置
  const handleRemoveLocation = async () => {
    if (!session?.user?.userId) {
      alert("請先登入");
      return;
    }

    if (!confirm("確定要取消發布位置嗎？您的標記將從地圖上消失。")) {
      return;
    }

    setIsRemovingLocation(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/location`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 重新載入成員位置
        await fetchMemberLocations();
        setCurrentUserLocation(null);
        alert("位置已取消發布！");
      } else {
        const error = await response.json();
        alert(error.error || "取消發布失敗");
      }
    } catch (error: any) {
      console.error("Error removing location:", error);
      alert("取消發布時發生錯誤：" + error.message);
    } finally {
      setIsRemovingLocation(false);
    }
  };

  // 載入收藏清單
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await fetch('/api/profile/favorites');
      if (response.ok) {
        const data = await response.json();
        const favoriteIds = new Set<string>(data.favorites.map((fav: any) => fav.placeId as string));
        setFavoritePlaces(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, []);

  // 新增收藏
  const handleAddFavorite = useCallback(async (place: {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    types?: string[];
  }) => {
    if (!session?.user?.userId) {
      alert('請先登入');
      return;
    }

    setIsFavoriting(true);
    try {
      const response = await fetch('/api/profile/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(place),
      });

      if (response.ok) {
        setFavoritePlaces(prev => {
          const newSet = new Set(prev);
          newSet.add(place.placeId);
          return newSet;
        });
        alert('已加入收藏！');
      } else {
        const error = await response.json();
        alert(error.error || '加入收藏失敗');
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('加入收藏時發生錯誤');
    } finally {
      setIsFavoriting(false);
    }
  }, [session]);

  // 移除收藏
  const handleRemoveFavorite = useCallback(async (placeId: string) => {
    if (!session?.user?.userId) {
      alert('請先登入');
      return;
    }

    setIsFavoriting(true);
    try {
      const response = await fetch('/api/profile/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });

      if (response.ok) {
        setFavoritePlaces(prev => {
          const newSet = new Set(prev);
          newSet.delete(placeId);
          return newSet;
        });
        alert('已取消收藏！');
      } else {
        const error = await response.json();
        alert(error.error || '取消收藏失敗');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('取消收藏時發生錯誤');
    } finally {
      setIsFavoriting(false);
    }
  }, [session]);

  // 組件載入時獲取成員位置和收藏清單
  useEffect(() => {
    if (isLoaded && groupId) {
      fetchMemberLocations();
      fetchFavorites();
    }
  }, [isLoaded, groupId, fetchMemberLocations, fetchFavorites]);

  // 處理搜尋自動完成選擇
  const onPlaceSelected = useCallback(() => {
    try {
      if (!searchAutocompleteRef.current) {
        return;
      }
      
      const place = searchAutocompleteRef.current.getPlace();
      if (!place) {
        setSearchError("無法獲取地點資訊");
        return;
      }
      
      if (!place.geometry || !place.geometry.location) {
        setSearchError("該地點沒有位置資訊");
        setSearchResults([]);
        return;
      }
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const result: SearchResult = {
        placeId: place.place_id || '',
        name: place.name || '',
        address: place.formatted_address || '',
        lat,
        lng,
        types: place.types || [],
      };
      setSearchResults([result]);
      setSelectedSearchResult(result);
      setSearchQuery(place.name || '');
      setSearchError(null);
      // 移動地圖到搜尋結果位置
      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(15);
      }
    } catch (error) {
      console.error("Error handling place selection:", error);
      setSearchError("處理地點選擇時發生錯誤");
      setSearchResults([]);
    }
  }, [map]);

  // 執行附近搜尋
  const performNearbySearch = useCallback(async () => {
    if (!map || !placesServiceRef.current || !searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    // 設置超時機制，防止搜尋永遠卡住
    const timeoutId = setTimeout(() => {
      setIsSearching(false);
      setSearchError("搜尋逾時，請稍後再試");
      setSearchResults([]);
    }, 10000); // 10 秒超時

    try {
      const bounds = map.getBounds();
      if (!bounds) {
        clearTimeout(timeoutId);
        setIsSearching(false);
        setSearchError("無法獲取地圖範圍");
        return;
      }

      const request: google.maps.places.TextSearchRequest = {
        query: searchQuery,
        bounds: bounds,
        language: 'zh-TW',
      };

      let callbackExecuted = false;
      placesServiceRef.current.textSearch(request, (results, status) => {
        if (callbackExecuted) return; // 防止重複執行
        callbackExecuted = true;
        clearTimeout(timeoutId);
        
        try {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            if (results && results.length > 0) {
              const formattedResults: SearchResult[] = results.map((place) => ({
                placeId: place.place_id || '',
                name: place.name || '',
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
                types: place.types || [],
              }));
              setSearchResults(formattedResults);
              setSearchError(null);
              // 調整地圖視窗以顯示所有結果
              if (map) {
                const bounds = new window.google.maps.LatLngBounds();
                formattedResults.forEach((result) => {
                  bounds.extend({ lat: result.lat, lng: result.lng });
                });
                map.fitBounds(bounds);
              }
            } else {
              // OK 狀態但沒有結果
              setSearchResults([]);
              setSearchError("附近沒有找到符合條件的店家");
            }
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSearchResults([]);
            setSearchError("附近沒有找到符合條件的店家");
          } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            setSearchResults([]);
            setSearchError("搜尋請求過於頻繁，請稍後再試");
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setSearchResults([]);
            setSearchError("搜尋請求被拒絕，請檢查 API 設定");
          } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
            setSearchResults([]);
            setSearchError("搜尋請求無效，請檢查輸入內容");
          } else {
            setSearchResults([]);
            setSearchError(`沒有找到這個地點`);
          }
        } catch (error) {
          console.error("Error processing search results:", error);
          setSearchResults([]);
          setSearchError("處理搜尋結果時發生錯誤");
        } finally {
          setIsSearching(false);
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error performing nearby search:", error);
      setSearchResults([]);
      setSearchError("搜尋時發生錯誤，請稍後再試");
      setIsSearching(false);
    }
  }, [map, searchQuery]);

  // 執行全球搜尋
  const performGlobalSearch = useCallback(async () => {
    if (!map || !placesServiceRef.current || !searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    // 設置超時機制，防止搜尋永遠卡住
    const timeoutId = setTimeout(() => {
      setIsSearching(false);
      setSearchError("搜尋逾時，請稍後再試");
      setSearchResults([]);
    }, 10000); // 10 秒超時

    try {
      const request: google.maps.places.TextSearchRequest = {
        query: searchQuery,
        language: 'zh-TW',
      };

      let callbackExecuted = false;
      placesServiceRef.current.textSearch(request, (results, status) => {
        if (callbackExecuted) return; // 防止重複執行
        callbackExecuted = true;
        clearTimeout(timeoutId);
        
        try {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            if (results && results.length > 0) {
              const formattedResults: SearchResult[] = results.slice(0, 10).map((place) => ({
                placeId: place.place_id || '',
                name: place.name || '',
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
                types: place.types || [],
              }));
              setSearchResults(formattedResults);
              setSearchError(null);
              // 調整地圖視窗以顯示所有結果
              if (map) {
                const bounds = new window.google.maps.LatLngBounds();
                formattedResults.forEach((result) => {
                  bounds.extend({ lat: result.lat, lng: result.lng });
                });
                map.fitBounds(bounds);
              }
            } else {
              // OK 狀態但沒有結果
              setSearchResults([]);
              setSearchError("沒有找到符合條件的店家");
            }
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSearchResults([]);
            setSearchError("沒有找到符合條件的店家");
          } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            setSearchResults([]);
            setSearchError("搜尋請求過於頻繁，請稍後再試");
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setSearchResults([]);
            setSearchError("搜尋請求被拒絕，請檢查 API 設定");
          } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
            setSearchResults([]);
            setSearchError("搜尋請求無效，請檢查輸入內容");
          } else {
            setSearchResults([]);
            setSearchError(`沒有找到這個地點`);
          }
        } catch (error) {
          console.error("Error processing search results:", error);
          setSearchResults([]);
          setSearchError("處理搜尋結果時發生錯誤");
        } finally {
          setIsSearching(false);
        }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error performing global search:", error);
      setSearchResults([]);
      setSearchError("搜尋時發生錯誤，請稍後再試");
      setIsSearching(false);
    }
  }, [map, searchQuery]);

  // 處理搜尋提交
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "nearby") {
      performNearbySearch();
    } else {
      performGlobalSearch();
    }
  }, [searchMode, performNearbySearch, performGlobalSearch]);

  // 清除搜尋結果
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSearchResult(null);
    setSearchError(null);
  }, []);

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
      {/* 搜尋框 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-[200px]">
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    searchAutocompleteRef.current = autocomplete;
                    if (autocomplete) {
                      autocomplete.setFields(['place_id', 'geometry', 'name', 'formatted_address', 'types']);
                      autocomplete.setComponentRestrictions({ country: 'tw' });
                      autocomplete.setTypes(['book_store', 'cafe', 'library']);
                    }
                  }}
                  onPlaceChanged={onPlaceSelected}
                  options={{
                    types: ['book_store', 'cafe', 'library'],
                    componentRestrictions: { country: 'tw' },
                  }}
                >
                  <input
                    type="text"
                    placeholder="搜尋書店、咖啡廳、圖書館... (輸入後從建議中選擇)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="載入中..."
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400"
                />
              )}
            </div>
            {searchResults.length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                清除
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400">
              找到 {searchResults.length} 個結果
            </div>
          )}
          {searchError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {searchError}
            </div>
          )}
        </div>
      </div>

      {/* 控制面板 */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-2 items-center">
          {/* 發布位置按鈕 */}
          <button
            onClick={handleOpenLocationForm}
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
                獲取位置中...
              </>
            ) : (
              "📍 發布位置"
            )}
          </button>

          {/* 取消發布位置按鈕（僅當用戶已發布位置時顯示） */}
          {memberLocations.some(loc => loc.userId === session?.user?.userId) && (
            <button
              onClick={handleRemoveLocation}
              disabled={isRemovingLocation}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRemovingLocation
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {isRemovingLocation ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  取消中...
                </>
              ) : (
                "❌ 取消發布"
              )}
            </button>
          )}
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
            {locations.map((location) => (
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
                }}
              />
            ))}

            {/* 顯示搜尋結果標記 */}
            {searchResults.map((result) => (
              <Marker
                key={result.placeId}
                position={{ lat: result.lat, lng: result.lng }}
                onClick={() => setSelectedSearchResult(result)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                }}
                title={result.name}
              />
            ))}

            {/* Hover 提示視窗（顯示名字和更新時間） */}
            {hoveredMemberLocation && !selectedMemberLocation && (
              <InfoWindow
                position={{ lat: hoveredMemberLocation.lat, lng: hoveredMemberLocation.lng }}
                options={{
                  disableAutoPan: true,
                }}
              >
                <div className="p-2">
                  <p className="font-semibold text-sm text-gray-900 mb-1">
                    {hoveredMemberLocation.userName}
                  </p>
                  <p className="text-xs text-gray-700">
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
                <div className="p-2 min-w-[250px] max-w-[300px]">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMemberLocation.userImage && (
                      <img
                        src={selectedMemberLocation.userImage}
                        alt={selectedMemberLocation.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{selectedMemberLocation.userName}</h3>
                      <span className="text-xs text-gray-700">
                        {selectedMemberLocation.role === "owner" ? "👑 群主" : 
                         selectedMemberLocation.role === "admin" ? "⭐ 管理員" : "👤 成員"}
                      </span>
                    </div>
                  </div>
                  
                  {/* 地點名稱 */}
                  {selectedMemberLocation.placeName && (
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      📚 {selectedMemberLocation.placeName}
                    </p>
                  )}
                  
                  {/* 地址 */}
                  {selectedMemberLocation.address && (
                    <p className="text-sm text-gray-700 mb-2">
                      📍 {selectedMemberLocation.address}
                    </p>
                  )}

                  {/* 預計讀到幾點 */}
                  {selectedMemberLocation.studyUntil && (
                    <p className="text-sm text-gray-800 mb-1">
                      ⏰ 預計讀到：{formatStudyUntil(selectedMemberLocation.studyUntil)}
                    </p>
                  )}

                  {/* 擁擠程度 */}
                  {selectedMemberLocation.crowdedness && (
                    <p className="text-sm text-gray-800 mb-1">
                      {formatCrowdedness(selectedMemberLocation.crowdedness)}
                    </p>
                  )}

                  {/* 設施 */}
                  <div className="flex gap-3 text-sm text-gray-800 mb-2">
                    {selectedMemberLocation.hasOutlet && (
                      <span className="flex items-center gap-1">
                        🔌 插座
                      </span>
                    )}
                    {selectedMemberLocation.hasWifi && (
                      <span className="flex items-center gap-1">
                        📶 網路
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 border-t border-gray-300 pt-2 mt-2">
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
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{selectedLocation.name}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {selectedLocation.address}
                  </p>
                  {selectedLocation.description && (
                    <p className="text-sm text-gray-700">
                      {selectedLocation.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {selectedLocation.type === "bookstore" ? "📚 書店" : "☕ 咖啡廳"}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}

            {/* 搜尋結果資訊視窗 */}
            {selectedSearchResult && (
              <InfoWindow
                position={{ lat: selectedSearchResult.lat, lng: selectedSearchResult.lng }}
                onCloseClick={() => setSelectedSearchResult(null)}
              >
                <div className="p-2 min-w-[250px] max-w-[300px]">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{selectedSearchResult.name}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {selectedSearchResult.address}
                  </p>
                  {selectedSearchResult.types && selectedSearchResult.types.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 mb-3">
                      {selectedSearchResult.types.includes('book_store') && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          📚 書店
                        </span>
                      )}
                      {selectedSearchResult.types.includes('cafe') && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          ☕ 咖啡廳
                        </span>
                      )}
                      {selectedSearchResult.types.includes('library') && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                          📖 圖書館
                        </span>
                      )}
                    </div>
                  )}
                  {/* 收藏按鈕 */}
                  <button
                    onClick={() => {
                      const isFavorited = favoritePlaces.has(selectedSearchResult.placeId);
                      if (isFavorited) {
                        handleRemoveFavorite(selectedSearchResult.placeId);
                      } else {
                        handleAddFavorite({
                          placeId: selectedSearchResult.placeId,
                          name: selectedSearchResult.name,
                          address: selectedSearchResult.address,
                          lat: selectedSearchResult.lat,
                          lng: selectedSearchResult.lng,
                          types: selectedSearchResult.types,
                        });
                      }
                    }}
                    disabled={isFavoriting}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      favoritePlaces.has(selectedSearchResult.placeId)
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isFavoriting ? '處理中...' : favoritePlaces.has(selectedSearchResult.placeId) ? '❤️ 已收藏' : '⭐ 加入收藏'}
                  </button>
                </div>
              </InfoWindow>
            )}
        </GoogleMap>
      </div>

      {/* 位置列表（可選） */}
      {locations.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-3">位置列表 ({locations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((location) => (
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
                {memberLocation.placeName && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    📚 {memberLocation.placeName}
                  </p>
                )}
                {memberLocation.address && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    📍 {memberLocation.address}
                  </p>
                )}
                {memberLocation.studyUntil && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    ⏰ {formatStudyUntil(memberLocation.studyUntil)}
                  </p>
                )}
                {memberLocation.crowdedness && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {formatCrowdedness(memberLocation.crowdedness)}
                  </p>
                )}
                <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {memberLocation.hasOutlet && <span>🔌</span>}
                  {memberLocation.hasWifi && <span>📶</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(memberLocation.updatedAt).toLocaleString("zh-TW")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空狀態 */}
      {locations.length === 0 && memberLocations.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">暫無位置標記</p>
          <p className="text-sm mb-4">點擊「發布位置」按鈕來分享您的位置</p>
        </div>
      )}

      {/* 位置資訊表單模組 */}
      <LocationFormModal
        isOpen={showLocationForm}
        onClose={() => {
          setShowLocationForm(false);
          setCurrentUserLocation(null);
        }}
        onSubmit={handleSubmitLocation}
        isSubmitting={isUpdatingLocation}
        isScriptLoaded={isLoaded}
        currentGroupId={groupId}
      />
    </div>
  );
}

