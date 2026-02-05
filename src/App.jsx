import { useMemo, useState } from 'react'
import {
  COINS,
  GRID_SIZE,
  createBoard,
  findMatches,
  hasAnyMoves,
  findHint,
  resolveBoard,
  swapCells,
  toRowCol
} from './game.js'

const SCORE_PER_COIN = 10
const INVALID_SHAKE_MS = 350

export default function App() {
  const [cells, setCells] = useState(() => createBoard().cells)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [lastClear, setLastClear] = useState(0)
  const [lastCombo, setLastCombo] = useState(1)
  const [invalidSwap, setInvalidSwap] = useState([])
  const [isResolving, setIsResolving] = useState(false)
  const [showNoMoves, setShowNoMoves] = useState(false)
  const [hint, setHint] = useState([])

  const stats = useMemo(
    () => [
      { label: 'Score', value: score },
      { label: 'Moves', value: moves },
      { label: 'Last Clear', value: lastClear || '—' },
      { label: 'Combo', value: lastCombo > 1 ? `x${lastCombo}` : '—' }
    ],
    [score, moves, lastClear, lastCombo]
  )

  const resetGame = () => {
    const board = createBoard()
    setCells(board.cells)
    setSelected(null)
    setScore(0)
    setMoves(0)
    setLastClear(0)
    setLastCombo(1)
    setShowNoMoves(false)
    setHint([])
  }

  const shuffleBoard = () => {
    const board = createBoard()
    setCells(board.cells)
    setSelected(null)
    setLastClear(0)
    setLastCombo(1)
    setShowNoMoves(false)
    setHint([])
  }

  const showHint = () => {
    const suggestion = findHint(cells, GRID_SIZE)
    setHint(suggestion ?? [])
  }

  const handleTileClick = (index) => {
    if (isResolving) return

    if (selected === null) {
      setSelected(index)
      return
    }

    if (selected === index) {
      setSelected(null)
      return
    }

    if (!isAdjacent(selected, index, GRID_SIZE)) {
      setSelected(index)
      setHint([])
      return
    }

    const swapped = swapCells(cells, selected, index)
    const matches = findMatches(swapped, GRID_SIZE)

    if (matches.size === 0) {
      setInvalidSwap([selected, index])
      setSelected(null)
      setHint([])
      window.setTimeout(() => setInvalidSwap([]), INVALID_SHAKE_MS)
      return
    }

    setIsResolving(true)
    const resolved = resolveBoard(swapped, GRID_SIZE)
    setCells(resolved.cells)
    const comboMultiplier = Math.max(1, resolved.cascades || 1)
    setScore((prev) => prev + resolved.cleared * SCORE_PER_COIN * comboMultiplier)
    setMoves((prev) => prev + 1)
    setLastClear(resolved.cleared)
    setLastCombo(comboMultiplier)
    setSelected(null)
    setIsResolving(false)
    setHint([])
    setShowNoMoves(!hasAnyMoves(resolved.cells, GRID_SIZE))
  }

  return (
    <div className="app">
      <header className="hud">
        <div className="title">
          <span className="eyebrow">Crypto Match-3</span>
          <h1>Coin Crush</h1>
          <p>Swap adjacent coins to match three or more.</p>
        </div>
        <div className="stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </header>

      <section className="board-wrap">
        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          role="grid"
          aria-label="Coin match board"
        >
          {cells.map((type, index) => {
            const coin = COINS[type]
            const isSelected = selected === index
            const isInvalid = invalidSwap.includes(index)
            const isHint = hint.includes(index)
            const delay = `${(index % GRID_SIZE) * 20}ms`

            return (
              <button
                key={`${index}-${coin.id}`}
                type="button"
                className={`tile${isSelected ? ' is-selected' : ''}${
                  isInvalid ? ' is-invalid' : ''
                }${isHint ? ' is-hint' : ''}`}
                style={{ '--delay': delay }}
                aria-pressed={isSelected}
                onClick={() => handleTileClick(index)}
              >
                <span className="tile-glow" aria-hidden="true" />
                <img src={coin.image} alt={`${coin.name} logo`} loading="lazy" />
                <span className="tile-label">{coin.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="actions">
        <button type="button" onClick={resetGame}>
          New Game
        </button>
        <button type="button" onClick={shuffleBoard}>
          Shuffle
        </button>
        <button type="button" onClick={showHint}>
          Hint
        </button>
      </div>

      {showNoMoves && (
        <div className="no-moves" role="status" aria-live="polite">
          <strong>No more moves.</strong>
          <span>Shuffle to keep playing.</span>
          <button type="button" onClick={shuffleBoard}>
            Shuffle Board
          </button>
        </div>
      )}

      <footer className="help">
        <div>Click a coin, then click an adjacent coin to swap.</div>
        <div>Only swaps that create a match will stick.</div>
      </footer>
    </div>
  )
}

function isAdjacent(a, b, size) {
  const first = toRowCol(a, size)
  const second = toRowCol(b, size)
  return Math.abs(first.row - second.row) + Math.abs(first.col - second.col) === 1
}
