import { siteConfig } from "../config/site.js";
import { childrenLifeStage } from "../core/personalTimeline.js";
import { projectArchive } from "./projects.js";
import type { CategoryHub, MissionGroup, NetworkRoute, NodeId, PortfolioNode, ProjectEntry } from "../domain/types.js";

export const worldSize = { width: 3600, height: 2200 } as const;

export const mapBounds = {
  minX: 150,
  maxX: 3510,
  minY: 250,
  maxY: 1950,
} as const;

const selectProjects = (...ids: readonly string[]): readonly ProjectEntry[] =>
  ids.map((id) => {
    const project = projectArchive.find((candidate) => candidate.id === id);
    if (!project) throw new Error(`Unknown portfolio project: ${id}`);
    return project;
  });

export const portfolioNodes = [
  {
    id: "profile",
    index: "00",
    title: "PROFILE",
    subtitle: "SYSTEM OWNER",
    status: "START",
    statusTone: "neutral",
    position: { x: 420, y: 1080 },
    sector: "physical",
    missionGroup: "entry",
    locationLabel: "PEN / SYSTEM OWNER",
    detail: {
      kicker: "NODE 00 / PEN SYSTEM OWNER",
      title: siteConfig.name,
      lede: "Embedded Software Engineer with over two years of combined professional software-development and engineering experience spanning embedded systems, industrial communication, operational technology, IoT, networking, backend software, applications, and hardware-software integration.",
      stats: [
        { label: "CURRENT", value: "Embedded Software Engineer" },
        { label: "EXPERIENCE", value: "2+ years combined" },
        { label: "BASE", value: siteConfig.location },
      ],
      blocks: [
        {
          type: "text",
          label: "FAMILY & VALUES",
          heading: `Family-oriented husband and father of two ${childrenLifeStage(siteConfig.childrenBirthYear)}.`,
          paragraphs: [
            `I am a 25-year-old, family-oriented and goal-driven software and embedded systems engineer with a strong interest in building reliable technology that connects software, hardware, networks, and real-world systems. I am married to my wife, Alexia, and together we are raising two ${childrenLifeStage(siteConfig.childrenBirthYear)}, which has given me an even stronger sense of responsibility, purpose, and ambition. Professionally, I am passionate about embedded software, systems integration, networking, IoT, APIs, and protocol communication, and I enjoy solving complex technical problems that require understanding how multiple layers of a system work together. I approach both my career and personal life with a long-term mindset, continuously developing my skills, taking on challenging projects, and working toward becoming a well-rounded engineer capable of designing and building complete, maintainable systems while creating a stable and fulfilling future for my family.`,
          ],
        },
        {
          type: "text",
          label: "ENGINEERING RANGE",
          heading: "From physical buses and binary messages to APIs, applications, and infrastructure.",
          paragraphs: [
            "Professional work spans C++, industrial networks, protocol conversion, REST APIs, hardware integration, legacy modernization, and production debugging. Academic and personal work extends that range into TCP/IP, WPF, JavaFX, Android, OpenGL, machine learning, quantitative programming, cloud services, databases, and full-stack IoT systems.",
          ],
        },
        {
          type: "text",
          label: "PROFESSIONAL HIGHLIGHTS",
          paragraphs: [
            "At Haia Consultancy, progressed from Software Engineering Intern to IFSF Technical Support and then Full-time Embedded Software Engineer. Leads the two-person ILAC project, designed its architecture, supervises the second developer added in 2026, contributed to its proof-of-concept demonstration to the IFSF Working Group, served as Author on IFSF Engineering Bulletin No. 26, and is the sole author of Bulletin No. 27.",
          ],
        },
        { type: "tags", tags: ["C++", "Embedded", "IFSF", "LonWorks", "REST", "IoT", "TCP/IP", "Full-stack"] },
      ],
    },
  },
  {
    id: "haia",
    index: "01",
    title: "HAIA",
    subtitle: "CURRENT EMPLOYER",
    status: "LIVE",
    statusTone: "live",
    position: { x: 1180, y: 650 },
    sector: "physical",
    missionGroup: "professional",
    locationLabel: "HAIA / CURRENT EMPLOYER",
    detail: {
      kicker: "NODE 01 / HAIA / PROFESSIONAL CAREER / CURRENT",
      title: "Haia Consultancy",
      lede: "Progressed from Software Engineering Intern to IFSF Technical Support and then Full-time Embedded Software Engineer.",
      stats: [
        { label: "CURRENT ROLE", value: "Embedded Software Engineer" },
        { label: "PERIOD", value: "Sep 2024 — Present" },
        { label: "LOCATION", value: "Breda, Netherlands" },
      ],
      blocks: [
        {
          type: "timeline",
          label: "CAREER PROGRESSION",
          entries: [
            { period: "SEP 2024 — JAN 2025", title: "Software Engineering Intern" },
            { period: "JUN 2025 — NOV 2025", title: "IFSF Technical Support" },
            { period: "NOV 2025 — PRESENT", title: "Full-time Embedded Software Engineer" },
          ],
        },
        {
          type: "text",
          label: "EMBEDDED SOFTWARE ENGINEERING",
          heading: "Industrial and operational technology across hardware, network, protocol, and API boundaries.",
          paragraphs: [
            "Develop embedded and systems-level software primarily in C++, communicate with industrial devices and operational-technology networks, bridge established communication protocols with modern software architectures, and develop REST/HTTP functionality using Oat++.",
          ],
          bullets: [
            "Message construction, parsing, validation, reads, writes, answers, acknowledgements, and data conversion.",
            "Binary structures, bitfields, BCD encoding, bin8, bcd6, and bcd8.",
            "IFSF, LonWorks, LonTalk, TP/FT-10, forecourt technology, Price Poles, product data, pricing, and fuelling modes.",
            "C++11 compatibility and 32-bit Windows development using CMake, Ninja, GCC, and MinGW.",
            "Debugging across embedded hardware, industrial devices, LON networks, REST services, and backend applications.",
          ],
        },
        {
          type: "text",
          label: "IFSF TECHNICAL SUPPORT",
          paragraphs: [
            "Investigated IFSF communication, LON networks, forecourt hardware, legacy devices, interoperability, and hardware-lifecycle issues. Researched migration paths toward API-based architectures and communicated findings through formal engineering documentation.",
          ],
        },
        { type: "tags", tags: ["C++", "IFSF", "LonWorks", "LonTalk", "TP/FT-10", "Oat++", "REST", "CMake", "GitHub"] },
      ],
    },
  },
  {
    id: "ilac",
    index: "02",
    title: "ILAC",
    subtitle: "REST ↔ IFSF LON",
    status: "POC",
    statusTone: "bridge",
    position: { x: 1320, y: 540 },
    sector: "interface",
    missionGroup: "professional",
    locationLabel: "ILAC / MODERNIZATION BRIDGE",
    detail: {
      kicker: "NODE 02 / PROFESSIONAL PROJECT / SYSTEM BRIDGE",
      title: "ILAC — IFSF LON API Converter",
      lede: "A C++ protocol-conversion system connecting the OpenRetailing Price Pole API Collections over REST/HTTP with IFSF Price Pole communication over LonWorks. I lead the two-person project team, designed its architecture, supervise the second developer, and own the primary technical decisions.",
      stats: [
        { label: "ROLE", value: "Lead Developer / Architect" },
        { label: "TEAM", value: "Two engineers" },
        { label: "DEMO", value: "IFSF Working Group" },
      ],
      blocks: [
        {
          type: "text",
          label: "LEADERSHIP & OWNERSHIP",
          heading: "Lead developer and system architect for a two-person team.",
          paragraphs: [
            "ILAC began as my Haia internship project. I continued developing it after the internship, and a second developer joined in 2026 under my supervision.",
          ],
          bullets: [
            "Designed the project architecture and conversion boundaries.",
            "Set the technical direction and make the primary implementation decisions.",
            "Coordinate and review work while remaining the main developer.",
          ],
        },
        {
          type: "bridge",
          label: "CONVERSION PATH",
          nodes: [
            { title: "OPENRETAILING PRICE POLE APIS", caption: "PDCA + Price Poles API" },
            { title: "ILAC", caption: "IFSF LON API Converter", accent: true },
            { title: "IFSF PRICE POLE", caption: "Part 3-02 over LonWorks" },
          ],
          connectors: ["REST / HTTP →", "→ IFSF / LONTALK / TP/FT-10"],
        },
        {
          type: "text",
          label: "ENGINEERING WORK",
          paragraphs: [
            "Map OpenRetailing Price Pole API resources to the database-oriented IFSF model defined by Part 3-02 and Part 2-01, then carry those operations over LonTalk / TP/FT-10.",
          ],
          bullets: [
            "REST GET operations map to IFSF Read → Answer flows; REST POST/update operations map to Write → Acknowledge flows, with acknowledgements also covering error cases.",
            "IFSF data is addressed through Database Address (DB_Ad) + Data Identifier (Data_Id) across Price Pole, Price Pole Point, Product, Product per Fuelling Mode, Segment, and Error Code databases.",
            "Data conversion follows IFSF common field formats; Engineering Bulletin No. 11 defines UNIT_PRICE as bin8 + bcd6.",
            "Used OpenRetailing simulators to generate Price Pole API payloads and IFSF simulators to receive and respond to Price Pole messages over LON.",
          ],
        },
        {
          type: "text",
          label: "ENGINEERING SIGNIFICANCE",
          heading: "Modernize without forcing immediate field-equipment replacement.",
          paragraphs: [
            "ILAC demonstrates a practical migration path from mature operational-technology networks to modern API-based software while retaining compatibility with installed IFSF LON equipment. The proof of concept was successfully demonstrated to the IFSF Working Group and progressed toward validation with physical Price Pole hardware.",
          ],
        },
        { type: "tags", tags: ["C++", "Oat++", "OpenRetailing", "PDCA", "REST", "HTTP", "IFSF", "LonWorks", "LonTalk", "TP/FT-10"] },
      ],
    },
  },
  {
    id: "publications",
    index: "03",
    title: "IFSF BULLETINS",
    subtitle: "INDUSTRY CONTRIBUTION",
    status: "2 DOCS",
    statusTone: "bridge",
    position: { x: 1325, y: 820 },
    sector: "interface",
    missionGroup: "professional",
    locationLabel: "IFSF / TECHNICAL PUBLICATIONS",
    detail: {
      kicker: "NODE 03 / INDUSTRY CONTRIBUTION",
      title: "IFSF Engineering Bulletins 26 and 27",
      lede: "Two technical IFSF publications covering LON hardware lifecycle risk and bidirectional Price Pole API-to-IFSF LON conversion.",
      stats: [
        { label: "BULLETINS", value: "No. 26 + No. 27" },
        { label: "FOCUS", value: "Lifecycle + protocol modernization" },
      ],
      blocks: [
        {
          type: "text",
          label: "ENGINEERING BULLETIN NO. 26",
          heading: "Renesas FT 5000 & FT 6050 End-of-Life Issue",
          paragraphs: [
            "Examines the end-of-life of the Renesas FT 5000 and FT 6050 smart-transceiver SoCs and the resulting impact on IFSF-LON forecourt systems. It outlines the dependency of deployed TP/FT-10 equipment on these components and evaluates practical migration paths spanning alternative transceivers and hardware, host-based LON software stacks, interfaces, transformers, and gateways while supporting the longer-term move toward IP/API-based systems.",
          ],
        },
        {
          type: "text",
          label: "ENGINEERING BULLETIN NO. 27",
          heading: "Price Pole API Standard to IFSF LON Conversion",
          paragraphs: [
            "Defines a bidirectional mapping between IFSF Part 3-02 Price Pole Application v1.24 and the OpenRetailing Price Pole API Collections v1.0. It maps REST resources and fields to IFSF DB_Ad/Data_Id addressing, translates GET operations to Read/Answer and POST or update operations to Write/Acknowledge, and covers field encoding and error handling using Part 2-01 Communications over LonWorks v1.93 and Engineering Bulletin No. 11 as supporting standards.",
          ],
        },
      ],
    },
  },
  {
    id: "axians",
    index: "04",
    title: "AXIANS",
    subtitle: "IOT FRAMEWORK",
    status: "≈40 H/MO",
    statusTone: "neutral",
    position: { x: 805, y: 900 },
    sector: "physical",
    missionGroup: "professional",
    locationLabel: "AXIANS / REUSABLE IOT ARCHITECTURE",
    detail: {
      kicker: "NODE 04 / PROFESSIONAL FOUNDATION",
      title: "Axians",
      lede: "Designed and developed reusable IoT architecture in C++ to eliminate repetitive project setup and make future sensor integrations faster.",
      stats: [
        { label: "ROLE", value: "Software Engineering Intern" },
        { label: "PERIOD", value: "Aug 2021 — Jan 2022" },
      ],
      blocks: [
        {
          type: "impact",
          label: "ESTIMATED IMPACT",
          value: "≈40",
          suffix: "ENGINEERING HOURS / MONTH",
          text: "Estimated monthly saving from removing the need to repeatedly build common IoT project infrastructure from scratch.",
        },
        {
          type: "text",
          label: "FRAMEWORK SCOPE",
          paragraphs: [
            "Created reusable components for connecting sensors, integrating sensor hardware with the wider software stack, retrieving sensor data, and storing sensor information in a DevOps database.",
          ],
        },
        {
          type: "text",
          label: "ENGINEERING COMMUNICATION",
          paragraphs: [
            "Presented architecture, implementation progress, results, and future development opportunities to senior developers, software architects, stakeholders, and the university supervisor.",
          ],
        },
        { type: "tags", tags: ["C++", "IoT", "Sensors", "Reusable architecture", "Data acquisition", "Database integration"] },
      ],
    },
  },
  {
    id: "networked",
    index: "05",
    title: "NETWORKED APPS",
    subtitle: "TCP / CLIENT-SERVER",
    status: "2 SYSTEMS",
    statusTone: "neutral",
    position: { x: 1840, y: 1040 },
    sector: "interface",
    missionGroup: "projects",
    locationLabel: "PROJECT CONSTELLATION / NETWORKED APPLICATIONS",
    detail: {
      kicker: "NODE 05 / PROJECT CONSTELLATION / NETWORKING",
      title: "Networked Applications",
      lede: "Two academic systems that make TCP/IP, sockets, client/server architecture, shared state, and networked desktop software concrete.",
      stats: [
        { label: "JAVA", value: "Connect 4" },
        { label: "C# / WPF", value: "Supermarket E-Shop" },
        { label: "CORE", value: "TCP/IP sockets" },
      ],
      blocks: [
        {
          type: "text",
          label: "ENGINEERING THREAD",
          paragraphs: [
            "These projects show networking from two application perspectives: synchronising gameplay between Java programs and separating a WPF e-commerce client from a catalogue-management server.",
          ],
        },
        { type: "projects", label: "NETWORKED PROJECTS", projects: selectProjects("connect4", "supermarket") },
        { type: "tags", tags: ["Java", "C#", "WPF", "TCP/IP", "Sockets", "Client/server", "Distributed state"] },
      ],
    },
  },
  {
    id: "embedded-lab",
    index: "06",
    title: "PHYSICAL COMPUTING",
    subtitle: "ESP32 / ARDUINO",
    status: "2 SYSTEMS",
    statusTone: "neutral",
    position: { x: 1925, y: 1590 },
    sector: "physical",
    missionGroup: "projects",
    locationLabel: "PROJECT CONSTELLATION / PHYSICAL COMPUTING",
    detail: {
      kicker: "NODE 06 / PROJECT CONSTELLATION / PHYSICAL",
      title: "Embedded & Physical Computing",
      lede: "Connected embedded work combining firmware, Wi-Fi/HTTP, buses, peripherals, mobile software, backend communication, and real-world hardware interaction.",
      stats: [
        { label: "EMBEDDED", value: "ESP32 / Arduino" },
        { label: "BUSES", value: "I²C / SMBus" },
        { label: "NETWORK", value: "Wi-Fi / HTTP" },
      ],
      blocks: [
        {
          type: "text",
          label: "ENGINEERING THREAD",
          paragraphs: [
            "The ESP32 system focuses on low-level peripheral integration and network connectivity; The Esteling Games expands physical computing into an Android/backend/Arduino interaction loop.",
          ],
        },
        { type: "projects", label: "PHYSICAL-COMPUTING PROJECTS", projects: selectProjects("esp32-connected", "esteling") },
        { type: "tags", tags: ["Embedded C", "ESP32", "Espressif", "Arduino", "Android", "I²C", "SMBus", "HTTP"] },
      ],
    },
  },
  {
    id: "applications-lab",
    index: "07",
    title: "APPLICATION LAB",
    subtitle: "WPF / JAVAFX",
    status: "2 APPS",
    statusTone: "neutral",
    position: { x: 2230, y: 1610 },
    sector: "application",
    missionGroup: "projects",
    locationLabel: "PROJECT CONSTELLATION / APPLICATION SOFTWARE",
    detail: {
      kicker: "NODE 07 / PROJECT CONSTELLATION / APPLICATIONS",
      title: "Desktop, Simulation & User-Facing Applications",
      lede: "Application-development work showing GUI design, simulation, pathfinding, external-system integration, dynamic data, and domain-oriented software.",
      stats: [
        { label: "JAVA", value: "JavaFX simulation" },
        { label: "C#", value: "WPF monitoring" },
        { label: "FOCUS", value: "User-facing software" },
      ],
      blocks: [
        { type: "projects", label: "APPLICATION PROJECTS", projects: selectProjects("schoolplanner", "healthcare") },
        { type: "tags", tags: ["Java", "JavaFX", "C#", "WPF", "Simulation", "Pathfinding", "GUI", "External integration"] },
      ],
    },
  },
  {
    id: "vision-ml",
    index: "08",
    title: "VISION + ML",
    subtitle: "OPENGL / CV / ML",
    status: "2 PROJECTS",
    statusTone: "neutral",
    position: { x: 2440, y: 1420 },
    sector: "application",
    missionGroup: "projects",
    locationLabel: "PROJECT CONSTELLATION / GRAPHICS + ML",
    detail: {
      kicker: "NODE 08 / PROJECT CONSTELLATION / INTERACTIVE INTELLIGENCE",
      title: "Graphics, Computer Vision & Machine Learning",
      lede: "Exploratory work combining C++ graphics and gesture-driven interaction with smaller Python/TensorFlow machine-learning experiments.",
      stats: [
        { label: "GRAPHICS", value: "C++ / OpenGL" },
        { label: "INPUT", value: "Camera gestures" },
        { label: "ML", value: "Python / TensorFlow" },
      ],
      blocks: [
        {
          type: "text",
          label: "ENGINEERING THREAD",
          paragraphs: [
            "Word Raiders applies machine-learning-based gesture recognition inside an interactive 3D/2.5D game, while the ML mini projects isolate dataset preparation, model experimentation, and evaluation workflows.",
          ],
        },
        { type: "projects", label: "GRAPHICS + ML PROJECTS", projects: selectProjects("word-raiders", "ml-mini") },
        { type: "tags", tags: ["C++", "OpenGL", "Computer vision", "Gesture recognition", "Python", "TensorFlow", "Jupyter"] },
      ],
    },
  },
  {
    id: "quant-research",
    index: "09",
    title: "QUANT RESEARCH",
    subtitle: "YONSEI / DATA",
    status: "2 REPOS",
    statusTone: "neutral",
    position: { x: 2350, y: 1070 },
    sector: "application",
    missionGroup: "projects",
    locationLabel: "PROJECT CONSTELLATION / QUANTITATIVE RESEARCH",
    detail: {
      kicker: "NODE 09 / PROJECT CONSTELLATION / DATA",
      title: "Yonsei Quantitative Research Replication",
      lede: "A two-stage Advanced Programming group project completed by a three-person engineering team, using historical financial data to reproduce a published stock-split research methodology and investigate abnormal returns.",
      stats: [
        { label: "UNIVERSITY", value: "Yonsei University" },
        { label: "DOMAIN", value: "Stock splits / returns" },
        { label: "WORKFLOW", value: "Midterm → Final" },
      ],
      blocks: [
        {
          type: "text",
          label: "RESEARCH METHOD",
          paragraphs: [
            "As part of a three-person engineering team, translated a published quantitative research methodology into software, processed historical stock-market data, analysed behaviour around stock-split events, and attempted to reproduce the researchers' published findings.",
          ],
        },
        { type: "projects", label: "RESEARCH REPOSITORIES", projects: selectProjects("yonsei-quant") },
        { type: "tags", tags: ["Quantitative programming", "Financial data", "Research replication", "Python", "Data processing"] },
      ],
    },
  },
  {
    id: "education",
    index: "10",
    title: "EDUCATION",
    subtitle: "AVANS / YONSEI",
    status: "ACADEMIC",
    statusTone: "neutral",
    position: { x: 2530, y: 560 },
    sector: "application",
    missionGroup: "academic",
    locationLabel: "ACADEMIC ORBIT / AVANS + YONSEI",
    detail: {
      kicker: "NODE 10 / ACADEMIC ORBIT",
      title: "Education",
      lede: "Computer Engineering education at Avans University of Applied Sciences combined with a one-year Computer Science study-abroad programme at Yonsei University in Seoul.",
      stats: [
        { label: "AVANS", value: "2019 — 2025" },
        { label: "YONSEI", value: "Aug 2022 — Jul 2023" },
      ],
      blocks: [
        {
          type: "text",
          label: "AVANS UNIVERSITY OF APPLIED SCIENCES / 2019–2025",
          heading: "Computer Engineering",
          paragraphs: [
            "Technical and project work covered C, C++, C#, Java, JavaScript, Python, Kotlin, embedded programming, Arduino, ESP32, TCP/IP, socket programming, IoT, desktop software, web/full-stack development, Android, machine learning, software engineering, and hardware-software integration.",
          ],
        },
        {
          type: "text",
          label: "YONSEI UNIVERSITY / SEOUL / AUG 2022–JUL 2023",
          heading: "Computer Science — Study Abroad",
          paragraphs: [
            "Advanced programming, Python, quantitative programming, financial-data analysis, machine-learning fundamentals, Jupyter Notebook, algorithms, data processing, and research replication formed the technical core of the study-abroad year. Alongside the Computer Science programme, completed Korean Language Institute Levels 1 and 2.",
          ],
        },
        { type: "tags", tags: ["Computer Engineering", "Computer Science", "Avans", "Yonsei", "Seoul", "International study"] },
      ],
    },
  },
  {
    id: "skills",
    index: "11",
    title: "CAPABILITIES",
    subtitle: "FULL STACK MATRIX",
    status: "STACK",
    statusTone: "neutral",
    position: { x: 3040, y: 590 },
    sector: "application",
    missionGroup: "academic",
    locationLabel: "CAPABILITY MATRIX / ENGINEERING RANGE",
    detail: {
      kicker: "NODE 11 / CAPABILITY MATRIX",
      title: "Technical Capabilities",
      lede: "A broad technical background anchored by professional embedded, industrial, protocol, and systems engineering.",
      stats: [
        { label: "CORE", value: "C / C++ / C#" },
        { label: "OT", value: "IFSF / LonWorks / TP/FT-10" },
        { label: "RANGE", value: "Hardware → Cloud → UI" },
      ],
      blocks: [
        {
          type: "capabilities",
          label: "ENGINEERING DOMAINS",
          groups: [
            { label: "LANGUAGES", value: "C · C++ · C# · Java · JavaScript · TypeScript · Kotlin · Python · SQL" },
            { label: "EMBEDDED & IOT", value: "ESP32 · Espressif · STM32 · Arduino · Raspberry Pi Pico · ATtiny85 · firmware · GPIO · sensors · actuators" },
            { label: "HARDWARE BUSES", value: "I²C · SMBus · serial communication · TP/FT-10 · hardware peripherals · device communication" },
            { label: "INDUSTRIAL / OT", value: "IFSF · LonWorks · LonTalk · OpenRetailing.org · forecourt technology · Price Poles · building automation" },
            { label: "LOW-LEVEL", value: "Binary communication · byte structures · bitfields · BCD · bin8 · bcd6 · bcd8 · serialization · message framing" },
            { label: "NETWORKING", value: "TCP/IP · sockets · client/server · REST · HTTP · MQTT · distributed applications · industrial networking" },
            { label: "BACKEND", value: "C++ · C# · ASP.NET Core · Oat++ · REST APIs · JSON · database integration · protocol-to-API conversion" },
            { label: "DESKTOP", value: "C# · WPF · Java · JavaFX · GUI development · simulations · networked desktop applications" },
            { label: "WEB & FRONTEND", value: "JavaScript · TypeScript · web applications · REST integration · full-stack development" },
            { label: "MOBILE", value: "Android · Kotlin · Java · backend integration · hardware/mobile integration" },
            { label: "GRAPHICS & GAMES", value: "C++ · OpenGL · 3D/2.5D graphics · game logic · gesture controls · computer vision" },
            { label: "DATA & ML", value: "Python · TensorFlow · Jupyter · quantitative analysis · research replication · model experimentation" },
            { label: "DATA & STORAGE", value: "PostgreSQL · MySQL · MariaDB · SQLite · SQL · CRUD · data modelling · backend persistence" },
            { label: "CLOUD & PLATFORM", value: "Azure · AWS · Docker · Docker Compose · VirtualBox · virtual machines · portable deployment" },
            { label: "OBSERVABILITY", value: "Prometheus · Grafana · metrics · monitoring · system observability" },
            { label: "BUILD & DEV", value: "CMake · Ninja · GCC · MinGW · MINGW32 · Git · GitHub · GitLab · VS Code · CLion" },
          ],
        },
        { type: "action", label: "OPEN PHYSICAL ↔ APPLICATION LAYERS ↗", action: "open-layers" },
      ],
    },
  },
  {
    id: "contact",
    index: "12",
    title: "COMMS",
    subtitle: "OPEN CHANNEL",
    status: "OPEN",
    statusTone: "live",
    position: { x: 3200, y: 1080 },
    sector: "application",
    missionGroup: "contact",
    locationLabel: "COMMS / OPEN CHANNEL",
    detail: {
      kicker: "NODE 12 / OPEN CHANNEL",
      title: "Contact",
      lede: "Interested in embedded systems, industrial communication, IoT, networking, backend engineering, or software that crosses the hardware/software boundary?",
      stats: [
        { label: "ROLE", value: "Embedded Software Engineer" },
        { label: "LOCATION", value: siteConfig.location },
        { label: "CHANNELS", value: "Email · GitHub · LinkedIn" },
      ],
      blocks: [
        { type: "links", label: "TRANSMIT CONNECTION REQUEST", heading: "Build systems that connect software to the physical world." },
      ],
    },
  },
] as const satisfies readonly PortfolioNode[];

