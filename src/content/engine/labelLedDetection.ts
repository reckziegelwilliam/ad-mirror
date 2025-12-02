/**
 * Label-led container detection
 * 
 * This strategy finds ad containers by:
 * 1. Searching for text nodes containing ad labels ("Promoted", "Sponsored", etc.)
 * 2. Walking up the DOM to find the container element
 * 3. More robust than pure CSS selectors when layouts change
 */

import { ContainerRule, ContainerMatch } from '../../shared/types/detection';

export interface LabelLedOptions {
  labelTexts: string[];           // Text patterns to search for
  containerSelector?: string;     // closest() selector for container
  scopeSelector?: string;         // Only search within this scope
  maxDepth?: number;              // Max levels to walk up (default: 10)
}

/**
 * Find ad containers using label-led detection
 */
export function findContainersByLabel(
  rule: ContainerRule,
  document: Document = window.document
): ContainerMatch[] {
  if (rule.type !== 'label-led' || !rule.labelTexts || rule.labelTexts.length === 0) {
    console.warn('Invalid label-led rule:', rule);
    return [];
  }
  
  const matches: ContainerMatch[] = [];
  const seenContainers = new Set<HTMLElement>();
  
  const scope = rule.scopeSelector 
    ? document.querySelector(rule.scopeSelector) 
    : document.body;
    
  if (!scope) {
    console.warn(`Scope selector not found: ${rule.scopeSelector}`);
    return [];
  }
  
  // Find all text nodes containing label patterns with proximity scoring
  const labelResults = findLabelElements(scope, rule.labelTexts);
  
  console.log(`[Label-Led] Found ${labelResults.length} label candidates for rule ${rule.id}`);
  
  // For each label, walk up to find container
  for (const {element: labelEl, confidence: labelConfidence, labelElement} of labelResults) {
    const container = findContainerFromLabel(
      labelEl,
      rule.containerSelector,
      10 // maxDepth
    );
    
    if (container && !seenContainers.has(container)) {
      seenContainers.add(container);
      
      // v2.1: Include proximity confidence and label element
      matches.push({
        container,
        ruleId: rule.id,
        ruleType: 'label-led',
        score: rule.score * labelConfidence, // Adjust score by label confidence
        matchedAt: Date.now(),
        labelElement,              // Store for context-aware extraction
        labelConfidence,
      });
    }
  }
  
  console.log(`[Label-Led] Rule ${rule.id} matched ${matches.length} unique containers`);
  
  return matches;
}

/**
 * Find all elements containing label text with proximity scoring
 */
function findLabelElements(root: Element, labelTexts: string[]): Array<{element: Element; confidence: number; labelElement: Element}> {
  const results: Array<{element: Element; confidence: number; labelElement: Element}> = [];
  
  // Common elements that contain text
  const textElements = root.querySelectorAll(
    'span, div, p, a, button, label, h1, h2, h3, h4, h5, h6'
  );
  
  for (const element of textElements) {
    const text = element.textContent?.trim() || '';
    
    // Check if text matches any label pattern
    for (const labelText of labelTexts) {
      // Create a regex that matches the label as a whole word
      const pattern = new RegExp(`\\b${escapeRegex(labelText)}\\b`, 'i');
      
      if (pattern.test(text)) {
        // v2.1: Calculate proximity confidence
        const directText = getDirectText(element);
        let confidence = 0.7; // Base confidence
        let labelElement = element;
        
        if (pattern.test(directText)) {
          // Direct text match - highest confidence
          confidence = 1.0;
          labelElement = element;
        } else {
          // Text in child - calculate depth-based confidence
          const depth = getTextDepth(element, labelText);
          if (depth <= 2) {
            confidence = 0.9; // Immediate child
            labelElement = findLabelChild(element, labelText) || element;
          } else if (depth <= 4) {
            confidence = 0.8; // Nested child
            labelElement = findLabelChild(element, labelText) || element;
          } else {
            confidence = 0.7; // Deep nesting
            labelElement = findLabelChild(element, labelText) || element;
          }
        }
        
        results.push({element, confidence, labelElement});
        break; // Don't check other patterns for this element
      }
    }
  }
  
  return results;
}

/**
 * Get depth of text match within element tree
 */
