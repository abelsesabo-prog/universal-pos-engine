// ==========================================
// START OF FILE: database.js
// ==========================================

const DB_NAME = 'UniversalEngineLocalDB';
const DB_VERSION = 2; // Incremented for new Dictionary Schema
let db = null;

/**
 * Initializes the Zero-Latency UI Local Database (IndexedDB Architecture)
 */
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB Critical Error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = async (event) => {
      db = event.target.result;
      console.log('⚡ Local Single-State IndexedDB Storage Engine Online.');
      
      // Auto-seed the dictionary so you have data to test immediately
      await seedDictionary();
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const localDB = event.target.result;

      if (!localDB.objectStoreNames.contains('inventory')) {
        localDB.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
      }
      if (!localDB.objectStoreNames.contains('transactions')) {
        localDB.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!localDB.objectStoreNames.contains('tmda_quarantine')) {
        localDB.createObjectStore('tmda_quarantine', { keyPath: 'id', autoIncrement: true });
      }
      if (!localDB.objectStoreNames.contains('sync_queue')) {
        localDB.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
      if (!localDB.objectStoreNames.contains('financial_ledger')) {
        localDB.createObjectStore('financial_ledger', { keyPath: 'id', autoIncrement: true });
      }
      if (!localDB.objectStoreNames.contains('customer_complaints')) {
        localDB.createObjectStore('customer_complaints', { keyPath: 'id', autoIncrement: true });
      }
      // NEW: Universal Dictionary Object Store
      if (!localDB.objectStoreNames.contains('universal_dictionary')) {
        localDB.createObjectStore('universal_dictionary', { keyPath: 'id', autoIncrement: true });
      }

      console.log('📦 Database Schema Schemas Provisioned successfully.');
    };
  });
}

const CURRENT_TENANT = 'pharmacy_branch_01'; 
window.initIndexedDB = initIndexedDB;

// Unified Write Logic
window.localWrite = (storeName, data) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");
        const dataWithTenant = { ...data, tenantId: CURRENT_TENANT, timestamp: Date.now() };
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(dataWithTenant);
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
};

// Unified Read Logic
window.localGetAll = (storeName) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Database not initialized");
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            const allData = request.result || [];
            const filteredData = allData.filter(item => item.tenantId === CURRENT_TENANT || !item.tenantId);
            resolve(filteredData);
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

// Sync Queue & Bridge
window.addToSyncQueue = async (action, data) => {
    const syncItem = { action, payload: data, timestamp: new Date().toISOString(), status: 'pending' };
    await window.localWrite('sync_queue', syncItem);
    attemptSync();
};

async function attemptSync() {
    if (!navigator.onLine) return;
    const queue = await window.localGetAll('sync_queue');
    const pendingItems = queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.payload)
            });
            if (response.ok) {
                console.log("✅ Synced successfully:", item.action);
                // Implementation for localDelete would go here
            }
        } catch (err) {
            console.error("❌ Sync failed, will retry later:", err);
            break;
        }
    }
}
window.addEventListener('online', attemptSync);

// Auto-Seeder for the Universal Dictionary
async function seedDictionary() {
    try {
        const existing = await window.localGetAll('universal_dictionary');
        if (existing.length === 0) {
            const seeds = [
                { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Medicine (Antibiotic)', form: 'Capsule / Suspension', uses: 'Treats bacterial infections such as pneumonia, bronchitis, and infections of the ear, nose, throat, urinary tract, and skin.', dosage: 'Adults: 250-500mg every 8 hours. Complete full course.', warnings: 'Penicillin allergy. May cause gastrointestinal upset.' },
                { name: 'Iodine Tincture', genericName: 'Iodine', category: 'Antiseptic / Medical Supply', form: 'Liquid Solution', uses: 'First aid to help prevent infection in minor cuts, scrapes, and burns.', dosage: 'Clean affected area, apply 1-3 times daily.', warnings: 'For external use only. Do not use over large body areas.' },
                { name: 'Metronidazole', genericName: 'Metronidazole', category: 'Medicine (Antibiotic/Antiprotozoal)', form: 'Gel / Tablet', uses: 'Treats skin infections, bacterial vaginosis, and various pelvic/GI tract infections.', dosage: 'Varies by infection. Gel: Apply thin film twice daily.', warnings: 'Avoid alcohol during and for 3 days after use (disulfiram-like reaction).' },
                { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Medicine (Analgesic)', form: 'Tablet / Syrup', uses: 'Relieves mild to moderate pain and reduces fever.', dosage: 'Adults: 500-1000mg every 4-6 hours (Max 4000mg/day).', warnings: 'Liver damage risk if maximum daily dose is exceeded.' },
                { name: 'Pampers Baby Wipes', genericName: 'Wet Wipes', category: 'General Retail / Hygiene', form: 'Pack', uses: 'Cleaning infant skin, general purpose hygiene.', dosage: 'Use as needed.', warnings: 'Do not flush. External use only.' }
            ];
            for (const item of seeds) {
                await window.localWrite('universal_dictionary', item);
            }
            console.log("📚 Universal Dictionary seeded with initial test data.");
        }
    } catch (e) {
        console.error("Dictionary Seeding failed:", e);
    }
}
// ==========================================
// END OF FILE: database.js
// ==========================================