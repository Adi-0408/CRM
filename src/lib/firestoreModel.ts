import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ModelQueryOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  populates?: { path: string; select?: string }[];
}

// Field to collection relation registry for Mongoose-style .populate()
const RELATION_MAP: Record<string, string> = {
  employee: 'employees',
  assignedTo: 'employees',
  createdBy: 'employees',
  approvedBy: 'employees',
  paidBy: 'employees',
  overriddenBy: 'employees',
  teamMembers: 'employees',
  project: 'projects',
  client: 'leads',
  lead: 'leads',
};

/**
 * Recursively sanitizes data payloads for Cloud Firestore:
 * - Replaces `undefined` with `null` so Firestore setDoc / updateDoc never throws Unsupported field value: undefined
 * - Normalizes Date instances to ISO strings
 * - Handles nested objects and arrays
 */
export function sanitizeForFirestore(val: any): any {
  if (val === undefined) {
    return null;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForFirestore(item));
  }
  const clean: Record<string, any> = {};
  for (const k of Object.keys(val)) {
    const v = val[k];
    if (v === undefined) {
      clean[k] = null;
    } else {
      clean[k] = sanitizeForFirestore(v);
    }
  }
  return clean;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function generateSlug(text: string): string {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getUniqueReadableDocId(data: any, collectionName: string): Promise<string> {
  if (data._id || data.id) {
    return String(data._id || data.id).trim();
  }

  let base = '';
  if (data.name) {
    base = generateSlug(data.name);
  } else if (data.title) {
    base = generateSlug(data.title);
  } else if (data.ticketNumber) {
    base = String(data.ticketNumber).trim();
  } else if (data.employee && data.date) {
    const empId = typeof data.employee === 'string' ? data.employee : (data.employee._id || data.employee.id || data.employee.name || 'emp');
    base = `${generateSlug(empId)}_${data.date}`;
  } else if (data.employeeId && data.month) {
    base = `${generateSlug(data.employeeId)}_${data.month}`;
  } else if (data.email) {
    base = generateSlug(data.email.split('@')[0]);
  }

  if (!base) {
    base = `${collectionName}_${Date.now()}`;
  }

  let candidate = base;
  try {
    const existingSnap = await getDoc(doc(db, collectionName, candidate));
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (
        (data.email && existingData?.email === data.email) ||
        (data.date && existingData?.date === data.date)
      ) {
        return candidate;
      }
      let suffix = 2;
      while (true) {
        const testId = `${base}-${suffix}`;
        const s = await getDoc(doc(db, collectionName, testId));
        if (!s.exists()) {
          candidate = testId;
          break;
        }
        suffix++;
        if (suffix > 50) break;
      }
    }
  } catch {
    // ignore lookup error
  }

  return candidate;
}

// Check if a document matches a Mongoose-style filter query
export function matchesFilter(docData: any, filter?: any): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const key of Object.keys(filter)) {
    const filterVal = filter[key];

    // Handle $or: [...]
    if (key === '$or' && Array.isArray(filterVal)) {
      const orMatched = filterVal.some((subFilter) => matchesFilter(docData, subFilter));
      if (!orMatched) return false;
      continue;
    }

    const docVal = docData[key];

    // Handle regex match { field: { $regex: 'pattern', $options: 'i' } }
    if (filterVal && typeof filterVal === 'object' && filterVal.$regex) {
      const reg = new RegExp(filterVal.$regex, filterVal.$options || 'i');
      if (!reg.test(String(docVal || ''))) return false;
      continue;
    }

    // Handle $in: [...]
    if (filterVal && typeof filterVal === 'object' && Array.isArray(filterVal.$in)) {
      if (!filterVal.$in.includes(docVal)) return false;
      continue;
    }

    // Handle comparisons ($gte, $lte, $gt, $lt)
    if (filterVal && typeof filterVal === 'object' && (filterVal.$gte !== undefined || filterVal.$lte !== undefined || filterVal.$gt !== undefined || filterVal.$lt !== undefined)) {
      const dTime = docVal instanceof Date ? docVal.getTime() : new Date(docVal).getTime();
      if (filterVal.$gte !== undefined) {
        const target = filterVal.$gte instanceof Date ? filterVal.$gte.getTime() : new Date(filterVal.$gte).getTime();
        if (dTime < target) return false;
      }
      if (filterVal.$gt !== undefined) {
        const target = filterVal.$gt instanceof Date ? filterVal.$gt.getTime() : new Date(filterVal.$gt).getTime();
        if (dTime <= target) return false;
      }
      if (filterVal.$lte !== undefined) {
        const target = filterVal.$lte instanceof Date ? filterVal.$lte.getTime() : new Date(filterVal.$lte).getTime();
        if (dTime > target) return false;
      }
      if (filterVal.$lt !== undefined) {
        const target = filterVal.$lt instanceof Date ? filterVal.$lt.getTime() : new Date(filterVal.$lt).getTime();
        if (dTime >= target) return false;
      }
      continue;
    }

    // Direct match (case-insensitive for emails)
    if (typeof filterVal === 'string' && typeof docVal === 'string') {
      if (key.toLowerCase().includes('email')) {
        if (filterVal.toLowerCase().trim() !== docVal.toLowerCase().trim()) return false;
        continue;
      }
      if (filterVal !== docVal) return false;
      continue;
    }

    // ID match: handle docVal being object with _id or id
    if (key === '_id' || key === 'id') {
      const targetId = String(filterVal);
      if (String(docData._id) !== targetId && String(docData.id) !== targetId) return false;
      continue;
    }

    if (docVal !== filterVal) {
      return false;
    }
  }

  return true;
}

