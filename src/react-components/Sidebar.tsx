import * as React from "react";
import * as Router from "react-router-dom";
import { appIcons } from "../globals";

export function Sidebar() {
  return (
    <aside id="sidebar">
      <img id="company-logo" src="./assets/company-logo.svg" alt="Construction Company" />
      <ul id="nav-buttons">
        <Router.Link to="/">
          <bim-button icon={appIcons.PROJECT} label="Projects"></bim-button>
        </Router.Link>
        <bim-button icon={appIcons.USER} label="Users"></bim-button>
      </ul>
    </aside>
  )
}