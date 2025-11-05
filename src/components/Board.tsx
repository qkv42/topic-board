import StickyNote from './StickyNote'
import { StickyNote as StickyNoteType } from '../App'
import './Board.css'

interface BoardProps {
    notes: StickyNoteType[]
    onUpdateNote: (id: string, updates: Partial<StickyNoteType>) => void
    onDeleteNote: (id: string) => void
    onAddComment: (noteId: string, text: string) => void
    onDeleteComment: (noteId: string, commentId: string) => void
    editingNoteIds: React.MutableRefObject<Set<string>>
}

export default function Board({
    notes,
    onUpdateNote,
    onDeleteNote,
    onAddComment,
    onDeleteComment,
    editingNoteIds,
}: BoardProps) {
    return (
        <div className="board">
            {notes.map(note => (
                <StickyNote
                    key={note.id}
                    note={note}
                    onUpdate={onUpdateNote}
                    onDelete={onDeleteNote}
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                    editingNoteIds={editingNoteIds}
                />
            ))}
        </div>
    )
}


