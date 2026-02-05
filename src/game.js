export const GRID_SIZE = 8

export const COINS = [
  {
    id: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  {
    id: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  },
  {
    id: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  {
    id: 'ada',
    name: 'Cardano',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
  },
  {
    id: 'xrp',
    name: 'XRP',
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png'
  },
  {
    id: 'dot',
    name: 'Polkadot',
    image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
  },
  {
    id: 'matic',
    name: 'Polygon',
    image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png'
  }
]

export function createBoard({ size = GRID_SIZE, rng = Math.random } = {}) {
  const cells = new Array(size * size)

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const index = row * size + col
      let type = randomType(rng)
      while (createsMatch(cells, row, col, size, type)) {
        type = randomType(rng)
      }
      cells[index] = type
    }
  }

  return { size, cells }
}

export function swapCells(cells, a, b) {
  const next = cells.slice()
  const temp = next[a]
  next[a] = next[b]
  next[b] = temp
  return next
}

export function findMatches(cells, size) {
  const matches = new Set()

  for (let row = 0; row < size; row += 1) {
    let runStart = 0
    let runType = cells[row * size]
    for (let col = 1; col <= size; col += 1) {
      const index = row * size + col
      const type = col < size ? cells[index] : null
      const isSame = type !== null && type === runType

      if (isSame) continue

      const runLength = col - runStart
      if (runType !== null && runLength >= 3) {
        for (let i = runStart; i < col; i += 1) {
          matches.add(row * size + i)
        }
      }

      runStart = col
      runType = type
    }
  }

  for (let col = 0; col < size; col += 1) {
    let runStart = 0
    let runType = cells[col]
    for (let row = 1; row <= size; row += 1) {
      const index = row * size + col
      const type = row < size ? cells[index] : null
      const isSame = type !== null && type === runType

      if (isSame) continue

      const runLength = row - runStart
      if (runType !== null && runLength >= 3) {
        for (let i = runStart; i < row; i += 1) {
          matches.add(i * size + col)
        }
      }

      runStart = row
      runType = type
    }
  }

  return matches
}

export function resolveBoard(cells, size, rng = Math.random) {
  let working = cells.slice()
  let cleared = 0
  let cascades = 0

  while (true) {
    const matches = findMatches(working, size)
    if (matches.size === 0) break

    cleared += matches.size
    cascades += 1
    const next = working.slice()
    matches.forEach((index) => {
      next[index] = null
    })

    working = collapse(next, size, rng)
  }

  return { cells: working, cleared, cascades }
}

export function toRowCol(index, size) {
  return { row: Math.floor(index / size), col: index % size }
}

export function hasAnyMoves(cells, size) {
  return findHint(cells, size) !== null
}

export function findHint(cells, size) {
  for (let index = 0; index < cells.length; index += 1) {
    const { row, col } = toRowCol(index, size)
    if (col + 1 < size) {
      if (swapCreatesMatch(cells, size, index, index + 1)) return [index, index + 1]
    }
    if (row + 1 < size) {
      if (swapCreatesMatch(cells, size, index, index + size)) return [index, index + size]
    }
  }

  return null
}

function collapse(cells, size, rng) {
  const next = cells.slice()

  for (let col = 0; col < size; col += 1) {
    const stack = []
    for (let row = size - 1; row >= 0; row -= 1) {
      const value = next[row * size + col]
      if (value !== null) stack.push(value)
    }

    let stackIndex = 0
    for (let row = size - 1; row >= 0; row -= 1) {
      if (stackIndex < stack.length) {
        next[row * size + col] = stack[stackIndex]
        stackIndex += 1
      } else {
        next[row * size + col] = randomType(rng)
      }
    }
  }

  return next
}

function createsMatch(cells, row, col, size, type) {
  if (col >= 2) {
    const left = cells[row * size + (col - 1)]
    const leftLeft = cells[row * size + (col - 2)]
    if (left === type && leftLeft === type) return true
  }

  if (row >= 2) {
    const up = cells[(row - 1) * size + col]
    const upUp = cells[(row - 2) * size + col]
    if (up === type && upUp === type) return true
  }

  return false
}

function randomType(rng) {
  return Math.floor(rng() * COINS.length)
}

function swapCreatesMatch(cells, size, a, b) {
  if (cells[a] === cells[b]) return false
  const next = swapCells(cells, a, b)
  return findMatches(next, size).size > 0
}
