import * as OBC from "@thatopen/components"

export interface SmartViewVector3 {
  x: number
  y: number
  z: number
}

export interface SmartViewDefinition {
  id: string
  name: string
  projection: OBC.CameraProjection
  cameraPosition: SmartViewVector3
  cameraTarget: SmartViewVector3
  cameraZoom?: number
  hiddenItems: Record<string, number[]>
  selectionItems?: Record<string, number[]>
  highlightedItems?: Record<string, Record<string, number[]>>
  highlightStyles?: Record<string, Omit<import("@thatopen/fragments").MaterialDefinition, "customId"> | null>
  createdAt: string
}

export interface SmartViewsSerializedData {
  version: 1
  views: SmartViewDefinition[]
}
