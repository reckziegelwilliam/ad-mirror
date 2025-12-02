/**
 * Validation functions for ad candidates
 * Each validator contributes to the overall confidence score
 */

import { AdField, FieldData, ValidationRule, ValidationResult, ValidatorType } from '../../shared/types/detection';

/**
 * Validate that a required field is present and non-empty
 */
export function validateRequiredField(
  field: AdField,
  fields: FieldData,
  weight: number
): { passed: boolean; message: string; score: number } {
  const value = getFieldValue(field, fields);
  const passed = Boolean(value && (typeof value === 'string' ? value.trim() : value.length > 0));
  
  return {
    passed,
    message: passed ? `Field '${field}' present` : `Missing required field '${field}'`,
    score: passed ? weight : 0,
  };
}

/**
 * Validate that label text matches expected patterns
 */
export function validateLabelPattern(
  pattern: string,
  fields: FieldData,
  weight: number
): { passed: boolean; message: string; score: number } {
  const label = fields.label || '';
  const regex = new RegExp(pattern, 'i');
  const passed = regex.test(label);
  
  return {
    passed,
    message: passed 
      ? `Label matches pattern: ${pattern}` 
      : `Label '${label}' does not match pattern: ${pattern}`,
    score: passed ? weight : 0,
  };
}

/**
 * Validate that URL is well-formed and not empty
 */
export function validateUrl(
  url: string | undefined,
  weight: number
): { passed: boolean; message: string; score: number } {
  if (!url || !url.trim()) {
    return {
      passed: false,
      message: 'URL is missing or empty',
      score: 0,
    };
  }
  
  try {
    const parsed = new URL(url);
    const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    
    return {
      passed: isValid,
      message: isValid ? `Valid URL: ${parsed.hostname}` : `Invalid URL protocol: ${parsed.protocol}`,
      score: isValid ? weight : 0,
    };
  } catch (e) {
    return {
      passed: false,
      message: `Invalid URL format: ${url}`,
      score: 0,
    };
  }
}

/**
 * Validate minimum text length for a field
 */
export function validateMinTextLength(
  field: AdField,
  fields: FieldData,
  minLength: number,
  weight: number
): { passed: boolean; message: string; score: number } {
  const value = getFieldValue(field, fields);
  const text = typeof value === 'string' ? value : '';
  const passed = text.length >= minLength;
  
  return {
    passed,
    message: passed 
      ? `Field '${field}' has sufficient length (${text.length} >= ${minLength})`
      : `Field '${field}' too short (${text.length} < ${minLength})`,
    score: passed ? weight : weight * (text.length / minLength), // Partial credit
  };
}

/**
 * Validate advertiser name is reasonable (not empty, not suspicious)
 */
export function validateAdvertiser(
  advertiser: string | undefined,
  weight: number
): { passed: boolean; message: string; score: number } {
  if (!advertiser || !advertiser.trim()) {
    return {
      passed: false,
      message: 'Advertiser name is missing',
      score: 0,
    };
  }
  
  // Basic sanity checks
  const trimmed = advertiser.trim();
  
  // Too short
  if (trimmed.length < 2) {
    return {
      passed: false,
      message: 'Advertiser name too short',
      score: 0,
    };
  }
  
  // Suspicious patterns (all numbers, all special chars, etc.)
  if (/^[\d\s]+$/.test(trimmed) || /^[^\w\s]+$/.test(trimmed)) {
    return {
      passed: false,
      message: 'Advertiser name appears invalid',
      score: weight * 0.3, // Partial credit - might be legitimate
    };
  }
  
  return {
    passed: true,
    message: `Valid advertiser: ${trimmed.substring(0, 30)}`,
    score: weight,
  };
}

/**
 * Main validation function - runs all validators and computes confidence
 */
