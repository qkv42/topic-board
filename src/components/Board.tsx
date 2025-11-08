import { forwardRef, useEffect, useRef, useMemo, useState } from 'react'
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

// Pevná velikost boardu - poznámky se umisťují v rámci této oblasti
const BOARD_WIDTH = 1920
const BOARD_HEIGHT = 1080

const Board = forwardRef<HTMLDivElement, BoardProps>(({
    notes,
    onUpdateNote,
    onDeleteNote,
    onAddComment,
    onDeleteComment,
    editingNoteIds,
}, ref) => {
    const boardInnerRef = useRef<HTMLDivElement>(null)
    const [effectiveBoardWidth, setEffectiveBoardWidth] = useState(BOARD_WIDTH)
    const [effectiveBoardHeight, setEffectiveBoardHeight] = useState(BOARD_HEIGHT)
    const [boardScale, setBoardScale] = useState(1)
    const [showWhiteBackground, setShowWhiteBackground] = useState(false)

    // Nastavíme efektivní velikost boardu a scale
    useEffect(() => {
        const updateBoardSize = () => {
            const boardElement = ref && 'current' in ref && ref.current ? ref.current : null
            if (boardElement) {
                const viewportWidth = boardElement.clientWidth
                const viewportHeight = boardElement.clientHeight

                // Pokud je viewport menší než BOARD rozměry, použijeme scale pro zmenšení
                // Jinak scale = 1 a efektivní velikost je viewport (celá plocha)
                if (viewportWidth < BOARD_WIDTH || viewportHeight < BOARD_HEIGHT) {
                    // Na menším monitoru: efektivní velikost = BOARD rozměry, scale se použije pro zobrazení
                    // Poznámky se ukládají v BOARD souřadnicích, ale zobrazují se škálované
                    setEffectiveBoardWidth(BOARD_WIDTH)
                    setEffectiveBoardHeight(BOARD_HEIGHT)
                    const scaleX = viewportWidth / BOARD_WIDTH
                    const scaleY = viewportHeight / BOARD_HEIGHT
                    const newScale = Math.min(scaleX, scaleY)
                    setBoardScale(newScale)
                    setShowWhiteBackground(false) // Na menším monitoru žádné bílé pozadí
                } else {
                    // Na větším monitoru: efektivní velikost = viewport (celá plocha), scale = 1
                    // Žádné bílé pozadí - použijeme celou plochu
                    setEffectiveBoardWidth(viewportWidth)
                    setEffectiveBoardHeight(viewportHeight)
                    setBoardScale(1)
                    setShowWhiteBackground(false) // Na větším monitoru žádné bílé pozadí - celá plocha je aktivní
                }
            }
        }

        updateBoardSize()
        window.addEventListener('resize', updateBoardSize)
        return () => window.removeEventListener('resize', updateBoardSize)
    }, [ref])


    // Normalizujeme pozice poznámek - převedeme procenta na pixely nebo použijeme pixely přímo
    const notesWithNormalizedPositions = useMemo(() => {
        return notes.map(note => {
            let x = note.x
            let y = note.y

            // Pokud je pozice v procentech (0-100), převedeme na pixely
            if (x <= 100 && y <= 100) {
                x = (x / 100) * effectiveBoardWidth
                y = (y / 100) * effectiveBoardHeight
            }

            // Omezíme pozici na efektivní velikost boardu (ne na viewport)
            // Poznámky se mohou posouvat v rámci celého boardu, ne jen viewportu
            const noteWidth = 280
            const noteHeight = 200

            // Efektivní velikost boardu (může být větší než viewport)
            // Na menším monitoru je to BOARD_WIDTH/HEIGHT (1920x1080), na větším max(viewport, BOARD)
            // Poznámka může být až na pozici, kde její pravý/dolní okraj je na hranici boardu
            const maxX = effectiveBoardWidth - noteWidth
            const maxY = effectiveBoardHeight - noteHeight

            if (x < 0) x = 0
            else if (x > maxX) x = maxX
            if (y < 0) y = 0
            else if (y > maxY) y = maxY

            return { ...note, x, y }
        })
    }, [notes, effectiveBoardWidth, effectiveBoardHeight])

    // Reset scroll pozice pouze při prvním načtení (když není žádná poznámka)
    useEffect(() => {
        if (ref && 'current' in ref && ref.current && notes.length === 0) {
            ref.current.scrollLeft = 0
            ref.current.scrollTop = 0
        }
    }, [ref, notes.length])

    // Určíme, jestli má být board zarovnaný na střed (větší monitor) nebo na začátek (menší monitor)
    const isCentered = showWhiteBackground && boardScale === 1

    return (
        <div
            className="board"
            ref={ref}
            style={{
                backgroundColor: showWhiteBackground ? 'white' : 'transparent',
            }}
        >
            <div
                ref={boardInnerRef}
                className="board-inner"
                style={{
                    position: 'relative',
                    width: `${effectiveBoardWidth}px`,
                    height: `${effectiveBoardHeight}px`,
                    transform: boardScale < 1 ? `scale(${boardScale})` : 'none',
                    transformOrigin: 'top left',
                    margin: isCentered ? 'auto' : '0',
                    backgroundSize: boardScale < 1 ? `${effectiveBoardWidth}px ${effectiveBoardHeight}px` : 'cover',
                }}
            >
                {notesWithNormalizedPositions.map(note => (
                    <StickyNote
                        key={note.id}
                        note={note}
                        onUpdate={onUpdateNote}
                        onDelete={onDeleteNote}
                        onAddComment={onAddComment}
                        onDeleteComment={onDeleteComment}
                        editingNoteIds={editingNoteIds}
                        boardWidth={effectiveBoardWidth}
                        boardHeight={effectiveBoardHeight}
                        scale={boardScale}
                        boardInnerRef={boardInnerRef}
                    />
                ))}
            </div>
        </div>
    )
})

Board.displayName = 'Board'

export default Board


