import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer,
  enableIndexedDbPersistence
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { 
  Vehicle, 
  Driver, 
  TripRequest, 
  TravelLog, 
  SMSAlert, 
  FuelRecord, 
  MaintenanceRecord, 
  InstitutionalOfficer 
} from "./types";
import { 
  MOCK_VEHICLES, 
  MOCK_DRIVERS, 
  MOCK_TRIP_REQUESTS, 
  MOCK_TRAVEL_LOGS, 
  MOCK_SMS_ALERTS, 
  MOCK_FUEL_RECORDS, 
  MOCK_MAINTENANCE_RECORDS, 
  MOCK_OFFICERS 
} from "./data/mockData";

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with configured Database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Clean undefined values before writing to Firestore
function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        clean[key] = sanitizePayload(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

// Diagnostic test connection & initial check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, "_system_status", "ping");
    await setDoc(testDoc, { 
      lastPing: new Date().toISOString(), 
      appId: firebaseConfig.appId,
      status: "connected"
    }, { merge: true });
    console.log("[Firestore] Cross-device cloud sync connected successfully!");
    return true;
  } catch (error) {
    console.warn("[Firestore] Connection test warning:", error);
    return false;
  }
}

// ==========================================
// REAL-TIME SUBSCRIBERS ACROSS ALL DEVICES
// ==========================================

export function subscribeToVehicles(onData: (vehicles: Vehicle[]) => void) {
  const colRef = collection(db, "vehicles");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: Vehicle[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Vehicle);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] Vehicles listener error:", err);
  });
}

export function subscribeToDrivers(onData: (drivers: Driver[]) => void) {
  const colRef = collection(db, "drivers");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: Driver[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Driver);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] Drivers listener error:", err);
  });
}

export function subscribeToTripRequests(onData: (requests: TripRequest[]) => void) {
  const colRef = collection(db, "requests");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: TripRequest[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TripRequest);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] Requests listener error:", err);
  });
}

export function subscribeToTravelLogs(onData: (logs: TravelLog[]) => void) {
  const colRef = collection(db, "travelLogs");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: TravelLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as TravelLog);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] TravelLogs listener error:", err);
  });
}

export function subscribeToFuelRecords(onData: (records: FuelRecord[]) => void) {
  const colRef = collection(db, "fuelRecords");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: FuelRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as FuelRecord);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] FuelRecords listener error:", err);
  });
}

export function subscribeToMaintenanceRecords(onData: (records: MaintenanceRecord[]) => void) {
  const colRef = collection(db, "maintenanceRecords");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: MaintenanceRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as MaintenanceRecord);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] MaintenanceRecords listener error:", err);
  });
}

export function subscribeToOfficers(onData: (officers: InstitutionalOfficer[]) => void) {
  const colRef = collection(db, "officers");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: InstitutionalOfficer[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as InstitutionalOfficer);
      });
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] Officers listener error:", err);
  });
}

export function subscribeToSmsAlerts(onData: (alerts: SMSAlert[]) => void) {
  const colRef = collection(db, "smsAlerts");
  return onSnapshot(colRef, (snapshot) => {
    if (!snapshot.empty) {
      const list: SMSAlert[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as SMSAlert);
      });
      list.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
      onData(list);
    }
  }, (err) => {
    console.error("[Firestore] SMSAlerts listener error:", err);
  });
}

// ==========================================
// CLOUD MUTATION OPERATIONS (CROSS-DEVICE)
// ==========================================

