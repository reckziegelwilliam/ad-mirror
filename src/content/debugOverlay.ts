/**
 * Enhanced Debug Overlay for Ad Detection
 * 
 * Production-ready diagnostic tool showing:
 * - Matched container rules with scores
 * - Extracted fields with confidence
 * - Color-coded highlights by confidence
 * - Validation details and failure reasons
 * - Interactive detail view on click
 */

import { DetectionDebugInfo } from '../shared/types/detection';
import { generateDebugInfo } from './engine/detector';

let debugEnabled = false;
let currentPlatform: string = '';
let highlightedContainers: Map<HTMLElement, DebugHighlight> = new Map();
let debugConsole: HTMLElement | null = null;
let detailPanel: HTMLElement | null = null;
let platformConfig: any = null;

interface DebugHighlight {
  container: HTMLElement;
  outline: HTMLElement;
  label: HTMLElement;
  tooltip: HTMLElement | null;
  debugInfo: DetectionDebugInfo;
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ENABLE_DEBUG') {
    toggleDebugOverlay(true, msg.platform, msg.config);
  } else if (msg.type === 'DISABLE_DEBUG') {
    toggleDebugOverlay(false);
  }
});

export function toggleDebugOverlay(enabled: boolean, platform?: string, config?: any) {
  debugEnabled = enabled;
  currentPlatform = platform || window.location.hostname;
  platformConfig = config;
  
  if (enabled) {
    console.log(`[Debug Overlay v2] Enabled for ${currentPlatform}`);
    injectDebugStyles();
    createDebugConsole();
    startHighlighting();
  } else {
    console.log('[Debug Overlay v2] Disabled');
    cleanup();
  }
}

// ============================================================================
// STYLES
// ============================================================================

