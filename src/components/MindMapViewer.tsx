'use client'

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  ReactFlowProvider,
  Node
} from 'reactflow'
import 'reactflow/dist/style.css'

import { MindMapData, MindMapNode, MindMapEdge } from '@/lib/mindmap-types'

// Custom node components
const RootNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-6 py-4 shadow-lg rounded-2xl border-2 transition-all duration-200 ${
    selected ? 'border-mango-400 shadow-mango-500/20' : 'border-gray-300'
  }`} style={{ 
    backgroundColor: data.color,
    color: data.color === '#FFC300' ? '#000' : '#fff',
    minWidth: '120px',
    textAlign: 'center'
  }}>
    <div className="font-bold text-lg">{data.label}</div>
    {data.description && (
      <div className="text-sm opacity-80 mt-1">{data.description}</div>
    )}
  </div>
)

const ConceptNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-3 shadow-md rounded-xl border transition-all duration-200 ${
    selected ? 'border-mango-400 shadow-mango-500/10' : 'border-gray-400'
  }`} style={{ 
    backgroundColor: data.color,
    color: '#fff',
    minWidth: '100px',
    textAlign: 'center'
  }}>
    <div className="font-semibold text-sm">{data.label}</div>
    {data.examples && data.examples.length > 0 && (
      <div className="text-xs opacity-70 mt-1">
        {data.examples.slice(0, 2).join(', ')}
      </div>
    )}
  </div>
)

const DetailNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-3 py-2 shadow-sm rounded-lg border transition-all duration-200 ${
    selected ? 'border-mango-400' : 'border-gray-500'
  }`} style={{ 
    backgroundColor: data.color,
    color: '#ccc',
    minWidth: '80px',
    fontSize: '12px',
    textAlign: 'center'
  }}>
    <div className="font-medium">{data.label}</div>
    {data.description && (
      <div className="text-xs opacity-60 mt-1 leading-tight">
        {data.description.substring(0, 50)}
        {data.description.length > 50 ? '...' : ''}
      </div>
    )}
  </div>
)

// Node type mapping
const nodeTypes = {
  root: RootNode,
  concept: ConceptNode,
  detail: DetailNode,
  connection: ConceptNode,
  example: DetailNode
}

interface MindMapViewerProps {
  mindMapData: MindMapData
  onSave?: (data: MindMapData) => void
  isEditable?: boolean
  className?: string
}

function MindMapViewerContent({ mindMapData, onSave, isEditable = false, className = '' }: MindMapViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(mindMapData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(mindMapData.edges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update nodes and edges when mindMapData changes
  useEffect(() => {
    setNodes(mindMapData.nodes)
    setEdges(mindMapData.edges)
  }, [mindMapData, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (isEditable) {
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2, stroke: '#666666' }
        }, eds))
      }
    },
    [setEdges, isEditable]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node)
  }, [selectedNode])

  const handleSave = useCallback(() => {
    if (onSave) {
      const updatedData: MindMapData = {
        ...mindMapData,
        nodes: nodes as MindMapNode[],
        edges: edges as MindMapEdge[],
        metadata: {
          ...mindMapData.metadata,
          total_nodes: nodes.length,
          total_edges: edges.length,
          version: mindMapData.metadata.version + 1
        },
        updated_at: new Date().toISOString()
      }
      onSave(updatedData)
    }
  }, [nodes, edges, mindMapData, onSave])

  const handleFitView = useCallback(() => {
    // This would normally use the fitView function from useReactFlow
    console.log('Fitting view to all nodes')
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const handleExport = useCallback(() => {
    // Basic export functionality
    const exportData = {
      title: mindMapData.title,
      nodes: nodes.length,
      edges: edges.length,
      created: mindMapData.created_at
    }
    console.log('Exporting mind map:', exportData)
    
    // Create downloadable JSON
    const blob = new Blob([JSON.stringify(mindMapData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMapData.title.replace(/[^a-z0-9]/gi, '_')}_mindmap.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [mindMapData, nodes, edges])

  return (
    <div className={`relative bg-dark-primary ${isFullscreen ? 'fixed inset-0 z-50' : 'h-96 md:h-[600px]'} ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={'loose' as any}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2
        }}
        className="bg-dark-secondary"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls 
          className="bg-dark-tertiary border-gray-600"
          showInteractive={isEditable}
        />
        <MiniMap 
          className="bg-dark-tertiary border border-gray-600"
          nodeColor={(node) => (node.data as any).color}
          maskColor="rgba(0, 0, 0, 0.3)"
          position="bottom-left"
        />
        <Background 
          variant={'dots' as any} 
          gap={20} 
          size={1}
          color="#333"
        />
        
        {/* Control Panel */}
        <Panel position="top-right" className="bg-dark-tertiary rounded-lg p-2 border border-gray-600">
          <div className="flex gap-2">
            <button
              onClick={handleFitView}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
              title="Fit to view"
            >
              🔍
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? '📱' : '📺'}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
              title="Export mind map"
            >
              💾
            </button>
            {isEditable && (
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-mango-500 hover:bg-mango-400 text-black rounded text-sm transition-colors font-medium"
                title="Save changes"
              >
                💾 Save
              </button>
            )}
          </div>
        </Panel>

        {/* Info Panel */}
        <Panel position="top-left" className="bg-dark-tertiary rounded-lg p-3 border border-gray-600 max-w-xs">
          <h3 className="font-bold text-white text-sm mb-2">{mindMapData.title}</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <div>📊 {nodes.length} concepts</div>
            <div>🔗 {edges.length} connections</div>
            <div>🎨 {mindMapData.theme} theme</div>
            <div>📐 {mindMapData.layout} layout</div>
          </div>
        </Panel>

        {/* Node Detail Panel */}
        {selectedNode && (
          <Panel position="bottom-right" className="bg-dark-tertiary rounded-lg p-3 border border-gray-600 max-w-sm">
            <div className="text-white">
              <h4 className="font-bold text-sm mb-2">{selectedNode.data.label}</h4>
              {selectedNode.data.description && (
                <p className="text-xs text-gray-300 mb-2">{selectedNode.data.description}</p>
              )}
              {selectedNode.data.examples && selectedNode.data.examples.length > 0 && (
                <div className="text-xs text-gray-400">
                  <strong>Examples:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {selectedNode.data.examples.slice(0, 3).map((example: string, index: number) => (
                      <li key={index}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Importance: {'★'.repeat(selectedNode.data.importance)} ({selectedNode.data.importance}/5)
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

export default function MindMapViewer(props: MindMapViewerProps) {
  return (
    <ReactFlowProvider>
      <MindMapViewerContent {...props} />
    </ReactFlowProvider>
  )
}