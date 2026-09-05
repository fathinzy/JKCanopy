// A lightweight top-down SVG diagram of a canopy layout.
// Draws the canopy area(s), round tables (circles) and long tables (rectangles).
// Purely illustrative - not to scale.
export default function LayoutDiagram({ layout }) {
  const { canopies, roundTables, longTables } = layout

  // Arrange round tables in a simple grid inside the canopy area.
  const roundPositions = []
  const perRow = Math.ceil(Math.sqrt(Math.max(roundTables, 1)))
  for (let i = 0; i < roundTables; i++) {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    roundPositions.push({
      cx: 40 + col * 42 + (canopies > 1 ? 0 : 20),
      cy: 40 + row * 42,
    })
  }

  // Long tables laid out along the bottom.
  const longPositions = []
  for (let i = 0; i < longTables; i++) {
    longPositions.push({ x: 24 + (i % 3) * 62, y: 150 + Math.floor(i / 3) * 22 })
  }

  return (
    <svg viewBox="0 0 240 200" className="h-44 w-full">
      {/* Canopy area(s) */}
      {Array.from({ length: canopies }).map((_, i) => (
        <rect
          key={i}
          x={10 + i * (220 / canopies)}
          y={10}
          width={220 / canopies - 8}
          height={180}
          rx={8}
          fill="#f5efe6"
          stroke="#8b5e34"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      ))}

      {/* Round tables */}
      {roundPositions.map((p, i) => (
        <circle
          key={`r${i}`}
          cx={p.cx}
          cy={p.cy}
          r={14}
          fill="#c9a24b"
          stroke="#6f4a29"
          strokeWidth="1.5"
        />
      ))}

      {/* Long tables */}
      {longPositions.map((p, i) => (
        <rect
          key={`l${i}`}
          x={p.x}
          y={p.y}
          width={52}
          height={14}
          rx={2}
          fill="#a9764a"
          stroke="#6f4a29"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  )
}
