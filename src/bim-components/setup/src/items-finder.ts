import * as OBC from "@thatopen/components"

export const setupItemsFinder = (components: OBC.Components) => {
  const finder = components.get(OBC.ItemsFinder);
  finder.create("Walls", [{ categories: [/WALL/] }])
  finder.create("Doors & Windows", [{ categories: [/DOOR/, /WINDOW/] }])
  finder.create("Drywall T7", [
    {
      attributes: {
        queries: [
          { name: /Name/, value: /Muro liviano T7/ }
        ]
      }
    }
  ])

  finder.create("External Walls", [
    {
      categories: [/WALL/],
      relation: {
        name: "IsDefinedBy",
        query: {
          relation: {
            name: "HasProperties",
            query: {
              attributes: {
                queries: [
                  { name: /Name/, value: /IsExternal/ },
                  { name: /NominalValue/, value: true },
                ]
              }
            }
          }
        }
      }
    }
  ])
}