/**
 * Core Detection Engine
 * 
 * Three-phase detection pipeline:
 * 1. Container Detection - Find ad boundaries using multiple strategies
 * 2. Field Extraction - Pull specific data with fallback selectors
 * 3. Validation - Score and filter candidates by confidence
 */

import {
  PlatformSelectorConfig,
  ContainerRule,
  ContainerMatch,
  FieldRule,
  FieldData,
  FieldExtraction,
  AdField,
  AdCandidate,
  DetectionDebugInfo,
} from '../../shared/types/detection';
import { findContainersByLabelAdvanced } from './labelLedDetection';
import { validateAdCandidate, computeConfidence } from './validators';
import { getMetricsCollector } from './metricsCollector';  // v2.1

// ============================================================================
// PHASE 1: CONTAINER DETECTION
// ============================================================================

/**
 * Find ad containers using all configured rules
 * Returns deduplicated containers with their best scores
 */
export function findAdContainers(
  config: PlatformSelectorConfig,
  document: Document = window.document
): ContainerMatch[] {
  const candidates: ContainerMatch[] = [];
  
  console.log(`[Detector] Running ${config.containerRules.length} container rules for ${config.platform}`);
  
  // Run each container rule
  for (const rule of config.containerRules) {
    try {
      const matches = executeContainerRule(rule, document);
      candidates.push(...matches);
      
      if (config.debug) {
        console.log(`[Detector] Rule ${rule.id} found ${matches.length} matches`);
      }
    } catch (error) {
      console.error(`[Detector] Error executing rule ${rule.id}:`, error);
    }
  }
  
  // Deduplicate by DOM node, keeping highest score
  const uniqueMatches = deduplicateContainers(candidates);
  
  // v2.1: Use configurable or dynamic threshold
  let threshold: number;
  if (config.containerScoreThreshold !== undefined) {
    // Use explicit threshold from config
    threshold = config.containerScoreThreshold;
  } else if (config.adaptiveThreshold) {
    // Calculate dynamic threshold based on match distribution
    threshold = calculateDynamicThreshold(uniqueMatches, config);
  } else {
    // Use default threshold
    threshold = 0.6;
  }
  
  const filtered = uniqueMatches.filter(match => match.score >= threshold);
  
  console.log(`[Detector] Found ${filtered.length} unique containers (${uniqueMatches.length} before threshold ${threshold.toFixed(2)})`);
  
  return filtered;
}

/**
 * Execute a single container detection rule
 */
function executeContainerRule(
  rule: ContainerRule,
  document: Document
): ContainerMatch[] {
  const scope = rule.scopeSelector
    ? document.querySelector(rule.scopeSelector)
    : document.body;
    
  if (!scope) {
    console.warn(`[Detector] Scope not found for rule ${rule.id}: ${rule.scopeSelector}`);
    return [];
  }
  
  let matches: ContainerMatch[] = [];
  
  switch (rule.type) {
    case 'css':
      matches = findContainersByCss(rule, scope as HTMLElement);
      break;
      
    case 'label-led':
      matches = findContainersByLabelAdvanced(rule, document);
      break;
      
    case 'attribute':
      matches = findContainersByAttribute(rule, scope as HTMLElement);
      break;
      
    default:
      console.warn(`[Detector] Unknown rule type: ${rule.type}`);
      return [];
  }
  
  // v2.1: Apply negative filters
  return applyNegativeFilters(matches, rule);
}

/**
 * Find containers using CSS selector
 */
function findContainersByCss(
  rule: ContainerRule,
  scope: HTMLElement
): ContainerMatch[] {
  if (!rule.selector) {
    console.warn(`[Detector] CSS rule ${rule.id} missing selector`);
    return [];
  }
  
  const elements = scope.querySelectorAll<HTMLElement>(rule.selector);
  const matches: ContainerMatch[] = [];
  
  for (const element of elements) {
    matches.push({
      container: element,
      ruleId: rule.id,
      ruleType: 'css',
      score: rule.score,
      matchedAt: Date.now(),
    });
  }
  
  return matches;
}

/**
 * Find containers by data attribute
 */
