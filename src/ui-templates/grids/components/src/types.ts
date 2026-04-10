import * as BUI from "@thatopen/ui";
import { DataSourcesPanelState, ItemsDataPanelState, ModelsPanelState, QueriesPanelState, SmartViewsPanelState } from "../../../sections";

type Viewport = {
  name: "viewport";
  state: {};
}

export type ItemsData = {
  name: "itemsData";
  state: ItemsDataPanelState
}

export type Queries = {
  name: "queries";
  state: QueriesPanelState
}

export type DataSources = {
  name: "datasources";
  state: DataSourcesPanelState
}

export type SmartViews = {
  name: "smartviews";
  state: SmartViewsPanelState
}

export type Models = {
  name: "models";
  state: ModelsPanelState
}

type ComponentsGridElements = [Viewport, ItemsData, Models, Queries, DataSources, SmartViews];
type ComponentsGridLayouts = ["Models", "Queries", "Viewer"];

export type ComponentsGrid = BUI.Grid<ComponentsGridLayouts, ComponentsGridElements>
