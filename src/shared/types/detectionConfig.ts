import { PlatformId } from './platform';

export interface DetectionRule {
  id: string;
  type: 'css' | 'text' | 'attribute';
  selector?: string;
  textPattern?: string;
  attributeKey?: string;
  attributeValue?: string;
  confidence: number;
  containerSelector?: string;
}

export interface ExtractorConfig {
  advertiserName?: string[];
  advertiserHandle?: string[];
  title?: string[];
  text?: string[];
  destination?: string[];
  media?: string[];
}

export interface PlatformDetectionConfig {
  platform: PlatformId;
  version: string;
  hostnames: string[];
  rules: DetectionRule[];
  extractors?: ExtractorConfig;
}

