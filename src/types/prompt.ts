export interface Prompt {
  id: number;
  title: string;
  author: string;
  authorId?: string;
  date: string;
  description: string;
  tags: string[];
  rating: number;
  totalRatings?: number;
  likes: number;
  bookmarks?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  category?: 'work' | 'dev' | 'design' | 'edu' | 'image';
  previewImage?: string;
  aiModel?: {
    name: string;
    icon: string;
  };
  content?: string;
  isPublic?: boolean;
}