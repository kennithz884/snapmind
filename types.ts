
export enum Category {
  TECHNICAL = 'Technical',
  SHOPPING = 'Shopping',
  CHAT = 'Chat',
  INSPIRATION = 'Inspiration',
  DOCUMENT = 'Document',
  MISC = 'Misc'
}

export interface Screenshot {
  id: string;
  url: string;
  timestamp: number;
  category: Category;
  summary: string;
  ocrText: string;
  viewCount: number;
  insights: {
    links: string[];
    phones: string[];
    addresses: string[];
  };
  embedding?: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  group: string;
}

export interface KnowledgeLink {
  source: string;
  target: string;
}
