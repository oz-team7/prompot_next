export interface Prompt {
  id: string; // UUID 형식으로 변경
  title: string;
  author: string;
  authorId?: string;
  date: string;
  description: string;
  tags: string[];
  rating: number;
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