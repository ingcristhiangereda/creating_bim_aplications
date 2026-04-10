import * as BUI from "@thatopen/ui"
import { SmartViews } from "../../../../bim-components"
import { SmartViewsListState, SmartViewsListTableData } from "./types"

export const smartViewsListTemplate: BUI.StatefullComponent<SmartViewsListState> = (state) => {
  const { components } = state
  const smartViews = components.get(SmartViews)

  const onCreated = (e?: Element) => {
    if (!e) return
    const table = e as BUI.Table<SmartViewsListTableData>
    const data: typeof table.data = []

    for (const [id, view] of smartViews.list) {
      data.push({
        data: {
          ID: id,
          Name: view.name,
          CreatedAt: view.createdAt,
          Actions: "",
        },
      })
    }

    table.data = data
  }

  return BUI.html`<bim-table ${BUI.ref(onCreated)}></bim-table>`
}
