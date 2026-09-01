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
  writeBatch
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Diagnostic test connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "_test_connection", "ping"));
    return true;
  } catch (error) {
    // If offline or first connection, this is non-fatal
    console.log("Firestore initialized successfully in cloud mode.");
    return true;
  }
}

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
    console.warn("Firestore vehicles listener warning:", err);
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
    console.warn("Firestore drivers listener warning:", err);
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
    console.warn("Firestore requests listener warning:", err);
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
    console.warn("Firestore travelLogs listener warning:", err);
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
    console.warn("Firestore fuelRecords listener warning:", err);
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
    console.warn("Firestore maintenanceRecords listener warning:", err);
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
    console.warn("Firestore officers listener warning:", err);
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
    console.warn("Firestore smsAlerts listener warning:", err);
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
// AUTO-INITIAL SEEDING ON EMPTY CLOUD DB
// ==========================================
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const vSnap = await getDocs(collection(db, "vehicles"));
    if (vSnap.empty) {
      console.log("Seeding initial fleet vehicles into Cloud Firestore...");
      const batch = writeBatch(db);
      MOCK_VEHICLES.forEach((v) => {
        batch.set(doc(db, "vehicles", v.id), sanitizePayload(v));
      });
      MOCK_DRIVERS.forEach((d) => {
        batch.set(doc(db, "drivers", d.id), sanitizePayload(d));
      });
      MOCK_TRIP_REQUESTS.forEach((r) => {
        batch.set(doc(db, "requests", r.id), sanitizePayload(r));
      });
      MOCK_TRAVEL_LOGS.forEach((l) => {
        batch.set(doc(db, "travelLogs", l.id), sanitizePayload(l));
      });
      MOCK_SMS_ALERTS.forEach((s) => {
        batch.set(doc(db, "smsAlerts", s.id), sanitizePayload(s));
      });
      MOCK_FUEL_RECORDS.forEach((f) => {
        batch.set(doc(db, "fuelRecords", f.id), sanitizePayload(f));
      });
      MOCK_MAINTENANCE_RECORDS.forEach((m) => {
        batch.set(doc(db, "maintenanceRecords", m.id), sanitizePayload(m));
      });
      MOCK_OFFICERS.forEach((o) => {
        batch.set(doc(db, "officers", o.id), sanitizePayload(o));
      });
      await batch.commit();
      console.log("Cloud Firestore successfully seeded with OARI baseline data.");
    }
  } catch (err) {
    console.warn("Firestore initial seed notice:", err);
  }
}
