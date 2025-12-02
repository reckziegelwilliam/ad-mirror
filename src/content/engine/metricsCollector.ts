/**
 * Selector Performance Metrics Collector
 * Tracks how well selectors perform over time
 */

export interface SelectorPerformanceMetrics {
  ruleId: string;
  ruleType: 'container' | 'field';
  timesMatched: number;
  timesValidated: number;      // For containers: passed validation
  averageConfidence: number;
  lastUsed: number;             // Timestamp
  successRate: number;          // timesValidated / timesMatched
}

export interface MetricsSnapshot {
  timestamp: number;
  platform: string;
  totalDetections: number;
  metrics: SelectorPerformanceMetrics[];
}

/**
 * Collects and manages selector performance metrics
 */
export class SelectorMetricsCollector {
  private metrics: Map<string, SelectorPerformanceMetrics> = new Map();
  private maxStoredDetections = 1000;
  private storageKey = 'ad-mirror-selector-metrics';
  
  constructor() {
    this.loadFromStorage();
  }
  
  /**
   * Record a container rule match
   */
  recordContainerMatch(ruleId: string, validated: boolean, confidence: number): void {
    const metric = this.getOrCreateMetric(ruleId, 'container');
    
    metric.timesMatched++;
    if (validated) {
      metric.timesValidated++;
    }
    
    // Update rolling average confidence
    metric.averageConfidence = 
      (metric.averageConfidence * (metric.timesMatched - 1) + confidence) / 
      metric.timesMatched;
    
    metric.lastUsed = Date.now();
    metric.successRate = metric.timesMatched > 0 
      ? metric.timesValidated / metric.timesMatched 
      : 0;
    
    this.metrics.set(ruleId, metric);
    this.saveToStorage();
  }
  
  /**
   * Record a field rule match
   */
  recordFieldMatch(ruleId: string, found: boolean, score: number): void {
    const metric = this.getOrCreateMetric(ruleId, 'field');
    
    metric.timesMatched++;
    if (found) {
      metric.timesValidated++;
    }
    
    // For field rules, use score as confidence
    metric.averageConfidence = 
      (metric.averageConfidence * (metric.timesMatched - 1) + score) / 
      metric.timesMatched;
    
    metric.lastUsed = Date.now();
    metric.successRate = metric.timesMatched > 0 
      ? metric.timesValidated / metric.timesMatched 
      : 0;
    
    this.metrics.set(ruleId, metric);
    this.saveToStorage();
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): SelectorPerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Get metrics for a specific rule
   */
  getMetric(ruleId: string): SelectorPerformanceMetrics | undefined {
    return this.metrics.get(ruleId);
  }
  
  /**
   * Identify rules performing below threshold
   */
  getProblematicRules(successRateThreshold: number = 0.5): SelectorPerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => 
        m.successRate < successRateThreshold && 
        m.timesMatched >= 10 // Only consider rules with enough data
      )
      .sort((a, b) => a.successRate - b.successRate);
  }
  
  /**
   * Get top performing rules
   */
  getTopRules(limit: number = 10): SelectorPerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.timesMatched >= 5)
      .sort((a, b) => {
        // Sort by success rate, then by average confidence
        if (Math.abs(a.successRate - b.successRate) > 0.1) {
          return b.successRate - a.successRate;
        }
        return b.averageConfidence - a.averageConfidence;
      })
      .slice(0, limit);
  }
  
  /**
   * Get recently unused rules (potential candidates for removal)
   */
  getStaleRules(daysSinceLastUse: number = 30): SelectorPerformanceMetrics[] {
    const threshold = Date.now() - (daysSinceLastUse * 24 * 60 * 60 * 1000);
    
    return Array.from(this.metrics.values())
      .filter(m => m.lastUsed < threshold && m.timesMatched < 5);
  }
  
  /**
   * Export metrics as JSON
   */
  exportMetrics(platform?: string): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      platform: platform || 'all',
      totalDetections: Array.from(this.metrics.values())
        .reduce((sum, m) => sum + m.timesMatched, 0),
      metrics: this.getMetrics(),
    };
  }
  
  /**
   * Import metrics from JSON
   */
  importMetrics(snapshot: MetricsSnapshot): void {
    for (const metric of snapshot.metrics) {
      this.metrics.set(metric.ruleId, metric);
    }
    this.saveToStorage();
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.saveToStorage();
  }
  
  /**
   * Prune old metrics to prevent unbounded growth
   */
  pruneMetrics(): void {
    const allMetrics = Array.from(this.metrics.values());
    
    // Keep only the most recent or most used metrics
    if (allMetrics.length > this.maxStoredDetections) {
      const sorted = allMetrics.sort((a, b) => {
        // Prioritize: high usage > recent use
        if (Math.abs(a.timesMatched - b.timesMatched) > 10) {
          return b.timesMatched - a.timesMatched;
        }
        return b.lastUsed - a.lastUsed;
      });
      
      // Keep top metrics
      this.metrics.clear();
      for (const metric of sorted.slice(0, this.maxStoredDetections)) {
        this.metrics.set(metric.ruleId, metric);
      }
      
      this.saveToStorage();
    }
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    totalRules: number;
    totalMatches: number;
    avgSuccessRate: number;
    avgConfidence: number;
    problematicRulesCount: number;
  } {
    const allMetrics = this.getMetrics();
    
    if (allMetrics.length === 0) {
      return {
        totalRules: 0,
        totalMatches: 0,
        avgSuccessRate: 0,
        avgConfidence: 0,
        problematicRulesCount: 0,
      };
    }
    
    const totalMatches = allMetrics.reduce((sum, m) => sum + m.timesMatched, 0);
    const avgSuccessRate = allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length;
    const avgConfidence = allMetrics.reduce((sum, m) => sum + m.averageConfidence, 0) / allMetrics.length;
    const problematicRulesCount = this.getProblematicRules().length;
    
    return {
      totalRules: allMetrics.length,
      totalMatches,
      avgSuccessRate,
      avgConfidence,
      problematicRulesCount,
    };
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  private getOrCreateMetric(ruleId: string, ruleType: 'container' | 'field'): SelectorPerformanceMetrics {
    const existing = this.metrics.get(ruleId);
    
    if (existing) {
      return existing;
    }
    
    const newMetric: SelectorPerformanceMetrics = {
      ruleId,
      ruleType,
      timesMatched: 0,
      timesValidated: 0,
      averageConfidence: 0,
      lastUsed: Date.now(),
      successRate: 0,
    };
    
    return newMetric;
  }
  
  private saveToStorage(): void {
    try {
      const data = this.exportMetrics();
      chrome.storage.local.set({ [this.storageKey]: data });
      
      // Prune periodically
      if (Math.random() < 0.1) { // 10% chance on each save
        this.pruneMetrics();
      }
    } catch (error) {
      console.error('[Metrics] Failed to save to storage:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      chrome.storage.local.get(this.storageKey, (result) => {
        const data = result[this.storageKey] as MetricsSnapshot | undefined;
        
        if (data && data.metrics) {
          for (const metric of data.metrics) {
            this.metrics.set(metric.ruleId, metric);
          }
        }
      });
    } catch (error) {
      console.error('[Metrics] Failed to load from storage:', error);
    }
  }
}

// Global singleton instance
let globalCollector: SelectorMetricsCollector | null = null;

/**
 * Get the global metrics collector instance
 */
export function getMetricsCollector(): SelectorMetricsCollector {
  if (!globalCollector) {
    globalCollector = new SelectorMetricsCollector();
  }
  return globalCollector;
}

