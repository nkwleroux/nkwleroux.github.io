export type NodeId =
  | "profile"
  | "haia"
  | "ilac"
  | "publications"
  | "axians"
  | "networked"
  | "embedded-lab"
  | "applications-lab"
  | "vision-ml"
  | "quant-research"
  | "education"
  | "skills"
  | "contact";

export type Sector = "physical" | "interface" | "application";
export type StatusTone = "neutral" | "live" | "build" | "bridge";
export type MissionGroup = "entry" | "professional" | "projects" | "academic" | "contact";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Stat {
  readonly label: string;
  readonly value: string;
}

export interface TimelineEntry {
  readonly period: string;
  readonly title: string;
}

export interface DiagramNode {
  readonly title: string;
  readonly caption: string;
  readonly accent?: boolean;
}

export interface CapabilityGroup {
  readonly label: string;
  readonly value: string;
}

export interface ProjectRepository {
  readonly label: string;
  readonly url: string;
}

export interface ProjectEntry {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly context: string;
  readonly ownership: string;
  readonly status: string;
  readonly source: string;
  readonly githubUrl: string;
  readonly repositories?: readonly ProjectRepository[];
  readonly description: string;
  readonly areas: readonly string[];
}

export type DetailBlock =
  | {
      readonly type: "text";
      readonly label: string;
      readonly heading?: string;
      readonly paragraphs: readonly string[];
      readonly bullets?: readonly string[];
    }
  | {
      readonly type: "timeline";
      readonly label: string;
      readonly entries: readonly TimelineEntry[];
    }
  | {
      readonly type: "impact";
      readonly label: string;
      readonly value: string;
      readonly suffix: string;
      readonly text: string;
    }
  | {
      readonly type: "bridge";
      readonly label: string;
      readonly nodes: readonly DiagramNode[];
      readonly connectors: readonly string[];
    }
  | {
      readonly type: "architecture";
      readonly label: string;
      readonly nodes: readonly DiagramNode[];
    }
  | {
      readonly type: "capabilities";
      readonly label: string;
      readonly groups: readonly CapabilityGroup[];
    }
  | {
      readonly type: "projects";
      readonly label: string;
      readonly projects: readonly ProjectEntry[];
    }
  | {
      readonly type: "tags";
      readonly tags: readonly string[];
    }
  | {
      readonly type: "action";
      readonly label: string;
      readonly action: "open-layers";
    }
  | {
      readonly type: "links";
      readonly label: string;
      readonly heading: string;
    };

export interface NodeDetail {
  readonly kicker: string;
  readonly title: string;
  readonly lede: string;
  readonly stats: readonly Stat[];
  readonly blocks: readonly DetailBlock[];
}

export interface CategoryHub {
  readonly id: MissionGroup;
  readonly label: string;
  readonly subtitle: string;
  readonly position: Point;
  readonly sector: Sector;
  readonly missionIds: readonly NodeId[];
  readonly mergedMissionId?: NodeId;
}

export interface PortfolioNode {
  readonly id: NodeId;
  readonly index: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly statusTone: StatusTone;
  readonly position: Point;
  readonly sector: Sector;
  readonly missionGroup: MissionGroup;
  readonly locationLabel: string;
  readonly detail: NodeDetail;
}

export interface NetworkRoute {
  readonly id: string;
  readonly from: MissionGroup;
  readonly to: MissionGroup;
  readonly path: string;
}
