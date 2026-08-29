import type { NodeId } from "../domain/types.js";

export const routeByNodeId: Readonly<Record<NodeId, string>> = {
  profile: "/profile/",
  haia: "/work/haia/",
  ilac: "/work/haia/ilac/",
  publications: "/",
  axians: "/experience/axians/",
  networked: "/projects/networked/",
  "embedded-lab": "/projects/embedded-lab/",
  "applications-lab": "/projects/applications-lab/",
  "vision-ml": "/projects/vision-ml/",
  "quant-research": "/projects/quant-research/",
  education: "/education/",
  skills: "/skills/",
  contact: "/contact/",
};


export const resumeRouteByNodeId: Readonly<Record<NodeId, string>> = {
  profile: "/resume.html#about",
  haia: "/resume.html#experience",
  ilac: "/resume.html#systems",
  publications: "/resume.html#publications",
  axians: "/resume.html#experience",
  networked: "/resume.html#projects",
  "embedded-lab": "/resume.html#projects",
  "applications-lab": "/resume.html#projects",
  "vision-ml": "/resume.html#projects",
  "quant-research": "/resume.html#projects",
  education: "/resume.html#education",
  skills: "/resume.html#skills",
  contact: "/resume.html#contact",
};

export const resumeRouteLabelByNodeId: Readonly<Record<NodeId, string>> = {
  profile: "OPEN ABOUT IN RESUME ↗",
  haia: "OPEN EXPERIENCE IN RESUME ↗",
  ilac: "OPEN ILAC IN RESUME ↗",
  publications: "OPEN PUBLICATIONS IN RESUME ↗",
  axians: "OPEN EXPERIENCE IN RESUME ↗",
  networked: "OPEN PROJECTS IN RESUME ↗",
  "embedded-lab": "OPEN PROJECTS IN RESUME ↗",
  "applications-lab": "OPEN PROJECTS IN RESUME ↗",
  "vision-ml": "OPEN PROJECTS IN RESUME ↗",
  "quant-research": "OPEN PROJECTS IN RESUME ↗",
  education: "OPEN EDUCATION IN RESUME ↗",
  skills: "OPEN SKILLS IN RESUME ↗",
  contact: "OPEN CONTACT IN RESUME ↗",
};
export const stableRouteLabelByNodeId: Readonly<Partial<Record<NodeId, string>>> = {
  profile: "OPEN SHAREABLE PROFILE",
  haia: "OPEN SHAREABLE WORK PAGE",
  ilac: "OPEN SHAREABLE CASE STUDY",
  axians: "OPEN SHAREABLE CASE STUDY",
  networked: "OPEN SHAREABLE PROJECT PAGE",
  "embedded-lab": "OPEN SHAREABLE PROJECT PAGE",
  "applications-lab": "OPEN SHAREABLE PROJECT PAGE",
  "vision-ml": "OPEN SHAREABLE PROJECT PAGE",
  "quant-research": "OPEN SHAREABLE PROJECT PAGE",
  education: "OPEN EDUCATION PAGE",
  skills: "OPEN CAPABILITIES PAGE",
  contact: "OPEN CONTACT PAGE",
};

export interface NodeEvidenceMeta {
  readonly context: string;
  readonly ownership: string;
  readonly status: string;
  readonly source: string;
}

export const nodeEvidenceMetaById: Readonly<Record<NodeId, NodeEvidenceMeta>> = {
  profile: { context: "Professional profile", ownership: "Nicholas Le Roux", status: "Current", source: "Portfolio + resume" },
  haia: { context: "Professional", ownership: "Team environment / individual engineering contribution", status: "Active", source: "Professional work" },
  ilac: { context: "Professional · Haia Consultancy", ownership: "Lead developer · architecture owner · two-person team", status: "Proof of concept demonstrated", source: "Private professional source" },
  publications: { context: "Professional · Industry contribution", ownership: "No. 26 Author / main contributor · No. 27 Sole Author", status: "No. 26 released · No. 27 final-draft source reviewed", source: "IFSF bulletin source material" },
  axians: { context: "Professional internship", ownership: "Individual engineering contribution", status: "Completed", source: "Professional work" },
  networked: { context: "Academic", ownership: "Coursework projects", status: "Completed", source: "Public GitHub" },
  "embedded-lab": { context: "Academic", ownership: "Team project", status: "Completed", source: "Public GitHub" },
  "applications-lab": { context: "Academic", ownership: "Team/coursework projects", status: "Completed", source: "Public GitHub" },
  "vision-ml": { context: "Academic", ownership: "Team + individual experiments", status: "Completed", source: "Public GitHub" },
  "quant-research": { context: "Academic · Yonsei", ownership: "Group project · 3 engineers", status: "Completed", source: "Public GitHub" },
  education: { context: "Education", ownership: "Avans + Yonsei", status: "Completed", source: "Academic record + project evidence" },
  skills: { context: "Capability map", ownership: "Evidence-linked", status: "Current", source: "Portfolio projects + professional work" },
  contact: { context: "Professional contact", ownership: "Direct", status: "Open", source: "Email · GitHub · LinkedIn" },
};
