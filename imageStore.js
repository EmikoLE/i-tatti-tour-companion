const DB_NAME = "itattiCustomImages";
const DB_VERSION = 1;
const STORE_NAME = "images";
const ASSETS_PATH = "assets/";

let dbPromise = null;
const urlCache = new Map();

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export function generateImageId() {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveImage(id, blob) {
  const db = await openDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  urlCache.set(id, URL.createObjectURL(blob));
}

export async function deleteImage(id) {
  const db = await openDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

export async function preloadAllImages() {
  let db;

  try {
    db = await openDb();
  } catch {
    return;
  }

  await new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).openCursor();

    request.onsuccess = event => {
      const cursor = event.target.result;

      if (cursor) {
        if (!urlCache.has(cursor.key)) {
          urlCache.set(cursor.key, URL.createObjectURL(cursor.value));
        }

        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => resolve();
  });
}

export function detectOrientation(blob) {
  return new Promise(resolve => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      const orientation = img.naturalHeight > img.naturalWidth ? "portrait" : "landscape";
      URL.revokeObjectURL(objectUrl);
      resolve(orientation);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve("landscape");
    };

    img.src = objectUrl;
  });
}

export function resolveAssetUrl(key, isCustom) {
  if (!key) return "";
  return isCustom ? (urlCache.get(key) || "") : ASSETS_PATH + key;
}