function findContainersByAttribute(
  rule: ContainerRule,
  scope: HTMLElement
): ContainerMatch[] {
  if (!rule.attributeKey) {
    console.warn(`[Detector] Attribute rule ${rule.id} missing attributeKey`);
    return [];
  }
  
  let selector = `[${rule.attributeKey}]`;
  if (rule.attributeValue) {
    selector = `[${rule.attributeKey}="${rule.attributeValue}"]`;
  }
  
  const elements = scope.querySelectorAll<HTMLElement>(selector);
  const matches: ContainerMatch[] = [];
  
  for (const element of elements) {
    matches.push({
      container: element,
      ruleId: rule.id,
      ruleType: 'attribute',
      score: rule.score,
      matchedAt: Date.now(),
    });
  }
  
  return matches;
}

/**
 * Deduplicate containers by DOM node, keeping highest score
 */
function deduplicateContainers(candidates: ContainerMatch[]): ContainerMatch[] {
  const map = new Map<HTMLElement, ContainerMatch>();
  
  for (const candidate of candidates) {
    const existing = map.get(candidate.container);
    
    if (!existing || candidate.score > existing.score) {
      map.set(candidate.container, candidate);
    }
  }
  
  return Array.from(map.values());
}

// ============================================================================
// v2.1: NEGATIVE FILTERS & DYNAMIC THRESHOLDS
// ============================================================================

/**
 * Apply negative filters to exclude non-ad containers
 */
function applyNegativeFilters(
  matches: ContainerMatch[],
  rule: ContainerRule
): ContainerMatch[] {
  let filtered = matches;
  
  // Filter by exclude selectors
  if (rule.excludeSelectors && rule.excludeSelectors.length > 0) {
    filtered = filtered.filter(match => {
      for (const excludeSelector of rule.excludeSelectors!) {
        try {
          // Check if container itself matches exclude selector
          if (match.container.matches(excludeSelector)) {
            return false;
          }
          
          // Check if container contains excluded element
          if (match.container.querySelector(excludeSelector)) {
            return false;
          }
        } catch (error) {
          console.warn(`[Detector] Invalid exclude selector: ${excludeSelector}`, error);
        }
      }
      return true;
    });
  }
  
  // Filter by text content exclusions
  if (rule.excludeIfContains && rule.excludeIfContains.length > 0) {
    filtered = filtered.filter(match => {
      const text = match.container.textContent || '';
      return !rule.excludeIfContains!.some(phrase => 
        text.includes(phrase)
      );
    });
  }
  
  // Filter by ancestor exclusions
  if (rule.excludeAncestors && rule.excludeAncestors.length > 0) {
    filtered = filtered.filter(match => {
      for (const ancestorSelector of rule.excludeAncestors!) {
        try {
          if (match.container.closest(ancestorSelector)) {
            return false;
          }
        } catch (error) {
          console.warn(`[Detector] Invalid ancestor selector: ${ancestorSelector}`, error);
        }
      }
      return true;
    });
  }
  
  return filtered;
}

/**
 * Calculate dynamic threshold based on match quality distribution
 */
function calculateDynamicThreshold(
  matches: ContainerMatch[],
  config: PlatformSelectorConfig
): number {
  if (matches.length === 0) {
    return config.containerScoreThreshold || 0.6;
  }
  
  // Get score distribution
  const scores = matches.map(m => m.score);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  
  // If we have high-confidence matches, raise the bar
  // Use 80% of max score as threshold, but never below minConfidence
  let threshold = maxScore * 0.8;
  
  // Don't set threshold too high if average is much lower
  if (avgScore < threshold * 0.7) {
    threshold = Math.max(avgScore * 1.1, config.minConfidence);
  }
  
  // Clamp to reasonable range
  threshold = Math.max(threshold, config.minConfidence);
  threshold = Math.min(threshold, 0.95); // Never filter out 95%+ scores
  
  return threshold;
}

// ============================================================================
// PHASE 2: FIELD EXTRACTION
// ============================================================================

/**
 * Extract all fields from a container using configured rules
 * v2.1: Now accepts optional context for context-aware extraction
 */
