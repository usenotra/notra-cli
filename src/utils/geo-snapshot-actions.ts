import type { GeoSnapshotAction, GeoSnapshotSummary } from '../types/geo';

export function recommendGeoActions({ visibility, changes, contentGaps, sentiment, agentReadiness, traffic }: GeoSnapshotSummary): GeoSnapshotAction[] {
  const actions: GeoSnapshotAction[] = [];
  if (!visibility.configured) {
    actions.push({
      priority: 'high', action: 'configure_visibility',
      reason: 'The visibility analytics backend is not configured.',
    });
  } else if (visibility.checks === 0) {
    actions.push({
      priority: 'high', action: 'run_geo_scan',
      reason: 'No answer-engine checks exist in the selected window.',
    });
  } else if (visibility.mentionRate < 0.5) {
    actions.push({
      priority: 'medium', action: 'review_content_gaps',
      reason: `The aggregate mention rate is ${Math.round(visibility.mentionRate * 100)}%.`,
    });
  }
  if (changes && (changes.lost > 0 || changes.citationsRemoved > 0)) {
    actions.push({
      priority: 'high', action: 'investigate_visibility_losses',
      reason: `${changes.lost} mentions and ${changes.citationsRemoved} citations were lost since the previous scan.`,
    });
  }
  if (contentGaps && contentGaps.promptGapCount + contentGaps.searchGapCount > 0) {
    actions.push({
      priority: 'high', action: 'prioritize_content_gaps',
      reason: `${contentGaps.promptGapCount} prompt gaps and ${contentGaps.searchGapCount} search gaps are open.`,
    });
  }
  if (sentiment && sentiment.negativeShare !== null && sentiment.negativeShare >= 0.25) {
    actions.push({
      priority: 'medium', action: 'review_negative_sentiment',
      reason: `${Math.round(sentiment.negativeShare * 100)}% of classified mentions are negative.`,
    });
  }
  if (agentReadiness && agentReadiness.score !== null && agentReadiness.score < 80) {
    actions.push({
      priority: 'medium', action: 'fix_agent_readiness',
      reason: `The latest agent readiness score is ${agentReadiness.score}.`,
    });
  }
  if (traffic && !traffic.configured) {
    actions.push({
      priority: 'low', action: 'configure_ai_traffic',
      reason: 'AI traffic measurement is not configured.',
    });
  }
  return actions;
}
