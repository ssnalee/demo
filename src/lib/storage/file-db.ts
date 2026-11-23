/**
 * 큰 파일(근로자 신분증·통장 사본 등)을 담는 IndexedDB 저장소.
 * 원본과 같은 DB 이름(constructionSafetyFiles)·스토어(files)를 사용합니다.
 * 키 예: `worker:<workerId>:idcard`, `worker:<workerId>:bank`
 */
const DB_NAME = "constructionSafetyFiles";
const STORE = "files";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE);
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => {
        dbPromise = null;
        reject(r.error);
      };
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    let out: T;
    if (req) req.onsuccess = () => (out = req.result as T);
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
  });
}

export const FileDB = {
  get: <T = string>(key: string) => run<T | undefined>("readonly", (st) => st.get(key)),
  async put(key: string, value: unknown) {
    await run("readwrite", (st) => st.put(value, key));
  },
  async del(key: string) {
    await run("readwrite", (st) => st.delete(key));
  },
};
