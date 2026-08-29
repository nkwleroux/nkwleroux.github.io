import { siteConfig } from "../config/site.js";
import { createElement } from "../core/dom.js";
import type { DetailBlock } from "../domain/types.js";

const makeSection = (label: string): HTMLElement => {
  const section = createElement("section", "panel-section");
  section.append(createElement("span", undefined, label));
  return section;
};

export const renderDetailBlock = (block: DetailBlock): HTMLElement => {
  switch (block.type) {
    case "text": {
      const section = makeSection(block.label);
      if (block.heading) section.append(createElement("h3", undefined, block.heading));
      for (const paragraph of block.paragraphs) section.append(createElement("p", undefined, paragraph));
      if (block.bullets) {
        const list = createElement("ul");
        for (const bullet of block.bullets) list.append(createElement("li", undefined, bullet));
        section.append(list);
      }
      return section;
    }
    case "timeline": {
      const section = makeSection(block.label);
      const timeline = createElement("div", "career-path");
      for (const entry of block.entries) {
        const item = createElement("div");
        item.append(createElement("span", undefined, entry.period), createElement("b", undefined, entry.title));
        timeline.append(item);
      }
      section.append(timeline);
      return section;
    }
    case "impact": {
      const section = makeSection(block.label);
      const number = createElement("div", "impact-number", block.value);
      number.append(createElement("small", undefined, ` ${block.suffix}`));
      section.append(number, createElement("p", undefined, block.text));
      return section;
    }
    case "bridge": {
      const section = makeSection(block.label);
      const diagram = createElement("div", "system-bridge");
      block.nodes.forEach((node, index) => {
        const card = createElement("div", node.accent ? "bridge-core" : undefined);
        card.append(createElement("b", undefined, node.title), createElement("small", undefined, node.caption));
        diagram.append(card);
        const connector = block.connectors[index];
        if (connector) diagram.append(createElement("i", undefined, connector));
      });
      section.append(diagram);
      return section;
    }
    case "architecture": {
      const section = makeSection(block.label);
      const diagram = createElement("div", "architecture-panel");
      for (const node of block.nodes) {
        const card = createElement("div", node.accent ? "accent" : undefined);
        card.append(createElement("b", undefined, node.title), createElement("small", undefined, node.caption));
        diagram.append(card);
      }
      section.append(diagram);
      return section;
    }
    case "capabilities": {
      const section = makeSection(block.label);
      const list = createElement("div", "stack-list");
      for (const group of block.groups) {
        const item = createElement("div");
        item.append(createElement("span", undefined, group.label), createElement("b", undefined, group.value));
        list.append(item);
      }
      section.append(list);
      return section;
    }
    case "projects": {
      const section = makeSection(block.label);
      const list = createElement("div", "project-list");
      for (const project of block.projects) {
        const card = createElement("article", "project-list-card");
        const meta = createElement("span", "project-list-meta", project.category);
        const roleBadges = createElement("div", "project-list-role-badges");
        roleBadges.append(createElement("span", undefined, project.ownership.toUpperCase()));
        const primaryArea = project.areas[0];
        if (primaryArea) roleBadges.append(createElement("span", undefined, primaryArea.toUpperCase()));
        const evidence = createElement("div", "project-list-evidence");
        for (const [label, value] of [
          ["CONTEXT", project.context],
          ["STATUS", project.status],
          ["SOURCE", project.source],
        ] as const) {
          const item = createElement("div");
          item.append(createElement("span", undefined, label), createElement("b", undefined, value));
          evidence.append(item);
        }
        const title = createElement("h3", undefined, project.title);
        const description = createElement("p", undefined, project.description);
        const areas = createElement("div", "project-area-tags");
        for (const area of project.areas) areas.append(createElement("span", undefined, area));
        const links = createElement("div", "project-repo-links");
        const repositories = project.repositories ?? [{ label: "VIEW ON GITHUB", url: project.githubUrl }];
        for (const repository of repositories) {
          const link = createElement("a", "project-github-link", `${repository.label} ↗`);
          link.href = repository.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          links.append(link);
        }
        card.append(meta, roleBadges, evidence, title, description, areas, links);
        list.append(card);
      }
      section.append(list);
      return section;
    }
    case "tags": {
      const tags = createElement("div", "tags");
      for (const tag of block.tags) tags.append(createElement("span", undefined, tag));
      return tags;
    }
    case "action": {
      const button = createElement("button", "panel-link as-button", block.label);
      button.type = "button";
      button.dataset["action"] = block.action;
      return button;
    }
    case "links": {
      const section = makeSection(block.label);
      section.append(createElement("h3", undefined, block.heading));
      if (siteConfig.contactFormEnabled) {
        const emailLink = createElement("a", "panel-link", "EMAIL ↗");
        emailLink.href = `mailto:${siteConfig.email}`;
        section.append(emailLink, document.createElement("br"));
      } else {
        section.append(
          createElement("span", "panel-link is-disabled", `EMAIL // ${siteConfig.email}`),
          document.createElement("br"),
        );
      }

      const links = [
        ["GITHUB ↗", siteConfig.githubUrl],
        ["LINKEDIN ↗", siteConfig.linkedInUrl],
      ] as const;
      for (const [label, href] of links) {
        const link = createElement("a", "panel-link", label);
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        section.append(link, document.createElement("br"));
      }
      return section;
    }
  }
};
