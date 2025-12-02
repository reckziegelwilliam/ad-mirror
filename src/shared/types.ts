export type Platform = 'reddit' | 'google' | 'twitter' | 'facebook';

export interface AdRecord {
  id: string;                    // SHA-256 hash of stable fields
  platform: Platform;
  firstSeenAt: number;           // Unix timestamp ms - first detection
  lastSeenAt: number;            // Unix timestamp ms - most recent detection
  impressionCount: number;       // Number of times seen
  placement: 'feed' | 'search' | 'other';
  pageUrl?: string;              // Excluded by default
  advertiserName?: string;
  advertiserHandle?: string;     // @username for Twitter/Reddit
  labelText?: string;            // e.g., "Promoted", "Sponsored"
  creativeText?: string;         // Ad text content (max 2000 chars)
  destinationUrl?: string;       // Sanitized (trackers stripped)
  mediaUrls?: string[];          // Empty by default
  tags?: string[];               // User-defined tags
  transparencyNote?: string;     // Reserved for v1+ (user-triggered capture)
  // Legacy fields for backward compatibility during migration
  detectedAt?: number;           // DEPRECATED: use firstSeenAt
  text?: string;                 // DEPRECATED: use creativeText
  destUrl?: string;              // DEPRECATED: use destinationUrl
  sponsoredLabel?: string;       // DEPRECATED: use labelText
}

export interface Settings {
  enabledPlatforms: Record<Platform, boolean>;
  capturePageUrl: boolean;       // Default: false
  storeMediaUrls: boolean;       // Default: false
  theme: 'system' | 'light' | 'dark';
  retentionDays: 90 | 180 | 365 | null;  // null = keep forever
  selectorsOverride?: Partial<SelectorsConfig>;
}

export interface SelectorsConfig {
  reddit: RedditSelectors;
  google: GoogleSelectors;
  twitter: TwitterSelectors;
  // Future: facebook, instagram, youtube, linkedin
}

export interface RedditSelectors {
  postContainer: string;
  adLabelTexts: string[];         // Keep as regex-friendly
  title: string;
  advertiser: string;
  advertiserFallback: string;     // NEW: fallback selector
  dest: string;
  media: string;
}

export interface GoogleSelectors {
  adHeaderTexts: string[];        // ["Sponsored results"]
  headingSelectors: string[];     // Heading elements to search
  sectionSelectors: string[];     // Block containers
  cardLinkSelector: string;       // Links within sponsored block
}

export interface TwitterSelectors {
  tweetContainer: string;
  tweetContainerFallback: string; // NEW: fallback to just 'article'
  adLabelTexts: string[];
  text: string;
  advertiserSelectors: string[];  // Multiple fallbacks
  media: string;
}

// Message protocol (extensible for v1+ analytics, sync)
export type BackgroundMessage =
  | { type: 'AD_CANDIDATE'; payload: AdCandidatePayload }
  | { type: 'SAVE_RECORD'; record: AdRecord }
  | { type: 'LIST_RECORDS'; filters?: RecordFilters }
  | { type: 'DELETE_RECORD'; id: string }
  | { type: 'DELETE_ALL' }
  | { type: 'EXPORT'; format: 'json' | 'csv' | 'csv-summary'; filters?: RecordFilters };

export type PopupMessage =
  | { type: 'RECORD_SAVED'; record: AdRecord }
  | { type: 'RECORDS_LIST'; records: AdRecord[] };

export interface AdCandidatePayload {
  platform: Platform;
  pageUrl: string;
  placement: 'feed' | 'search' | 'other';
  advertiserName?: string;
  advertiserHandle?: string;
  text?: string;
  mediaUrls?: string[];
  destUrl?: string;
  sponsoredLabel?: string;
}

export interface RecordFilters {
  platforms?: Platform[];
  startDate?: number;
  endDate?: number;
  searchText?: string;
}

// Future v1+ types (stub for schema design)
export interface Impression {
  id: string;
  adId: string;         // FK to AdRecord.id
  seenAt: number;
  pageUrl?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface AdTag {
  adId: string;
  tagId: string;
}

