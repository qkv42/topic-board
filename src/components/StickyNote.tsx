import { useState, useRef, useEffect } from 'react'
import { StickyNote as StickyNoteType } from '../App'
import './StickyNote.css'

const COLORS = [
    '#FFE5B4', '#FFB6C1', '#B0E0E6', '#98FB98',
    '#DDA0DD', '#F0E68C', '#FFA07A', '#87CEEB',
]

interface StickyNoteProps {
    note: StickyNoteType
    onUpdate: (id: string, updates: Partial<StickyNoteType>) => void
    onDelete: (id: string) => void
    onAddComment: (noteId: string, text: string) => void
    onDeleteComment: (noteId: string, commentId: string) => void
}

export default function StickyNote({
    note,
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment,
}: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })

    useEffect(() => {
        if (note.text === '') {
            setIsEditing(true)
        }
    }, [note.id, note.text])

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.note-content, .note-footer, .comment-section')) {
            return
        }

        setIsDragging(true)
        // Uložíme offset mezi kurzorem a pozicí note v momentě chycení
        dragOffset.current = {
            x: e.clientX - note.x,
            y: e.clientY - note.y,
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            // Nová pozice = pozice kurzoru mínus offset
            const newX = e.clientX - dragOffset.current.x
            const newY = e.clientY - dragOffset.current.y

            // Omezení na hranice okna
            const maxX = window.innerWidth - (noteRef.current?.offsetWidth || 280)
            const maxY = window.innerHeight - (noteRef.current?.offsetHeight || 200)

            onUpdate(note.id, {
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, note.id, onUpdate])

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(note.id, { text: e.target.value })
    }

    const handleTextBlur = () => {
        setIsEditing(false)
        // Text zůstane prázdný, placeholder se zobrazí vizuálně
    }

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (newComment.trim()) {
            onAddComment(note.id, newComment.trim())
            setNewComment('')
        }
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div
            ref={noteRef}
            className={`sticky-note ${isDragging ? 'dragging' : ''}`}
            style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                backgroundColor: note.color,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="note-header">
                <div className="note-author">
                    👤 {note.authorName || 'Anonymní'}
                </div>
                <button
                    className="color-picker-btn"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Změnit barvu"
                >
                    🎨
                </button>
                {showColorPicker && (
                    <div className="color-picker">
                        {COLORS.map(color => (
                            <button
                                key={color}
                                className="color-option"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    onUpdate(note.id, { color })
                                    setShowColorPicker(false)
                                }}
                            />
                        ))}
                    </div>
                )}
                <button
                    className="delete-btn"
                    onClick={() => onDelete(note.id)}
                    title="Smazat"
                >
                    ×
                </button>
            </div>

            <div className="note-content" onClick={() => !isEditing && setIsEditing(true)}>
                {isEditing ? (
                    <textarea
                        value={note.text}
                        onChange={handleTextChange}
                        onBlur={handleTextBlur}
                        autoFocus
                        className="note-textarea"
                        placeholder="Nová poznámka..."
                        rows={3}
                    />
                ) : (
                    <div className={`note-text ${note.text.trim() === '' ? 'note-text-empty' : ''}`}>
                        {note.text.trim() === '' ? 'Nová poznámka...' : note.text}
                    </div>
                )}
            </div>

            <div className="note-footer">
                <button
                    className="comment-toggle-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    💬 {note.comments.length > 0 && `(${note.comments.length})`}
                </button>
            </div>

            {showComments && (
                <div className="comment-section">
                    <div className="comments-list">
                        {note.comments.length === 0 ? (
                            <div className="no-comments">Zatím žádné komentáře</div>
                        ) : (
              note.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">👤 {comment.authorName || 'Anonymní'}</span>
                    <span className="comment-date">{formatDate(comment.timestamp)}</span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-footer">
                    <button
                      className="delete-comment-btn"
                      onClick={() => onDeleteComment(note.id, comment.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
                        )}
                    </div>
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Přidat komentář..."
                            className="comment-input"
                        />
                        <button type="submit" className="comment-submit-btn">
                            Přidat
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

