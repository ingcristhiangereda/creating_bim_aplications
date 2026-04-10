import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import { DataSourcesListState, DataSourcesTableData } from "./types";
import { DataEnhancer } from "../../../../bim-components";

export const setDefaults = (
  state: DataSourcesListState,
  table: BUI.Table<DataSourcesTableData>,
) => {
  const { components } = state

  table.noIndentation = true
  table.hiddenColumns = ["__source", "__entryIndex"]
  table.addEventListener("rowcreated", (e: CustomEvent<BUI.RowCreatedEventDetail<DataSourcesTableData>>) => {
    const { row } = e.detail
    row.style.cursor = "pointer"
    row.addEventListener("click", async () => {
      const enhancer = components.get(DataEnhancer)
      const source = row.data.__source
      const entryIndex = row.data.__entryIndex
      if (!source || typeof entryIndex !== "number") return

      const sourceData = await enhancer.getSourceData(source)
      const sourceEntry = sourceData[entryIndex]
      if (!sourceEntry) return

      const items = await enhancer.findItemsWithSameSourceData(source, sourceEntry)
      const highlighter = components.get(OBF.Highlighter)
      await highlighter.highlightByID("select", items)
    })
  })
}
