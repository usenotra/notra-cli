import { STOPPED_POST_PREVIEW_STATUSES } from '../constants/post-preview';
import type { WatchStatus } from '../types/api-command';
import type { PostPreviewSnapshot } from '../types/post-preview';

/** Done once the latest build is live; `live` alone can be the previous build. */
export function postPreviewWatchStatus(result: unknown): WatchStatus {
  const { preview } = result as PostPreviewSnapshot;
  if (!preview || preview.deleting || STOPPED_POST_PREVIEW_STATUSES.has(preview.status)) return 'failed';
  return preview.latestLive ? 'completed' : 'running';
}

export function describePostPreview(result: unknown): string {
  const { preview } = result as PostPreviewSnapshot;
  if (!preview) return 'No preview for this post on this Site';
  if (preview.latestLive) return 'Preview is live';
  return preview.errorMessage ? `Preview ${preview.status}: ${preview.errorMessage}` : `Preview ${preview.status}`;
}
