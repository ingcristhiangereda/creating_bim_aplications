import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"
import * as THREE from "three"
import * as FRAGS from "@thatopen/fragments"
import { SmartViewDefinition, SmartViewsSerializedData } from "./src/types"
export * from "./src"

export class SmartViews extends OBC.Component {
  static uuid = "2fa38b8f-9258-442e-80fb-52ef7f4f2aa5" as const
  enabled = true
  world: OBC.World | null = null

  readonly list = new FRAGS.DataMap<string, SmartViewDefinition>()

  async capture(name: string, selection?: OBC.ModelIdMap) {
    const view = await this.getCurrentViewDefinition(name, selection)
    this.list.set(view.id, view)
    return view
  }

  async update(id: string, selection?: OBC.ModelIdMap) {
    const previous = this.list.get(id)
    if (!previous) {
      throw new Error(`SmartViews: View "${id}" not found.`)
    }

    const view = await this.getCurrentViewDefinition(
      previous.name,
      selection,
      previous.id,
      previous.createdAt,
    )

    this.list.set(id, view)
    return view
  }

  async go(id: string, config?: { transition?: boolean; applyVisibility?: boolean; applyHighlights?: boolean }) {
    const view = this.list.get(id)
    if (!view) {
      throw new Error(`SmartViews: View "${id}" not found.`)
    }

    if (!this.world) {
      throw new Error("SmartViews: No world has been assigned.")
    }

    if (!(this.world.camera instanceof OBC.OrthoPerspectiveCamera)) {
      throw new Error("SmartViews: OrthoPerspectiveCamera is required to open smart views.")
    }

    await this.world.camera.projection.set(view.projection)

    await this.world.camera.controls.setLookAt(
      view.cameraPosition.x,
      view.cameraPosition.y,
      view.cameraPosition.z,
      view.cameraTarget.x,
      view.cameraTarget.y,
      view.cameraTarget.z,
      config?.transition ?? true,
    )

    if (typeof view.cameraZoom === "number") {
      this.world.camera.three.zoom = view.cameraZoom
      this.world.camera.three.updateProjectionMatrix()
    }

    const applyVisibility = config?.applyVisibility ?? true
    if (applyVisibility) {
      const hider = this.components.get(OBC.Hider)
      await hider.set(true)
      const hiddenItems = OBC.ModelIdMapUtils.fromRaw(view.hiddenItems)
      if (!OBC.ModelIdMapUtils.isEmpty(hiddenItems)) {
        await hider.set(false, hiddenItems)
      }
    }

    const applyHighlights = config?.applyHighlights ?? true
    if (applyHighlights) {
      const highlighter = this.components.get(OBF.Highlighter)
      await highlighter.clear()

      if (view.highlightStyles) {
        for (const [styleName, style] of Object.entries(view.highlightStyles)) {
          if (!highlighter.styles.has(styleName)) {
            highlighter.styles.set(styleName, style)
          }
        }
      }

      const highlightedItems = view.highlightedItems ?? {}
      for (const [styleName, rawMap] of Object.entries(highlightedItems)) {
        const modelIdMap = OBC.ModelIdMapUtils.fromRaw(rawMap)
        if (OBC.ModelIdMapUtils.isEmpty(modelIdMap)) continue
        await highlighter.highlightByID(styleName, modelIdMap, false, false)
      }
    }

    return view
  }

  export(): SmartViewsSerializedData {
    return {
      version: 1,
      views: [...this.list.values()].map((view) => this.cloneView(view)),
    }
  }

  import(data: SmartViewsSerializedData, options?: { replace?: boolean }) {
    if (!data || data.version !== 1 || !Array.isArray(data.views)) {
      throw new Error("SmartViews: Invalid import data format.")
    }

    const shouldReplace = options?.replace ?? true
    if (shouldReplace) {
      this.list.clear()
    }

    for (const rawView of data.views) {
      if (!rawView || typeof rawView !== "object") continue
      const view = this.normalizeImportedView(rawView)
      this.list.set(view.id, view)
    }
  }

  private async getCurrentViewDefinition(
    name: string,
    selection?: OBC.ModelIdMap,
    id = this.createId(),
    createdAt = new Date().toISOString(),
  ) {
    if (!this.world) {
      throw new Error("SmartViews: No world has been assigned.")
    }

    if (!(this.world.camera instanceof OBC.OrthoPerspectiveCamera)) {
      throw new Error("SmartViews: OrthoPerspectiveCamera is required to capture smart views.")
    }

    const controls = this.world.camera.controls
    const position = new THREE.Vector3()
    const target = new THREE.Vector3()
    controls.getPosition(position)
    controls.getTarget(target)

    const hider = this.components.get(OBC.Hider)
    const hiddenItems = await hider.getVisibilityMap(false)
    const highlighter = this.components.get(OBF.Highlighter)
    const highlightedItems = this.getHighlighterSelectionsAsRaw(highlighter)
    const highlightStyles = this.getHighlighterStylesForSelections(highlighter, highlightedItems)

    return {
      id,
      name,
      projection: this.world.camera.projection.current,
      cameraPosition: { x: position.x, y: position.y, z: position.z },
      cameraTarget: { x: target.x, y: target.y, z: target.z },
      cameraZoom: this.world.camera.three.zoom,
      hiddenItems,
      selectionItems: selection ? OBC.ModelIdMapUtils.toRaw(selection) : undefined,
      highlightedItems,
      highlightStyles,
      createdAt,
    }
  }

