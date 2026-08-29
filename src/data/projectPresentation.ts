import type { NodeId } from "../domain/types.js";

export interface ProjectPresentationMeta {
  readonly role: string;
  readonly team: string;
  readonly period: string;
  readonly status: string;
  readonly impact: string;
  readonly badges: readonly string[];
}

export const projectPresentationMetaById: Readonly<Partial<Record<NodeId, ProjectPresentationMeta>>> = {
  haia: {
    role: "Embedded Software Engineer",
    team: "Consultancy / engineering team",
    period: "2024-Present",
    status: "Active",
    impact: "Industrial protocol modernization, IFSF engineering support, and connected-system delivery",
    badges: ["EMBEDDED SOFTWARE ENGINEER", "INDUSTRIAL SYSTEMS", "IFSF + LON"],
  },
  ilac: {
    role: "Lead Developer",
    team: "2 engineers",
    period: "2024-Present",
    status: "Active",
    impact: "REST ↔ IFSF LON interoperability for installed Price Pole equipment",
    badges: ["LEAD DEVELOPER", "SYSTEM ARCHITECT", "TEAM OF 2"],
  },
  publications: {
    role: "Technical Author",
    team: "Industry review contributors",
    period: "2025-2026",
    status: "Released / final draft",
    impact: "Migration guidance for LON hardware lifecycle risk and Price Pole API-to-LON conversion",
    badges: ["TECHNICAL AUTHOR", "IFSF", "INDUSTRY CONTRIBUTION"],
  },
  axians: {
    role: "Software Engineering Intern",
    team: "Individual engineering contribution",
    period: "2021-2022",
    status: "Completed",
    impact: "Reusable C++ IoT architecture estimated to save about 40 engineering hours per month",
    badges: ["C++ IOT", "REUSABLE ARCHITECTURE", "MEASURABLE IMPACT"],
  },
  networked: {
    role: "Developer",
    team: "Individual coursework projects",
    period: "2019-2025",
    status: "Completed",
    impact: "TCP/IP socket programming and client/server application architecture",
    badges: ["NETWORK PROGRAMMING", "CLIENT/SERVER", "TCP/IP"],
  },
  "embedded-lab": {
    role: "Embedded Developer",
    team: "Academic team",
    period: "2019-2025",
    status: "Completed",
    impact: "Connected embedded systems integrating peripherals, Wi-Fi, HTTP, and physical controls",
    badges: ["EMBEDDED", "PHYSICAL COMPUTING", "CONNECTED DEVICES"],
  },
  "applications-lab": {
    role: "Application Developer",
    team: "Academic teams / coursework",
    period: "2019-2025",
    status: "Completed",
    impact: "Desktop software, external integrations, and user-facing application architecture",
    badges: ["APPLICATION SOFTWARE", "DESKTOP", "INTEGRATION"],
  },
  "vision-ml": {
    role: "Developer",
    team: "Team + individual experiments",
    period: "2019-2025",
    status: "Completed",
    impact: "Interactive graphics, computer vision, gesture recognition, and machine-learning experimentation",
    badges: ["C++ / OPENGL", "COMPUTER VISION", "MACHINE LEARNING"],
  },
  "quant-research": {
    role: "Academic Developer",
    team: "3 engineers",
    period: "2022-2023",
    status: "Completed",
    impact: "Research replication and abnormal-return analysis using historical financial data",
    badges: ["GROUP PROJECT", "TEAM OF 3", "PYTHON + QUANTITATIVE RESEARCH"],
  },
};
