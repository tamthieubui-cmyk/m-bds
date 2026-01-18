import { AppType, AppConfig } from './types';

export const APPS: AppConfig[] = [
  {
    id: AppType.BRANDING,
    label: 'App Xây Dựng Thương Hiệu',
    icon: '✨',
    description: 'Tạo nhân vật đại diện chuyên nghiệp, lời thoại truyền cảm hứng và kịch bản video marketing.',
    themeColor: 'text-indigo-600',
    themeBg: 'bg-indigo-50 border-indigo-200'
  },
  {
    id: AppType.TOWNHOUSE,
    label: 'App Nhà Phố',
    icon: '🏡',
    description: 'Tưởng tượng không gian sống hiện đại, kiến trúc sư tư vấn và video trải nghiệm nội thất.',
    themeColor: 'text-emerald-600',
    themeBg: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: AppType.LAND,
    label: 'App Đất Nền',
    icon: 'map',
    description: 'Phân tích tiềm năng đầu tư, chuyên gia địa ốc và mô phỏng quy hoạch tương lai.',
    themeColor: 'text-amber-600',
    themeBg: 'bg-amber-50 border-amber-200'
  }
];