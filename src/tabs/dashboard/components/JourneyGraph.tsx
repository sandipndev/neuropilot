import { useEffect, useRef, useState } from "react"

import type { WebsiteVisit } from "~background/messages/website-visit"
import db from "~db"

interface JourneyNode {
  id: string
  url: string
  title: string
  visits: number
  totalTime: number
  favicon: string
  timestamp: number
  referrer: string | null
}

interface JourneyPath {
  id: string
  nodes: JourneyNode[]
  startTime: number
  endTime: number
}

export function JourneyGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [journeyPaths, setJourneyPaths] = useState<JourneyPath[]>([])
  const [hoveredNode, setHoveredNode] = useState<JourneyNode | null>(null)
  const [timeRange, setTimeRange] = useState<number>(15 * 60 * 1000)
  const [faviconImages, setFaviconImages] = useState<Map<string, string>>(
    new Map()
  )

  useEffect(() => {
    loadJourneyData()
  }, [timeRange])

  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      return ""
    }
  }

  const loadJourneyData = async () => {
    const cutoffTime = Date.now() - timeRange
    const visits = await db
      .table<WebsiteVisit>("websiteVisits")
      .where("opened_at")
      .above(cutoffTime)
      .toArray()

    // Sort visits chronologically
    visits.sort((a, b) => a.opened_at - b.opened_at)

    // Build journey paths based on referrer chains
    const paths: JourneyPath[] = []
    const processedVisits = new Set<string>()

    visits.forEach((visit) => {
      const visitKey = `${visit.url}-${visit.opened_at}`
      if (processedVisits.has(visitKey)) return

      // Start a new path if this visit has no referrer or referrer is not in our dataset
      const hasReferrerInDataset = visits.some(
        (v) => v.url === visit.referrer && v.opened_at < visit.opened_at
      )

      if (!visit.referrer || !hasReferrerInDataset) {
        // This is the start of a new journey path
        const path: JourneyPath = {
          id: `path-${visit.opened_at}`,
          nodes: [],
          startTime: visit.opened_at,
          endTime: visit.opened_at
        }

        // Build the chain starting from this visit
        let currentVisit = visit
        const pathVisits = [currentVisit]
        processedVisits.add(`${currentVisit.url}-${currentVisit.opened_at}`)

        // Follow the referrer chain forward
        let foundNext = true
        while (foundNext) {
          foundNext = false
          const nextVisit = visits.find(
            (v) =>
              v.referrer === currentVisit.url &&
              v.opened_at > currentVisit.opened_at &&
              !processedVisits.has(`${v.url}-${v.opened_at}`)
          )

          if (nextVisit) {
            pathVisits.push(nextVisit)
            processedVisits.add(`${nextVisit.url}-${nextVisit.opened_at}`)
            currentVisit = nextVisit
            foundNext = true
          }
        }

        // Convert visits to nodes
        path.nodes = pathVisits.map((v) => ({
          id: `${v.url}-${v.opened_at}`,
          url: v.url,
          title: v.title || v.url,
          visits: 1,
          totalTime: v.active_time || 0,
          favicon: getFaviconUrl(v.url),
          timestamp: v.opened_at,
          referrer: v.referrer
        }))

        path.endTime = pathVisits[pathVisits.length - 1].opened_at
        paths.push(path)
      }
    })

    // Preload favicons
    const imageMap = new Map<string, string>()
    paths.forEach((path) => {
      path.nodes.forEach((node) => {
        imageMap.set(node.id, node.favicon)
      })
    })

    setFaviconImages(imageMap)
    setJourneyPaths(paths)
  }

  const getNodeSize = (visits: number) => {
    return Math.min(48 + visits * 4, 80)
  }

  const getTimeColor = (totalTime: number) => {
    const minutes = totalTime / 60000
    if (minutes < 1) return "from-blue-400 to-blue-500"
    if (minutes < 5) return "from-purple-400 to-purple-500"
    if (minutes < 15) return "from-pink-400 to-pink-500"
    return "from-rose-400 to-rose-500"
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

  const renderJourneyCard = (path: JourneyPath, pathIndex: number) => {
    // Calculate node positions with wrapping
    const nodesPerRow = 4
    const nodeSize = 40
    const nodeSpacing = 70
    const rowHeight = 80

    const nodePositions = path.nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow)
      const col = index % nodesPerRow
      return {
        ...node,
        x: col * nodeSpacing + nodeSize / 2,
        y: row * rowHeight + nodeSize / 2,
        index
      }
    })

    const maxRows = Math.ceil(path.nodes.length / nodesPerRow)
    const cardHeight = maxRows * rowHeight + 20

    // Generate curved path between two points
    const generateCurvePath = (from: any, to: any) => {
      const dx = to.x - from.x
      const dy = to.y - from.y

      // If nodes are on the same row, use a simple curved line
      if (Math.abs(dy) < 10) {
        const midX = from.x + dx / 2
        const curveHeight = 15
        return `M ${from.x} ${from.y} Q ${midX} ${from.y - curveHeight} ${to.x} ${to.y}`
      }

      // For nodes on different rows, create a smooth S-curve
      const controlPoint1X = from.x + dx * 0.2
      const controlPoint1Y = from.y + dy * 0.8
      const controlPoint2X = to.x - dx * 0.2
      const controlPoint2Y = to.y - dy * 0.2

      return `M ${from.x} ${from.y} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${to.x} ${to.y}`
    }

    return (
      <div
        key={path.id}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Journey {pathIndex + 1}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(path.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>

        {/* Journey Flow with Wrapping */}
        <div className="relative" style={{ height: cardHeight }}>
          {/* SVG for curved connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}>
            <defs>
              <marker
                id={`arrowhead-${pathIndex}`}
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth">
                <polygon
                  points="0 0, 8 3, 0 6"
                  className="fill-blue-400 dark:fill-blue-500"
                />
              </marker>
            </defs>

            {nodePositions.slice(0, -1).map((node, index) => {
              const nextNode = nodePositions[index + 1]
              return (
                <path
                  key={`connection-${index}`}
                  d={generateCurvePath(node, nextNode)}
                  className="stroke-blue-400 dark:stroke-blue-500"
                  strokeWidth="2"
                  fill="none"
                  markerEnd={`url(#arrowhead-${pathIndex})`}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          <div className="relative" style={{ zIndex: 2 }}>
            {nodePositions.map((node) => {
              const isHovered = hoveredNode?.id === node.id
              const timeColor = getTimeColor(node.totalTime)

              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: node.x - nodeSize / 2,
                    top: node.y - nodeSize / 2,
                    width: nodeSize,
                    height: nodeSize
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}>
                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${timeColor} blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                  />

                  {/* Main node */}
                  <div
                    className={`relative rounded-full bg-gradient-to-br ${timeColor} p-1 shadow-md transition-all duration-300 group ${
                      isHovered ? "scale-110 shadow-lg" : ""
                    } w-full h-full`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 p-1.5 flex items-center justify-center overflow-hidden">
                      <img
                        src={faviconImages.get(node.id)}
                        alt={node.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>

                    {/* Visit badge */}
                    {node.visits > 1 && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                        {node.visits}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {path.nodes.length} {path.nodes.length === 1 ? "site" : "sites"}
          </span>
          <span>
            {formatTime(
              path.nodes.reduce((sum, node) => sum + node.totalTime, 0)
            )}{" "}
            total
          </span>
        </div>
      </div>
    )
  }

  const getTotalNodes = (paths: JourneyPath[]): number => {
    return paths.reduce((sum, path) => sum + path.nodes.length, 0)
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
          <option value={1 * 60 * 1000}>Last 1 Minute</option>
          <option value={5 * 60 * 1000}>Last 5 Minutes</option>
          <option value={15 * 60 * 1000}>Last 15 Minutes</option>
          <option value={30 * 60 * 1000}>Last 30 Minutes</option>
          <option value={60 * 60 * 1000}>Last Hour</option>
          <option value={6 * 60 * 60 * 1000}>Last 6 Hours</option>
          <option value={24 * 60 * 60 * 1000}>Last 24 Hours</option>
          <option value={7 * 24 * 60 * 60 * 1000}>Last 7 Days</option>
          <option value={30 * 24 * 60 * 60 * 1000}>Last 30 Days</option>
        </select>
      </div>

      {journeyPaths.length === 0 ? (
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <p className="text-sm">
              No browsing data available for this time range
            </p>
            <p className="text-xs mt-1 text-gray-400">
              Start browsing to see your journey
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Journey Cards Area */}
          <div ref={containerRef} className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journeyPaths.map((path, pathIndex) =>
                renderJourneyCard(path, pathIndex)
              )}
            </div>

            {/* Tooltip */}
            {hoveredNode && (
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-72 z-50 pointer-events-none">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={faviconImages.get(hoveredNode.id)}
                    alt=""
                    className="w-10 h-10 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {hoveredNode.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {getDomainFromUrl(hoveredNode.url)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">
                      Visits
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {hoveredNode.visits}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">
                      Time Spent
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatTime(hoveredNode.totalTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">
                      Last Visit
                    </span>
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

          {/* Right Legend */}
          <div className="w-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Legend
            </h4>

            {/* Time Color Legend */}
            <div className="space-y-3 mb-6">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Spent
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    &lt; 1 min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    1-5 min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-pink-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    5-15 min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-400 to-rose-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    &gt; 15 min
                  </span>
                </div>
              </div>
            </div>

            {/* Journey Stats */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Statistics
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Journeys
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {journeyPaths.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Sites
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getTotalNodes(journeyPaths)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Avg per Journey
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {journeyPaths.length > 0
                      ? Math.round(
                          (getTotalNodes(journeyPaths) / journeyPaths.length) *
                            10
                        ) / 10
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Journey List */}
            {journeyPaths.length > 0 && (
              <div className="mt-6 space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Journeys
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {journeyPaths.slice(0, 5).map((path, index) => (
                    <div
                      key={path.id}
                      className="text-xs p-2 bg-white dark:bg-gray-700 rounded border">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Journey {index + 1}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {new Date(path.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}{" "}
                        • {path.nodes.length} sites
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
