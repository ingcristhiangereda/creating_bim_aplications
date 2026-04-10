import * as OBC from "@thatopen/components";
import { createWorld, setupDataEnhancer, setupFragmentsManager, setupHighlighter, setupIfcLoader, setupItemsFinder, setupSmartViews } from "./src";
import * as BUI from "@thatopen/ui"
import { loadModelBtnTemplate } from "../../ui-templates";

export const setupComponents = async () => {
  const components = new OBC.Components();
  const { world, viewport } = createWorld(components)

  setupIfcLoader(components)
  setupFragmentsManager(components, world)
  setupHighlighter(components, world)
  setupItemsFinder(components)
  setupDataEnhancer(components)
  await setupSmartViews(components, world)

  components.init()

  return { components, viewport }
}