function injectDebugStyles() {
  if (document.getElementById('ad-mirror-debug-styles-v2')) return;
  
  const style = document.createElement('style');
  style.id = 'ad-mirror-debug-styles-v2';
  style.textContent = `
    /* Container highlights - color-coded by confidence */
    .ad-mirror-highlight-high {
      outline: 3px solid #22c55e !important;
      outline-offset: 2px !important;
      background-color: rgba(34, 197, 94, 0.05) !important;
      position: relative !important;
    }
    
    .ad-mirror-highlight-medium {
      outline: 3px solid #eab308 !important;
      outline-offset: 2px !important;
      background-color: rgba(234, 179, 8, 0.05) !important;
      position: relative !important;
    }
    
    .ad-mirror-highlight-low {
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
      background-color: rgba(239, 68, 68, 0.05) !important;
      position: relative !important;
    }
    
    /* Confidence label */
    .ad-mirror-label {
      position: absolute !important;
      top: -28px !important;
      left: 0 !important;
      padding: 4px 10px !important;
      font-size: 11px !important;
      font-weight: bold !important;
      font-family: 'SF Mono', Monaco, monospace !important;
      border-radius: 4px !important;
      z-index: 999999 !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
      white-space: nowrap !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
    }
    
    .ad-mirror-label:hover {
      transform: scale(1.05) !important;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3) !important;
    }
    
    .ad-mirror-label-high {
      background: #22c55e !important;
      color: white !important;
    }
    
    .ad-mirror-label-medium {
      background: #eab308 !important;
      color: #1f2937 !important;
    }
    
    .ad-mirror-label-low {
      background: #ef4444 !important;
      color: white !important;
    }
    
    /* Quick tooltip on hover */
    .ad-mirror-tooltip {
      position: absolute !important;
      top: 4px !important;
      right: 4px !important;
      background: rgba(0, 0, 0, 0.92) !important;
      color: #4ade80 !important;
      padding: 10px !important;
      font-size: 11px !important;
      font-family: 'SF Mono', Monaco, monospace !important;
      border-radius: 6px !important;
      z-index: 999998 !important;
      max-width: 350px !important;
      line-height: 1.5 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transition: opacity 0.2s !important;
    }
    
    .ad-mirror-highlight-high:hover .ad-mirror-tooltip,
    .ad-mirror-highlight-medium:hover .ad-mirror-tooltip,
    .ad-mirror-highlight-low:hover .ad-mirror-tooltip {
      opacity: 1 !important;
    }
    
    .ad-mirror-tooltip-field {
      margin: 3px 0 !important;
      color: #93c5fd !important;
    }
    
    .ad-mirror-tooltip-value {
      color: #d1d5db !important;
      margin-left: 8px !important;
    }
    
    /* Debug console */
    .ad-mirror-console {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      background: rgba(0, 0, 0, 0.95) !important;
      color: #4ade80 !important;
      padding: 16px !important;
      font-size: 12px !important;
      font-family: 'SF Mono', Monaco, monospace !important;
      border-radius: 8px !important;
      z-index: 1000000 !important;
      min-width: 300px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
      border: 1px solid #22c55e !important;
    }
    
    .ad-mirror-console-header {
      font-weight: bold !important;
      font-size: 14px !important;
      margin-bottom: 12px !important;
      padding-bottom: 10px !important;
      border-bottom: 2px solid #22c55e !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    
    .ad-mirror-console-close {
      cursor: pointer !important;
      color: #ef4444 !important;
      font-size: 16px !important;
      padding: 2px 6px !important;
      border-radius: 3px !important;
      transition: background 0.2s !important;
    }
    
    .ad-mirror-console-close:hover {
      background: rgba(239, 68, 68, 0.2) !important;
    }
    
    .ad-mirror-console-stat {
      margin: 6px 0 !important;
      display: flex !important;
      justify-content: space-between !important;
    }
    
    .ad-mirror-console-label {
      color: #93c5fd !important;
    }
    
    .ad-mirror-console-value {
      color: #fbbf24 !important;
      font-weight: bold !important;
    }
    
    /* Detail panel */
    .ad-mirror-detail-panel {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: rgba(17, 24, 39, 0.98) !important;
      color: #e5e7eb !important;
      padding: 24px !important;
      font-size: 12px !important;
      font-family: 'SF Mono', Monaco, monospace !important;
      border-radius: 12px !important;
      z-index: 1000001 !important;
      max-width: 700px !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
      border: 2px solid #22c55e !important;
    }
    
    .ad-mirror-detail-header {
      font-size: 16px !important;
      font-weight: bold !important;
      margin-bottom: 16px !important;
      padding-bottom: 12px !important;
      border-bottom: 2px solid #374151 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      color: #22c55e !important;
    }
    
    .ad-mirror-detail-close {
      cursor: pointer !important;
      color: #ef4444 !important;
      font-size: 20px !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      transition: background 0.2s !important;
    }
    
    .ad-mirror-detail-close:hover {
      background: rgba(239, 68, 68, 0.2) !important;
    }
    
    .ad-mirror-detail-section {
      margin: 20px 0 !important;
    }
    
    .ad-mirror-detail-section-title {
      font-size: 13px !important;
      font-weight: bold !important;
      color: #60a5fa !important;
      margin-bottom: 10px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
    }
    
    .ad-mirror-detail-item {
      margin: 8px 0 !important;
      padding: 8px !important;
      background: rgba(55, 65, 81, 0.5) !important;
      border-radius: 4px !important;
      border-left: 3px solid #6b7280 !important;
    }
    
    .ad-mirror-detail-item-matched {
      border-left-color: #22c55e !important;
    }
    
    .ad-mirror-detail-item-failed {
      border-left-color: #ef4444 !important;
    }
    
    .ad-mirror-detail-field {
      color: #93c5fd !important;
      font-weight: bold !important;
    }
    
    .ad-mirror-detail-value {
      color: #d1d5db !important;
      margin-left: 8px !important;
      word-break: break-word !important;
    }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// DEBUG CONSOLE
// ============================================================================

function createDebugConsole() {
  if (debugConsole) return;
  
  debugConsole = document.createElement('div');
  debugConsole.className = 'ad-mirror-console';
  debugConsole.innerHTML = `
    <div class="ad-mirror-console-header">
      <span>🔍 Ad Mirror Debug v2</span>
      <span class="ad-mirror-console-close" id="ad-mirror-close-v2">✕</span>
    </div>
    <div class="ad-mirror-console-stat">
      <span class="ad-mirror-console-label">Platform:</span>
      <span class="ad-mirror-console-value" id="ad-mirror-platform-v2">${currentPlatform}</span>
    </div>
    <div class="ad-mirror-console-stat">
      <span class="ad-mirror-console-label">Detected Ads:</span>
      <span class="ad-mirror-console-value" id="ad-mirror-count-v2">0</span>
    </div>
    <div class="ad-mirror-console-stat">
      <span class="ad-mirror-console-label">High Confidence:</span>
      <span class="ad-mirror-console-value" style="color: #22c55e !important" id="ad-mirror-high-v2">0</span>
    </div>
    <div class="ad-mirror-console-stat">
      <span class="ad-mirror-console-label">Medium Confidence:</span>
      <span class="ad-mirror-console-value" style="color: #eab308 !important" id="ad-mirror-medium-v2">0</span>
    </div>
    <div class="ad-mirror-console-stat">
      <span class="ad-mirror-console-label">Low Confidence:</span>
      <span class="ad-mirror-console-value" style="color: #ef4444 !important" id="ad-mirror-low-v2">0</span>
    </div>
  `;
  
  document.body.appendChild(debugConsole);
  
  document.getElementById('ad-mirror-close-v2')?.addEventListener('click', () => {
    toggleDebugOverlay(false);
  });
}

function updateConsoleStats() {
  if (!debugConsole) return;
  
  let high = 0, medium = 0, low = 0;
  
  for (const highlight of highlightedContainers.values()) {
    const confidence = highlight.debugInfo.overallConfidence;
    if (confidence >= 0.8) high++;
    else if (confidence >= 0.6) medium++;
    else low++;
  }
  
  const countEl = document.getElementById('ad-mirror-count-v2');
  const highEl = document.getElementById('ad-mirror-high-v2');
  const mediumEl = document.getElementById('ad-mirror-medium-v2');
  const lowEl = document.getElementById('ad-mirror-low-v2');
  
  if (countEl) countEl.textContent = String(highlightedContainers.size);
  if (highEl) highEl.textContent = String(high);
  if (mediumEl) mediumEl.textContent = String(medium);
  if (lowEl) lowEl.textContent = String(low);
}

// ============================================================================
// HIGHLIGHTING
// ============================================================================

function startHighlighting() {
  // Watch for new ad containers
  const observer = new MutationObserver(() => {
    if (platformConfig) {
      scanForAds();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial scan
  if (platformConfig) {
    scanForAds();
  }
}

function scanForAds() {
  // Find elements that look like ads
  const candidates = document.querySelectorAll(
    'article, div[data-testid], div[role="article"], section, div[data-ad], [data-promoted]'
  );
  
  for (const element of candidates) {
    if (highlightedContainers.has(element as HTMLElement)) continue;
    
    // Check if this looks like an ad
    const text = element.textContent || '';
    if (/\b(promoted|sponsored|ad)\b/i.test(text)) {
      highlightContainer(element as HTMLElement);
    }
  }
}

function highlightContainer(container: HTMLElement) {
  if (!platformConfig) return;
  
  try {
    // Generate detailed debug info
    const debugInfo = generateDebugInfo(container, platformConfig);
    
    // Determine confidence level
    const confidence = debugInfo.overallConfidence;
    let level: 'high' | 'medium' | 'low';
    if (confidence >= 0.8) level = 'high';
    else if (confidence >= 0.6) level = 'medium';
    else level = 'low';
    
    // Add highlight class
    container.classList.add(`ad-mirror-highlight-${level}`);
    
    // Create label
    const label = document.createElement('div');
    label.className = `ad-mirror-label ad-mirror-label-${level}`;
    label.textContent = `${(confidence * 100).toFixed(0)}% • ${debugInfo.containerRules.find(r => r.matched)?.ruleId || 'unknown'}`;
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      showDetailPanel(container, debugInfo);
    });
    
    // Create tooltip
    const tooltip = createTooltip(debugInfo);
    
    // Ensure container is positioned
    const position = getComputedStyle(container).position;
    if (position === 'static') {
      container.style.position = 'relative';
    }
    
    container.appendChild(label);
    container.appendChild(tooltip);
    
    // Store highlight info
    highlightedContainers.set(container, {
      container,
      outline: container,
      label,
      tooltip,
      debugInfo,
    });
    
    updateConsoleStats();
    
  } catch (error) {
    console.error('[Debug Overlay v2] Error highlighting container:', error);
  }
}

function createTooltip(debugInfo: DetectionDebugInfo): HTMLElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'ad-mirror-tooltip';
  
  const fields: string[] = [];
  
  for (const attempt of debugInfo.fieldAttempts) {
    if (attempt.finalValue) {
      const value = String(attempt.finalValue).substring(0, 50);
      fields.push(`
        <div class="ad-mirror-tooltip-field">
          ${attempt.field}:<span class="ad-mirror-tooltip-value">${value}${value.length >= 50 ? '...' : ''}</span>
        </div>
      `);
    }
  }
  
  tooltip.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 6px; color: #fbbf24 !important;">
      Confidence: ${(debugInfo.overallConfidence * 100).toFixed(1)}%
    </div>
    ${fields.join('')}
    <div style="margin-top: 8px; color: #9ca3af !important; font-size: 10px !important;">
      Click label for details
    </div>
  `;
  
  return tooltip;
}