export function extractFields(
  container: HTMLElement,
  rules: FieldRule[],
  debug: boolean = false,
  context?: { labelElement?: Element }  // v2.1: Context for smarter extraction
): { fields: FieldData; extractions: FieldExtraction[] } {
  const fields: FieldData = {
    images: [],
    videos: [],
  };
  const extractions: FieldExtraction[] = [];
  
  // Group rules by field
  const rulesByField = new Map<AdField, FieldRule[]>();
  for (const rule of rules) {
    const fieldRules = rulesByField.get(rule.field) || [];
    fieldRules.push(rule);
    rulesByField.set(rule.field, fieldRules);
  }
  
  // Sort each field's rules by score (highest first)
  for (const fieldRules of rulesByField.values()) {
    fieldRules.sort((a, b) => b.score - a.score);
  }
  
  // Extract each field
  for (const [field, fieldRules] of rulesByField) {
    const result = extractField(container, field, fieldRules, debug, context);
    
    if (result) {
      extractions.push(result);
      setFieldValue(fields, field, result.value);
    }
  }
  
  if (debug) {
    console.log(`[Detector] Extracted ${extractions.length} fields from container:`, fields);
  }
  
  return { fields, extractions };
}

/**
 * Extract a single field using fallback rules
 * v2.1: Context-aware extraction prioritizes elements near label
 */
function extractField(
  container: HTMLElement,
  field: AdField,
  rules: FieldRule[],
  debug: boolean,
  context?: { labelElement?: Element }
): FieldExtraction | null {
  for (const rule of rules) {
    try {
      let element: Element | null = null;
      
      // v2.1: Try context-aware extraction first for certain fields
      if (context?.labelElement && (field === 'advertiser' || field === 'advertiserHandle')) {
        element = findNearestMatch(context.labelElement, rule.selector, container);
        if (element && debug) {
          console.log(`[Detector] Field ${field} using context-aware match`);
        }
      }
      
      // Fall back to normal extraction if context-aware didn't work
      if (!element) {
        element = container.querySelector(rule.selector);
      }
      
      if (!element) {
        if (debug) {
          console.log(`[Detector] Field ${field} rule ${rule.id} - no match for: ${rule.selector}`);
        }
        continue;
      }
      
      let value: string | string[];
      
      // Extract from attribute or text content
      if (rule.attr) {
        const attrValue = element.getAttribute(rule.attr);
        if (!attrValue) continue;
        value = attrValue.trim();
      } else {
        // Special handling for media fields
        if (field === 'image' || field === 'video') {
          value = extractMediaUrls(container, rule.selector, rule.attr || 'src');
          if (value.length === 0) continue;
        } else {
          const textValue = element.textContent?.trim();
          if (!textValue) continue;
          value = textValue;
        }
      }
      
      // Apply transforms
      if (typeof value === 'string' && rule.transform) {
        value = applyTransform(value, rule.transform);
      }
      
      // Found a value!
      if (debug) {
        console.log(`[Detector] Field ${field} extracted via rule ${rule.id}:`, value);
      }
      
      return {
        field,
        value,
        ruleId: rule.id,
        selector: rule.selector,
        score: rule.score,
      };
      
    } catch (error) {
      console.error(`[Detector] Error extracting field ${field} with rule ${rule.id}:`, error);
    }
  }
  
  if (debug) {
    console.log(`[Detector] Field ${field} - no value found after ${rules.length} attempts`);
  }
  
  return null;
}

// ============================================================================
// v2.1: CONTEXT-AWARE EXTRACTION HELPERS
// ============================================================================

/**
 * Find the element matching selector that is closest to reference element
 */
function findNearestMatch(
  reference: Element,
  selector: string,
  container: HTMLElement
): Element | null {
  const candidates = Array.from(container.querySelectorAll(selector));
  
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  
  // Find closest by DOM distance
  let closest: Element | null = null;
  let minDistance = Infinity;
  
  for (const candidate of candidates) {
    const distance = getDOMDistance(reference, candidate);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }
  
  return closest;
}

/**
 * Calculate tree distance between two elements
 */
