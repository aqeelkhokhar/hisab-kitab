import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';

// ─── Family ─────────────────────────────────────────
export async function createFamily(code: string, creatorName: string, creatorPin: string) {
  const familyRef = doc(collection(db, 'families'));
  const familyId = familyRef.id;

  await setDoc(familyRef, {
    code: code.toUpperCase(),
    createdAt: Timestamp.now(),
  });

  const memberRef = await addDoc(collection(db, 'families', familyId, 'members'), {
    name: creatorName,
    pin: creatorPin,
    pushToken: null,
    createdAt: Timestamp.now(),
  });

  return { familyId, memberId: memberRef.id };
}

export async function joinFamily(code: string, name: string, pin: string) {
  const q = query(collection(db, 'families'), where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Family not found. Check the code and try again.');
  }

  const familyDoc = snapshot.docs[0];
  const familyId = familyDoc.id;

  // Check if name already exists — if so, verify PIN to re-join
  const membersSnap = await getDocs(collection(db, 'families', familyId, 'members'));
  const existingMember = membersSnap.docs.find(
    (d) => d.data().name.toLowerCase() === name.toLowerCase()
  );

  if (existingMember) {
    if (existingMember.data().pin === pin) {
      // Same person re-joining — return existing member
      return { familyId, memberId: existingMember.id };
    }
    throw new Error('This name is already taken in this family.');
  }

  const memberRef = await addDoc(collection(db, 'families', familyId, 'members'), {
    name,
    pin,
    pushToken: null,
    createdAt: Timestamp.now(),
  });

  return { familyId, memberId: memberRef.id };
}

export async function loginWithPin(familyId: string, name: string, pin: string) {
  const membersSnap = await getDocs(collection(db, 'families', familyId, 'members'));
  const member = membersSnap.docs.find(
    (d) => d.data().name.toLowerCase() === name.toLowerCase() && d.data().pin === pin
  );

  if (!member) {
    throw new Error('Invalid name or PIN.');
  }

  return { memberId: member.id, memberName: member.data().name };
}

export async function getFamilyMembers(familyId: string) {
  const snap = await getDocs(collection(db, 'families', familyId, 'members'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getFamilyCode(familyId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'families', familyId));
  if (snap.exists()) {
    return snap.data().code || null;
  }
  return null;
}

export async function updatePushToken(familyId: string, memberId: string, token: string) {
  await updateDoc(doc(db, 'families', familyId, 'members', memberId), {
    pushToken: token,
  });
}

// ─── Income ─────────────────────────────────────────
export async function addIncome(
  familyId: string,
  data: { amount: number; source: string; memberId: string; memberName: string; month: string }
) {
  return addDoc(collection(db, 'families', familyId, 'income'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export function subscribeToIncome(familyId: string, month: string, callback: (data: any[]) => void) {
  const q = query(
    collection(db, 'families', familyId, 'income'),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(data);
  });
}

export async function deleteIncome(familyId: string, incomeId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'income', incomeId));
}

// ─── Expenses ───────────────────────────────────────
export async function addExpense(
  familyId: string,
  data: {
    amount: number;
    category: string;
    comment: string;
    photoUrl: string | null;
    memberId: string;
    memberName: string;
  }
) {
  return addDoc(collection(db, 'families', familyId, 'expenses'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export function subscribeToExpenses(familyId: string, callback: (data: any[]) => void) {
  const q = query(collection(db, 'families', familyId, 'expenses'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(data);
  });
}

export function subscribeToMonthlyExpenses(
  familyId: string,
  startDate: Date,
  endDate: Date,
  callback: (data: any[]) => void
) {
  const startTs = Timestamp.fromDate(startDate);
  const endTs = Timestamp.fromDate(endDate);
  const q = query(collection(db, 'families', familyId, 'expenses'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d: any) => d.createdAt && d.createdAt >= startTs && d.createdAt <= endTs)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(data);
  });
}

export async function deleteExpense(familyId: string, expenseId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'expenses', expenseId));
}

// ─── Udhar ──────────────────────────────────────────
export async function addUdhar(
  familyId: string,
  data: {
    personName: string;
    amount: number;
    type: 'give' | 'return';
    comment: string;
    memberId: string;
    memberName: string;
    linkedTo?: string;
  }
) {
  return addDoc(collection(db, 'families', familyId, 'udhar'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export function subscribeToUdhar(familyId: string, callback: (data: any[]) => void) {
  const q = query(collection(db, 'families', familyId, 'udhar'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(data);
  });
}

export async function deleteUdhar(familyId: string, udharId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'udhar', udharId));
}