// ============================================================================
// DETAIL PANEL
// ============================================================================

function showDetailPanel(container: HTMLElement, debugInfo: DetectionDebugInfo) {
  // Remove existing panel
  if (detailPanel) {
    detailPanel.remove();
  }
  
  detailPanel = document.createElement('div');
  detailPanel.className = 'ad-mirror-detail-panel';
  
  // Build content
  let html = `
    <div class="ad-mirror-detail-header">
      <span>Detection Details</span>
      <span class="ad-mirror-detail-close" id="ad-mirror-detail-close-v2">✕</span>
    </div>
  `;
  
  // Container Rules
  html += `
    <div class="ad-mirror-detail-section">
      <div class="ad-mirror-detail-section-title">Container Rules</div>
  `;
  
  for (const rule of debugInfo.containerRules) {
    const itemClass = rule.matched ? 'ad-mirror-detail-item-matched' : 'ad-mirror-detail-item-failed';
    html += `
      <div class="ad-mirror-detail-item ${itemClass}">
        <div>
          <span class="ad-mirror-detail-field">Rule:</span>
          <span class="ad-mirror-detail-value">${rule.ruleId}</span>
        </div>
        <div>
          <span class="ad-mirror-detail-field">Matched:</span>
          <span class="ad-mirror-detail-value">${rule.matched ? '✓ Yes' : '✗ No'}</span>
        </div>
        ${rule.score !== undefined ? `
          <div>
            <span class="ad-mirror-detail-field">Score:</span>
            <span class="ad-mirror-detail-value">${rule.score}</span>
          </div>
        ` : ''}
        ${rule.selector ? `
          <div>
            <span class="ad-mirror-detail-field">Selector:</span>
            <span class="ad-mirror-detail-value">${rule.selector}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  html += `</div>`;
  
  // Field Extraction
  html += `
    <div class="ad-mirror-detail-section">
      <div class="ad-mirror-detail-section-title">Field Extraction</div>
  `;
  
  for (const fieldAttempt of debugInfo.fieldAttempts) {
    const hasValue = Boolean(fieldAttempt.finalValue);
    const itemClass = hasValue ? 'ad-mirror-detail-item-matched' : 'ad-mirror-detail-item-failed';
    
    html += `
      <div class="ad-mirror-detail-item ${itemClass}">
        <div>
          <span class="ad-mirror-detail-field">Field:</span>
          <span class="ad-mirror-detail-value">${fieldAttempt.field}</span>
        </div>
        ${fieldAttempt.finalValue ? `
          <div>
            <span class="ad-mirror-detail-field">Value:</span>
            <span class="ad-mirror-detail-value">${String(fieldAttempt.finalValue).substring(0, 100)}</span>
          </div>
        ` : ''}
        <div style="margin-top: 6px; font-size: 11px; color: #9ca3af !important;">
          Attempts: ${fieldAttempt.attempts.map(a => a.found ? '✓' : '✗').join(' ')}
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  // Validation
  html += `
    <div class="ad-mirror-detail-section">
      <div class="ad-mirror-detail-section-title">Validation</div>
  `;
  
  for (const validation of debugInfo.validationDetails) {
    const itemClass = validation.passed ? 'ad-mirror-detail-item-matched' : 'ad-mirror-detail-item-failed';
    html += `
      <div class="ad-mirror-detail-item ${itemClass}">
        <div>
          <span class="ad-mirror-detail-field">Validator:</span>
          <span class="ad-mirror-detail-value">${validation.validator}</span>
        </div>
        <div>
          <span class="ad-mirror-detail-field">Result:</span>
          <span class="ad-mirror-detail-value">${validation.passed ? '✓ Passed' : '✗ Failed'}</span>
        </div>
        <div>
          <span class="ad-mirror-detail-field">Message:</span>
          <span class="ad-mirror-detail-value">${validation.message}</span>
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  // Overall Result
  html += `
    <div class="ad-mirror-detail-section">
      <div class="ad-mirror-detail-section-title">Overall Result</div>
      <div class="ad-mirror-detail-item">
        <div>
          <span class="ad-mirror-detail-field">Confidence:</span>
          <span class="ad-mirror-detail-value" style="font-size: 16px !important; color: ${debugInfo.overallConfidence >= 0.8 ? '#22c55e' : debugInfo.overallConfidence >= 0.6 ? '#eab308' : '#ef4444'} !important;">
            ${(debugInfo.overallConfidence * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span class="ad-mirror-detail-field">Accepted:</span>
          <span class="ad-mirror-detail-value">${debugInfo.accepted ? '✓ Yes' : '✗ No'}</span>
        </div>
      </div>
    </div>
  `;
  
  detailPanel.innerHTML = html;
  document.body.appendChild(detailPanel);
  
  // Close button
  document.getElementById('ad-mirror-detail-close-v2')?.addEventListener('click', () => {
    detailPanel?.remove();
    detailPanel = null;
  });
  
  // Click outside to close
  detailPanel.addEventListener('click', (e) => {
    if (e.target === detailPanel) {
      detailPanel?.remove();
      detailPanel = null;
    }
  });
}

// ============================================================================
// CLEANUP
// ============================================================================

function cleanup() {
  // Remove highlights
  for (const [container, highlight] of highlightedContainers) {
    container.classList.remove('ad-mirror-highlight-high', 'ad-mirror-highlight-medium', 'ad-mirror-highlight-low');
    highlight.label.remove();
    highlight.tooltip?.remove();
  }
  
  highlightedContainers.clear();
  
  // Remove console
  debugConsole?.remove();
  debugConsole = null;
  
  // Remove detail panel
  detailPanel?.remove();
  detailPanel = null;
  
  // Remove styles
  document.getElementById('ad-mirror-debug-styles-v2')?.remove();
}

console.log('[Ad Mirror] Enhanced debug overlay v2 loaded');