function getDOMDistance(el1: Element, el2: Element): number {
  const path1 = getElementPath(el1);
  const path2 = getElementPath(el2);
  
  // Find common ancestor depth
  let commonDepth = 0;
  while (
    commonDepth < path1.length && 
    commonDepth < path2.length && 
    path1[commonDepth] === path2[commonDepth]
  ) {
    commonDepth++;
  }
  
  // Distance = steps from el1 to common ancestor + steps from common ancestor to el2
  return (path1.length - commonDepth) + (path2.length - commonDepth);
}

/**
 * Get path from element to root
 */
function getElementPath(element: Element): Element[] {
  const path: Element[] = [];
  let current: Element | null = element;
  
  while (current) {
    path.unshift(current);
    current = current.parentElement;
  }
  
  return path;
}

/**
 * Extract multiple media URLs
 */
function extractMediaUrls(container: HTMLElement, selector: string, attr: string): string[] {
  const elements = container.querySelectorAll(selector);
  const urls: string[] = [];
  
  for (const element of elements) {
    const url = element.getAttribute(attr);
    if (url && url.trim()) {
      urls.push(url.trim());
    }
  }
  
  return urls;
}

/**
 * Apply transform to extracted value
 */
function applyTransform(value: string, transform: string): string {
  switch (transform) {
    case 'trim':
      return value.trim();
      
    case 'lowercase':
      return value.toLowerCase();
      
    case 'url-clean':
      // Remove tracking parameters
      try {
        const url = new URL(value);
        // Remove common tracking params
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
        for (const param of trackingParams) {
          url.searchParams.delete(param);
        }
        return url.toString();
      } catch {
        return value;
      }
      
    default:
      return value;
  }
}

/**
 * Set field value in FieldData object
 */
function setFieldValue(fields: FieldData, field: AdField, value: string | string[]): void {
  switch (field) {
    case 'label':
      fields.label = value as string;
      break;
    case 'advertiser':
      fields.advertiser = value as string;
      break;
    case 'advertiserHandle':
      fields.advertiserHandle = value as string;
      break;
    case 'headline':
      fields.headline = value as string;
      break;
    case 'body':
      fields.body = value as string;
      break;
    case 'cta':
      fields.cta = value as string;
      break;
    case 'destinationUrl':
      fields.destinationUrl = value as string;
      break;
    case 'image':
      fields.images = value as string[];
      break;
    case 'video':
      fields.videos = value as string[];
      break;
  }
}

// ============================================================================
// PHASE 3: COMPLETE DETECTION PIPELINE
// ============================================================================

/**
 * Run complete detection pipeline for a page
 * v2.1: Now collects performance metrics
 */
export function detectAds(
  config: PlatformSelectorConfig,
  seenContainers: WeakSet<HTMLElement> = new WeakSet(),
  document: Document = window.document
): AdCandidate[] {
  const candidates: AdCandidate[] = [];
  const metricsCollector = getMetricsCollector();  // v2.1
  
  // Phase 1: Find containers
  const containers = findAdContainers(config, document);
  
  // Phase 2 & 3: Extract and validate each container
  for (const match of containers) {
    // Skip if already seen
    if (seenContainers.has(match.container)) {
      continue;
    }
    
    seenContainers.add(match.container);
    
    // v2.1: Pass label context for context-aware extraction
    const context = match.labelElement ? { labelElement: match.labelElement } : undefined;
    
    // Extract fields
    const { fields, extractions } = extractFields(
      match.container, 
      config.fieldRules, 
      config.debug,
      context  // v2.1: Context for smarter extraction
    );
    
    // v2.1: Record field extraction metrics
    for (const extraction of extractions) {
      metricsCollector.recordFieldMatch(extraction.ruleId, true, extraction.score);
    }
    
    // Validate
    const validation = config.validators && config.validators.length > 0
      ? validateAdCandidate(fields, config.validators, config.minConfidence)
      : createDefaultValidation(fields, config.minConfidence);
    
    // v2.1: Record container match metrics
    metricsCollector.recordContainerMatch(match.ruleId, validation.valid, validation.confidence);
    
    // Only include valid candidates
    if (validation.valid) {
      candidates.push({
        container: match.container,
        containerMatch: match,
        fields,
        fieldExtractions: extractions,
        validation,
        platform: config.platform,
        detectedAt: Date.now(),
        pageUrl: window.location.href,
        placement: detectPlacement(config.platform, window.location.href),
      });
      
      if (config.debug) {
        console.log('[Detector] Valid ad candidate:', {
          ruleId: match.ruleId,
          confidence: validation.confidence,
          fields,
        });
      }
    } else {
      if (config.debug) {
        console.log('[Detector] Rejected candidate (low confidence):', {
          ruleId: match.ruleId,
          confidence: validation.confidence,
          reasons: validation.reasons,
        });
      }
    }
  }
  
  return candidates;
}

