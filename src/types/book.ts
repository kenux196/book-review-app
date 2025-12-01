export type BookStatus = 'TO_READ' | 'READING' | 'READ' | 'STOPPED';

export interface ReadingLog {
  id: string;
  date: string;
  startPage: number;
  endPage: number;
  content?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  startDate?: string;
  endDate?: string;
  rating?: number;
  review?: string;
  logs: ReadingLog[];
  createdAt: string;
}