export async function saveTripRequestToCloud(req: TripRequest): Promise<void> {
  const clean = sanitizePayload(req);
  const docRef = doc(db, "requests", req.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function deleteTripRequestFromCloud(id: string): Promise<void> {
  await deleteDoc(doc(db, "requests", id));
}

export async function saveVehicleToCloud(v: Vehicle): Promise<void> {
  const clean = sanitizePayload(v);
  const docRef = doc(db, "vehicles", v.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function deleteVehicleFromCloud(id: string): Promise<void> {
  await deleteDoc(doc(db, "vehicles", id));
}

export async function saveDriverToCloud(d: Driver): Promise<void> {
  const clean = sanitizePayload(d);
  const docRef = doc(db, "drivers", d.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function deleteDriverFromCloud(id: string): Promise<void> {
  await deleteDoc(doc(db, "drivers", id));
}

export async function saveOfficerToCloud(o: InstitutionalOfficer): Promise<void> {
  const clean = sanitizePayload(o);
  const docRef = doc(db, "officers", o.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function deleteOfficerFromCloud(id: string): Promise<void> {
  await deleteDoc(doc(db, "officers", id));
}

export async function saveTravelLogToCloud(l: TravelLog): Promise<void> {
  const clean = sanitizePayload(l);
  const docRef = doc(db, "travelLogs", l.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function saveFuelRecordToCloud(f: FuelRecord): Promise<void> {
  const clean = sanitizePayload(f);
  const docRef = doc(db, "fuelRecords", f.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function saveMaintenanceRecordToCloud(m: MaintenanceRecord): Promise<void> {
  const clean = sanitizePayload(m);
  const docRef = doc(db, "maintenanceRecords", m.id);
  await setDoc(docRef, clean, { merge: true });
}

export async function saveSmsAlertToCloud(a: SMSAlert): Promise<void> {
  const clean = sanitizePayload(a);
  const docRef = doc(db, "smsAlerts", a.id);
  await setDoc(docRef, clean, { merge: true });
}

// ==========================================
// INDEPENDENT AUTO-SEEDING PER COLLECTION
// ==========================================
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Vehicles
    const vSnap = await getDocs(collection(db, "vehicles"));
    if (vSnap.empty) {
      console.log("[Firestore] Seeding baseline vehicles...");
      for (const v of MOCK_VEHICLES) {
        await setDoc(doc(db, "vehicles", v.id), sanitizePayload(v), { merge: true });
      }
    }

    // 2. Drivers
    const dSnap = await getDocs(collection(db, "drivers"));
    if (dSnap.empty) {
      console.log("[Firestore] Seeding baseline drivers...");
      for (const d of MOCK_DRIVERS) {
        await setDoc(doc(db, "drivers", d.id), sanitizePayload(d), { merge: true });
      }
    }

    // 3. Requests
    const rSnap = await getDocs(collection(db, "requests"));
    if (rSnap.empty) {
      console.log("[Firestore] Seeding baseline trip requests...");
      for (const r of MOCK_TRIP_REQUESTS) {
        await setDoc(doc(db, "requests", r.id), sanitizePayload(r), { merge: true });
      }
    }

    // 4. Officers
    const oSnap = await getDocs(collection(db, "officers"));
    if (oSnap.empty) {
      console.log("[Firestore] Seeding baseline institutional officers...");
      for (const o of MOCK_OFFICERS) {
        await setDoc(doc(db, "officers", o.id), sanitizePayload(o), { merge: true });
      }
    }

    // 5. Travel Logs
    const lSnap = await getDocs(collection(db, "travelLogs"));
    if (lSnap.empty) {
      console.log("[Firestore] Seeding baseline travel logs...");
      for (const l of MOCK_TRAVEL_LOGS) {
        await setDoc(doc(db, "travelLogs", l.id), sanitizePayload(l), { merge: true });
      }
    }

    // 6. Fuel Records
    const fSnap = await getDocs(collection(db, "fuelRecords"));
    if (fSnap.empty) {
      for (const f of MOCK_FUEL_RECORDS) {
        await setDoc(doc(db, "fuelRecords", f.id), sanitizePayload(f), { merge: true });
      }
    }

    // 7. Maintenance Records
    const mSnap = await getDocs(collection(db, "maintenanceRecords"));
    if (mSnap.empty) {
      for (const m of MOCK_MAINTENANCE_RECORDS) {
        await setDoc(doc(db, "maintenanceRecords", m.id), sanitizePayload(m), { merge: true });
      }
    }

    // 8. SMS Alerts
    const sSnap = await getDocs(collection(db, "smsAlerts"));
    if (sSnap.empty) {
      for (const s of MOCK_SMS_ALERTS) {
        await setDoc(doc(db, "smsAlerts", s.id), sanitizePayload(s), { merge: true });
      }
    }
  } catch (err) {
    console.error("[Firestore] Seeding error:", err);
  }
}
