import { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import { 
  getNotes, 
  createNote, 
  updateNote as updateNoteAPI, 
  deleteNote as deleteNoteAPI,
  subscribeToNotes
} from './services/firebase'
import './App.css'

export interface Comment {
    id: string
    text: string
    timestamp: number
    authorName: string
}

export interface StickyNote {
    id: string
    text: string
    color: string
    x: number
    y: number
    comments: Comment[]
    createdAt: number
    authorName: string
}

const COLORS = [
    '#FFE5B4', // světle žlutá
    '#FFB6C1', // světle růžová
    '#B0E0E6', // světle modrá
    '#98FB98', // světle zelená
    '#DDA0DD', // světle fialová
    '#F0E68C', // khaki
    '#FFA07A', // světle lososová
    '#87CEEB', // světle modrá 2
]

// Referenční velikost boardu - minimální velikost pro umístění poznámek
// Pokud je viewport větší, použije se viewport velikost
const BOARD_WIDTH = 1920
const BOARD_HEIGHT = 1080
const NOTE_WIDTH = 280
const NOTE_HEIGHT = 200

// Společné heslo pro přístup k boardu (z environment variable)
const BOARD_PASSWORD = import.meta.env.VITE_BOARD_PASSWORD || ''

function App() {
    const [notes, setNotes] = useState<StickyNote[]>([])
    const [userName, setUserName] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showNameInput, setShowNameInput] = useState(true)
    const [passwordError, setPasswordError] = useState<string>('')
    // Firebase je vždy připojený - není potřeba kontrolovat stav
    const isUpdatingFromServer = useRef(false)
    const editingNoteIds = useRef<Set<string>>(new Set())
    const boardRef = useRef<HTMLDivElement>(null)

    // Načtení autentizace a jména z localStorage
    useEffect(() => {
        const savedAuth = localStorage.getItem('topic-board-authenticated')
        const savedName = localStorage.getItem('topic-board-username')
        
        if (savedAuth === 'true') {
            setIsAuthenticated(true)
            if (savedName) {
                setUserName(savedName)
                setShowNameInput(false)
            }
        }
    }, [])

    // Ověření hesla
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError('')
        
        if (password.trim() === BOARD_PASSWORD) {
            setIsAuthenticated(true)
            localStorage.setItem('topic-board-authenticated', 'true')
        } else {
            setPasswordError('Nesprávné heslo. Zkuste to znovu.')
            setPassword('')
        }
    }

    // Zabránit submiti formuláře při stisku Enter, pokud heslo není kompletní
    const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && password.trim().length < BOARD_PASSWORD.length) {
            e.preventDefault()
        }
    }

    // Odhlášení (vymaže autentizaci)
    const handleLogout = () => {
        setIsAuthenticated(false)
        setShowNameInput(true)
        setUserName('')
        localStorage.removeItem('topic-board-authenticated')
        localStorage.removeItem('topic-board-username')
    }

    // Uložení jména
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (userName.trim()) {
            localStorage.setItem('topic-board-username', userName.trim())
            setShowNameInput(false)
        }
    }

    // Funkce pro normalizaci pozice poznámky - zajistí, že pozice je v rámci BOARD rozměrů
    // Poznámka: skutečná normalizace se provádí v Board.tsx s ohledem na efektivní velikost
    // Tato funkce pouze převede procenta na pixely a omezí na minimální BOARD rozměry
    const normalizeNotePosition = (note: StickyNote): StickyNote => {
        // Pokud je pozice v procentech (0-100), převedeme na pixely v rámci BOARD
        let x = note.x
        let y = note.y
        
        if (x <= 100 && y <= 100) {
            // Je to v procentech, převedeme na pixely
            x = (x / 100) * BOARD_WIDTH
            y = (y / 100) * BOARD_HEIGHT
        }
        
        // NEOmezujeme na hranice BOARD - necháme Board.tsx, aby to udělal s ohledem na efektivní velikost
        // Pouze zajistíme, že pozice není záporná
        x = Math.max(0, x)
        y = Math.max(0, y)
        
        return {
            ...note,
            x,
            y,
        }
    }

    // Real-time subscription pro změny
    useEffect(() => {
        if (showNameInput) return

        const unsubscribe = subscribeToNotes((newNotes) => {
            isUpdatingFromServer.current = true
            
            // Ignorujeme updates pro poznámky, které jsou právě editované - zachováme všechny jejich vlastnosti
            setNotes(prevNotes => {
                const updatedNotes = newNotes.map(newNote => {
                    // Pokud je poznámka právě editovaná, zachováme celou původní poznámku (ne jen text)
                    if (editingNoteIds.current.has(newNote.id)) {
                        const prevNote = prevNotes.find(n => n.id === newNote.id)
                        if (prevNote) {
                            return prevNote // Vrátíme celou původní poznámku, ne jen text
                        }
                    }
                    // Normalizujeme pozici poznámky, aby byla v rámci MAX_BOARD rozměrů
                    return normalizeNotePosition(newNote)
                })
                return updatedNotes
            })
            
            isUpdatingFromServer.current = false
        })

        return () => {
            unsubscribe()
        }
    }, [showNameInput])

    const addNote = async () => {
        if (isUpdatingFromServer.current) return

        // Získáme board element a jeho aktuální viewport
        const boardElement = boardRef.current
        if (!boardElement) return
        
        // Umístíme poznámku v rámci boardu (efektivní velikost - může být větší než viewport)
        const boardRect = boardElement.getBoundingClientRect()
        const viewportWidth = boardRect.width
        const viewportHeight = boardRect.height
        
        // Efektivní velikost boardu - použijeme větší z viewport nebo BOARD rozměrů
        const effectiveWidth = Math.max(viewportWidth, BOARD_WIDTH)
        const effectiveHeight = Math.max(viewportHeight, BOARD_HEIGHT)
        
        // Pozice v rámci boardu (ne jen viewportu)
        const maxX = effectiveWidth - NOTE_WIDTH - 50
        const maxY = effectiveHeight - NOTE_HEIGHT - 50
        
        // Umístíme poznámku v rámci viewportu, ale omezíme na efektivní BOARD rozměry
        const xInPixels = Math.min(
            Math.random() * Math.max(maxX - 50, 50) + 50,
            effectiveWidth - NOTE_WIDTH - 50
        )
        const yInPixels = Math.min(
            Math.random() * Math.max(maxY - 50, 50) + 50,
            effectiveHeight - NOTE_HEIGHT - 50
        )
        
        // Uložíme jako pixely - pozice je v rámci efektivní velikosti boardu
        const newNote: Omit<StickyNote, 'id' | 'createdAt'> = {
            text: '',
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            x: Math.max(50, xInPixels),
            y: Math.max(50, yInPixels),
            comments: [],
            authorName: userName || 'Anonymní',
        }

        try {
            const created = await createNote(newNote)
            // Real-time subscription automaticky přidá note, ale přidáme lokálně pro rychlost
            setNotes(prev => [...prev, created])
        } catch (error) {
            console.error('Chyba při vytváření note:', error)
            alert(`Chyba při vytváření poznámky. Zkontrolujte Firebase konfiguraci.\n\nChyba: ${error}`)
        }
    }

    const updateNote = async (id: string, updates: Partial<StickyNote>) => {
        if (isUpdatingFromServer.current) return

        // Optimistic update (lokální změna pro rychlost) - ale ne pro text, protože má vlastní lokální state
        const hasTextUpdate = 'text' in updates
        if (!hasTextUpdate) {
            // Pro pozice (x, y) vždy použijeme optimistic update
            setNotes(prevNotes =>
                prevNotes.map(note =>
                    note.id === id ? { ...note, ...updates } : note
                )
            )
        }

        try {
            await updateNoteAPI(id, updates)
            // Real-time subscription automaticky aktualizuje
        } catch (error) {
            console.error('Chyba při aktualizaci note:', error)
            // Pokud selže, načteme znovu z Firestore
            const loadedNotes = await getNotes()
            setNotes(loadedNotes)
        }
    }

    const deleteNote = async (id: string) => {
        if (isUpdatingFromServer.current) return

        // Optimistic delete
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id))

        try {
            await deleteNoteAPI(id)
            // Real-time subscription automaticky smaže
        } catch (error) {
            console.error('Chyba při mazání note:', error)
            // Pokud selže, načteme znovu z Firestore
            const loadedNotes = await getNotes()
            setNotes(loadedNotes)
        }
    }

    const addComment = async (noteId: string, text: string) => {
        if (isUpdatingFromServer.current) return

        const note = notes.find(n => n.id === noteId)
        if (!note) return

        const newComment: Comment = {
            id: Date.now().toString(),
            text,
            timestamp: Date.now(),
            authorName: userName || 'Anonymní',
        }

        const updatedNote = {
            ...note,
            comments: [...note.comments, newComment],
        }

        await updateNote(noteId, updatedNote)
    }

    const deleteComment = async (noteId: string, commentId: string) => {
        if (isUpdatingFromServer.current) return

        const note = notes.find(n => n.id === noteId)
        if (!note) return

        const updatedNote = {
            ...note,
            comments: note.comments.filter(c => c.id !== commentId),
        }

        await updateNote(noteId, updatedNote)
    }

    // Password screen
    if (!isAuthenticated) {
        return (
            <div className="app">
                <div className="name-input-overlay">
                    <div className="name-input-container">
                        <h2>🔒 Topic Board</h2>
                        <p>Pro přístup zadejte heslo:</p>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setPasswordError('')
                                }}
                                onKeyDown={handlePasswordKeyDown}
                                placeholder="Heslo..."
                                className="name-input"
                                autoFocus
                            />
                            {passwordError && (
                                <div className="password-error">{passwordError}</div>
                            )}
                            <button type="submit" className="name-submit-btn" disabled={!password.trim()}>
                                Přihlásit
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Name input screen
    if (showNameInput) {
        return (
            <div className="app">
                <div className="name-input-overlay">
                    <div className="name-input-container">
                        <h2>Vítejte v Topic Board! 👋</h2>
                        <p>Zadejte své jméno pro spolupráci:</p>
                        <form onSubmit={handleNameSubmit}>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Vaše jméno..."
                                className="name-input"
                                autoFocus
                                maxLength={20}
                            />
                            <button type="submit" className="name-submit-btn" disabled={!userName.trim()}>
                                Pokračovat
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="app">
            <header className="app-header">
                    <div className="header-left">
                        <h1>📌 Topic Board</h1>
                        <div className="connection-status">
                            <span className="status-dot connected"></span>
                            <span className="status-text">Připojeno</span>
                            {userName && (
                                <span className="user-name">👤 {userName}</span>
                            )}
                            <button 
                                className="logout-btn" 
                                onClick={handleLogout}
                                title="Odhlásit se"
                            >
                                🚪
                            </button>
                        </div>
                    </div>
                    <button className="add-note-btn" onClick={addNote}>
                        + Přidat poznámku
                    </button>
            </header>
            <Board
                ref={boardRef}
                notes={notes}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
                editingNoteIds={editingNoteIds}
            />
        </div>
    )
}

export default App

