import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"
import { SmartViews } from "../../bim-components"
import { smartViewsList } from "../tables/smartviews"

export interface SmartViewsPanelState {
  components: OBC.Components
}

export const smartViewsPanelTemplate: BUI.StatefullComponent<SmartViewsPanelState> = (state) => {
  const { components } = state
  const smartViews = components.get(SmartViews)
  const highlighter = components.get(OBF.Highlighter)

  let viewNameInput: BUI.TextInput | undefined

  const [viewsTable] = smartViewsList({ components })

  const onSearch = (e: Event) => {
    const input = e.target as BUI.TextInput
    viewsTable.queryString = input.value
  }

  const onCreateView = async ({ target: button }: { target: BUI.Button }) => {
    if (!viewNameInput) return
    const name = viewNameInput.value.trim()
    if (!name) {
      alert("Write a view name before creating the Smart View.")
      return
    }

    button.loading = true
    try {
      const selection = highlighter.selection.select
      await smartViews.capture(name, OBC.ModelIdMapUtils.isEmpty(selection) ? undefined : selection)
      viewNameInput.value = ""
    } finally {
      button.loading = false
    }
  }

  const downloadFile = (name: string, content: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const onDownloadViews = () => {
    const serialized = smartViews.export()
    const content = JSON.stringify(serialized, null, 2)
    downloadFile("smart-views.json", content, "application/json")
  }

  const onUploadViews = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"

    input.addEventListener("change", async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const parsed = JSON.parse(text)
        smartViews.import(parsed)
      } catch (_error) {
        alert("Invalid Smart Views file. Expected a valid SmartViews export JSON.")
      }
    })

    input.click()
  }

  return BUI.html`
  <bim-panel-section fixed label="Smart Views">
    <div style="display: grid; gap: 0.5rem; margin-bottom: 0.5rem;">
      <bim-text-input @input=${onSearch} placeholder="Search..." debounce="200"></bim-text-input>
      <bim-text-input ${BUI.ref((el?: Element) => (viewNameInput = el as BUI.TextInput))} placeholder="View name"></bim-text-input>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <bim-button style="flex: 0;" label="Create View" @click=${onCreateView}></bim-button>
        <bim-button style="flex: 0;" label="Download Views" @click=${onDownloadViews}></bim-button>
        <bim-button style="flex: 0;" label="Upload Views" @click=${onUploadViews}></bim-button>
      </div>
    </div>
    ${viewsTable}
  </bim-panel-section>`
}
