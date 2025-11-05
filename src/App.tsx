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

function App() {
    const [notes, setNotes] = useState<StickyNote[]>([])
    const [userName, setUserName] = useState<string>('')
    const [showNameInput, setShowNameInput] = useState(true)
    // Firebase je vždy připojený - není potřeba kontrolovat stav
    const isUpdatingFromServer = useRef(false)

    // Načtení jména z localStorage
    useEffect(() => {
        const savedName = localStorage.getItem('topic-board-username')
        if (savedName) {
            setUserName(savedName)
            setShowNameInput(false)
        }
    }, [])

    // Uložení jména
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (userName.trim()) {
            localStorage.setItem('topic-board-username', userName.trim())
            setShowNameInput(false)
        }
    }

    // Real-time subscription pro změny
    useEffect(() => {
        if (showNameInput) return

        const unsubscribe = subscribeToNotes((notes) => {
            isUpdatingFromServer.current = true
            setNotes(notes)
            isUpdatingFromServer.current = false
        })

        return () => {
            unsubscribe()
        }
    }, [showNameInput])

    const addNote = async () => {
        if (isUpdatingFromServer.current) return

        const newNote: Omit<StickyNote, 'id' | 'createdAt'> = {
            text: '',
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            x: Math.random() * (window.innerWidth - 330) + 50,
            y: Math.random() * (window.innerHeight - 300) + 50,
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

        // Optimistic update (lokální změna pro rychlost)
        setNotes(prevNotes =>
            prevNotes.map(note =>
                note.id === id ? { ...note, ...updates } : note
            )
        )

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
                    </div>
                </div>
                <button className="add-note-btn" onClick={addNote}>
                    + Přidat poznámku
                </button>
            </header>
            <Board
                notes={notes}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
            />
        </div>
    )
}

export default App

