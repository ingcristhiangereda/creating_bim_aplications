import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";

export interface DataSourcesListState {
  components: OBC.Components;
  source?: string;
}

export type DataSourcesTableData = Record<string, BUI.TableCellValue> & {
  __source: string;
  __entryIndex: number;
};
