import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { StickyNote } from '../App';

const NOTES_COLLECTION = 'notes';

// Převod Firestore timestamp na number
function timestampToNumber(timestamp: Timestamp | null): number {
  return timestamp?.toMillis() || Date.now();
}

// Převod Firestore dokumentu na StickyNote
export function docToNote(docData: DocumentData): StickyNote {
  const data = docData.data();
  return {
    id: docData.id,
    text: data.text || '',
    color: data.color || '#FFE5B4',
    x: data.x || 0,
    y: data.y || 0,
    comments: data.comments || [],
    authorName: data.authorName || 'Anonymní',
    createdAt: timestampToNumber(data.createdAt),
  };
}

// Převod StickyNote na Firestore data
export function noteToFirestore(note: Partial<StickyNote>): any {
  const data: any = {};
  if (note.text !== undefined) data.text = note.text;
  if (note.color !== undefined) data.color = note.color;
  if (note.x !== undefined) data.x = note.x;
  if (note.y !== undefined) data.y = note.y;
  if (note.comments !== undefined) data.comments = note.comments;
  if (note.authorName !== undefined) data.authorName = note.authorName;
  return data;
}

// Načtení všech notes
export async function getNotes(): Promise<StickyNote[]> {
  try {
    const notesRef = collection(db, NOTES_COLLECTION);
    const q = query(notesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNote);
  } catch (error) {
    console.error('Chyba při načítání notes:', error);
    return [];
  }
}

// Vytvoření nové note
export async function createNote(note: Omit<StickyNote, 'id' | 'createdAt'>): Promise<StickyNote> {
  const data = {
    ...noteToFirestore(note),
    createdAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, NOTES_COLLECTION), data);
  
  // Vrátíme note s ID a časem vytvoření
  const createdNote: StickyNote = {
    ...note,
    id: docRef.id,
    createdAt: Date.now(),
  };
  
  return createdNote;
}

// Aktualizace note
export async function updateNote(id: string, updates: Partial<StickyNote>): Promise<void> {
  const noteRef = doc(db, NOTES_COLLECTION, id);
  const data = noteToFirestore(updates);
  await updateDoc(noteRef, data);
}

// Smazání note
export async function deleteNote(id: string): Promise<void> {
  const noteRef = doc(db, NOTES_COLLECTION, id);
  await deleteDoc(noteRef);
}

// Real-time subscription pro změny
export function subscribeToNotes(
  callback: (notes: StickyNote[]) => void
): () => void {
  const notesRef = collection(db, NOTES_COLLECTION);
  const q = query(notesRef, orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot) => {
      const notes = snapshot.docs.map(docToNote);
      callback(notes);
    },
    (error) => {
      console.error('Chyba v real-time subscription:', error);
    }
  );
  
  return unsubscribe;
}