export const categoryHubs: readonly CategoryHub[] = [
  {
    id: "entry",
    label: "PROFILE",
    subtitle: "MISSION 00",
    position: { x: 420, y: 1080 },
    sector: "physical",
    missionIds: ["profile"],
    mergedMissionId: "profile",
  },
  {
    id: "professional",
    label: "PROFESSIONAL CAREER",
    subtitle: "CAREER HUB · HAIA + AXIANS",
    position: { x: 1050, y: 760 },
    sector: "interface",
    missionIds: ["haia", "ilac", "publications", "axians"],
  },
  {
    id: "projects",
    label: "PROJECT CONSTELLATION",
    subtitle: "MISSIONS 05–09",
    position: { x: 2050, y: 1300 },
    sector: "application",
    missionIds: ["networked", "embedded-lab", "applications-lab", "vision-ml", "quant-research"],
  },
  {
    id: "academic",
    label: "ACADEMIC + CAPABILITY",
    subtitle: "MISSIONS 10–11",
    position: { x: 2770, y: 760 },
    sector: "application",
    missionIds: ["education", "skills"],
  },
  {
    id: "contact",
    label: "CONTACT",
    subtitle: "MISSION 12",
    position: { x: 3200, y: 1080 },
    sector: "application",
    missionIds: ["contact"],
    mergedMissionId: "contact",
  },
];

