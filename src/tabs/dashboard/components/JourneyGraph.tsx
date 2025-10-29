import { useEffect, useRef, useState } from "react"
import db from "~db"
import type { WebsiteVisit } from "~background/messages/website-visit"

interface GraphNode {
  id: string
  url: string
  title: string
  x: number
  y: number
  visits: number
  totalTime: number
}

interface GraphEdge {
  from: string
  to: string
  count: number
}

export function JourneyGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [timeRange, setTimeRange] = useState<number>(24 * 60 * 60 * 1000) // 24 hours default

  useEffect(() => {
    loadJourneyData()
  }, [timeRange])

  const loadJourneyData = async () => {
    const cutoffTime = Date.now() - timeRange
    const visits = await db
      .table<WebsiteVisit>("websiteVisits")
      .where("opened_at")
      .above(cutoffTime)
      .toArray()

    // Build graph structure
    const nodeMap = new Map<string, { visits: number; totalTime: number; title: string }>()
    const edgeMap = new Map<string, number>()

    visits.forEach((visit) => {
      // Add/update node
      const existing = nodeMap.get(visit.url) || { visits: 0, totalTime: 0, title: visit.title }
      nodeMap.set(visit.url, {
        visits: existing.visits + 1,
        totalTime: existing.totalTime + (visit.active_time || 0),
        title: visit.title || new URL(visit.url).hostname
      })

      // Add edge if there's a referrer
      if (visit.referrer && visit.referrer !== visit.url) {
        const edgeKey = `${visit.referrer}->${visit.url}`
        edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1)
      }
    })

    // Convert to arrays and calculate positions
    const graphNodes: GraphNode[] = []
    const nodePositions = new Map<string, { x: number; y: number }>()
    
    // Use force-directed layout simulation
    const width = 800
    const height = 600
    const centerX = width / 2
    const centerY = height / 2

    Array.from(nodeMap.entries()).forEach(([url, data], index) => {
      const angle = (index / nodeMap.size) * 2 * Math.PI
      const radius = Math.min(width, height) * 0.35
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      
      nodePositions.set(url, { x, y })
      graphNodes.push({
        id: url,
        url,
        title: data.title,
        x,
        y,
        visits: data.visits,
        totalTime: data.totalTime
      })
    })

    const graphEdges: GraphEdge[] = Array.from(edgeMap.entries()).map(([key, count]) => {
      const [from, to] = key.split("->")
      return { from, to, count }
    })

    setNodes(graphNodes)
    setEdges(graphEdges)
  }

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)
      
      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        
        // Edge thickness based on count
        ctx.lineWidth = Math.min(1 + edge.count * 0.5, 5)
        ctx.strokeStyle = `rgba(59, 130, 246, ${Math.min(0.2 + edge.count * 0.1, 0.8)})`
        ctx.stroke()

        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
        const arrowSize = 8
        const nodeRadius = Math.sqrt(toNode.visits) * 3 + 8
        const arrowX = toNode.x - Math.cos(angle) * nodeRadius
        const arrowY = toNode.y - Math.sin(angle) * nodeRadius

        ctx.beginPath()
        ctx.moveTo(arrowX, arrowY)
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fillStyle = `rgba(59, 130, 246, ${Math.min(0.3 + edge.count * 0.1, 0.9)})`
        ctx.fill()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      const radius = Math.sqrt(node.visits) * 3 + 8
      const isHovered = hoveredNode?.id === node.id

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      
      // Color based on time spent
      const timeIntensity = Math.min(node.totalTime / 300000, 1) // 5 min max
      ctx.fillStyle = isHovered
        ? "rgb(59, 130, 246)"
        : `rgba(59, 130, 246, ${0.3 + timeIntensity * 0.5})`
      ctx.fill()
      
      ctx.strokeStyle = isHovered ? "rgb(37, 99, 235)" : "rgba(59, 130, 246, 0.8)"
      ctx.lineWidth = isHovered ? 3 : 2
      ctx.stroke()

      // Draw visit count
      ctx.fillStyle = "#fff"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.visits.toString(), node.x, node.y)
    })
  }, [nodes, edges, hoveredNode])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hoveredNode = nodes.find((node) => {
      const radius = Math.sqrt(node.visits) * 3 + 8
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= radius
    })

    setHoveredNode(hoveredNode || null)
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Journey Graph
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualize your browsing patterns and navigation flow
          </p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value={60 * 60 * 1000}>Last Hour</option>
          <option value={6 * 60 * 60 * 1000}>Last 6 Hours</option>
          <option value={24 * 60 * 60 * 1000}>Last 24 Hours</option>
          <option value={7 * 24 * 60 * 60 * 1000}>Last 7 Days</option>
          <option value={30 * 24 * 60 * 60 * 1000}>Last 30 Days</option>
        </select>
      </div>

      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
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
            <p className="text-sm">No browsing data available for this time range</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            className="w-full h-96 cursor-pointer"
            style={{ width: "100%", height: "600px" }}
          />
          
          {hoveredNode && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
              <div className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                {hoveredNode.title}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-500">Domain:</span>
                  <span className="font-medium">{getDomainFromUrl(hoveredNode.url)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-500">Visits:</span>
                  <span className="font-medium">{hoveredNode.visits}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-500">Time Spent:</span>
                  <span className="font-medium">{formatTime(hoveredNode.totalTime)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30" />
          <span>Low activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60" />
          <span>Medium activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-90" />
          <span>High activity</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span>Node size = visit count</span>
        </div>
      </div>
    </div>
  )
}
