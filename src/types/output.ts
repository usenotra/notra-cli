export type TableColumn<T> = {
  header: string;
  get: (row: T) => string;
};

export type TableOptions<T> = {
  columns: ReadonlyArray<TableColumn<T>>;
  empty?: string;
};

export type KeyValueRow = readonly [label: string, value: string];