// Convert Firestore doc snapshot to plain object with _id and id
function snapshotToDoc(snap: any, collectionName: string): any {
  if (!snap.exists()) return null;
  const data = snap.data();
  const id = snap.id;
  return createDocumentWrapper({ ...data, _id: id, id }, collectionName);
}

// Create document wrapper with .save(), .toObject(), .toJSON()
export function createDocumentWrapper(data: any, collectionName: string): any {
  if (!data || typeof data !== 'object') return data;

  const id = data._id || data.id;

  const wrapper: any = {
    ...data,
    _id: id,
    id,
    toObject() {
      const copy: any = { ...this };
      delete copy.toObject;
      delete copy.toJSON;
      delete copy.save;
      return copy;
    },
    toJSON() {
      return this.toObject();
    },
    async save() {
      const colRef = collection(db, collectionName);
      const rawPayload = { ...this.toObject(), updatedAt: new Date().toISOString() };
      delete rawPayload._id;
      delete rawPayload.id;
      const payload = sanitizeForFirestore(rawPayload);

      if (id) {
        await setDoc(doc(db, collectionName, String(id)), payload, { merge: true });
      } else {
        const created = await addDoc(colRef, {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        this._id = created.id;
        this.id = created.id;
      }
      return this;
    },
  };

  return wrapper;
}

// Populate reference fields on documents
async function populateDocs(docs: any[], populates: { path: string; select?: string }[]) {
  if (!docs || docs.length === 0 || !populates || populates.length === 0) return docs;

  for (const pop of populates) {
    const path = pop.path;
    const targetCollection = RELATION_MAP[path];
    if (!targetCollection) continue;

    const selectFields = pop.select ? pop.select.split(' ').map((s) => s.trim()).filter(Boolean) : null;

    // Collect all unique IDs to fetch
    const idsToFetch = new Set<string>();
    for (const d of docs) {
      const val = d[path];
      if (typeof val === 'string' && val.length > 0) {
        idsToFetch.add(val);
      } else if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === 'string' && item.length > 0) idsToFetch.add(item);
        });
      }
    }

    if (idsToFetch.size === 0) continue;

    // Fetch related docs from target collection
    const fetchedMap = new Map<string, any>();
    await Promise.all(
      Array.from(idsToFetch).map(async (refId) => {
        try {
          const snap = await getDoc(doc(db, targetCollection, refId));
          if (snap.exists()) {
            const raw = snap.data();
            let populatedVal: any = { _id: snap.id, id: snap.id };
            if (selectFields && selectFields.length > 0) {
              for (const f of selectFields) {
                if (raw[f] !== undefined) populatedVal[f] = raw[f];
              }
            } else {
              populatedVal = { ...raw, _id: snap.id, id: snap.id };
            }
            fetchedMap.set(refId, populatedVal);
          }
        } catch (e) {
          // ignore individual fetch errors
        }
      })
    );

    // Apply populated values
    for (const d of docs) {
      const val = d[path];
      if (typeof val === 'string' && fetchedMap.has(val)) {
        d[path] = fetchedMap.get(val);
      } else if (Array.isArray(val)) {
        d[path] = val.map((item) => (typeof item === 'string' && fetchedMap.has(item) ? fetchedMap.get(item) : item));
      }
    }
  }

  return docs;
}

