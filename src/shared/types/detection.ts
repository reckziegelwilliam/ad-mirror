/**
 * Layered Detection Pipeline Type System
 * 
 * This defines the complete type system for the new detection architecture:
 * 1. Container Detection - Find ad boundaries using multiple strategies
 * 2. Field Extraction - Pull specific data with fallback selectors
 * 3. Validation - Score and filter candidates by confidence
 */

import { Platform } from '../types';

// ============================================================================
// CONTAINER DETECTION
// ============================================================================

export type ContainerRuleType = 'css' | 'label-led' | 'attribute';

/**
 * Rule for finding ad container elements
 * Multiple rules can be defined per platform for robustness
 */
export interface ContainerRule {
  id: string;
  type: ContainerRuleType;
  
  // CSS selector strategy
  selector?: string;
  
  // Label-led strategy: find text nodes, walk up to container
  labelTexts?: string[];           // e.g., ["Promoted", "Sponsored"]
  containerSelector?: string;      // closest() selector to find container
  
  // Attribute strategy: match by data attributes
  attributeKey?: string;           // e.g., "data-ad"
  attributeValue?: string;         // e.g., "true" (optional - can match key existence)
  
  // Confidence score for this rule (0-1)
  score: number;
  
  // Optional: only apply within certain parent containers
  scopeSelector?: string;
  
  // v2.1: Negative filters to exclude non-ads
  excludeSelectors?: string[];     // CSS selectors to exclude (e.g., "[data-testid='comment']")
  excludeIfContains?: string[];    // Text patterns to exclude (e.g., ["Posted in", "Commented on"])
  excludeAncestors?: string[];     // Don't match if inside these ancestors (e.g., [".sidebar", ".footer"])
}

/**
 * Result of container detection with metadata
 */
export interface ContainerMatch {
  container: HTMLElement;
  ruleId: string;
  ruleType: ContainerRuleType;
  score: number;
  matchedAt: number;              // timestamp
  
  // v2.1: Context for improved extraction
  labelElement?: Element;         // Element containing the label (for context-aware extraction)
  labelConfidence?: number;       // Confidence of label match (for proximity scoring)
}

// ============================================================================
// FIELD EXTRACTION
// ============================================================================

export type AdField =
  | 'label'
  | 'advertiser'
  | 'advertiserHandle'
  | 'headline'
  | 'body'
  | 'cta'
  | 'destinationUrl'
  | 'image'
  | 'video';

/**
 * Rule for extracting a specific field from a container
 * Multiple rules per field enable fallback strategies
 */
export interface FieldRule {
  id: string;
  field: AdField;
  selector: string;                // CSS selector relative to container
  attr?: string;                   // Extract from attribute (e.g., 'href', 'src')
  score: number;                   // Priority of this extraction rule
  transform?: 'trim' | 'lowercase' | 'url-clean';  // Optional post-processing
}

/**
 * Extracted field data from a container
 */
export interface FieldData {
  label?: string;
  advertiser?: string;
  advertiserHandle?: string;
  headline?: string;
  body?: string;
  cta?: string;
  destinationUrl?: string;
  images?: string[];
  videos?: string[];
}

/**
 * Field extraction result with metadata
 */
export interface FieldExtraction {
  field: AdField;
  value: string | string[];
  ruleId: string;
  selector: string;
  score: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

export type ValidatorType = 
  | 'required-field'
  | 'label-pattern'
  | 'url-valid'
  | 'min-text-length';

/**
 * Rule for validating an ad candidate
 */
export interface ValidationRule {
  type: ValidatorType;
  field?: AdField;                 // For field-specific validators
  pattern?: string;                // Regex pattern for pattern validators
  minLength?: number;              // For length validators
  weight: number;                  // Impact on confidence score (0-1)
}

/**
 * Validation result with detailed feedback
 */
export interface ValidationResult {
  valid: boolean;                  // Pass/fail based on minConfidence
  confidence: number;              // Overall confidence score (0-1)
  reasons: string[];               // Detailed validation messages
  fieldScores: Record<AdField, number>;  // Per-field contribution
}

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

/**
 * Complete detection configuration for a platform
 */
export interface PlatformSelectorConfig {
  platform: Platform | string;
  version: string;                 // Config version for tracking
  hostnames: string[];
  
  // Phase 1: Container detection
  containerRules: ContainerRule[];
  
  // Phase 2: Field extraction
  fieldRules: FieldRule[];
  
  // Phase 3: Validation
  validators: ValidationRule[];
  minConfidence: number;           // Minimum confidence to accept (0-1)
  
  // v2.1: Dynamic thresholds
  containerScoreThreshold?: number;  // Minimum container score (default: 0.6)
  adaptiveThreshold?: boolean;       // Use dynamic threshold based on match quality (default: false)
  
  // Optional: debugging and metadata
  debug?: boolean;
  notes?: string;
}

// ============================================================================
// DETECTION RESULTS
// ============================================================================

/**
 * Complete ad candidate with all detection metadata
 */
export interface AdCandidate {
  // Container info
  container: HTMLElement;
  containerMatch: ContainerMatch;
  
  // Extracted fields
  fields: FieldData;
  fieldExtractions: FieldExtraction[];
  
  // Validation
  validation: ValidationResult;
  
  // Metadata
  platform: Platform | string;
  detectedAt: number;
  pageUrl: string;
  placement: 'feed' | 'search' | 'other';
}

/**
 * Simplified ad detection for sending to background script
 */
export interface AdDetectionPayload {
  platform: Platform | string;
  pageUrl: string;
  placement: 'feed' | 'search' | 'other';
  
  // Fields
  advertiserName?: string;
  advertiserHandle?: string;
  labelText?: string;
  creativeText?: string;
  destinationUrl?: string;
  mediaUrls?: string[];
  
  // Metadata
  confidence: number;
  containerRuleId: string;
  detectedAt: number;
}

// ============================================================================
// DEBUG INFO
// ============================================================================

/**
 * Detailed debugging information for overlay
 */
export interface DetectionDebugInfo {
  // Container detection
  containerRules: {
    ruleId: string;
    matched: boolean;
    score?: number;
    selector?: string;
  }[];
  
  // Field extraction
  fieldAttempts: {
    field: AdField;
    attempts: {
      ruleId: string;
      selector: string;
      found: boolean;
      value?: string;
    }[];
    finalValue?: string;
  }[];
  
  // Validation
  validationDetails: {
    validator: ValidatorType;
    passed: boolean;
    weight: number;
    message: string;
  }[];
  
  // Summary
  overallConfidence: number;
  accepted: boolean;
}

