export interface Prompt {
  id: number;
  title: string;
  author: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  authorId?: string;
  date: string;
  created_at?: string; // 추가
  description: string;
  tags: string[];
  rating: number;
  totalRatings?: number;
  likes: number;
  bookmarks?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  category?: "work" | "dev" | "design" | "edu" | "image";
  preview_image?: string;
  video_url?: string;
  additional_images?: string[];
  aiModel?: {
    name: string;
    icon: string;
  };
  content?: string;
  isPublic?: boolean;
  comments?: any[]; // 추가
  averageRating?: number; // 추가
  commentCount?: number; // 추가
}

export interface Bookmark {
  id: string;
  createdAt: string;
  categoryId?: string;
  prompt: {
    id: number;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    aiModel: string;
    previewImage?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    author: string;
    authorId?: string;
  };
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  bookmarkCount?: number;
}

export type CategoryType = 'all' | 'work' | 'dev' | 'design' | 'edu' | 'image';
export type SortType = 'latest' | 'latest-desc' | 'popular' | 'popular-desc' | 'rating' | 'rating-desc';