  private normalizeImportedView(rawView: SmartViewDefinition): SmartViewDefinition {
    const normalizedId = this.list.get(rawView.id) ? this.createId() : rawView.id
    const projection = rawView.projection === "Orthographic" ? "Orthographic" : "Perspective"

    return {
      id: normalizedId,
      name: rawView.name ?? "Imported View",
      projection,
      cameraPosition: this.toVector3(rawView.cameraPosition),
      cameraTarget: this.toVector3(rawView.cameraTarget),
      cameraZoom: typeof rawView.cameraZoom === "number" ? rawView.cameraZoom : undefined,
      hiddenItems: this.normalizeRawModelIdMap(rawView.hiddenItems),
      selectionItems: rawView.selectionItems ? this.normalizeRawModelIdMap(rawView.selectionItems) : undefined,
      highlightedItems: rawView.highlightedItems ? this.normalizeNestedRawModelIdMap(rawView.highlightedItems) : undefined,
      highlightStyles: rawView.highlightStyles ? this.normalizeHighlightStyles(rawView.highlightStyles) : undefined,
      createdAt: rawView.createdAt ?? new Date().toISOString(),
    }
  }

  private normalizeRawModelIdMap(raw?: Record<string, number[]>) {
    const normalized: Record<string, number[]> = {}
    if (!raw) return normalized

    for (const [modelId, localIds] of Object.entries(raw)) {
      if (!Array.isArray(localIds)) continue
      normalized[modelId] = localIds
        .filter((localId): localId is number => typeof localId === "number" && Number.isFinite(localId))
        .map((localId) => Math.trunc(localId))
    }

    return normalized
  }

  private normalizeNestedRawModelIdMap(raw?: Record<string, Record<string, number[]>>) {
    const normalized: Record<string, Record<string, number[]>> = {}
    if (!raw) return normalized

    for (const [styleName, modelMap] of Object.entries(raw)) {
      normalized[styleName] = this.normalizeRawModelIdMap(modelMap)
    }

    return normalized
  }

  private normalizeHighlightStyles(styles?: Record<string, Omit<FRAGS.MaterialDefinition, "customId"> | null>) {
    const normalized: Record<string, Omit<FRAGS.MaterialDefinition, "customId"> | null> = {}
    if (!styles) return normalized

    for (const [styleName, style] of Object.entries(styles)) {
      normalized[styleName] = style
    }

    return normalized
  }

  private getHighlighterSelectionsAsRaw(highlighter: OBF.Highlighter) {
    const highlightedItems: Record<string, Record<string, number[]>> = {}

    for (const [styleName, modelIdMap] of Object.entries(highlighter.selection)) {
      if (!modelIdMap || OBC.ModelIdMapUtils.isEmpty(modelIdMap)) continue
      highlightedItems[styleName] = OBC.ModelIdMapUtils.toRaw(modelIdMap)
    }

    return highlightedItems
  }

  private getHighlighterStylesForSelections(
    highlighter: OBF.Highlighter,
    highlightedItems: Record<string, Record<string, number[]>>,
  ) {
    const styles: Record<string, Omit<FRAGS.MaterialDefinition, "customId"> | null> = {}

    for (const styleName of Object.keys(highlightedItems)) {
      const style = highlighter.styles.get(styleName)
      if (!style) continue
      styles[styleName] = style
    }

    return styles
  }

  private toVector3(value?: { x?: number; y?: number; z?: number }) {
    return {
      x: typeof value?.x === "number" ? value.x : 0,
      y: typeof value?.y === "number" ? value.y : 0,
      z: typeof value?.z === "number" ? value.z : 0,
    }
  }

  private cloneView(view: SmartViewDefinition): SmartViewDefinition {
    return {
      ...view,
      cameraPosition: { ...view.cameraPosition },
      cameraTarget: { ...view.cameraTarget },
      hiddenItems: this.normalizeRawModelIdMap(view.hiddenItems),
      selectionItems: view.selectionItems ? this.normalizeRawModelIdMap(view.selectionItems) : undefined,
      highlightedItems: view.highlightedItems ? this.normalizeNestedRawModelIdMap(view.highlightedItems) : undefined,
      highlightStyles: view.highlightStyles ? this.normalizeHighlightStyles(view.highlightStyles) : undefined,
    }
  }

  private createId() {
    if ("randomUUID" in crypto) return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}
