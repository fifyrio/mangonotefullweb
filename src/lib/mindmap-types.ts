// Mind Map Data Structures for MangoNote
// Optimized for React Flow integration and AI generation

export interface MindMapNode {
  id: string
  type: 'root' | 'concept' | 'detail' | 'connection' | 'example'
  data: {
    label: string
    description?: string
    color: string
    importance: number // 1-5 scale
    category?: string
    examples?: string[]
    keywords?: string[]
  }
  position: { x: number; y: number }
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    width?: number
    height?: number
  }
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
  type?: 'default' | 'smoothstep' | 'straight' | 'step'
  animated?: boolean
  label?: string
  style?: {
    strokeWidth?: number
    stroke?: string
    strokeDasharray?: string
  }
  data?: {
    relationship: 'causes' | 'leads-to' | 'part-of' | 'example-of' | 'related-to'
    strength: number // 1-5 scale
  }
}

export interface MindMapData {
  id: string
  note_id: string
  user_id: string
  title: string
  description?: string
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  layout: 'hierarchical' | 'radial' | 'force' | 'manual'
  theme: 'default' | 'academic' | 'creative' | 'technical'
  metadata: {
    total_nodes: number
    total_edges: number
    max_depth: number
    created_by: 'ai' | 'user' | 'hybrid'
    version: number
  }
  created_at: string
  updated_at: string
}

export interface MindMapLayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL' // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  nodeSpacing: number
  levelSpacing: number
  centerRoot: boolean
  autoFit: boolean
}

export interface AIGeneratedMindMap {
  title: string
  central_concept: string
  main_branches: Array<{
    label: string
    importance: number
    subconcepts: Array<{
      label: string
      description?: string
      examples?: string[]
      importance: number
    }>
  }>
  relationships: Array<{
    from: string
    to: string
    type: 'causes' | 'leads-to' | 'part-of' | 'example-of' | 'related-to'
    strength: number
  }>
  layout_suggestion: 'hierarchical' | 'radial' | 'force'
  complexity_level: 'simple' | 'moderate' | 'complex'
}

// Theme configurations
export const MINDMAP_THEMES = {
  default: {
    rootNode: { backgroundColor: '#FFC300', textColor: '#000000' },
    conceptNode: { backgroundColor: '#2C2C2C', textColor: '#FFFFFF' },
    detailNode: { backgroundColor: '#1A1A1A', textColor: '#CCCCCC' },
    edge: { stroke: '#666666', strokeWidth: 2 }
  },
  academic: {
    rootNode: { backgroundColor: '#3B82F6', textColor: '#FFFFFF' },
    conceptNode: { backgroundColor: '#1E40AF', textColor: '#FFFFFF' },
    detailNode: { backgroundColor: '#1E3A8A', textColor: '#E5E7EB' },
    edge: { stroke: '#60A5FA', strokeWidth: 2 }
  },
  creative: {
    rootNode: { backgroundColor: '#F59E0B', textColor: '#000000' },
    conceptNode: { backgroundColor: '#EF4444', textColor: '#FFFFFF' },
    detailNode: { backgroundColor: '#8B5CF6', textColor: '#FFFFFF' },
    edge: { stroke: '#F472B6', strokeWidth: 3 }
  },
  technical: {
    rootNode: { backgroundColor: '#10B981', textColor: '#000000' },
    conceptNode: { backgroundColor: '#059669', textColor: '#FFFFFF' },
    detailNode: { backgroundColor: '#047857', textColor: '#D1FAE5' },
    edge: { stroke: '#34D399', strokeWidth: 2 }
  }
}

// Node size calculations
export const calculateNodeSize = (text: string, importance: number): { width: number; height: number } => {
  const baseWidth = 120
  const baseHeight = 40
  const textLength = text.length
  const importanceMultiplier = 0.8 + (importance * 0.1) // 0.9 to 1.3x
  
  const width = Math.max(baseWidth, Math.min(textLength * 8, 300)) * importanceMultiplier
  const height = Math.max(baseHeight, Math.ceil(textLength / 20) * 20) * importanceMultiplier
  
  return { width: Math.round(width), height: Math.round(height) }
}