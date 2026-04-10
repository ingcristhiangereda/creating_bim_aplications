import * as BUI from "@thatopen/ui";
import { DataSourcesListState, DataSourcesTableData } from "./src/types";
import { dataSourcesListTemplate } from "./src/template";
import { setDefaults } from "./src/set-defaults";

export const dataSourcesList = (state: DataSourcesListState) => {
  const component = BUI.Component.create<BUI.Table<DataSourcesTableData>, DataSourcesListState>(dataSourcesListTemplate, state);
  const [table] = component;
  setDefaults(state, table)
  return component
};
