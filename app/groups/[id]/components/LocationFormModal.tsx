"use client";

import { useState, useEffect, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";

interface LocationFormData {
  placeName: string;
  studyUntil: string; // ISO string format
  crowdedness: 'empty' | 'quiet' | 'moderate' | 'busy' | 'very-busy' | '';
  hasOutlet: boolean;
  hasWifi: boolean;
  placeId?: string;
  placeLat?: number;
  placeLng?: number;
  placeTypes?: string[];
  selectedGroups?: string[]; // 選擇要更新位置的群組 IDs
}

interface UserGroup {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  role: string;
}

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => Promise<void>;
  initialData?: {
    placeName?: string;
    studyUntil?: string;
    crowdedness?: 'empty' | 'quiet' | 'moderate' | 'busy' | 'very-busy';
    hasOutlet?: boolean;
    hasWifi?: boolean;
  };
  isSubmitting?: boolean;
  isScriptLoaded?: boolean;
  currentGroupId?: string; // 當前群組 ID，預設選中
}

const crowdednessOptions = [
  { value: 'empty', label: '空曠', emoji: '🟢' },
  { value: 'quiet', label: '安靜', emoji: '🟡' },
  { value: 'moderate', label: '普通', emoji: '🟠' },
  { value: 'busy', label: '擁擠', emoji: '🔴' },
  { value: 'very-busy', label: '非常擁擠', emoji: '⛔' },
];

export default function LocationFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
  isScriptLoaded = false,
  currentGroupId,
}: LocationFormModalProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    placeName: '',
    studyUntil: '',
    crowdedness: '',
    hasOutlet: false,
    hasWifi: false,
    selectedGroups: currentGroupId ? [currentGroupId] : [],
  });
  const [isManualInput, setIsManualInput] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 設置預設時間為當前時間後 2 小時
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 2);
      const defaultTimeString = defaultTime.toISOString().slice(0, 16);

      setFormData({
        placeName: initialData?.placeName || '',
        studyUntil: initialData?.studyUntil 
          ? new Date(initialData.studyUntil).toISOString().slice(0, 16)
          : defaultTimeString,
        crowdedness: initialData?.crowdedness || '',
        hasOutlet: initialData?.hasOutlet ?? false,
        hasWifi: initialData?.hasWifi ?? false,
        selectedGroups: currentGroupId ? [currentGroupId] : [],
      });
      setIsManualInput(false);
      
      // 載入使用者的群組列表
      fetchUserGroups();
    }
  }, [isOpen, initialData, currentGroupId]);

  const fetchUserGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const response = await fetch('/api/groups/my-groups');
      if (response.ok) {
        const data = await response.json();
        setUserGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setFormData(prev => {
      const currentSelected = prev.selectedGroups || [];
      const isSelected = currentSelected.includes(groupId);
      
      return {
        ...prev,
        selectedGroups: isSelected
          ? currentSelected.filter(id => id !== groupId)
          : [...currentSelected, groupId],
      };
    });
  };

  // 處理 Autocomplete 選擇
  const handlePlaceSelected = () => {
    try {
      if (!autocompleteRef.current) {
        return;
      }
      
      const place = autocompleteRef.current.getPlace();
      
      // 檢查 place 是否存在且有必要的屬性
      if (!place) {
        console.warn('No place data returned from autocomplete');
        return;
      }
      
      if (!place.geometry || !place.geometry.location) {
        console.warn('Place has no geometry or location data');
        return;
      }
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      setFormData({
        ...formData,
        placeName: place.name || formData.placeName,
        placeId: place.place_id,
        placeLat: lat,
        placeLng: lng,
        placeTypes: place.types || [],
      });
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              新增位置資訊
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isSubmitting}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 地點名稱 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  在哪裡讀書？
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualInput(!isManualInput);
                    // 切換模式時清除地標資訊
                    if (!isManualInput) {
                      setFormData({
                        ...formData,
                        placeId: undefined,
                        placeLat: undefined,
                        placeLng: undefined,
                        placeTypes: undefined,
                      });
                    }
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  disabled={isSubmitting}
                >
                  {isManualInput ? "🔍 搜尋店家" : "✏️ 手動輸入"}
                </button>
              </div>
              {isManualInput || !isScriptLoaded ? (
                <input
                  type="text"
                  value={formData.placeName}
                  onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
                  placeholder="例如：星巴克、圖書館、咖啡廳..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              ) : (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteRef.current = autocomplete;
                    if (autocomplete) {
                      autocomplete.setFields(['place_id', 'geometry', 'name', 'formatted_address', 'types']);
                      autocomplete.setComponentRestrictions({ country: 'tw' });
                      autocomplete.setTypes(['book_store', 'cafe', 'library']);
                    }
                  }}
                  onPlaceChanged={handlePlaceSelected}
                  options={{
                    types: ['book_store', 'cafe', 'library'],
                    componentRestrictions: { country: 'tw' },
                    language: 'zh-TW',
                  }}
                >
                  <input
                    type="text"
                    value={formData.placeName}
                    onChange={(e) => setFormData({ ...formData, placeName: e.target.value })}
                    placeholder="搜尋書店、咖啡廳、圖書館..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={isSubmitting}
                  />
                </Autocomplete>
              )}
              {formData.placeId && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ 已選擇地標：{formData.placeName}
                </p>
              )}
            </div>

            {/* 預計讀到幾點 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                預計讀到幾點？
              </label>
              <input
                type="datetime-local"
                value={formData.studyUntil}
                onChange={(e) => setFormData({ ...formData, studyUntil: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 擁擠程度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                店內人是否壅擠？
              </label>
              <div className="grid grid-cols-5 gap-2">
                {crowdednessOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, crowdedness: option.value as any })}
                    disabled={isSubmitting}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.crowdedness === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.emoji}</div>
                    <div className="text-xs">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 設施 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                設施
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasOutlet}
                    onChange={(e) => setFormData({ ...formData, hasOutlet: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    🔌 有插座
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasWifi}
                    onChange={(e) => setFormData({ ...formData, hasWifi: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    📶 有網路
                  </span>
                </label>
              </div>
            </div>

            {/* 選擇要更新的群組 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📢 要在哪些群組更新位置？
              </label>
              {isLoadingGroups ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">載入群組中...</div>
              ) : userGroups.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">您還沒有加入任何群組</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {userGroups.map((group) => (
                    <label key={group._id} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selectedGroups?.includes(group._id) || false}
                        onChange={() => toggleGroupSelection(group._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {group.name}
                        </span>
                        {group.role && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({group.role === 'owner' ? '群主' : group.role === 'admin' ? '管理員' : '成員'})
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {formData.selectedGroups && formData.selectedGroups.length > 0 && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  已選擇 {formData.selectedGroups.length} 個群組
                </p>
              )}
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.studyUntil}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    提交中...
                  </>
                ) : (
                  '確認'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



