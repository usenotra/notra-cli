export type PostPreviewSnapshot = {
  preview: {
    status: string;
    latestLive?: boolean;
    deleting: boolean;
    errorMessage: string | null;
  } | null;
};