export const categoryOrder = categoryHubs.map((hub) => hub.id);

const createCategoryHubMap = (
  hubs: readonly CategoryHub[],
): Readonly<Record<MissionGroup, CategoryHub>> => {
  const map = {} as Record<MissionGroup, CategoryHub>;
  for (const hub of hubs) map[hub.id] = hub;
  return map;
};

export const categoryHubById = createCategoryHubMap(categoryHubs);

export const networkRoutes = [
  { id: "category-entry-professional", from: "entry", to: "professional", path: "M420 1080 C560 880 790 760 1050 760" },
  { id: "category-professional-projects", from: "professional", to: "projects", path: "M1050 760 C1320 840 1710 1110 2050 1300" },
  { id: "category-projects-academic", from: "projects", to: "academic", path: "M2050 1300 C2280 1160 2510 920 2770 760" },
  { id: "category-academic-contact", from: "academic", to: "contact", path: "M2770 760 C2950 810 3110 930 3200 1080" },
] as const satisfies readonly NetworkRoute[];

const createNodeMap = (nodes: readonly PortfolioNode[]): Readonly<Record<NodeId, PortfolioNode>> => {
  const map = {} as Record<NodeId, PortfolioNode>;
  for (const node of nodes) map[node.id] = node;
  return map;
};

export const nodeById = createNodeMap(portfolioNodes);

export const connectedCategoryRouteIds = (group: MissionGroup): readonly string[] =>
  networkRoutes
    .filter((route) => route.from === group || route.to === group)
    .map((route) => route.id);

export const connectedRouteIds = (nodeId: NodeId): readonly string[] =>
  connectedCategoryRouteIds(nodeById[nodeId].missionGroup);

export const isNodeId = (value: string | undefined): value is NodeId =>
  portfolioNodes.some((node) => node.id === value);

export const isMissionGroup = (value: string | undefined): value is MissionGroup =>
  categoryHubs.some((hub) => hub.id === value);
