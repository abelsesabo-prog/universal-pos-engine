// ==========================================
// START OF FILE: public/database.js
// ==========================================

const DB_NAME = 'UniversalEngineLocalDB';
const DB_VERSION = 1;
let db = null;

/**
 * Initializes the Zero-Latency UI Local Database (IndexedDB Architecture)
 * Sets up individual storage nodes for zero-blocking offline manipulation.
 */
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB Critical Error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('⚡ Local Single-State IndexedDB Storage Engine Online.');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const localDB = event.target.result;

      // 1. Core Inventory Matrix Store
      if (!localDB.objectStoreNames.contains('inventory')) {
        localDB.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
      }

      // 2. Sales / Transaction Ledger Store
      if (!localDB.objectStoreNames.contains('transactions')) {
        localDB.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }

      // 3. TMDA Compliant Quarantine Vault Store
      if (!localDB.objectStoreNames.contains('tmda_quarantine')) {
        localDB.createObjectStore('tmda_quarantine', { keyPath: 'id', autoIncrement: true });
      }

      // 4. Offline Synchronizer Event Queue
      if (!localDB.objectStoreNames.contains('sync_queue')) {
        localDB.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }

      // NEW REQUIREMENT 1: Integrated Universal Financial Bookkeeping Ledger
      if (!localDB.objectStoreNames.contains('financial_ledger')) {
        localDB.createObjectStore('financial_ledger', { keyPath: 'id', autoIncrement: true });
      }

      // NEW REQUIREMENT 2: Universal Customer Complaints Tracking Log
      if (!localDB.objectStoreNames.contains('customer_complaints')) {
        localDB.createObjectStore('customer_complaints', { keyPath: 'id', autoIncrement: true });
      }

      console.log('📦 Database Schema Schemas Provisioned successfully.');
    };
  });
}

/**
 * Optimistic Write Pattern: Instantly writes data locally to prevent network lag.
 * Queues a task into the background network synchronization engine.
 */
function localWrite(storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName, 'sync_queue'], 'readwrite');
    const store = transaction.objectStore(storeName);
    const queueStore = transaction.objectStore('sync_queue');

    const putRequest = store.put(data);

    putRequest.onsuccess = (e) => {
      const generatedId = e.target.result;
      const optimizedData = { ...data, id: generatedId };

      // Queue an action event for background cloud cluster updates
      const syncEvent = {
        action: 'WRITE',
        targetStore: storeName,
        payload: optimizedData,
        timestamp: Date.now()
      };
      
      queueStore.add(syncEvent);
      resolve(optimizedData);
    };

    transaction.onerror = (e) => reject(e.target.error);
  });
}

// Export functions to global window namespace for access by user interface controllers
window.initIndexedDB = initIndexedDB;
window.localWrite = localWrite;
/**
 * Reads all records from a specific local database store instantly (Zero-Latency Read).
 */
function localGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

window.localGetAll = localGetAll;

// ==========================================
// END OF FILE: public/database.js
// ==========================================

