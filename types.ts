export enum AppType {
  BRANDING = 'BRANDING',
  TOWNHOUSE = 'TOWNHOUSE',
  LAND = 'LAND'
}

export type AspectRatio = '9:16' | '16:9' | '1:1';

export interface AppConfig {
  id: AppType;
  label: string;
  icon: string;
  description: string;
  themeColor: string;
  themeBg: string;
}

// === SCENE DATA (Shared by Land & Townhouse) ===
export interface SceneData {
  id: number;
  title: string;
  script: string;
  visualPrompt: string;
  veoPrompt?: string; // Added for Townhouse & Land
  imageBase64?: string | null;
  isLoadingImage?: boolean;
  // Regeneration States
  isEditing?: boolean;
  feedback?: string;
}

export interface ProjectInfo {
  description: string;
  utilities: string;
  cta: string;
}

// === BRANDING APP TYPES ===
export interface BrandingVariation {
  id: number;
  title: string;
  script: string;
  veoPrompt: string;
}

export interface BrandingResult {
  hookHeadline: string; // NEW: Catchy Title
  hashtags: string[];   // NEW: Relevant hashtags
  masterVisualPrompt: string;
  masterImageBase64?: string | null;
  variations: BrandingVariation[];
}

// === OPTIONS ===
export const CLOTHING_OPTIONS = [
  { id: 'vest', label: 'Vest chuyên nghiệp (Professional Suit)' },
  { id: 'polo', label: 'Áo Polo năng động (Smart Casual Polo)' },
  { id: 'shirt', label: 'Sơ mi trắng lịch lãm (White Dress Shirt)' },
  { id: 'custom', label: 'Tùy chỉnh (Custom Style)' }
];

export const TOWNHOUSE_OUTFITS = [
  { id: 'architect', label: 'Kiến trúc sư (Smart Casual Blazer)' },
  { id: 'luxury_realtor', label: 'Môi giới cao cấp (Premium Suit)' },
  { id: 'modern_host', label: 'Host hiện đại (Turtleneck & Coat)' },
  { id: 'minimalist', label: 'Tối giản (Minimalist Shirt)' },
  { id: 'creative', label: 'Sáng tạo (Creative Layering)' },
  { id: 'custom', label: 'Tùy chỉnh (Custom)' }
];

export const BRANDING_BACKGROUNDS = [
  { id: 'studio', label: 'Studio Chuyên nghiệp (Professional Studio)' },
  { id: 'office', label: 'Văn phòng Hiện đại (Modern Office)' },
  { id: 'cafe', label: 'Quán Cafe Yên tĩnh (Cozy Cafe)' },
  { id: 'bookshelf', label: 'Thư viện / Kệ sách (Library/Bookshelf)' },
  { id: 'nature', label: 'Thiên nhiên Ngoài trời (Outdoor Nature)' },
  { id: 'podcast', label: 'Phòng thu Podcast (Podcast Setup)' },
  { id: 'custom', label: 'Tùy chỉnh (Custom)' }
];

export const BRANDING_STYLES = [
  { id: 'minimalist', label: 'Tối giản & Tinh tế (Minimalist)' },
  { id: 'luxury', label: 'Sang trọng & Đẳng cấp (Luxury)' },
  { id: 'friendly', label: 'Thân thiện & Dễ gần (Friendly)' },
  { id: 'authoritative', label: 'Uy tín & Chuyên gia (Authoritative)' },
  { id: 'cinematic', label: 'Điện ảnh & Nghệ thuật (Cinematic)' }
];

export const BRANDING_TONES = [
  { id: 'inspirational', label: 'Truyền cảm hứng (Inspirational)' },
  { id: 'educational', label: 'Giáo dục / Chia sẻ (Educational)' },
  { id: 'storytelling', label: 'Kể chuyện (Storytelling)' },
  { id: 'witty', label: 'Hài hước & Dí dỏm (Witty)' },
  { id: 'serious', label: 'Nghiêm túc & Phân tích (Serious)' }
];

export const RATIO_OPTIONS: AspectRatio[] = ['9:16', '16:9', '1:1'];

// Legacy support
export interface GeneratedContent {
  characterImageBase64: string | null;
  script: string;
  veoPrompt: string;
}

export interface TextGenerationResult {
  visualPrompt: string;
  script: string;
  veoPrompt: string;
}