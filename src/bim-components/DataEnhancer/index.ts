import * as OBC from "@thatopen/components"
import * as FRAGS from "@thatopen/fragments"
import { DataEnhancerSource } from "./src";

export class DataEnhancer extends OBC.Component {
  static uuid = "d9d41a68-2606-4c61-9e86-af6b675758ef" as const
  enabled = true;

  private _sourcesDataCache: Record<string, any[]> = {}

  readonly sources = new FRAGS.DataMap<string, DataEnhancerSource>()

  async getSourceData(source: string) {
    const sourceConfig = this.sources.get(source)
    if (!sourceConfig) {
      throw new Error(`DataEnhancer: Source "${source}" not found`)
    }

    let data = this._sourcesDataCache[source]
    if (!data) {
      data = await sourceConfig.data()
      this._sourcesDataCache[source] = data
    }

    return data
  }

  async getData(items: OBC.ModelIdMap) {
    const fragments = this.components.get(OBC.FragmentsManager)
    const result: OBC.ModelIdDataMap<Record<string, any[]>> = new FRAGS.DataMap()
    for (const [modelId, _localIds] of Object.entries(items)) {
      const model = fragments.list.get(modelId)
      if (!model) continue
      const localIds = [..._localIds]
      const itemsData = await model.getItemsData(localIds)
      for (const [source, config] of this.sources.entries()) {
        const sourceData = await this.getSourceData(source)
        for (const [index, attributes] of itemsData.entries()) {
          const itemExternalData = config.matcher(attributes, sourceData)
          if (!itemExternalData) continue

          let modelResult = result.get(modelId)
          if (!modelResult) {
            modelResult = new FRAGS.DataMap()
            result.set(modelId, modelResult)
          }

          const localId = localIds[index]
          let itemSources = modelResult.get(localId)
          if (!itemSources) {
            itemSources = {}
            modelResult.set(localId, itemSources)
          }

          itemSources[source] = itemExternalData
        }
      }
    }

    return result
  }

  async findItemsWithSameSourceData(
    source: string,
    sourceEntry: unknown,
    items?: OBC.ModelIdMap,
  ) {
    const sourceConfig = this.sources.get(source)
    if (!sourceConfig) {
      throw new Error(`DataEnhancer: Source "${source}" not found`)
    }

    const fragments = this.components.get(OBC.FragmentsManager)
    const sourceData = await this.getSourceData(source)
    const targetKey = this.getComparableEntryKey(sourceEntry)
    const result: OBC.ModelIdMap = {}

    const modelIds = items ? Object.keys(items) : [...fragments.list.keys()]

    for (const modelId of modelIds) {
      const model = fragments.list.get(modelId)
      if (!model) continue

      const localIds = items ? [...items[modelId]] : await model.getLocalIds()
      if (localIds.length === 0) continue

      const itemsData = await model.getItemsData(localIds)
      for (const [index, attributes] of itemsData.entries()) {
        const itemExternalData = sourceConfig.matcher(attributes, sourceData)
        if (!itemExternalData) continue

        const hasSameSourceData = itemExternalData.some(
          (entry) => this.getComparableEntryKey(entry) === targetKey,
        )
        if (!hasSameSourceData) continue

        OBC.ModelIdMapUtils.append(result, modelId, localIds[index])
      }
    }

    return result
  }

  private getComparableEntryKey(value: unknown) {
    const normalized = this.normalizeComparableValue(value)
    return JSON.stringify(normalized)
  }

  private normalizeComparableValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.normalizeComparableValue(entry))
    }

    if (value && typeof value === "object") {
      const orderedEntries = Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, entry]) => [key, this.normalizeComparableValue(entry)])

      return Object.fromEntries(orderedEntries)
    }

    return value
  }
}