/**
 * Create default validation when no validators configured
 */
function createDefaultValidation(fields: FieldData, minConfidence: number) {
  const confidence = computeConfidence(fields);
  const reasons: string[] = [];
  
  if (!fields.advertiser) reasons.push('Missing advertiser');
  if (!fields.destinationUrl) reasons.push('Missing destination URL');
  if (!fields.label) reasons.push('Missing ad label');
  
  return {
    valid: confidence >= minConfidence,
    confidence,
    reasons,
    fieldScores: {} as Record<AdField, number>,
  };
}

/**
 * Detect placement type based on platform and URL
 */
function detectPlacement(platform: string, url: string): 'feed' | 'search' | 'other' {
  if (platform === 'google') {
    return 'search';
  }
  
  // For social platforms, check URL patterns
  if (url.includes('/search') || url.includes('/explore')) {
    return 'search';
  }
  
  // Default to feed
  return 'feed';
}

// ============================================================================
// DEBUG INFO GENERATION
// ============================================================================

/**
 * Generate detailed debug info for a container
 */
export function generateDebugInfo(
  container: HTMLElement,
  config: PlatformSelectorConfig
): DetectionDebugInfo {
  // Check which container rules match
  const containerRules = config.containerRules.map(rule => {
    let matched = false;
    let score: number | undefined;
    
    try {
      const matches = executeContainerRule(rule, document);
      matched = matches.some(m => m.container === container);
      if (matched) {
        score = rule.score;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return {
      ruleId: rule.id,
      matched,
      score,
      selector: rule.selector || rule.labelTexts?.join(', '),
    };
  });
  
  // Extract fields and track attempts
  const fieldAttempts: DetectionDebugInfo['fieldAttempts'] = [];
  const rulesByField = new Map<AdField, FieldRule[]>();
  
  for (const rule of config.fieldRules) {
    const rules = rulesByField.get(rule.field) || [];
    rules.push(rule);
    rulesByField.set(rule.field, rules);
  }
  
  for (const [field, rules] of rulesByField) {
    const attempts = rules.map(rule => {
      const element = container.querySelector(rule.selector);
      let value: string | undefined;
      
      if (element) {
        if (rule.attr) {
          value = element.getAttribute(rule.attr) || undefined;
        } else {
          value = element.textContent?.trim();
        }
      }
      
      return {
        ruleId: rule.id,
        selector: rule.selector,
        found: Boolean(element && value),
        value,
      };
    });
    
    const finalValue = attempts.find(a => a.found)?.value;
    
    fieldAttempts.push({
      field,
      attempts,
      finalValue,
    });
  }
  
  // Run validation
  const { fields } = extractFields(container, config.fieldRules, false);
  const validation = config.validators && config.validators.length > 0
    ? validateAdCandidate(fields, config.validators, config.minConfidence)
    : createDefaultValidation(fields, config.minConfidence);
  
  const validationDetails = validation.reasons.map((message, i) => ({
    validator: config.validators?.[i]?.type || 'default',
    passed: !message.includes('Missing') && !message.includes('below'),
    weight: config.validators?.[i]?.weight || 0,
    message,
  }));
  
  return {
    containerRules,
    fieldAttempts,
    validationDetails,
    overallConfidence: validation.confidence,
    accepted: validation.valid,
  };
}

