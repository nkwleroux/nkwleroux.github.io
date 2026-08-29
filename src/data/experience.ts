import type { MissionGroup, NodeId, Point } from "../domain/types.js";

export type WorldView = "network" | "timeline";

export const timelinePositions: Readonly<Record<NodeId, Point>> = {
  profile: { x: 300, y: 1080 },

  // Work experience
  axians: { x: 980, y: 650 },
  haia: { x: 2260, y: 650 },
  ilac: { x: 2720, y: 650 },
  publications: { x: 3000, y: 650 },

  // Education
  education: { x: 660, y: 1060 },
  "quant-research": { x: 1700, y: 1060 },

  // Academic project work
  networked: { x: 920, y: 1460 },
  "applications-lab": { x: 1210, y: 1460 },
  "embedded-lab": { x: 1500, y: 1460 },
  "vision-ml": { x: 1790, y: 1460 },

  // Capability
  skills: { x: 3030, y: 1810 },
  contact: { x: 3450, y: 1080 },
};

export const timelineMarkers = [
  { x: 520, label: "2019" },
  { x: 980, label: "2021" },
  { x: 1420, label: "2022" },
  { x: 1780, label: "2023" },
  { x: 2240, label: "2024" },
  { x: 2740, label: "2025" },
  { x: 3260, label: "NOW" },
] as const;

export const timelineLanes = [
  { y: 650, label: "WORK EXPERIENCE", detail: "AXIANS → HAIA → ILAC / IFSF" },
  { y: 1060, label: "EDUCATION", detail: "AVANS 2019–2025 · YONSEI AUG 2022–JUL 2023" },
  { y: 1460, label: "ACADEMIC PROJECTS", detail: "NETWORKING · EMBEDDED · APPLICATIONS · VISION / ML" },
  { y: 1810, label: "CAPABILITY", detail: "ENGINEERING CAPABILITY" },
] as const;

export const timelinePeriods = [
  { x: 880, width: 300, y: 535, label: "AXIANS", dates: "AUG 2021–JAN 2022" },
  { x: 2180, width: 1040, y: 535, label: "HAIA CONSULTANCY", dates: "SEP 2024–PRESENT" },
  { x: 520, width: 2260, y: 930, label: "AVANS · COMPUTER ENGINEERING", dates: "2019–2025" },
  { x: 1430, width: 520, y: 1175, label: "YONSEI · COMPUTER SCIENCE", dates: "AUG 2022–JUL 2023" },
  { x: 760, width: 1160, y: 1340, label: "ACADEMIC PROJECT WORK", dates: "DURING AVANS / YONSEI STUDY" },
] as const;

export const categorySummaries: Readonly<Record<MissionGroup, string>> = {
  entry: "Start with the engineer behind the network: embedded systems, industrial protocols, networking, APIs, and full-stack software.",
  professional: "Professional Career is the hub: Haia and Axians orbit it as employer missions, while ILAC and the IFSF Engineering Bulletins sit as smaller connected moons around Haia.",
  projects: "The project constellation covers networking, physical computing, desktop applications, graphics, computer vision, machine learning, and quantitative programming.",
  academic: "Computer Engineering at Avans, Computer Science study abroad at Yonsei, plus the capability matrix connecting tools to real project evidence.",
  contact: "Open a direct channel through email, GitHub, LinkedIn, or the contact form.",
};


export const recruiterTour = [
  "profile",
  "haia",
  "ilac",
  "publications",
  "axians",
  "networked",
  "embedded-lab",
  "skills",
  "contact",
] as const satisfies readonly NodeId[];

