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
}

export interface ProcessingStatus {
  isRecording: boolean;
  isProcessing: boolean;
  progressMessage: string;
  error: string | null;
}

export type ViewMode = 'list' | 'record' | 'detail';