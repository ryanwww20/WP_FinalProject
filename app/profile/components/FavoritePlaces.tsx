"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FavoritePlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types?: string[];
  addedAt: string;
}

export default function FavoritePlaces() {
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/profile/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (placeId: string) => {
    if (!confirm('確定要取消收藏這個地點嗎？')) {
      return;
    }

    setIsRemoving(placeId);
    try {
      const response = await fetch('/api/profile/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.placeId !== placeId));
      } else {
        const error = await response.json();
        alert(error.error || '取消收藏失敗');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('取消收藏時發生錯誤');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleOpenInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const getPlaceTypeLabel = (types?: string[]) => {
    if (!types || types.length === 0) return null;
    
    const labels = [];
    if (types.includes('book_store')) labels.push({ emoji: '📚', text: '書店' });
    if (types.includes('cafe')) labels.push({ emoji: '☕', text: '咖啡廳' });
    if (types.includes('library')) labels.push({ emoji: '📖', text: '圖書館' });
    
    return labels;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">收藏的地點</h2>
        <div className="text-center py-8 text-muted-foreground">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        收藏的地點 ({favorites.length})
      </h2>
      
      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">還沒有收藏任何地點</p>
          <p className="text-sm text-muted-foreground">在地圖上搜尋店家並加入收藏吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((place) => (
            <div
              key={place.placeId}
              className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1 truncate">
                    {place.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    📍 {place.address}
                  </p>
                  
                  {getPlaceTypeLabel(place.types) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {getPlaceTypeLabel(place.types)?.map((label, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/10 text-primary"
                        >
                          {label.emoji} {label.text}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    收藏於 {new Date(place.addedAt).toLocaleDateString('zh-TW')}
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOpenInMaps(place.lat, place.lng)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    🗺️ 開啟地圖
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(place.placeId)}
                    disabled={isRemoving === place.placeId}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRemoving === place.placeId ? '取消中...' : '❌ 取消收藏'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