function getTextDepth(element: Element, searchText: string): number {
  const pattern = new RegExp(escapeRegex(searchText), 'i');
  
  function traverse(el: Element, currentDepth: number): number {
    if (pattern.test(getDirectText(el))) {
      return currentDepth;
    }
    
    let minDepth = Infinity;
    for (const child of el.children) {
      const childDepth = traverse(child, currentDepth + 1);
      minDepth = Math.min(minDepth, childDepth);
    }
    
    return minDepth;
  }
  
  return traverse(element, 0);
}

/**
 * Find the child element containing the label text
 */
function findLabelChild(parent: Element, searchText: string): Element | null {
  const pattern = new RegExp(escapeRegex(searchText), 'i');
  
  function search(el: Element): Element | null {
    if (pattern.test(getDirectText(el))) {
      return el;
    }
    
    for (const child of el.children) {
      const found = search(child);
      if (found) return found;
    }
    
    return null;
  }
  
  return search(parent);
}

/**
 * Get text directly within an element (not from child elements)
 */
function getDirectText(element: Element): string {
  let text = '';
  
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  
  return text.trim();
}

/**
 * Walk up from label element to find the container
 */
function findContainerFromLabel(
  labelElement: Element,
  containerSelector: string | undefined,
  maxDepth: number
): HTMLElement | null {
  // If we have a specific container selector, use closest()
  if (containerSelector) {
    const container = labelElement.closest(containerSelector);
    return container as HTMLElement | null;
  }
  
  // Otherwise, walk up until we find a reasonable container
  // (article, section, or div with certain characteristics)
  let current: Element | null = labelElement;
  let depth = 0;
  
  while (current && depth < maxDepth) {
    // Check if this is a good container candidate
    if (isLikelyAdContainer(current as HTMLElement)) {
      return current as HTMLElement;
    }
    
    current = current.parentElement;
    depth++;
  }
  
  return null;
}

/**
 * Heuristic to determine if an element is likely an ad container
 */
function isLikelyAdContainer(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  
  // Explicit container elements
  if (tagName === 'article' || tagName === 'section') {
    return true;
  }
  
  // Divs with certain attributes that suggest they're containers
  if (tagName === 'div') {
    const attrs = [
      'data-testid',
      'data-ad',
      'data-post',
      'data-item',
      'data-card',
      'role',
      'id',
    ];
    
    for (const attr of attrs) {
      if (element.hasAttribute(attr)) {
        return true;
      }
    }
    
    // Check if it has a reasonable number of children (not just a wrapper)
    const childElements = Array.from(element.children).filter(
      (child) => child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE'
    );
    
    if (childElements.length >= 2 && childElements.length <= 20) {
      return true;
    }
  }
  
  return false;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Enhanced label-led detection with multiple strategies
 */
export function findContainersByLabelAdvanced(
  rule: ContainerRule,
  document: Document = window.document
): ContainerMatch[] {
  const matches: ContainerMatch[] = [];
  const seenContainers = new Set<HTMLElement>();
  
  if (rule.type !== 'label-led' || !rule.labelTexts) {
    return [];
  }
  
  // Strategy 1: Direct text match in common elements
  const directMatches = findContainersByLabel(rule, document);
  for (const match of directMatches) {
    if (!seenContainers.has(match.container)) {
      seenContainers.add(match.container);
      matches.push(match);
    }
  }
  
  // Strategy 2: Check aria-label attributes
  for (const labelText of rule.labelTexts) {
    const pattern = new RegExp(escapeRegex(labelText), 'i');
    const ariaElements = document.querySelectorAll('[aria-label]');
    
    for (const element of ariaElements) {
      const ariaLabel = element.getAttribute('aria-label') || '';
      
      if (pattern.test(ariaLabel)) {
        const container = rule.containerSelector
          ? (element.closest(rule.containerSelector) as HTMLElement)
          : (element as HTMLElement);
          
        if (container && !seenContainers.has(container)) {
          seenContainers.add(container);
          matches.push({
            container,
            ruleId: `${rule.id}-aria`,
            ruleType: 'label-led',
            score: rule.score * 0.95, // Slightly lower confidence for aria-label
            matchedAt: Date.now(),
          });
        }
      }
    }
  }
  
  return matches;
}

