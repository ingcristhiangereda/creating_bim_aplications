import * as OBC from "@thatopen/components"

export const setupIfcLoader = (components: OBC.Components) => {
  const ifcLoader = components.get(OBC.IfcLoader);
  ifcLoader.settings.autoSetWasm = false // it tells the component we are going to manually configure it
  ifcLoader.settings.wasm = { absolute: true, path: "https://unpkg.com/web-ifc@0.0.71/" } // it sets the path from which the base web-ifc code is going to be taken
}