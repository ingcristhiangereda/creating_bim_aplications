import * as React from "react";

interface Props {
  onChange: (value: string) => void
}

export function SearchBox(props: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", columnGap: 10, width: "40%" }}>
      <bim-text-input
        debounce="200"
        oninput={(e) => {props.onChange(e.target.value)}}
        placeholder="Search projects by name..."
      ></bim-text-input>
    </div>
  )
}