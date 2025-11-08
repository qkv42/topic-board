import { useState, useRef, useEffect, useLayoutEffect } from 'react'
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
    boardWidth?: number
    boardHeight?: number
    scale?: number
    boardInnerRef?: React.MutableRefObject<HTMLDivElement | null>
}

export default function StickyNote({
    note,
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment,
    editingNoteIds,
    boardWidth,
    boardHeight,
    scale = 1,
    boardInnerRef,
}: StickyNoteProps) {
    const [isDragging, setIsDragging] = useState(false)
    const isDraggingRef = useRef(false)
    const [isEditing, setIsEditing] = useState(false)
    const [localText, setLocalText] = useState(note.text)
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
    const dragPositionRef = useRef<{ x: number; y: number } | null>(null)
    const noteRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const dragOffset = useRef({ x: 0, y: 0 })
    const isEditingRef = useRef(false)
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastNoteIdRef = useRef(note.id)
    const ignoreServerUpdatesRef = useRef(false)
    const stableNoteRef = useRef(note) // Stabilní reference na note během editace

    // Reset při změně note.id - OKAMŽITĚ pomocí useLayoutEffect (synchronně před renderem)
    useLayoutEffect(() => {
        if (lastNoteIdRef.current !== note.id) {
            // Odstraníme starou poznámku ze setu
            editingNoteIds.current.delete(lastNoteIdRef.current)
            lastNoteIdRef.current = note.id
            isEditingRef.current = false
            setIsEditing(false)
            ignoreServerUpdatesRef.current = false
            stableNoteRef.current = note
            setLocalText(note.text)
            // Reset dragPosition při změně note.id - OKAMŽITĚ (synchronně před renderem)
            // DŮLEŽITÉ: Resetujeme i když se note.id změnil, aby se "kopie" nezobrazovala
            setDragPosition(null)
            dragPositionRef.current = null
            setIsDragging(false)
            isDraggingRef.current = false
            dragOffset.current = { x: 0, y: 0 }
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current)
                updateTimeoutRef.current = null
            }
        }
    }, [note.id, editingNoteIds])

    // Reset dragPosition po optimistic update - sledujeme změnu pozice
    useEffect(() => {
        // Pokud nedragujeme a dragPosition existuje a note.id je stejné
        if (!isDraggingRef.current && dragPosition && lastNoteIdRef.current === note.id) {
            // Zkontrolujeme, jestli se pozice změnila (optimistic update proběhl)
            const xDiff = Math.abs(note.x - dragPosition.x)
            const yDiff = Math.abs(note.y - dragPosition.y)
            // Pokud je pozice stejná (s tolerancí 1px), resetujeme dragPosition
            if (xDiff < 1 && yDiff < 1) {
                setDragPosition(null)
                dragPositionRef.current = null
            }
        }
    }, [note.x, note.y, isDragging, dragPosition, note.id])

    // Aktualizace stableNoteRef pouze když needitujeme
    // DŮLEŽITÉ: Aktualizujeme i když přijde update ze serveru po uložení
    useEffect(() => {
        if (!isEditingRef.current && lastNoteIdRef.current === note.id) {
            stableNoteRef.current = note
            // Pokud needitujeme a text se změnil, synchronizujeme i localText
            if (localText !== note.text && !ignoreServerUpdatesRef.current) {
                setLocalText(note.text)
            }
        }
    }, [note, note.id, localText])

    // Reset dragPosition po optimistic update - sledujeme změnu pozice
    // Pouze pokud nedragujeme a note.id se nezměnil
    useEffect(() => {
        // Pokud nedragujeme a dragPosition existuje a note.id je stejné
        if (!isDragging && dragPosition && lastNoteIdRef.current === note.id) {
            // Zkontrolujeme, jestli se pozice změnila (optimistic update proběhl)
            const xDiff = Math.abs(note.x - dragPosition.x)
            const yDiff = Math.abs(note.y - dragPosition.y)
            // Pokud je pozice stejná (s tolerancí 1px), resetujeme dragPosition
            if (xDiff < 1 && yDiff < 1) {
                setDragPosition(null)
                dragPositionRef.current = null
            }
        }
    }, [note.x, note.y, isDragging, dragPosition, note.id])

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
        // Zabraňme dragování při kliknutí na tlačítka, textarea, nebo komentáře
        if ((e.target as HTMLElement).closest('.note-content, .note-footer, .comment-section, .delete-btn, .color-picker-btn, .color-picker, .comment-toggle-btn')) {
            return
        }

        // Zabraňme označování textu při dragování
        e.preventDefault()

        // Použijeme board inner ref, pokud je k dispozici
        const boardInner = boardInnerRef?.current || (e.currentTarget as HTMLElement).closest('.board-inner') as HTMLElement
        if (!boardInner) return

        // Získáme pozici board inner elementu (v viewport souřadnicích, po scale transformaci)
        const boardInnerRect = boardInner.getBoundingClientRect()

        // Použijeme pozici poznámky z note.x/y (v souřadnicích boardu 1920x1080)
        // Tato pozice je nezávislá na scale transformaci
        const currentX = note.x
        const currentY = note.y

        // Reset dragPosition před začátkem nového dragování
        setDragPosition(null)
        dragPositionRef.current = null

        setIsDragging(true)
        isDraggingRef.current = true

        // Pozice kurzoru relativně k board inner elementu (v viewport souřadnicích, po scale)
        // getBoundingClientRect() vrací pozici a velikost PO transformaci
        const cursorXRelative = e.clientX - boardInnerRect.left
        const cursorYRelative = e.clientY - boardInnerRect.top

        // Přepočítáme na board souřadnice
        // boardInnerRect.width je nyní effectiveBoardWidth * scale (CSS transform: scale)
        // Když je scale < 1, můžeme použít jednodušší výpočet: cursorXRelative / scale
        // Protože boardInnerRect.width = effectiveBoardWidth * scale
        // Takže (cursorXRelative / (effectiveBoardWidth * scale)) * effectiveBoardWidth = cursorXRelative / scale
        const currentBoardWidth = boardWidth || 1920
        const currentBoardHeight = boardHeight || 1080

        const cursorXInBoard = scale < 1
            ? cursorXRelative / scale
            : (cursorXRelative / boardInnerRect.width) * currentBoardWidth
        const cursorYInBoard = scale < 1
            ? cursorYRelative / scale
            : (cursorYRelative / boardInnerRect.height) * currentBoardHeight

        // Offset = pozice kurzoru - pozice note (v souřadnicích boardu)
        dragOffset.current = {
            x: cursorXInBoard - currentX,
            y: cursorYInBoard - currentY,
        }
    }

    useEffect(() => {
        let animationFrameId: number | null = null

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            // Použijeme requestAnimationFrame pro plynulejší drag and drop
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }

            animationFrameId = requestAnimationFrame(() => {
                if (!isDraggingRef.current) return

                // Použijeme board inner ref, pokud je k dispozici
                const boardInner = boardInnerRef?.current || noteRef.current?.closest('.board-inner') as HTMLElement
                if (!boardInner) return

                // Získáme pozici board inner elementu (v viewport souřadnicích, po scale transformaci)
                const boardInnerRect = boardInner.getBoundingClientRect()

                // Pozice kurzoru relativně k board inner elementu (v viewport souřadnicích, po scale)
                // getBoundingClientRect() vrací pozici a velikost PO transformaci
                let cursorXRelative = e.clientX - boardInnerRect.left
                let cursorYRelative = e.clientY - boardInnerRect.top

                // Omezíme cursorXRelative/Y na minimum 0 (aby nebyly záporné)
                // NEOmezujeme na maximum - když je scale < 1, kurzor může být i mimo boardInnerRect
                // ale stále v rámci viewportu, a my chceme umožnit posouvat až k pravému kraji boardu
                cursorXRelative = Math.max(0, cursorXRelative)
                cursorYRelative = Math.max(0, cursorYRelative)

                // Přepočítáme na board souřadnice
                // boardInnerRect.width je nyní effectiveBoardWidth * scale (CSS transform: scale)
                // Když je scale < 1, můžeme použít jednodušší výpočet: cursorXRelative / scale
                // Protože boardInnerRect.width = effectiveBoardWidth * scale
                // Takže (cursorXRelative / (effectiveBoardWidth * scale)) * effectiveBoardWidth = cursorXRelative / scale
                const effectiveBoardWidth = boardWidth || 1920
                const effectiveBoardHeight = boardHeight || 1080

                // Když je scale < 1, použijeme cursorXRelative / scale
                // Ale omezíme na effectiveBoardWidth, aby poznámky nešly mimo board
                const cursorXInBoard = scale < 1
                    ? Math.min(cursorXRelative / scale, effectiveBoardWidth)
                    : (cursorXRelative / boardInnerRect.width) * effectiveBoardWidth
                const cursorYInBoard = scale < 1
                    ? Math.min(cursorYRelative / scale, effectiveBoardHeight)
                    : (cursorYRelative / boardInnerRect.height) * effectiveBoardHeight

                // Nová pozice = pozice kurzoru - offset (v souřadnicích boardu)
                const newX = cursorXInBoard - dragOffset.current.x
                const newY = cursorYInBoard - dragOffset.current.y

                // Omezení na hranice boardu - poznámky se mohou posouvat v rámci celého boardu
                // Použijeme efektivní BOARD rozměry (mohou být větší než viewport)
                // POZOR: offsetWidth/Height jsou škálované, takže je musíme vydělit scale
                const noteWidthScaled = noteRef.current?.offsetWidth || 280
                const noteHeightScaled = noteRef.current?.offsetHeight || 200
                const noteWidth = scale < 1 ? noteWidthScaled / scale : noteWidthScaled
                const noteHeight = scale < 1 ? noteHeightScaled / scale : noteHeightScaled

                // boardWidth a boardHeight jsou efektivní rozměry boardu (mohou být větší než viewport)
                const currentBoardWidth = boardWidth || 1920
                const currentBoardHeight = boardHeight || 1080

                // Vypočítáme maximální pozice - poznámka musí být celá viditelná v rámci boardu
                // Poznámka může být až na pozici, kde její pravý/dolní okraj je na hranici boardu
                const maxX = currentBoardWidth - noteWidth
                const maxY = currentBoardHeight - noteHeight

                // Omezíme pozici na hranice boardu (minimálně 0, maximálně maxX/Y)
                const clampedX = Math.max(0, Math.min(newX, maxX))
                const clampedY = Math.max(0, Math.min(newY, maxY))



                // Použijeme lokální state pro pozici během dragování (neukládáme na server)
                const newPos = { x: clampedX, y: clampedY }
                setDragPosition(newPos)
                dragPositionRef.current = newPos
            })
        }

        const handleMouseUp = () => {
            const finalPos = dragPositionRef.current

            setIsDragging(false)
            isDraggingRef.current = false

            // Při ukončení dragování uložíme finální pozici
            if (finalPos) {
                // Uložíme pozici přímo jako pixely - board má efektivní velikost (může být větší než 1920x1080)
                onUpdate(note.id, {
                    x: finalPos.x,
                    y: finalPos.y,
                })
                // dragPosition se resetuje automaticky v useEffect, když se note.x/y aktualizuje
            } else {
                // Pokud není finalPos, resetujeme hned
                setDragPosition(null)
                dragPositionRef.current = null
            }
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [isDragging, note.id, onUpdate, boardWidth, boardHeight, scale, boardInnerRef])

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
        const finalText = localText.trim()

        // Aktualizujeme stableNoteRef s finálním textem, aby se zobrazil správně
        stableNoteRef.current = { ...note, text: finalText }

        // Nejprve odstraníme ze setu, aby se mohla synchronizovat
        editingNoteIds.current.delete(note.id)

        // Uložíme změnu na server
        onUpdate(note.id, { text: finalText })

        // Okamžitě zavřeme editaci a povolíme synchronizaci
        isEditingRef.current = false
        setIsEditing(false)
        ignoreServerUpdatesRef.current = false

        // Nastavíme localText na finální hodnotu (bude se synchronizovat se serverem)
        setLocalText(finalText)
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

    // Použijeme dragPosition pouze pokud dragujeme, jinak note.x/y
    // Tím zajistíme, že se "kopie" nezobrazí - pokud nedragujeme, použijeme vždy note.x/y
    const displayX = (isDragging && dragPosition) ? dragPosition.x : note.x
    const displayY = (isDragging && dragPosition) ? dragPosition.y : note.y

    return (
        <div
            ref={noteRef}
            className={`sticky-note ${isDragging ? 'dragging' : ''}`}
            style={{
                left: `${displayX}px`,
                top: `${displayY}px`,
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
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(note.id)
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                    }}
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

