import { Platform } from '../types';

export type PlatformId = Platform | string;

export interface RawDetectionContext {
  url: string;
  htmlSnapshot?: string;
  timestamp: number;
}

export interface AdDetection {
  id: string;                  // platform-local UID
  platform: PlatformId;
  detectedAt: number;
  advertiserName?: string;
  advertiserHandle?: string;
  labelText?: string;          // "Sponsored", "Promoted"
  creativeText?: string;
  mediaUrls?: string[];
  destinationUrl?: string;
  selectorPath?: string;       // CSS/XPath of main node
  placement?: 'feed' | 'search' | 'other';
  meta: Record<string, any>;   // platform-specific extras
}

export interface DetectionPlugin {
  id: PlatformId;
  matchHostname(hostname: string): boolean;
  init(config: PlatformDetectionConfig): void;
  teardown(): void;
}

export interface PlatformDetectionConfig {
  platform: PlatformId;
  hostnames: string[];
  rules: DetectionRule[];
  extractors?: ExtractorConfig;
}

export interface DetectionRule {
  id: string;
  type: 'css' | 'text' | 'attribute';
  // CSS selector strategy
  selector?: string;
  // Text pattern strategy
  textPattern?: string;
  // Attribute strategy
  attributeKey?: string;
  attributeValue?: string;
  // Confidence score (0-1)
  confidence: number;
  // Optional: apply this rule to children of a container
  containerSelector?: string;
}

export interface ExtractorConfig {
  advertiserName?: string[];     // Array of selectors to try
  advertiserHandle?: string[];
  title?: string[];
  text?: string[];
  destination?: string[];
  media?: string[];
}

