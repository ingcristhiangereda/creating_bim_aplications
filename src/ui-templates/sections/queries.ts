import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { queriesList } from "../tables/queries";

export interface QueriesPanelState {
  components: OBC.Components;
}

export const queriesPanelTemplate: BUI.StatefullComponent<
  QueriesPanelState
> = (state) => {
  const { components } = state;
  const finder = components.get(OBC.ItemsFinder);
  let queryNameInput: BUI.TextInput | undefined;
  let psetInput: BUI.TextInput | undefined;
  let propertyInput: BUI.TextInput | undefined;
  let valueInput: BUI.TextInput | undefined;

  const [queriesTable] = queriesList({
    components,
  });

  const onSearch = (e: Event) => {
    const input = e.target as BUI.TextInput;
    queriesTable.queryString = input.value;
  };

  const toExactRegex = (value: string) => {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped}$`, "i");
  };

  const parseValue = (value: string) => {
    const trimmed = value.trim();
    const lowered = trimmed.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && trimmed !== "") return asNumber;
    return toExactRegex(trimmed);
  };

  const onCreateQuery = () => {
    if (!queryNameInput || !psetInput || !propertyInput || !valueInput) return;

    const name = queryNameInput.value.trim();
    const pset = psetInput.value.trim();
    const property = propertyInput.value.trim();
    const value = valueInput.value.trim();

    if (!name || !pset || !property || !value) {
      alert("Fill in Query Name, Property Set, Property Name and Value.");
      return;
    }

    if (finder.list.get(name)) {
      alert(`A query named "${name}" already exists.`);
      return;
    }

    finder.create(name, [
      {
        relation: {
          name: "IsDefinedBy",
          query: {
            attributes: {
              queries: [{ name: /Name/, value: toExactRegex(pset) }],
            },
            relation: {
              name: "HasProperties",
              query: {
                attributes: {
                  queries: [
                    { name: /Name/, value: toExactRegex(property) },
                    { name: /NominalValue/, value: parseValue(value) },
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    queryNameInput.value = "";
    psetInput.value = "";
    propertyInput.value = "";
    valueInput.value = "";
  };

  const downloadFile = (name: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onDownloadQueries = () => {
    const serialized = finder.export();
    const content = JSON.stringify(serialized, null, 2);
    downloadFile("items-finder-queries.json", content, "application/json");
  };

  const onUploadQueries = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        finder.import(parsed);
      } catch (error) {
        alert("Invalid queries file. Expected a valid ItemsFinder export JSON.");
      }
    });

    input.click();
  };

  return BUI.html`
  <bim-panel-section fixed label="Queries List">
    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
      <bim-text-input @input=${onSearch} placeholder="Search..." debounce="200"></bim-text-input>
    </div>
    <div style="display: grid; gap: 0.5rem; margin-bottom: 0.5rem;">
      <bim-text-input ${BUI.ref((el?: Element) => queryNameInput = el as BUI.TextInput)} placeholder="Query name"></bim-text-input>
      <bim-text-input ${BUI.ref((el?: Element) => psetInput = el as BUI.TextInput)} placeholder="Property Set (e.g. Pset_WallCommon)"></bim-text-input>
      <bim-text-input ${BUI.ref((el?: Element) => propertyInput = el as BUI.TextInput)} placeholder="Property Name (e.g. IsExternal)"></bim-text-input>
      <bim-text-input ${BUI.ref((el?: Element) => valueInput = el as BUI.TextInput)} placeholder="Property Value (e.g. true, 120, Exterior)"></bim-text-input>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <bim-button style="flex: 0;" label="Create Query" @click=${onCreateQuery}></bim-button>
        <bim-button style="flex: 0;" label="Download Queries" @click=${onDownloadQueries}></bim-button>
        <bim-button style="flex: 0;" label="Upload Queries" @click=${onUploadQueries}></bim-button>
      </div>
    </div>
    ${queriesTable}
  </bim-panel-section>`;
};
