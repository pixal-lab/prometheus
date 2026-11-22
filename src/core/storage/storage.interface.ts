export interface IStorageAdapter {
  getItem<T>(key: string, defaultValue?: T): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<boolean>;
  removeItem(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
}

