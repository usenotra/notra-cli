export type CommentedPostsResponse = {
  posts: { postId: string; title: string; openThreads: number; lastCommentAt: string | null }[];
  hasMore?: boolean;
};

export type PostCommentsResponse = {
  threads: {
    id: string;
    quote: string | null;
    author: string;
    body: string;
    leftOn: 'preview' | 'editor';
    resolved: boolean;
    deleted: boolean;
    replies: { id: string; author: string; body: string }[];
  }[];
  openThreads: number;
};
