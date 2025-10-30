import { useCallback, useMemo, useRef, useState } from "react"
import ForceGraph2D from "react-force-graph-2d"
import type { JourneyPath } from "./JourneyGraph"

interface NetworkGraphNode {
  id: string
  name: string
  url: string
  val: number
  color: string
  visits: number
  totalTime: number
  favicon: string
  timestamp: number
  summary?: string
}

interface NetworkGraphLink {
  source: string
  target: string
  value: number
}

interface NetworkGraphViewProps {
  journeyPaths: JourneyPath[]
  onClose: () => void
  timeRange: number
  faviconImages: Map<string, string>
}

export function NetworkGraphView({
  journeyPaths,
  onClose,
  timeRange,
  faviconImages
}: NetworkGraphViewProps) {
  const fgRef = useRef<any>(null)
  const [hoveredNode, setHoveredNode] = useState<NetworkGraphNode | null>(null)
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<number>(timeRange)
  const [sortBy, setSortBy] = useState<"visits" | "time" | "group">("visits")
  const [minVisits, setMinVisits] = useState<number>(1)

  // Generate graph data from journey paths
  const graphData = useMemo(() => {
    try {
      const nodesMap = new Map<string, NetworkGraphNode>()
      const linksMap = new Map<string, NetworkGraphLink>()

      // Filter paths by time
      const filteredPaths = journeyPaths.filter(
        (path) => Date.now() - path.startTime <= selectedTimeFilter
      )

      filteredPaths.forEach((path) => {
        path.nodes.forEach((node, index) => {
          let nodeId: string
          try {
            nodeId = new URL(node.url).hostname
          } catch {
            nodeId = node.url
          }

          // Aggregate node data
          if (nodesMap.has(nodeId)) {
            const existing = nodesMap.get(nodeId)!
            existing.visits += node.visits
            existing.totalTime += node.totalTime
            existing.val = sortBy === "visits" ? existing.visits : existing.totalTime / 60000
          } else {
            const minutes = node.totalTime / 60000
            let color = "#60a5fa"
            if (minutes >= 15) color = "#fb7185"
            else if (minutes >= 5) color = "#f472b6"
            else if (minutes >= 1) color = "#a78bfa"
            
            nodesMap.set(nodeId, {
              id: nodeId,
              name: node.title,
              url: node.url,
              val: sortBy === "visits" ? node.visits : node.totalTime / 60000,
              color: color,
              visits: node.visits,
              totalTime: node.totalTime,
              favicon: node.favicon,
              timestamp: node.timestamp,
              summary: node.summary
            })
          }

          // Create links between consecutive nodes
          if (index < path.nodes.length - 1) {
            const nextNode = path.nodes[index + 1]
            const sourceId = nodeId
            let targetId: string
            try {
              targetId = new URL(nextNode.url).hostname
            } catch {
              targetId = nextNode.url
            }
            const linkId = `${sourceId}->${targetId}`

            if (!linksMap.has(linkId)) {
              linksMap.set(linkId, {
                source: sourceId,
                target: targetId,
                value: 1
              })
            } else {
              linksMap.get(linkId)!.value += 1
            }
          }
        })
      })

      // Filter nodes by minimum visits
      const filteredNodes = Array.from(nodesMap.values()).filter(
        (node) => node.visits >= minVisits
      )
      const nodeIds = new Set(filteredNodes.map((n) => n.id))

      // Filter links to only include nodes that passed the filter
      const filteredLinks = Array.from(linksMap.values())
        .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))

      return {
        nodes: filteredNodes,
        links: filteredLinks
      }
    } catch (error) {
      console.error("Error generating graph data:", error)
      return { nodes: [], links: [] }
    }
  }, [journeyPaths, selectedTimeFilter, sortBy, minVisits])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  // Custom node canvas object with favicon
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = Math.max(15, node.val * 2.5)
    const label = node.id.length > 15 ? node.id.substring(0, 15) + "..." : node.id

    // Draw node circle with colored border
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = "#e5e7eb"
    ctx.fill()
    ctx.strokeStyle = node.color
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw favicon if available
    const faviconUrl = faviconImages.get(node.url) || node.favicon
    if (faviconUrl) {
      const img = new Image()
      img.src = faviconUrl
      if (img.complete) {
        const imgSize = size * 1.2
        ctx.save()
        ctx.beginPath()
        ctx.arc(node.x, node.y, size - 3, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(
          img,
          node.x - imgSize / 2,
          node.y - imgSize / 2,
          imgSize,
          imgSize
        )
        ctx.restore()
      }
    }

    // Draw label below node
    const fontSize = 12 / globalScale
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillStyle = "#374151"
    ctx.fillText(label, node.x, node.y + size + 4)
  }, [faviconImages])

  // Paint link particles for animation
  const linkDirectionalParticles = useCallback((link: any) => {
    return link.value > 2 ? 2 : 0 // Show particles for stronger connections
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" strokeWidth="2" />
              <circle cx="5" cy="12" r="2" strokeWidth="2" />
              <circle cx="19" cy="12" r="2" strokeWidth="2" />
              <circle cx="12" cy="19" r="2" strokeWidth="2" />
              <line x1="12" y1="7" x2="12" y2="17" strokeWidth="2" />
              <line x1="10.5" y1="6" x2="6.5" y2="11" strokeWidth="2" />
              <line x1="13.5" y1="6" x2="17.5" y2="11" strokeWidth="2" />
              <line x1="6.5" y1="13" x2="10.5" y2="18" strokeWidth="2" />
              <line x1="17.5" y1="13" x2="13.5" y2="18" strokeWidth="2" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Network Graph View
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualize your browsing patterns as a network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 overflow-x-auto">
          {/* Time Filter */}
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Time Range:
            </label>
            <select
              value={selectedTimeFilter}
              onChange={(e) => setSelectedTimeFilter(Number(e.target.value))}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={5 * 60 * 1000}>Last 5 Minutes</option>
              <option value={15 * 60 * 1000}>Last 15 Minutes</option>
              <option value={30 * 60 * 1000}>Last 30 Minutes</option>
              <option value={60 * 60 * 1000}>Last Hour</option>
              <option value={6 * 60 * 60 * 1000}>Last 6 Hours</option>
              <option value={24 * 60 * 60 * 1000}>Last 24 Hours</option>
              <option value={7 * 24 * 60 * 60 * 1000}>Last 7 Days</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Layout:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "visits" | "time" | "group")}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="visits">By Visits</option>
              <option value="time">By Time Spent</option>
              <option value="group">By Group</option>
            </select>
          </div>

          {/* Min Visits Filter */}
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Min Visits:
            </label>
            <input
              type="number"
              min="1"
              value={minVisits}
              onChange={(e) => setMinVisits(Number(e.target.value))}
              className="w-20 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-gray-500 dark:text-gray-400">Nodes:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {graphData.nodes.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Links:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {graphData.links.length}
              </span>
            </div>
          </div>
        </div>

        {/* Graph Container */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 min-h-0">
          {graphData.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  No data available for the selected filters
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeId="id"
                nodeLabel="name"
                nodeVal="val"
                nodeColor="color"
                nodeCanvasObject={nodeCanvasObject}
                nodeCanvasObjectMode={() => "replace"}
                linkSource="source"
                linkTarget="target"
                linkWidth={(link: any) => Math.max(2, Math.sqrt(link.value) * 2)}
                linkColor={() => "rgba(100, 116, 139, 0.6)"}
                linkCurvature={0.2}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={0.9}
                linkDirectionalArrowColor={() => "#64748b"}
                linkDirectionalParticles={linkDirectionalParticles}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "#3b82f6"}
                onNodeHover={(node: any) => setHoveredNode(node)}
                onNodeClick={(node: any) => {
                  if (node) {
                    window.open(node.url, "_blank")
                  }
                }}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                cooldownTicks={100}
                d3VelocityDecay={0.3}
                dagMode={sortBy === "group" ? "td" : undefined}
                dagLevelDistance={sortBy === "group" ? 80 : undefined}
                backgroundColor="transparent"
              />
            </div>
          )}

          {/* Hover Tooltip */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-10 pointer-events-none">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={hoveredNode.favicon}
                  alt=""
                  className="w-10 h-10 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                    {hoveredNode.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {hoveredNode.id}
                  </div>
                </div>
              </div>

              {hoveredNode.summary && (
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                  {hoveredNode.summary}
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Visits</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {hoveredNode.visits}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Time Spent</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatTime(hoveredNode.totalTime)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Last Visit</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(hoveredNode.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 z-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  &lt; 1 min
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  1-5 min
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  5-15 min
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  &gt; 15 min
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Drag nodes • Click to open
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
