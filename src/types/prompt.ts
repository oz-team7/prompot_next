export interface Prompt {
  id: number;
  title: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
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

export interface Bookmark {
  id: string;
  createdAt: string;
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