export const recruiterSummaries: Readonly<Record<(typeof recruiterTour)[number], string>> = {
  profile: "Embedded Software Engineer working across connected systems — from hardware and industrial protocols through APIs, networking, infrastructure, and application software.",
  haia: "At Haia Consultancy, the work progressed from internship to IFSF Technical Support and then full-time embedded software engineering, with a focus on industrial communication, protocol modernization, and hardware-software integration.",
  ilac: "ILAC is a two-person professional project led by Nicholas. He designed the architecture, supervises the second developer added in 2026, and remains the main technical decision-maker while mapping OpenRetailing Price Pole API operations to IFSF communication over LonWorks.",
  publications: "IFSF Engineering Bulletins 26 and 27 demonstrate standards work beyond implementation: hardware-lifecycle analysis, migration research, protocol mapping, and formal technical communication for industry readers.",
  axians: "At Axians, a modular C++ IoT framework was designed to reduce repeated sensor-integration setup and was estimated to save roughly 40 engineering hours per month.",
  networked: "Networked application work covers Java and C# client/server systems, TCP sockets, shared state, WPF interfaces, and server-side catalogue management.",
  "embedded-lab": "Connected embedded projects combine ESP32 firmware, Wi-Fi, HTTP, I²C/SMBus peripherals, displays, buzzers, touch input, and hardware-software integration.",
  skills: "The capability matrix connects C and C++ systems work to C#, Java, TypeScript, Python, databases, Docker, cloud tooling, observability, desktop software, mobile development, and graphics.",
  contact: "That is the expanded route. Continue exploring the network, open the resume, or use the contact channel to discuss embedded, networking, IoT, backend, or systems engineering work.",
};

export interface TraceStep {
  readonly label: string;
  readonly detail: string;
  readonly code?: string;
}

export interface SignalTrace {
  readonly id: "ilac";
  readonly kicker: string;
  readonly title: string;
  readonly intro: string;
  readonly steps: readonly TraceStep[];
  readonly returnSteps?: readonly TraceStep[];
}

export const signalTraces: Readonly<Record<SignalTrace["id"], SignalTrace>> = {
  ilac: {
    id: "ilac",
    kicker: "TRACE 01 / PROTOCOL BRIDGE",
    title: "REST → IFSF LON",
    intro: "Follow a Price Pole request as ILAC translates a modern API call into legacy operational-technology communication and returns the result.",
    steps: [
      { label: "OPENRETAILING REQUEST", detail: "A Price Pole REST request enters the HTTP API boundary.", code: "HTTP / JSON" },
      { label: "OAT++ ENDPOINT", detail: "The C++ service validates the request and selects the required operation.", code: "C++ / Oat++" },
      { label: "ILAC CONVERSION", detail: "API fields are mapped into the corresponding IFSF data and message structures.", code: "API → protocol" },
      { label: "IFSF MESSAGE", detail: "The converter constructs the required read/write message and binary representation.", code: "BCD / bitfields" },
      { label: "LONTALK / TP/FT-10", detail: "The message is transmitted to installed forecourt equipment over the legacy network.", code: "LonTalk" },
      { label: "PRICE POLE", detail: "The target equipment processes the request and produces an answer or acknowledgement.", code: "OT device" },
    ],
    returnSteps: [
      { label: "ACK / ANSWER", detail: "ILAC parses and validates the returned IFSF message.", code: "IFSF → data" },
      { label: "REST RESPONSE", detail: "The result is converted back into the modern API representation.", code: "JSON / HTTP" },
    ],
  },

};

export interface CaseStudySection {
  readonly number: string;
  readonly label: string;
  readonly body: string;
}

export interface CaseStudy {
  readonly id: NodeId;
  readonly eyebrow: string;
  readonly title: string;
  readonly thesis: string;
  readonly architecture: readonly string[];
  readonly sections: readonly CaseStudySection[];
  readonly proof: readonly string[];
  readonly trace?: SignalTrace["id"];
}

