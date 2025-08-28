import { query, queryOne } from '@/lib/database'
import { OpenRouterService } from '@/lib/openrouter-service'
import { ErrorHandler, AIError } from '@/lib/error-handler'
import { 
  MindMapData, 
  MindMapNode, 
  MindMapEdge, 
  AIGeneratedMindMap, 
  MINDMAP_THEMES,
  calculateNodeSize
} from '@/lib/mindmap-types'

// For demo purposes, we'll use a mock user ID
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export class MindMapService {
  private openRouter: OpenRouterService

  constructor() {
    this.openRouter = new OpenRouterService()
  }

  /**
   * Generate mind map from content using AI
   */
  async generateMindMap(content: string, noteId?: string): Promise<MindMapData> {
    try {
      console.log('Generating mind map with AI...', { contentLength: content.length })
      
      // Create AI prompt for mind map generation
      const aiResult = await this.generateMindMapWithAI(content)
      
      // Convert AI result to React Flow format
      const mindMapData = this.convertAIResultToMindMap(aiResult, noteId)
      
      // Save to database if noteId provided
      if (noteId) {
        const savedMindMap = await this.saveMindMap(mindMapData)
        return savedMindMap
      }
      
      return mindMapData
    } catch (error) {
      ErrorHandler.logError(error as Error, 'generate_mindmap', {
        contentLength: content.length,
        noteId
      })
      throw error
    }
  }

  /**
   * AI-powered mind map generation using OpenRouter
   */
  private async generateMindMapWithAI(content: string): Promise<AIGeneratedMindMap> {
    const prompt = this.createMindMapPrompt(content)
    
    try {
      const response = await this.openRouter.makeAPICall(prompt)
      const parsed = this.parseMindMapResponse(response)
      
      console.log('AI mind map generated:', {
        title: parsed.title,
        mainBranches: parsed.main_branches.length,
        relationships: parsed.relationships.length,
        complexity: parsed.complexity_level
      })
      
      return parsed
    } catch (error) {
      console.error('AI mind map generation failed:', error)
      throw new AIError(
        'Failed to generate mind map',
        'MINDMAP_GENERATION_FAILED',
        'Unable to create mind map from content. Please try again.',
        true
      )
    }
  }

  /**
   * Create optimized prompt for mind map generation
   */
  private createMindMapPrompt(content: string): string {
    const truncatedContent = content.substring(0, 8000)
    
    return `You are an expert knowledge visualization specialist. Create a comprehensive mind map structure from the provided content that maximizes learning and understanding.

**CONTENT TO ANALYZE:**
${truncatedContent}${content.length > 8000 ? '\n\n[Content continues - analyze full scope]' : ''}

**MIND MAP DESIGN PRINCIPLES:**
- **Hierarchy**: Central concept with logical branching
- **Clarity**: Clear, concise node labels
- **Completeness**: Cover all major concepts and relationships
- **Learning Focus**: Optimize for comprehension and retention
- **Visual Appeal**: Balanced, aesthetically pleasing layout

**REQUIRED JSON OUTPUT:**
{
  "title": "Clear, descriptive title for the mind map (60 chars max)",
  "central_concept": "Main concept that everything connects to",
  "main_branches": [
    {
      "label": "Primary concept branch 1 (concise but descriptive)",
      "importance": 5,
      "subconcepts": [
        {
          "label": "Specific subconcept",
          "description": "Brief explanation or context",
          "examples": ["concrete example 1", "concrete example 2"],
          "importance": 4
        },
        {
          "label": "Another subconcept",
          "description": "Additional context",
          "importance": 3
        }
      ]
    },
    {
      "label": "Primary concept branch 2",
      "importance": 4,
      "subconcepts": [
        {
          "label": "Related concept",
          "description": "How it connects to main theme",
          "importance": 4
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "concept name from branches",
      "to": "related concept name",
      "type": "causes|leads-to|part-of|example-of|related-to",
      "strength": 4
    }
  ],
  "layout_suggestion": "hierarchical|radial|force",
  "complexity_level": "simple|moderate|complex"
}

**QUALITY GUIDELINES:**
- **3-6 main branches** maximum for clarity
- **2-4 subconcepts per branch** to avoid overwhelming
- **Node labels**: 2-8 words, clear and specific
- **Relationships**: Only include meaningful connections
- **Importance scale**: 1 (minor detail) to 5 (central concept)
- **Examples**: Concrete, relevant, and helpful for understanding

**LAYOUT SUGGESTIONS:**
- **Hierarchical**: Top-down for process/sequential content
- **Radial**: Center-out for topic exploration
- **Force**: Organic layout for complex interconnections

Generate a mind map that would help someone master this content efficiently and see the big picture clearly.`
  }

  /**
   * Parse AI response for mind map data
   */
  private parseMindMapResponse(response: string): AIGeneratedMindMap {
    try {
      // Clean response
      let cleanContent = response.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const parsed = JSON.parse(cleanContent) as AIGeneratedMindMap
      
      // Validate structure
      if (!parsed.title || !parsed.central_concept || !Array.isArray(parsed.main_branches)) {
        throw new Error('Invalid mind map structure')
      }
      
      return parsed
    } catch (error) {
      console.error('Failed to parse mind map response:', response)
      throw new Error(`Failed to parse AI mind map response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert AI result to React Flow mind map format
   */
  private convertAIResultToMindMap(aiResult: AIGeneratedMindMap, noteId?: string): MindMapData {
    const nodes: MindMapNode[] = []
    const edges: MindMapEdge[] = []
    const theme = MINDMAP_THEMES.default
    
    // Create root node
    const rootNodeSize = calculateNodeSize(aiResult.central_concept, 5)
    const rootNode: MindMapNode = {
      id: 'root',
      type: 'root',
      data: {
        label: aiResult.central_concept,
        description: aiResult.title,
        color: theme.rootNode.backgroundColor,
        importance: 5,
        category: 'central'
      },
      position: { x: 400, y: 300 },
      style: {
        backgroundColor: theme.rootNode.backgroundColor,
        borderColor: '#FFA500',
        fontSize: 16,
        fontWeight: 'bold',
        ...rootNodeSize
      }
    }
    nodes.push(rootNode)

    // Position calculation for radial layout
    const branchCount = aiResult.main_branches.length
    const angleStep = (2 * Math.PI) / branchCount
    const branchDistance = 250
    const subconceptDistance = 150

    // Create main branch nodes and subconcept nodes
    aiResult.main_branches.forEach((branch, branchIndex) => {
      const angle = branchIndex * angleStep
      const branchX = 400 + Math.cos(angle) * branchDistance
      const branchY = 300 + Math.sin(angle) * branchDistance
      
      const branchNodeSize = calculateNodeSize(branch.label, branch.importance)
      const branchNode: MindMapNode = {
        id: `branch-${branchIndex}`,
        type: 'concept',
        data: {
          label: branch.label,
          color: theme.conceptNode.backgroundColor,
          importance: branch.importance,
          category: 'main-branch'
        },
        position: { x: branchX, y: branchY },
        style: {
          backgroundColor: theme.conceptNode.backgroundColor,
          borderColor: '#444444',
          fontSize: 14,
          fontWeight: 'bold',
          ...branchNodeSize
        }
      }
      nodes.push(branchNode)

      // Create edge from root to branch
      edges.push({
        id: `edge-root-branch-${branchIndex}`,
        source: 'root',
        target: `branch-${branchIndex}`,
        type: 'smoothstep',
        style: {
          strokeWidth: 3,
          stroke: theme.edge.stroke
        },
        data: {
          relationship: 'part-of',
          strength: branch.importance
        }
      })

      // Create subconcept nodes
      branch.subconcepts.forEach((subconcept, subIndex) => {
        const subAngle = angle + (subIndex - (branch.subconcepts.length - 1) / 2) * 0.5
        const subX = branchX + Math.cos(subAngle) * subconceptDistance
        const subY = branchY + Math.sin(subAngle) * subconceptDistance
        
        const subNodeSize = calculateNodeSize(subconcept.label, subconcept.importance)
        const subNode: MindMapNode = {
          id: `sub-${branchIndex}-${subIndex}`,
          type: 'detail',
          data: {
            label: subconcept.label,
            description: subconcept.description,
            color: theme.detailNode.backgroundColor,
            importance: subconcept.importance,
            examples: subconcept.examples,
            category: 'subconcept'
          },
          position: { x: subX, y: subY },
          style: {
            backgroundColor: theme.detailNode.backgroundColor,
            borderColor: '#333333',
            fontSize: 12,
            ...subNodeSize
          }
        }
        nodes.push(subNode)

        // Create edge from branch to subconcept
        edges.push({
          id: `edge-branch-${branchIndex}-sub-${subIndex}`,
          source: `branch-${branchIndex}`,
          target: `sub-${branchIndex}-${subIndex}`,
          type: 'smoothstep',
          style: {
            strokeWidth: 2,
            stroke: theme.edge.stroke
          },
          data: {
            relationship: 'part-of',
            strength: subconcept.importance
          }
        })
      })
    })

    // Add relationship edges
    aiResult.relationships.forEach((rel, relIndex) => {
      // Find nodes by label
      const sourceNode = nodes.find(n => n.data.label === rel.from)
      const targetNode = nodes.find(n => n.data.label === rel.to)
      
      if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
        edges.push({
          id: `relationship-${relIndex}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'straight',
          animated: true,
          label: rel.type.replace('-', ' '),
          style: {
            strokeWidth: rel.strength,
            stroke: '#FFC300',
            strokeDasharray: '5,5'
          },
          data: {
            relationship: rel.type,
            strength: rel.strength
          }
        })
      }
    })

    return {
      id: `mindmap-${Date.now()}`,
      note_id: noteId || '',
      user_id: DEMO_USER_ID,
      title: aiResult.title,
      description: `Mind map for: ${aiResult.central_concept}`,
      nodes,
      edges,
      layout: aiResult.layout_suggestion,
      theme: 'default',
      metadata: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        max_depth: 3,
        created_by: 'ai',
        version: 1
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Save mind map to database
   */
  async saveMindMap(mindMapData: MindMapData): Promise<MindMapData> {
    try {
      const result = await queryOne(`
        INSERT INTO mind_maps (
          note_id, user_id, title, description, nodes, edges, 
          layout, theme, metadata, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        mindMapData.note_id || null,
        mindMapData.user_id,
        mindMapData.title,
        mindMapData.description,
        JSON.stringify(mindMapData.nodes),
        JSON.stringify(mindMapData.edges),
        mindMapData.layout,
        mindMapData.theme,
        JSON.stringify(mindMapData.metadata),
        mindMapData.metadata.created_by
      ])

      return {
        ...mindMapData,
        id: result.id,
        created_at: result.created_at,
        updated_at: result.updated_at
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'save_mindmap', {
        noteId: mindMapData.note_id,
        nodeCount: mindMapData.nodes.length
      })
      throw error
    }
  }

  /**
   * Get mind map by note ID
   */
  async getMindMapByNoteId(noteId: string): Promise<MindMapData | null> {
    try {
      const result = await queryOne(`
        SELECT * FROM mind_maps 
        WHERE note_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `, [noteId, DEMO_USER_ID])

      if (!result) return null

      return {
        ...result,
        nodes: JSON.parse(result.nodes),
        edges: JSON.parse(result.edges),
        metadata: JSON.parse(result.metadata)
      }
    } catch (error) {
      console.error('Failed to fetch mind map:', error)
      return null
    }
  }

  /**
   * Get mind map by ID
   */
  async getMindMapById(mindMapId: string): Promise<MindMapData | null> {
    try {
      const result = await queryOne(`
        SELECT * FROM mind_maps 
        WHERE id = $1 AND user_id = $2
      `, [mindMapId, DEMO_USER_ID])

      if (!result) return null

      return {
        ...result,
        nodes: JSON.parse(result.nodes),
        edges: JSON.parse(result.edges),
        metadata: JSON.parse(result.metadata)
      }
    } catch (error) {
      console.error('Failed to fetch mind map by ID:', error)
      return null
    }
  }

  /**
   * Update mind map
   */
  async updateMindMap(mindMapId: string, updates: Partial<MindMapData>): Promise<MindMapData | null> {
    try {
      const result = await queryOne(`
        UPDATE mind_maps 
        SET 
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          nodes = COALESCE($4, nodes),
          edges = COALESCE($5, edges),
          layout = COALESCE($6, layout),
          theme = COALESCE($7, theme),
          metadata = COALESCE($8, metadata)
        WHERE id = $1 AND user_id = $9
        RETURNING *
      `, [
        mindMapId,
        updates.title,
        updates.description,
        updates.nodes ? JSON.stringify(updates.nodes) : null,
        updates.edges ? JSON.stringify(updates.edges) : null,
        updates.layout,
        updates.theme,
        updates.metadata ? JSON.stringify(updates.metadata) : null,
        DEMO_USER_ID
      ])

      if (!result) return null

      return {
        ...result,
        nodes: JSON.parse(result.nodes),
        edges: JSON.parse(result.edges),
        metadata: JSON.parse(result.metadata)
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'update_mindmap', { mindMapId })
      throw error
    }
  }
}