export function validateAdCandidate(
  fields: FieldData,
  validators: ValidationRule[],
  minConfidence: number
): ValidationResult {
  const reasons: string[] = [];
  const fieldScores: Record<string, number> = {};
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  const validationDetails: Array<{
    validator: ValidatorType;
    passed: boolean;
    weight: number;
    message: string;
  }> = [];
  
  // Run each validator
  for (const validator of validators) {
    maxPossibleScore += validator.weight;
    let result: { passed: boolean; message: string; score: number };
    
    switch (validator.type) {
      case 'required-field':
        if (!validator.field) {
          console.warn('required-field validator missing field specification');
          continue;
        }
        result = validateRequiredField(validator.field, fields, validator.weight);
        fieldScores[validator.field] = (fieldScores[validator.field] || 0) + result.score;
        break;
        
      case 'label-pattern':
        if (!validator.pattern) {
          console.warn('label-pattern validator missing pattern');
          continue;
        }
        result = validateLabelPattern(validator.pattern, fields, validator.weight);
        fieldScores['label'] = (fieldScores['label'] || 0) + result.score;
        break;
        
      case 'url-valid':
        result = validateUrl(fields.destinationUrl, validator.weight);
        fieldScores['destinationUrl'] = (fieldScores['destinationUrl'] || 0) + result.score;
        break;
        
      case 'min-text-length':
        if (!validator.field || validator.minLength === undefined) {
          console.warn('min-text-length validator missing field or minLength');
          continue;
        }
        result = validateMinTextLength(validator.field, fields, validator.minLength, validator.weight);
        fieldScores[validator.field] = (fieldScores[validator.field] || 0) + result.score;
        break;
        
      default:
        console.warn(`Unknown validator type: ${validator.type}`);
        continue;
    }
    
    totalScore += result.score;
    reasons.push(result.message);
    validationDetails.push({
      validator: validator.type,
      passed: result.passed,
      weight: validator.weight,
      message: result.message,
    });
  }
  
  // Compute confidence (0-1)
  const confidence = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  const valid = confidence >= minConfidence;
  
  if (!valid) {
    reasons.unshift(`Confidence ${confidence.toFixed(2)} below threshold ${minConfidence}`);
  }
  
  return {
    valid,
    confidence,
    reasons,
    fieldScores: fieldScores as Record<AdField, number>,
  };
}

/**
 * Compute overall confidence score from field completeness
 * This is used as a baseline when no explicit validators are configured
 */
export function computeConfidence(fields: FieldData): number {
  let score = 0;
  let maxScore = 0;
  
  // Critical fields (weight: 0.3 each)
  const criticalFields: Array<keyof FieldData> = ['advertiser', 'destinationUrl'];
  for (const field of criticalFields) {
    maxScore += 0.3;
    if (fields[field]) score += 0.3;
  }
  
  // Important fields (weight: 0.2 each)
  const importantFields: Array<keyof FieldData> = ['label', 'headline'];
  for (const field of importantFields) {
    maxScore += 0.2;
    if (fields[field]) score += 0.2;
  }
  
  // Nice-to-have fields (weight: 0.1 each)
  const optionalFields: Array<keyof FieldData> = ['body', 'images', 'videos'];
  for (const field of optionalFields) {
    maxScore += 0.1;
    const value = fields[field];
    if (value && (typeof value === 'string' ? value.trim() : value.length > 0)) {
      score += 0.1;
    }
  }
  
  return maxScore > 0 ? score / maxScore : 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFieldValue(field: AdField, fields: FieldData): string | string[] | undefined {
  switch (field) {
    case 'label':
      return fields.label;
    case 'advertiser':
      return fields.advertiser;
    case 'advertiserHandle':
      return fields.advertiserHandle;
    case 'headline':
      return fields.headline;
    case 'body':
      return fields.body;
    case 'cta':
      return fields.cta;
    case 'destinationUrl':
      return fields.destinationUrl;
    case 'image':
      return fields.images;
    case 'video':
      return fields.videos;
    default:
      return undefined;
  }
}