export const caseStudies: Partial<Readonly<Record<NodeId, CaseStudy>>> = {
  ilac: {
    id: "ilac",
    eyebrow: "PROFESSIONAL CASE STUDY / INDUSTRIAL PROTOCOL BRIDGE",
    title: "ILAC — IFSF LON API Converter",
    thesis: "A C++ bridge that maps OpenRetailing Price Pole REST resources to IFSF Price Pole data and message semantics over LonWorks.",
    architecture: ["OpenRetailing Price Pole APIs", "REST / HTTP", "ILAC", "IFSF DB_Ad + Data_Id", "LonTalk / TP/FT-10", "Price Pole"],
    sections: [
      { number: "01", label: "CONTEXT", body: "Forecourt environments can contain installed Price Pole equipment built around IFSF LON while newer software expects the OpenRetailing Price Pole API model." },
      { number: "02", label: "ENGINEERING PROBLEM", body: "Create an interoperability layer without requiring immediate replacement of the operational-technology network." },
      { number: "03", label: "LEADERSHIP & OWNERSHIP", body: "ILAC began as my Haia internship project. I continued it after the internship and now lead a two-person team. A second developer joined in 2026 under my supervision. I designed the architecture, remain the main developer, and make the primary technical decisions across the REST/Oat++ boundary, IFSF protocol handling, conversion logic, concurrency, and validation." },
      { number: "04", label: "CONSTRAINTS", body: "C++11, 32-bit Windows compatibility, binary protocol structures, acknowledgements, data conversion, simulators, and legacy network behaviour." },
      { number: "05", label: "ENGINEERING DECISIONS", body: "Preserve installed OT equipment behind a modern API boundary instead of forcing immediate field replacement; isolate conversion responsibility in ILAC; retain compatibility with the existing C++11 and 32-bit Windows environment." },
      { number: "06", label: "ARCHITECTURE", body: "Oat++ exposes the HTTP boundary; ILAC maps endpoint resources to the IFSF database-oriented model (DB_Ad + Data_Id), sends the corresponding application messages over LonTalk / TP/FT-10, and converts responses back to API data." },
      { number: "07", label: "IMPLEMENTATION", body: "Mapping work covers GET → Read / Answer, POST/update → Write / Acknowledge, DB_Ad/Data_Id translation, response/error handling, and IFSF field encodings such as the UNIT_PRICE bin8 + bcd6 format defined by Engineering Bulletin No. 11." },
      { number: "08", label: "RESULT", body: "The proof of concept was successfully demonstrated to the IFSF Working Group as a practical path between modern APIs and installed legacy OT." },
      { number: "09", label: "TECHNOLOGY", body: "C++, Oat++, REST/HTTP, OpenRetailing Price Pole APIs, IFSF Part 2-01 / Part 3-02, LonWorks/LonTalk, TP/FT-10, CMake, Ninja, GCC/MinGW." },
      { number: "10", label: "PROOF", body: "IFSF Engineering Bulletin No. 27 documents the same Price Pole API-to-IFSF LON conversion domain and was solely authored by Nicholas Le Roux." },
    ],
    proof: ["Lead developer · two-person team", "IFSF Working Group proof-of-concept demo", "Engineering Bulletin No. 27", "REST ↔ industrial protocol conversion"],
    trace: "ilac",
  },

  axians: {
    id: "axians",
    eyebrow: "PROFESSIONAL CASE STUDY / REUSABLE IOT ARCHITECTURE",
    title: "Axians — Modular C++ IoT Framework",
    thesis: "A reusable C++ IoT framework designed to remove repeated setup work and accelerate future sensor-integration projects.",
    architecture: ["Sensor hardware", "Reusable C++ components", "Data acquisition", "Software integration", "DevOps database"],
    sections: [
      { number: "01", label: "CONTEXT", body: "Recurring IoT project work required common sensor, connectivity, data-acquisition, and persistence infrastructure to be recreated repeatedly." },
      { number: "02", label: "PROBLEM", body: "Project-specific setup consumed engineering time before teams could focus on the unique behavior of each new sensor integration." },
      { number: "03", label: "MY ROLE", body: "Designed and developed reusable C++ components for connecting sensors, integrating sensor hardware with the wider software stack, retrieving sensor data, and storing sensor information in a DevOps database." },
      { number: "04", label: "CONSTRAINTS", body: "The framework needed to remain reusable across different IoT projects, isolate common concerns, and be understandable enough for other engineers to extend." },
      { number: "05", label: "ENGINEERING DECISIONS", body: "Separated common device, acquisition, integration, and persistence concerns into modular components rather than embedding them in one project-specific application." },
      { number: "06", label: "OUTCOME", body: "The reusable architecture was estimated to save approximately 40 engineering hours per month by reducing repeated setup work." },
      { number: "07", label: "COMMUNICATION", body: "Presented the architecture, implementation progress, results, and future opportunities to senior developers, software architects, stakeholders, and the university supervisor." },
      { number: "08", label: "TECHNOLOGY", body: "C++, IoT, sensors, reusable architecture, data acquisition, database integration, and engineering communication." },
    ],
    proof: ["≈40 engineering hours / month estimated impact", "Reusable C++ architecture", "Senior technical stakeholder presentation"],
  },
  networked: {
    id: "networked",
    eyebrow: "PROJECT CASE STUDY / NETWORKED APPLICATIONS",
    title: "Networked application systems",
    thesis: "Two projects demonstrating socket programming, client/server architecture, shared state, and network-facing desktop software.",
    architecture: ["Client", "TCP sockets", "Server", "Shared state", "Desktop UI"],
    sections: [
      { number: "01", label: "CONNECT 4", body: "A Java Connect 4 clone built around TCP connections and sockets to demonstrate network programming." },
      { number: "02", label: "SUPERMARKET E-SHOP", body: "A C# WPF client/server webshop with a frontend, backend, TCP communication, and a server-side catalogue editor." },
      { number: "03", label: "ENGINEERING VALUE", body: "Together they show transport-level networking applied to user-facing applications rather than isolated socket exercises." },
    ],
    proof: ["TCP / sockets", "Java + C#/WPF", "Client/server state"],
  },
};

