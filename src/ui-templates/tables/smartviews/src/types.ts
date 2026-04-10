import * as OBC from "@thatopen/components"

export interface SmartViewsListState {
  components: OBC.Components
}

export type SmartViewsListTableData = {
  ID: string
  Name: string
  CreatedAt: string
  Actions: string
}
