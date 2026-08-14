export type Promised<T> = T extends Promise<infer R> ? R : never;