export interface MissionPreview {
  readonly role: string;
  readonly technologies: readonly string[];
  readonly outcome: string;
}

export const missionPreviews: Partial<Readonly<Record<NodeId, MissionPreview>>> = {
  profile: { role: "Embedded Software Engineer · Nicholas Le Roux", technologies: ["Embedded", "Networking", "Backend"], outcome: "Start here: engineering profile and system overview" },
  haia: { role: "Embedded Software Engineer · Haia Consultancy", technologies: ["C++", "IFSF", "OT"], outcome: "Core project: ILAC — IFSF LON API Converter" },
  ilac: { role: "Protocol/API bridge", technologies: ["C++", "Oat++", "LonTalk"], outcome: "REST ↔ installed IFSF LON equipment" },
  publications: { role: "Industry contribution", technologies: ["IFSF", "FT-10", "API standards"], outcome: "Engineering Bulletins No. 26 + No. 27" },
  axians: { role: "Software Engineering Intern · Axians", technologies: ["C++", "Sensors", "IoT"], outcome: "Core project: Modular C++ IoT Framework" },
  networked: { role: "Network applications", technologies: ["TCP", "Java", "WPF"], outcome: "Two client/server systems" },
  "embedded-lab": { role: "Physical computing", technologies: ["ESP32", "C", "I²C"], outcome: "Connected embedded interaction" },
  "applications-lab": { role: "Desktop applications", technologies: ["C#", "WPF", "JavaFX"], outcome: "Simulation + monitoring UIs" },
  "vision-ml": { role: "Visual computing", technologies: ["OpenGL", "CV", "TensorFlow"], outcome: "Interactive graphics and ML experiments" },
  "quant-research": { role: "Research replication", technologies: ["Python", "Jupyter", "Data"], outcome: "Yonsei quantitative programming work" },
  education: { role: "Education", technologies: ["Computer Engineering", "Computer Science"], outcome: "Avans + Yonsei" },
  skills: { role: "Capability matrix", technologies: ["Embedded", "Backend", "Networking"], outcome: "Engineering range mapped to evidence" },
  contact: { role: "Open communications", technologies: ["Email", "GitHub", "LinkedIn"], outcome: "Open a direct channel with Nicholas" },
};
