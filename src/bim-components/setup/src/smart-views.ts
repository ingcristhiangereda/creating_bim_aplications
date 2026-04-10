import * as OBC from "@thatopen/components"
import { SmartViews, SmartViewsSerializedData } from "../../SmartViews"
import { getDocument, updateDocument } from "../../../firebase"

interface ProjectSmartViewsDoc {
  smartViews?: SmartViewsSerializedData
}

const getProjectIdFromUrl = () => {
  const match = location.pathname.match(/\/project\/([^\/]+)/)
  return match ? match[1] : null
}

export const setupSmartViews = async (components: OBC.Components, world: OBC.World) => {
  const smartViews = components.get(SmartViews)
  smartViews.world = world

  const projectId = getProjectIdFromUrl()
  if (!projectId) return

  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let loadingFromRemote = true

  const saveSmartViews = async () => {
    try {
      const serialized = smartViews.export()
      await updateDocument("/projects", projectId, {
        smartViews: serialized,
      })
      console.log("SmartViews: Saved to Firebase.", { projectId, views: serialized.views.length })
    } catch (error) {
      console.warn("SmartViews: Could not save to Firebase.", error)
    }
  }

  const scheduleSave = () => {
    if (loadingFromRemote) return
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveTimeout = null
      void saveSmartViews()
    }, 300)
  }

  try {
    const projectDoc = await getDocument<ProjectSmartViewsDoc>("/projects", projectId)
    if (projectDoc?.smartViews) {
      smartViews.import(projectDoc.smartViews)
      console.log("SmartViews: Loaded from Firebase.", { projectId, views: projectDoc.smartViews.views.length })
    }
  } catch (error) {
    console.warn("SmartViews: Could not load from Firebase.", error)
  } finally {
    loadingFromRemote = false
  }

  smartViews.list.onItemSet.add(scheduleSave)
  smartViews.list.onItemUpdated.add(scheduleSave)
  smartViews.list.onItemDeleted.add(scheduleSave)
  smartViews.list.onCleared.add(scheduleSave)
}
