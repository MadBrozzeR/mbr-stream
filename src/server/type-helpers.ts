export type Condition<T extends string | number = string, R extends boolean = true> = [R, T];

export type Merge<T> = {
  [K in keyof T]: T[K];
};

export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };
