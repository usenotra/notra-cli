import chalk from 'chalk';
import { formatDate, renderTable, sanitizeTerminalText, shouldUseColor, truncate } from './output';
import type { CommentedPostsResponse, PostCommentsResponse } from '../types/comments';

const dim = (text: string) => (shouldUseColor() ? chalk.dim(text) : text);
const bold = (text: string) => (shouldUseColor() ? chalk.bold(text) : text);

export function renderCommentedPosts(result: unknown): string {
  const { posts } = result as CommentedPostsResponse;
  return renderTable(posts, {
    empty: dim('No posts with open comments.'),
    columns: [
      { header: 'Post ID', get: (post) => post.postId },
      { header: 'Title', get: (post) => truncate(post.title, 48) },
      { header: 'Open', get: (post) => String(post.openThreads) },
      { header: 'Last comment', get: (post) => formatDate(post.lastCommentAt) },
    ],
  });
}

/** Each thread: its quote, the comment, and its replies indented below. */
export function renderPostComments(result: unknown): string {
  const { threads, openThreads } = result as PostCommentsResponse;
  if (threads.length === 0) return dim('No comment threads.');
  const blocks = threads.map((thread) => {
    const lines = [
      `${bold(sanitizeTerminalText(thread.id))}${thread.resolved ? dim('  resolved') : ''}${dim(`  ${thread.leftOn}`)}`,
    ];
    if (thread.quote) lines.push(dim(`  “${truncate(thread.quote, 100)}”`));
    lines.push(
      thread.deleted
        ? dim('  (first comment deleted)')
        : `  ${sanitizeTerminalText(thread.author)}: ${sanitizeTerminalText(thread.body)}`,
    );
    for (const reply of thread.replies) {
      lines.push(`    ↳ ${sanitizeTerminalText(reply.author)}: ${sanitizeTerminalText(reply.body)}`);
    }
    return lines.join('\n');
  });
  return `${blocks.join('\n\n')}\n\n${dim(`${openThreads} open`)}`;
}
