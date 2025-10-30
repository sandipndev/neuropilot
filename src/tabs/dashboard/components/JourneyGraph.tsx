import { lazy, Suspense, useEffect, useRef, useState } from "react"

import type { WebsiteVisit } from "~background/messages/website-visit"
import db from "~db"
import { ErrorBoundary } from "./ErrorBoundary"

const NetworkGraphView = lazy(() =>
  import("./NetworkGraphView").then((module) => ({
    default: module.NetworkGraphView
  }))
)

export interface JourneyNode {
  id: string
  url: string
  title: string
  visits: number
  totalTime: number
  favicon: string
  timestamp: number
  referrer: string | null
  summary?: string
}

export interface JourneyPath {
  id: string
  nodes: JourneyNode[]
  startTime: number
  endTime: number
}

interface SemanticGroup {
  id: string
  title: string
  keywords: string[]
  paths: JourneyPath[]
  totalNodes: number
  totalTime: number
  startTime: number
  endTime: number
}

type ViewMode = "date" | "group"

export function JourneyGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [journeyPaths, setJourneyPaths] = useState<JourneyPath[]>([])
  const [semanticGroups, setSemanticGroups] = useState<SemanticGroup[]>([])
  const [hoveredNode, setHoveredNode] = useState<JourneyNode | null>(null)
  const [timeRange, setTimeRange] = useState<number>(15 * 60 * 1000)
  const [viewMode, setViewMode] = useState<ViewMode>("date")
  const [faviconImages, setFaviconImages] = useState<Map<string, string>>(
    new Map()
  )
  const [scrollStates, setScrollStates] = useState<Map<string, { isAtBottom: boolean; remainingItems: number }>>(
    new Map()
  )
  const [showNetworkGraph, setShowNetworkGraph] = useState(false)

  useEffect(() => {
    loadJourneyData()
  }, [timeRange, viewMode])

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
          referrer: v.referrer,
          summary: v.summary
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

    // Generate semantic groups if in group view mode
    if (viewMode === "group") {
      const groups = generateSemanticGroups(paths)
      setSemanticGroups(groups)
    }
  }

  const extractKeywords = (text: string): string[] => {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([ "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", 
      "with", "by", "from", "up", "about", "into", "through", "during", "including", "until", "against", "among", 
      "throughout", "despite", "towards", "upon", "concerning", "is", "are", "was", "were", "be", "been", "being", 
      "have", "has", "had", "do", "does", "did", "will", "would", "should", "could", "may", "might", "must", "can", 
      "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "when", 
      "where", "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such" ])

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word))

    // Return unique keywords
    return [...new Set(words)]
  }

  const calculateSimilarity = (keywords1: string[], keywords2: string[]): number => {
    if (keywords1.length === 0 || keywords2.length === 0) return 0

    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    const intersection = new Set([...set1].filter((x) => set2.has(x)))

    // Jaccard similarity
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }

  const generateSemanticGroups = (paths: JourneyPath[]): SemanticGroup[] => {
    if (paths.length === 0) return []

    const pathsWithKeywords = paths.map((path) => {
      const allText = path.nodes
        .map((node) => `${node.title} ${getDomainFromUrl(node.url)} ${node.summary || ""}`)
        .join(" ")
      const keywords = extractKeywords(allText)
      return { path, keywords }
    })

    // Group paths by semantic similarity
    const groups: SemanticGroup[] = []
    const processed = new Set<string>()

    pathsWithKeywords.forEach(({ path, keywords }) => {
      if (processed.has(path.id)) return

      // Find similar paths
      const similarPaths = pathsWithKeywords.filter(
        ({ path: otherPath, keywords: otherKeywords }) => {
          if (processed.has(otherPath.id) || path.id === otherPath.id) return false
          const similarity = calculateSimilarity(keywords, otherKeywords)
          return similarity > 0.2 // Threshold for grouping
        }
      )

      // Create a group
      const groupPaths = [path, ...similarPaths.map((sp) => sp.path)]
      groupPaths.forEach((p) => processed.add(p.id))

      // Find common keywords
      const allKeywords = [keywords, ...similarPaths.map((sp) => sp.keywords)].flat()
      const keywordFrequency = new Map<string, number>()
      allKeywords.forEach((kw) => {
        keywordFrequency.set(kw, (keywordFrequency.get(kw) || 0) + 1)
      })

      // Get top keywords
      const topKeywords = [...keywordFrequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([kw]) => kw)

      // Generate group title from top keywords or domain
      const groupTitle =
        topKeywords.length > 0
          ? topKeywords
              .slice(0, 3)
              .map((kw) => kw.charAt(0).toUpperCase() + kw.slice(1))
              .join(", ")
          : getDomainFromUrl(groupPaths[0].nodes[0].url)

      const totalNodes = groupPaths.reduce((sum, p) => sum + p.nodes.length, 0)
      const totalTime = groupPaths.reduce(
        (sum, p) => sum + p.nodes.reduce((s, n) => s + n.totalTime, 0),
        0
      )

      groups.push({
        id: `group-${path.id}`,
        title: groupTitle,
        keywords: topKeywords,
        paths: groupPaths,
        totalNodes,
        totalTime,
        startTime: Math.min(...groupPaths.map((p) => p.startTime)),
        endTime: Math.max(...groupPaths.map((p) => p.endTime))
      })
    })

    // Sort groups by start time (most recent first)
    return groups.sort((a, b) => b.startTime - a.startTime)
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

  const handleGroupScroll = (groupId: string, event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight
    
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10  // 10px threshold
    const group = semanticGroups.find(g => g.id === groupId)
    if (!group) return
    
    const totalPaths = group.paths.length
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
    const visiblePaths = Math.ceil(scrollPercentage * totalPaths)
    const remainingItems = Math.max(0, totalPaths - visiblePaths)
    
    setScrollStates(prev => {
      const newMap = new Map(prev)
      newMap.set(groupId, { isAtBottom, remainingItems })
      return newMap
    })
  }

const renderSemanticGroupCard = (group: SemanticGroup, groupIndex: number) => {
  const scrollState = scrollStates.get(group.id)
  const isAtBottom = scrollState?.isAtBottom ?? false
  const remainingItems = scrollState?.remainingItems ?? Math.max(0, group.paths.length - 3)
  const showIndicator = group.paths.length > 4 && !isAtBottom && remainingItems > 0

  // Helper function to extract keywords from a path
  const getPathKeywords = (path: JourneyPath): string[] => {
    const allText = path.nodes
      .map((node) => `${node.title} ${getDomainFromUrl(node.url)} ${node.summary || ""}`)
      .join(" ")
    return extractKeywords(allText)
  }

  // Helper function to find common keywords between two paths
  const findCommonKeywords = (path1Keywords: string[], path2Keywords: string[]): string[] => {
    const set1 = new Set(path1Keywords)
    return path2Keywords.filter(kw => set1.has(kw))
  }

  // Get keywords for each path
  const pathKeywords = group.paths.map(path => ({
    path,
    keywords: getPathKeywords(path)
  }))

  return (
    <div
      key={group.id}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      
      {/* Group Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              {group.title}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(group.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>

        {/* Common Keywords */}
        {group.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {group.keywords.slice(0, 5).map((keyword, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-700/50 shadow-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Journey Paths in Group */}
      <div className="relative">
        <div 
          className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
          onScroll={(e) => handleGroupScroll(group.id, e)}>
          {group.paths.map((path, pathIndex) => {
            const currentPathKeywords = pathKeywords[pathIndex].keywords
            
            // Find common keywords with other paths in the group
            const commonWithOthers = pathKeywords
              .filter((_, idx) => idx !== pathIndex)
              .flatMap(other => findCommonKeywords(currentPathKeywords, other.keywords))
            const uniqueCommonKeywords = [...new Set(commonWithOthers)]
            
            // Get unique domains from this path
            const domains = [...new Set(path.nodes.map(node => getDomainFromUrl(node.url)))]
            
            return (
              <div
                key={path.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600 relative overflow-hidden">
                
                {/* Connection indicator */}
                {uniqueCommonKeywords.length > 0 && (
                  <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full blur-xl"></div>
                )}
                
                {/* Path Header */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      uniqueCommonKeywords.length > 0 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm" 
                        : "bg-blue-500"
                    }`}></div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Journey {pathIndex + 1}
                    </span>
                    {uniqueCommonKeywords.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                        {uniqueCommonKeywords.length} shared
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {path.nodes.length} {path.nodes.length === 1 ? "site" : "sites"}
                  </span>
                </div>

                {/* Domain badges - show which sites are in this journey */}
                {domains.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {domains.slice(0, 3).map((domain, idx) => (
                      // <span
                      //   key={idx}
                      //   className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600 font-mono">
                      //   {domain}
                      // </span>
                      <></>
                    ))}
                    {domains.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-gray-500 dark:text-gray-500">
                        +{domains.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Common keywords for this path */}
                {uniqueCommonKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                    {uniqueCommonKeywords.slice(0, 4).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-300 dark:border-blue-600/50">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* Path Nodes - Compact View */}
                <div className="flex flex-wrap gap-2">
                  {path.nodes.map((node) => {
                    const timeColor = getTimeColor(node.totalTime)
                    return (
                      <div
                        key={node.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}>
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${timeColor} p-0.5 shadow-sm transition-all duration-300 ${
                            hoveredNode?.id === node.id ? "scale-110 shadow-md" : ""
                          }`}>
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 p-1 flex items-center justify-center overflow-hidden">
                            <img
                              src={faviconImages.get(node.id)}
                              alt={node.title}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        
        {showIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none flex items-end justify-center pb-1 transition-opacity duration-300">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ↓ Scroll for {remainingItems} more
            </span>
          </div>
        )}
      </div>

      {/* Group Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {group.paths.length} {group.paths.length === 1 ? "journey" : "journeys"}
        </span>
        <span>{formatTime(group.totalTime)} total</span>
      </div>
    </div>
  )
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

        <div className="flex items-center gap-3">
          {/* Network Graph Button */}
          <button
            onClick={() => setShowNetworkGraph(true)}
            className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="View Network Graph">
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
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
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("date")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                viewMode === "date"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              By date
            </button>
            <button
              onClick={() => setViewMode("group")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                viewMode === "group"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              By group
            </button>
          </div>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-auto min-w-fit pr-8 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[position:right_0.5rem_center] bg-no-repeat">
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
            {viewMode === "date" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journeyPaths.map((path, pathIndex) =>
                  renderJourneyCard(path, pathIndex)
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semanticGroups.map((group, groupIndex) =>
                  renderSemanticGroupCard(group, groupIndex)
                )}
              </div>
            )}

            {/* Tooltip */}
            {hoveredNode && (
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-50 pointer-events-none">
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

                {/* Website Summary */}
                {hoveredNode.summary && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Summary
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {hoveredNode.summary}
                    </div>
                  </div>
                )}

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
                {viewMode === "date" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Groups
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {semanticGroups.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Journeys
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {semanticGroups.reduce((sum, g) => sum + g.paths.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Sites
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {semanticGroups.reduce((sum, g) => sum + g.totalNodes, 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Journey/Group List */}
            {viewMode === "date" && journeyPaths.length > 0 && (
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
            {viewMode === "group" && semanticGroups.length > 0 && (
              <div className="mt-6 space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Top Groups
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {semanticGroups.slice(0, 5).map((group, index) => (
                    <div
                      key={group.id}
                      className="text-xs p-2 bg-white dark:bg-gray-700 rounded border">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {group.title}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {group.paths.length}{" "}
                        {group.paths.length === 1 ? "journey" : "journeys"} •{" "}
                        {group.totalNodes} sites
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Graph Modal */}
      {showNetworkGraph && (
        <ErrorBoundary
          fallback={
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Network Graph Error
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Failed to load the network graph visualization. This feature may not be compatible with your browser.
                </p>
                <button
                  onClick={() => setShowNetworkGraph(false)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          }>
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="text-gray-900 dark:text-white">
                      Loading Network Graph...
                    </span>
                  </div>
                </div>
              </div>
            }>
            <NetworkGraphView
              journeyPaths={journeyPaths}
              onClose={() => setShowNetworkGraph(false)}
              timeRange={timeRange}
              faviconImages={faviconImages}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}
