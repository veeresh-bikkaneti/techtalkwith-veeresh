export interface AgentDefinition {
  id: string
  displayName: string
  model: string
  publisher: string
  toolNames: string[]
  spawnableAgents: string[]
  spawnerPrompt: string
  systemPrompt: string
  instructionsPrompt: string
}
