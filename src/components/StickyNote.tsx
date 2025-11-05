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
    editingNoteIds: React.MutableRefObject<Set<string>>
}

export default function StickyNote({
    note,
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment,
    editingNoteIds,
}: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [localText, setLocalText] = useState(note.text)
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const noteRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })
    const isEditingRef = useRef(false)
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastNoteIdRef = useRef(note.id)
    const ignoreServerUpdatesRef = useRef(false)
    const stableNoteRef = useRef(note) // Stabilní reference na note během editace

    // Reset při změně note.id
    useEffect(() => {
        if (lastNoteIdRef.current !== note.id) {
            // Odstraníme starou poznámku ze setu
            editingNoteIds.current.delete(lastNoteIdRef.current)
            lastNoteIdRef.current = note.id
            isEditingRef.current = false
            setIsEditing(false)
            ignoreServerUpdatesRef.current = false
            stableNoteRef.current = note
            setLocalText(note.text)
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
                updateTimeoutRef.current = null
            }
        }
    }, [note.id, editingNoteIds])
    
    // Aktualizace stableNoteRef pouze když needitujeme
    useEffect(() => {
        if (!isEditingRef.current && lastNoteIdRef.current === note.id) {
            stableNoteRef.current = note
        }
    }, [note, note.id])

    // Cleanup při unmount
    useEffect(() => {
        return () => {
            editingNoteIds.current.delete(note.id)
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
            }
        }
    }, [note.id, editingNoteIds])

    // Synchronizace lokálního textu s note.text (ale jen když needitujeme a neignorujeme)
    // DŮLEŽITÉ: Tento efekt NESMÍ běžet během editace, protože by resetoval text
    useEffect(() => {
        // Pokud právě editujeme, NIKDY nesynchronizujme s note.text
        if (isEditingRef.current || ignoreServerUpdatesRef.current || lastNoteIdRef.current !== note.id) {
            return
        }
        
        // Pouze pokud se text skutečně změnil (ne z našich vlastních změn)
        // A pokud nový text není prázdný (aby se nepřepsal text, který uživatel napsal)
        if (localText !== note.text && note.text.trim() !== '' && !editingNoteIds.current.has(note.id)) {
            setLocalText(note.text)
        }
    }, [note.text, note.id, localText])

    // Nastaví editaci jen při vytvoření nové prázdné poznámky
    useEffect(() => {
        if (note.text === '' && !isEditingRef.current && lastNoteIdRef.current === note.id) {
            isEditingRef.current = true
            setIsEditing(true)
            ignoreServerUpdatesRef.current = true
        }
    }, [note.id, note.text])

    // Cleanup timeout při unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
            }
        }
    }, [])

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.note-content, .note-footer, .comment-section')) {
            return
        }

        // Najdeme board container
        const boardElement = (e.currentTarget as HTMLElement).closest('.board') as HTMLElement
        if (!boardElement) return

        // Získáme pozici boardu a scroll pozici
        const boardRect = boardElement.getBoundingClientRect()
        const scrollLeft = boardElement.scrollLeft
        const scrollTop = boardElement.scrollTop

        setIsDragging(true)
        // Uložíme offset mezi kurzorem a pozicí note v momentě chycení (relativně k boardu)
        dragOffset.current = {
            x: e.clientX - boardRect.left - note.x + scrollLeft,
            y: e.clientY - boardRect.top - note.y + scrollTop,
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            // Najdeme board container (rodič s třídou .board)
            const boardElement = noteRef.current?.closest('.board') as HTMLElement
            if (!boardElement) return

            // Získáme pozici boardu a scroll pozici
            const boardRect = boardElement.getBoundingClientRect()
            const scrollLeft = boardElement.scrollLeft
            const scrollTop = boardElement.scrollTop

            // Nová pozice relativně k boardu (včetně scroll pozice)
            const newX = e.clientX - boardRect.left - dragOffset.current.x + scrollLeft
            const newY = e.clientY - boardRect.top - dragOffset.current.y + scrollTop

            // Omezení na hranice boardu (včetně scrollované oblasti)
            const boardWidth = Math.max(boardElement.scrollWidth, boardElement.clientWidth)
            const boardHeight = Math.max(boardElement.scrollHeight, boardElement.clientHeight)
            const noteWidth = noteRef.current?.offsetWidth || 280
            const noteHeight = noteRef.current?.offsetHeight || 200

            onUpdate(note.id, {
                x: Math.max(0, Math.min(newX, boardWidth - noteWidth)),
                y: Math.max(0, Math.min(newY, boardHeight - noteHeight)),
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
        const newText = e.target.value
        setLocalText(newText)
        
        // Ujistíme se, že jsme v editaci a ignorujeme server updates
        if (!isEditingRef.current) {
            isEditingRef.current = true
            setIsEditing(true)
            ignoreServerUpdatesRef.current = true
            editingNoteIds.current.add(note.id) // Přidáme do setu editovaných poznámek
            stableNoteRef.current = note // Uložíme stabilní referenci
        }
        
        // NEPOSÍLÁME změny na server během psaní - pouze při blur
        // To eliminuje konflikty mezi lokálním stavem a updates ze serveru
    }

    const handleTextBlur = () => {
        // Zrušíme timeout pokud existuje
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
            updateTimeoutRef.current = null
        }
        
        // Uložíme finální hodnotu na server
        const finalText = localText
        ignoreServerUpdatesRef.current = false
        
        // Nejprve odstraníme ze setu, aby se mohla synchronizovat
        editingNoteIds.current.delete(note.id)
        
        // Uložíme změnu
        onUpdate(note.id, { text: finalText })
        
        // Počkáme krátce, než zavřeme editaci
        setTimeout(() => {
            isEditingRef.current = false
            setIsEditing(false)
            ignoreServerUpdatesRef.current = false
            // Synchronizujeme s tím, co přišlo ze serveru (pokud se něco změnilo)
            if (!editingNoteIds.current.has(note.id)) {
                setLocalText(note.text)
            }
        }, 150)
    }

    const handleTextFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        isEditingRef.current = true
        setIsEditing(true)
        ignoreServerUpdatesRef.current = true
        editingNoteIds.current.add(note.id) // Přidáme do setu editovaných poznámek
        // Použijeme lokální text, ne note.text
        setLocalText(localText || note.text)
        // Zajistíme, že textarea má focus
        e.target.focus()
    }

    const handleContentClick = () => {
        if (!isEditingRef.current) {
            isEditingRef.current = true
            setIsEditing(true)
            ignoreServerUpdatesRef.current = true
            editingNoteIds.current.add(note.id) // Přidáme do setu editovaných poznámek
        }
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

            <div className="note-content" onClick={handleContentClick}>
                {isEditing ? (
                    <textarea
                        key={`textarea-${note.id}`}
                        ref={textareaRef}
                        value={localText}
                        onChange={handleTextChange}
                        onBlur={handleTextBlur}
                        onFocus={handleTextFocus}
                        autoFocus={isEditing}
                        className="note-textarea"
                        placeholder="Nová poznámka..."
                        rows={3}
                        onKeyDown={(e) => {
                            // Zabraňme jakémukoliv chování, které by mohlo způsobit blur
                            e.stopPropagation()
                            // Zabraňme Escape, který by mohl zavřít editaci
                            if (e.key === 'Escape') {
                                e.preventDefault()
                                e.stopPropagation()
                            }
                        }}
                        onMouseDown={(e) => {
                            // Zabraňme propagaci, aby se nezačalo drag
                            e.stopPropagation()
                        }}
                        onClick={(e) => {
                            // Zabraňme propagaci kliknutí
                            e.stopPropagation()
                        }}
                    />
                ) : (
                    <div className={`note-text ${stableNoteRef.current.text.trim() === '' ? 'note-text-empty' : ''}`}>
                        {stableNoteRef.current.text.trim() === '' ? 'Nová poznámka...' : stableNoteRef.current.text}
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

