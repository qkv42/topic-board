import PocketBase from 'pocketbase';
import { StickyNote, Comment } from '../App';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

// PocketBase collection name
export const NOTES_COLLECTION = 'notes';

// PocketBase record structure (jak to ukládáme v databázi)
export interface NoteRecord {
    id: string;
    text: string;
    color: string;
    x: number;
    y: number;
    comments: Comment[];
    authorName: string;
    createdAt: string;
    updated: string;
}

// Převod mezi NoteRecord a StickyNote
export function recordToNote(record: NoteRecord): StickyNote {
    return {
        id: record.id,
        text: record.text,
        color: record.color,
        x: record.x,
        y: record.y,
        comments: record.comments || [],
        authorName: record.authorName || 'Anonymní',
        createdAt: new Date(record.createdAt).getTime(),
    };
}

export function noteToRecord(note: StickyNote): Partial<NoteRecord> {
    return {
        text: note.text,
        color: note.color,
        x: note.x,
        y: note.y,
        comments: note.comments,
        authorName: note.authorName,
    };
}

// Načtení všech notes
export async function getNotes(): Promise<StickyNote[]> {
    try {
        const records = await pb.collection(NOTES_COLLECTION).getFullList<NoteRecord>({
            sort: 'created',
        });
        return records.map(recordToNote);
    } catch (error) {
        console.error('Chyba při načítání notes:', error);
        return [];
    }
}

// Vytvoření nové note
export async function createNote(note: Omit<StickyNote, 'id' | 'createdAt'>): Promise<StickyNote> {
    const data = {
        text: note.text || '',
        color: note.color,
        x: note.x,
        y: note.y,
        comments: note.comments || [],
        authorName: note.authorName || 'Anonymní',
    };
    const record = await pb.collection(NOTES_COLLECTION).create<NoteRecord>(data);
    return recordToNote(record);
}

// Aktualizace note
export async function updateNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote> {
    const data: any = {};
    if (updates.text !== undefined) data.text = updates.text;
    if (updates.color !== undefined) data.color = updates.color;
    if (updates.x !== undefined) data.x = updates.x;
    if (updates.y !== undefined) data.y = updates.y;
    if (updates.comments !== undefined) data.comments = updates.comments;
    if (updates.authorName !== undefined) data.authorName = updates.authorName;
    
    const record = await pb.collection(NOTES_COLLECTION).update<NoteRecord>(id, data);
    return recordToNote(record);
}

// Smazání note
export async function deleteNote(id: string): Promise<void> {
    await pb.collection(NOTES_COLLECTION).delete(id);
}

// Real-time subscription helper
export function subscribeToNotes(
    callback: (action: 'create' | 'update' | 'delete', record: NoteRecord | { id: string }) => void
) {
    return pb.collection(NOTES_COLLECTION).subscribe<NoteRecord>('*', (e) => {
        if (e.action === 'create') {
            callback('create', e.record);
        } else if (e.action === 'update') {
            callback('update', e.record);
        } else if (e.action === 'delete') {
            callback('delete', { id: e.record.id });
        }
    });
}