// Chainable query object supporting .populate(), .sort(), .limit(), and await
export class FirestoreQuery<T = any> implements PromiseLike<T> {
  private collectionName: string;
  private filter?: any;
  private isSingle: boolean;
  private directId?: string;
  private options: ModelQueryOptions = { populates: [] };

  constructor(collectionName: string, filter?: any, isSingle = false, directId?: string) {
    this.collectionName = collectionName;
    this.filter = filter;
    this.isSingle = isSingle;
    this.directId = directId;
  }

  populate(path: string | { path: string; select?: string }, select?: string): this {
    if (typeof path === 'string') {
      this.options.populates?.push({ path, select });
    } else if (path && path.path) {
      this.options.populates?.push(path);
    }
    return this;
  }

  sort(sortObj: Record<string, 1 | -1>): this {
    this.options.sort = sortObj;
    return this;
  }

  limit(n: number): this {
    this.options.limit = n;
    return this;
  }

  select(_fields: string): this {
    return this; // select is handled through projection if needed
  }

  async exec(): Promise<T> {
    // 1. Direct ID lookup
    if (this.directId) {
      try {
        const snap = await getDoc(doc(db, this.collectionName, String(this.directId)));
        if (!snap.exists()) return null as any;
        let resultDoc = snapshotToDoc(snap, this.collectionName);
        if (this.options.populates && this.options.populates.length > 0) {
          const populated = await populateDocs([resultDoc], this.options.populates);
          resultDoc = populated[0];
        }
        return resultDoc as any;
      } catch (err) {
        return null as any;
      }
    }

    // 2. Collection Query
    const colRef = collection(db, this.collectionName);
    const snap = await getDocs(colRef);
    let results: any[] = [];

    snap.forEach((d) => {
      const data = d.data();
      const wrapped = createDocumentWrapper({ ...data, _id: d.id, id: d.id }, this.collectionName);
      if (matchesFilter(wrapped, this.filter)) {
        results.push(wrapped);
      }
    });

    // Sort results
    if (this.options.sort) {
      const sortKeys = Object.keys(this.options.sort);
      results.sort((a, b) => {
        for (const k of sortKeys) {
          const dir = this.options.sort![k];
          const valA = a[k];
          const valB = b[k];
          if (valA === valB) continue;
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          if (valA < valB) return dir === 1 ? -1 : 1;
          if (valA > valB) return dir === 1 ? 1 : -1;
        }
        return 0;
      });
    }

    // Limit results
    if (this.options.limit && this.options.limit > 0) {
      results = results.slice(0, this.options.limit);
    }

    // Populate relations
    if (this.options.populates && this.options.populates.length > 0) {
      results = await populateDocs(results, this.options.populates);
    }

    if (this.isSingle) {
      return (results.length > 0 ? results[0] : null) as any;
    }

    return results as any;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.exec().catch(onrejected);
  }
}

