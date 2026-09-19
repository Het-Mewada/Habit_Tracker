'use client';

import React, { useState, useEffect } from 'react';
import { InsightsView } from '@/components/insights/InsightsView';
import { StructuredAiInsight } from '@/lib/ai/heuristic';

export default function InsightsPage() {
  const [insight, setInsight] = useState<StructuredAiInsight | null>(null);
  const [isCached, setIsCached] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCachedInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/insights');
      const data = await res.json();
      if (res.ok) {
        setInsight(data.insight || null);
        setIsCached(Boolean(data.isCached));
      }
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshInsights = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/insights', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setInsight(data.insight || null);
        setIsCached(Boolean(data.isCached));
      }
    } catch (err) {
      console.error('Failed to refresh insights:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCachedInsights();
  }, []);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="p-16 text-center text-slate-400 animate-pulse font-medium">
          Loading AI insights from cache...
        </div>
      ) : (
        <InsightsView
          insight={insight}
          isCached={isCached}
          onRefresh={handleRefreshInsights}
          isLoading={isRefreshing}
        />
      )}
    </div>
  );
}
