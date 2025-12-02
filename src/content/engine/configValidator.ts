/**
 * Configuration Validator
 * Validates platform selector configs for errors and best practices
 */

import { PlatformSelectorConfig, ContainerRule, FieldRule } from '../../shared/types/detection';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  location?: string;
  ruleId?: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a complete platform configuration
 */
export function validateConfig(config: PlatformSelectorConfig): ConfigValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Validate basic structure
  if (!config.platform) {
    errors.push({
      type: 'error',
      message: 'Missing required field: platform',
    });
  }
  
  if (!config.version) {
    warnings.push({
      type: 'warning',
      message: 'Missing version field',
    });
  }
  
  if (!config.containerRules || config.containerRules.length === 0) {
    errors.push({
      type: 'error',
      message: 'No container rules defined',
    });
  }
  
  if (!config.fieldRules || config.fieldRules.length === 0) {
    errors.push({
      type: 'error',
      message: 'No field rules defined',
    });
  }
  
  // Validate container rules
  if (config.containerRules) {
    for (const rule of config.containerRules) {
      const ruleErrors = validateContainerRule(rule);
      errors.push(...ruleErrors.filter(e => e.type === 'error'));
      warnings.push(...ruleErrors.filter(e => e.type === 'warning'));
    }
  }
  
  // Validate field rules
  if (config.fieldRules) {
    for (const rule of config.fieldRules) {
      const ruleErrors = validateFieldRule(rule);
      errors.push(...ruleErrors.filter(e => e.type === 'error'));
      warnings.push(...ruleErrors.filter(e => e.type === 'warning'));
    }
  }
  
  // Validate validators
  if (config.validators) {
    const totalWeight = config.validators.reduce((sum, v) => sum + v.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.15) {
      warnings.push({
        type: 'warning',
        message: `Validator weights sum to ${totalWeight.toFixed(2)}, expected ~1.0`,
        location: 'validators',
      });
    }
    
    if (totalWeight === 0) {
      errors.push({
        type: 'error',
        message: 'Validator weights sum to 0',
        location: 'validators',
      });
    }
  }
  
  // Validate thresholds
  if (config.minConfidence !== undefined) {
    if (config.minConfidence < 0 || config.minConfidence > 1) {
      errors.push({
        type: 'error',
        message: `minConfidence ${config.minConfidence} outside valid range [0, 1]`,
        location: 'minConfidence',
      });
    }
  } else {
    warnings.push({
      type: 'warning',
      message: 'minConfidence not set, will use default',
      location: 'minConfidence',
    });
  }
  
  if (config.containerScoreThreshold !== undefined) {
    if (config.containerScoreThreshold < 0 || config.containerScoreThreshold > 1) {
      errors.push({
        type: 'error',
        message: `containerScoreThreshold ${config.containerScoreThreshold} outside valid range [0, 1]`,
        location: 'containerScoreThreshold',
      });
    }
  }
  
  // Check for required field extractors
  const extractedFields = new Set(config.fieldRules?.map(r => r.field) || []);
  const criticalFields = ['advertiser', 'destinationUrl'];
  
  for (const field of criticalFields) {
    if (!extractedFields.has(field as any)) {
      warnings.push({
        type: 'warning',
        message: `No extractor for critical field: ${field}`,
        location: 'fieldRules',
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single container rule
 */
function validateContainerRule(rule: ContainerRule): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!rule.id) {
    errors.push({
      type: 'error',
      message: 'Container rule missing id',
      ruleId: rule.id || 'unknown',
    });
  }
  
  if (!rule.type) {
    errors.push({
      type: 'error',
      message: 'Container rule missing type',
      ruleId: rule.id,
    });
  }
  
  // Validate based on rule type
  switch (rule.type) {
    case 'css':
      if (!rule.selector) {
        errors.push({
          type: 'error',
          message: 'CSS rule missing selector',
          ruleId: rule.id,
        });
      } else {
        const selectorError = validateCssSelector(rule.selector);
        if (selectorError) {
          errors.push({
            type: 'error',
            message: `Invalid CSS selector: ${selectorError}`,
            ruleId: rule.id,
            location: 'selector',
          });
        }
      }
      break;
      
    case 'label-led':
      if (!rule.labelTexts || rule.labelTexts.length === 0) {
        errors.push({
          type: 'error',
          message: 'Label-led rule missing labelTexts',
          ruleId: rule.id,
        });
      }
      
      if (rule.containerSelector) {
        const selectorError = validateCssSelector(rule.containerSelector);
        if (selectorError) {
          errors.push({
            type: 'error',
            message: `Invalid container selector: ${selectorError}`,
            ruleId: rule.id,
            location: 'containerSelector',
          });
        }
      }
      break;
      
    case 'attribute':
      if (!rule.attributeKey) {
        errors.push({
          type: 'error',
          message: 'Attribute rule missing attributeKey',
          ruleId: rule.id,
        });
      }
      break;
  }
  
  // Validate score
  if (rule.score === undefined || rule.score === null) {
    errors.push({
      type: 'error',
      message: 'Container rule missing score',
      ruleId: rule.id,
    });
  } else if (rule.score < 0 || rule.score > 1) {
    errors.push({
      type: 'warning',
      message: `Score ${rule.score} outside typical range [0, 1]`,
      ruleId: rule.id,
    });
  }
  
  // Validate negative selectors
  if (rule.excludeSelectors) {
    for (const selector of rule.excludeSelectors) {
      const error = validateCssSelector(selector);
      if (error) {
        errors.push({
          type: 'error',
          message: `Invalid exclude selector: ${error}`,
          ruleId: rule.id,
          location: 'excludeSelectors',
        });
      }
    }
  }
  
  if (rule.excludeAncestors) {
    for (const selector of rule.excludeAncestors) {
      const error = validateCssSelector(selector);
      if (error) {
        errors.push({
          type: 'error',
          message: `Invalid ancestor selector: ${error}`,
          ruleId: rule.id,
          location: 'excludeAncestors',
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate a single field rule
 */
function validateFieldRule(rule: FieldRule): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!rule.id) {
    errors.push({
      type: 'error',
      message: 'Field rule missing id',
      ruleId: rule.id || 'unknown',
    });
  }
  
  if (!rule.field) {
    errors.push({
      type: 'error',
      message: 'Field rule missing field name',
      ruleId: rule.id,
    });
  }
  
  if (!rule.selector) {
    errors.push({
      type: 'error',
      message: 'Field rule missing selector',
      ruleId: rule.id,
    });
  } else {
    const selectorError = validateCssSelector(rule.selector);
    if (selectorError) {
      errors.push({
        type: 'error',
        message: `Invalid CSS selector: ${selectorError}`,
        ruleId: rule.id,
        location: 'selector',
      });
    }
  }
  
  if (rule.score === undefined || rule.score === null) {
    errors.push({
      type: 'error',
      message: 'Field rule missing score',
      ruleId: rule.id,
    });
  } else if (rule.score < 0 || rule.score > 1) {
    errors.push({
      type: 'warning',
      message: `Score ${rule.score} outside typical range [0, 1]`,
      ruleId: rule.id,
    });
  }
  
  // Validate transform if present
  if (rule.transform) {
    const validTransforms = ['trim', 'lowercase', 'url-clean'];
    if (!validTransforms.includes(rule.transform)) {
      errors.push({
        type: 'warning',
        message: `Unknown transform: ${rule.transform}`,
        ruleId: rule.id,
        location: 'transform',
      });
    }
  }
  
  return errors;
}

/**
 * Validate a CSS selector
 * Returns error message if invalid, undefined if valid
 */
function validateCssSelector(selector: string): string | undefined {
  if (!selector || selector.trim() === '') {
    return 'Selector is empty';
  }
  
  try {
    // Try to use the selector on a dummy element
    const testDiv = document.createElement('div');
    testDiv.querySelector(selector);
    return undefined; // Valid
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Invalid selector';
  }
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ConfigValidationResult): string {
  const lines: string[] = [];
  
  if (result.valid) {
    lines.push('✓ Configuration is valid');
  } else {
    lines.push('✗ Configuration has errors');
  }
  
  if (result.errors.length > 0) {
    lines.push(`\n${result.errors.length} error(s):`);
    for (const error of result.errors) {
      let line = `  - ${error.message}`;
      if (error.ruleId) line += ` (rule: ${error.ruleId})`;
      if (error.location) line += ` [${error.location}]`;
      lines.push(line);
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push(`\n${result.warnings.length} warning(s):`);
    for (const warning of result.warnings) {
      let line = `  - ${warning.message}`;
      if (warning.ruleId) line += ` (rule: ${warning.ruleId})`;
      if (warning.location) line += ` [${warning.location}]`;
      lines.push(line);
    }
  }
  
  return lines.join('\n');
}