// Factory to create a Firestore Model providing Mongoose-compatible API
export function createFirestoreModel<T = any>(collectionName: string) {
  class ModelInstance {
    [key: string]: any;

    constructor(data: any = {}) {
      Object.assign(this, data);
      this._id = data._id || data.id;
      this.id = this._id;
    }

    toObject() {
      const copy: any = { ...this };
      delete copy.toObject;
      delete copy.toJSON;
      delete copy.save;
      return copy;
    }

    toJSON() {
      return this.toObject();
    }

    async save() {
      const rawPayload: any = { ...this.toObject(), updatedAt: new Date().toISOString() };
      let currentId = this._id || this.id;
      delete rawPayload._id;
      delete rawPayload.id;
      const payload: any = sanitizeForFirestore(rawPayload);

      if (!currentId) {
        currentId = await getUniqueReadableDocId(payload, collectionName);
      }

      await setDoc(doc(db, collectionName, String(currentId)), payload, { merge: true });
      this._id = currentId;
      this.id = currentId;

      return createDocumentWrapper({ ...payload, _id: currentId, id: currentId }, collectionName);
    }

    // Static Model methods
    static get collectionName() {
      return collectionName;
    }

    static find(filter?: any): FirestoreQuery<T[]> {
      return new FirestoreQuery<T[]>(collectionName, filter, false);
    }

    static findOne(filter?: any): FirestoreQuery<T | null> {
      return new FirestoreQuery<T | null>(collectionName, filter, true);
    }

    static findById(id: any): FirestoreQuery<T | null> {
      return new FirestoreQuery<T | null>(collectionName, null, true, id ? String(id) : undefined);
    }

    static async create(data: any): Promise<any> {
      if (Array.isArray(data)) {
        return Promise.all(data.map((item) => ModelInstance.create(item)));
      }

      const rawPayload: any = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      let docId = data._id || data.id;
      delete rawPayload._id;
      delete rawPayload.id;
      const payload: any = sanitizeForFirestore(rawPayload);

      if (!docId) {
        docId = await getUniqueReadableDocId(payload, collectionName);
      }

      await setDoc(doc(db, collectionName, String(docId)), payload, { merge: true });
      return createDocumentWrapper({ ...payload, _id: docId, id: docId }, collectionName);
    }

    static async findByIdAndUpdate(id: any, update: any, options: any = {}): Promise<any> {
      if (!id) return null;
      const docRef = doc(db, collectionName, String(id));
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const current = snap.data();
      const rawPayload: any = { ...update, updatedAt: new Date().toISOString() };

      // Handle $inc
      if (update.$inc) {
        for (const incKey of Object.keys(update.$inc)) {
          rawPayload[incKey] = (current[incKey] || 0) + update.$inc[incKey];
        }
        delete rawPayload.$inc;
      }

      // Handle $set
      if (update.$set) {
        Object.assign(rawPayload, update.$set);
        delete rawPayload.$set;
      }

      delete rawPayload._id;
      delete rawPayload.id;

      const payload: any = sanitizeForFirestore(rawPayload);

      await setDoc(docRef, payload, { merge: true });
      const updatedSnap = await getDoc(docRef);
      return snapshotToDoc(updatedSnap, collectionName);
    }

    static async findOneAndUpdate(filter: any, update: any, options: any = {}): Promise<any> {
      const query = new FirestoreQuery(collectionName, filter, true);
      const existing = await query.exec();
      if (existing) {
        return ModelInstance.findByIdAndUpdate(existing._id || existing.id, update, options);
      }
      if (options.upsert) {
        const payload: any = {};
        if (update.$setOnInsert) Object.assign(payload, update.$setOnInsert);
        if (update.$set) Object.assign(payload, update.$set);
        if (!update.$set && !update.$setOnInsert) Object.assign(payload, update);
        for (const k of Object.keys(filter)) {
          if (!k.startsWith('$') && payload[k] === undefined) {
            payload[k] = filter[k];
          }
        }
        return ModelInstance.create(payload);
      }
      return null;
    }

    static async findByIdAndDelete(id: any): Promise<any> {
      if (!id) return null;
      const docRef = doc(db, collectionName, String(id));
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const deletedDoc = snapshotToDoc(snap, collectionName);
      await deleteDoc(docRef);
      return deletedDoc;
    }

    static async deleteMany(filter: any = {}): Promise<{ deletedCount: number }> {
      const colRef = collection(db, collectionName);
      const snap = await getDocs(colRef);
      let count = 0;

      await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          if (matchesFilter({ ...data, _id: d.id, id: d.id }, filter)) {
            await deleteDoc(d.ref);
            count++;
          }
        })
      );

      return { deletedCount: count };
    }

    static async countDocuments(filter: any = {}): Promise<number> {
      const colRef = collection(db, collectionName);
      const snap = await getDocs(colRef);
      let count = 0;
      snap.forEach((d) => {
        if (matchesFilter({ ...d.data(), _id: d.id, id: d.id }, filter)) {
          count++;
        }
      });
      return count;
    }

    static async aggregate(_pipeline: any[] = []): Promise<any[]> {
      return [];
    }
  }

  return ModelInstance as any;
}

export default createFirestoreModel;
