(() => {
  'use strict';
  const prefix = 'learning-hub:double-slit:smart-v1:';
  let database;
  function db() {
    if (database) return database;
    database = new Promise((resolve) => {
      let request,
        settled = false;
      const finish = (value) => {
        if (settled) {
          value?.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 1800);
      try {
        request = indexedDB.open('learning-hub-double-slit', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('work'))
            request.result.createObjectStore('work');
        };
        request.onsuccess = () => finish(request.result);
        request.onerror = () => finish(null);
        request.onblocked = () => finish(null);
      } catch {
        finish(null);
      }
    });
    return database;
  }
  function mirror(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  function readMirror(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  }
  async function indexed(key, value) {
    const d = await db();
    if (!d) return false;
    return new Promise((resolve) => {
      try {
        const tx = d.transaction('work', 'readwrite');
        tx.objectStore('work').put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }
  function session(identity, onStatus) {
    const key = prefix + identity;
    let timer,
      pending = null,
      queue = Promise.resolve(),
      last = 0;
    const status = (local, idb) =>
      onStatus?.(idb ? 'indexed' : local ? 'local' : 'memory');
    function commit() {
      clearTimeout(timer);
      if (!pending) return queue;
      const value = pending;
      pending = null;
      const local = mirror(key, value);
      queue = queue.then(async () => status(local, await indexed(key, value)));
      return queue;
    }
    return {
      async load() {
        const local = readMirror(key),
          d = await db();
        let record = null;
        if (d)
          record = await new Promise((resolve) => {
            try {
              const tx = d.transaction('work');
              const request = tx.objectStore('work').get(key);
              request.onsuccess = () => resolve(request.result || null);
              request.onerror = () => resolve(null);
              tx.onabort = () => resolve(null);
            } catch {
              resolve(null);
            }
          });
        return [local, record]
          .filter(
            (v) =>
              v &&
              v.schema === 1 &&
              Number.isFinite(v.savedAt) &&
              v.snapshot?.identity === identity,
          )
          .sort((a, b) => b.savedAt - a.savedAt)
          .map((v) => v.snapshot);
      },
      save(snapshot) {
        last = Math.max(Date.now(), last + 1);
        pending = { schema: 1, savedAt: last, snapshot };
        const local = mirror(key, pending);
        status(local, false);
        clearTimeout(timer);
        timer = setTimeout(commit, 250);
      },
      flush: commit,
    };
  }
  globalThis.DoubleSlitLabStorage = { session };
})();
