import * as BUI from "@thatopen/ui"
import { SmartViews } from "../../../../bim-components"
import { appIcons } from "../../../../globals"
import { SmartViewsListState, SmartViewsListTableData } from "./types"

export const setDefaults = (
  state: SmartViewsListState,
  table: BUI.Table<SmartViewsListTableData>,
) => {
  const { components } = state

  table.noIndentation = true
  table.columns = [
    "Name",
    {
      name: "CreatedAt",
      width: "minmax(8rem, 1fr)",
    },
    { name: "Actions", width: "auto" },
  ]

  table.dataTransform = {
    CreatedAt: (value) => {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString()
    },
    Actions: (cellValue, rowData) => {
      const { ID } = rowData
      if (!ID) return cellValue

      const smartViews = components.get(SmartViews)
      if (!smartViews.list.get(ID)) return cellValue

      const onApply = async ({ target: button }: { target: BUI.Button }) => {
        button.loading = true
        try {
          await smartViews.go(ID)
        } finally {
          button.loading = false
        }
      }

      const onUpdate = async ({ target: button }: { target: BUI.Button }) => {
        button.loading = true
        try {
          await smartViews.update(ID)
        } finally {
          button.loading = false
        }
      }

      return BUI.html`
        <div style="display: flex; gap: 0.35rem;">
          <bim-button style="flex: 0;" icon=${appIcons.APPLY} @click=${onApply}></bim-button>
          <bim-button style="flex: 0;" icon=${appIcons.REFRESH} @click=${onUpdate}></bim-button>
        </div>
      `
    },
  }
}
