export interface Idea {
  id: string;
  createdAt: number;
  title: string;
  transcript: string;
  summary: string;
  actionItems: string[];
  tags: string[];
  category: 'Work' | 'Personal' | 'Creative' | 'Other';
  isFavorite: boolean;
  imageUrl?: string;
  expansion?: string; // New field for AI Deep Dive content
}

export interface ProcessingStatus {
  isRecording: boolean;
  isProcessing: boolean;
  progressMessage: string;
  error: string | null;
}

export type ViewMode = 'list' | 'record' | 'detail' | 'stats';