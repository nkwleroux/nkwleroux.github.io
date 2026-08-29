type IconKind =
  | "protocol"
  | "binary"
  | "display"
  | "audio"
  | "touch"
  | "rotary"
  | "hardware"
  | "network"
  | "software"
  | "tool"
  | "bus";

interface FallbackIconSpec {
  readonly label: string;
  readonly mark: string;
  readonly kind: IconKind;
}

interface BrandIconSpec {
  readonly label: string;
  readonly src: string;
}

type IconSpec = FallbackIconSpec | BrandIconSpec;

const devicon = (name: string, file = `${name}-original.svg`): string =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${name}/${file}`;

const simpleIcon = (slug: string): string =>
  `https://cdn.simpleicons.org/${slug}`;

const specs: Readonly<Record<string, IconSpec>> = {
  "C": { label: "C", src: devicon("c") },
  "C++": { label: "C++", src: devicon("cplusplus") },
  "C#": { label: "C#", src: devicon("csharp") },
  "Java": { label: "Java", src: devicon("java") },
  "JavaScript": { label: "JavaScript", src: devicon("javascript") },
  "TypeScript": { label: "TypeScript", src: devicon("typescript") },
  "Kotlin": { label: "Kotlin", src: devicon("kotlin") },
  "Python": { label: "Python", src: devicon("python") },

  "ESP32": { label: "ESP32 / Espressif", src: simpleIcon("espressif") },
  "STM32": { label: "STM32 / STMicroelectronics", src: simpleIcon("stmicroelectronics") },
  "Arduino": { label: "Arduino", src: devicon("arduino") },
  "Pico": { label: "Raspberry Pi Pico", src: devicon("raspberrypi") },
  "ATtiny85": { label: "ATtiny85", mark: "AT85", kind: "hardware" },

  "I²C": { label: "I²C", mark: "I²C", kind: "bus" },
  "SMBus": { label: "SMBus", mark: "SMB", kind: "bus" },
  "TP/FT-10": { label: "TP/FT-10", mark: "TP", kind: "bus" },

  "IFSF": { label: "IFSF", mark: "IFSF", kind: "protocol" },
  "LonWorks": { label: "LonWorks", mark: "LON", kind: "network" },
  "LonTalk": { label: "LonTalk", mark: "LT", kind: "network" },

  "Binary": { label: "Binary data", mark: "01", kind: "binary" },
  "bitfields": { label: "Bitfields", mark: "BITS", kind: "binary" },
  "BCD": { label: "BCD encoding", mark: "BCD", kind: "binary" },

  "LCD": { label: "LCD", mark: "LCD", kind: "display" },
  "buzzer": { label: "Buzzer", mark: "SND", kind: "audio" },
  "touch": { label: "Touch input", mark: "TOUCH", kind: "touch" },
  "rotary": { label: "Rotary input", mark: "ROT", kind: "rotary" },

  "Hardware": { label: "Hardware", mark: "HW", kind: "hardware" },
  "Network": { label: "Network", mark: "NET", kind: "network" },
  "Software": { label: "Software", mark: "</>", kind: "software" },

  "CMake": { label: "CMake", src: devicon("cmake") },
  "Ninja": { label: "Ninja", mark: "NIN", kind: "tool" },
  "GCC": { label: "GCC", src: devicon("gcc") },
  "MinGW": { label: "MinGW", mark: "MGW", kind: "tool" },

  "ASP.NET Core": { label: "ASP.NET Core / .NET", src: devicon("dotnetcore") },
  "Oat++": { label: "Oat++", mark: "O++", kind: "software" },

  "TCP/IP": { label: "TCP/IP", mark: "TCP", kind: "network" },
  "sockets": { label: "Sockets", mark: "SOCK", kind: "network" },
  "MQTT": { label: "MQTT", src: simpleIcon("mqtt") },

  "WPF": { label: "WPF", mark: "WPF", kind: "software" },
  "JavaFX": { label: "JavaFX", mark: "JavaFX", kind: "software" },

  "Android": { label: "Android", src: devicon("android") },

  "TensorFlow": { label: "TensorFlow", src: devicon("tensorflow") },
  "Jupyter": { label: "Jupyter", src: devicon("jupyter") },

  "PostgreSQL": { label: "PostgreSQL", src: devicon("postgresql") },
  "MySQL": { label: "MySQL", src: devicon("mysql") },
  "MariaDB": { label: "MariaDB", src: devicon("mariadb") },
  "SQLite": { label: "SQLite", src: devicon("sqlite") },

  "Azure": { label: "Microsoft Azure", src: devicon("azure") },
  "AWS": {
    label: "Amazon Web Services",
    src: devicon("amazonwebservices", "amazonwebservices-original-wordmark.svg"),
  },
  "Docker": { label: "Docker", src: devicon("docker") },

  "Prometheus": { label: "Prometheus", src: devicon("prometheus") },
  "Grafana": { label: "Grafana", src: devicon("grafana") },

  "OpenGL": { label: "OpenGL", src: devicon("opengl") },

  "Git": { label: "Git", src: devicon("git") },
  "GitHub": { label: "GitHub", src: devicon("github") },
  "GitLab": { label: "GitLab", src: devicon("gitlab") },
  "VS Code": { label: "Visual Studio Code", src: devicon("vscode") },
  "CLion": { label: "CLion", src: devicon("clion") },
  "Docker Compose": { label: "Docker Compose", src: devicon("docker") },
  "VirtualBox": { label: "VirtualBox", mark: "VB", kind: "tool" },
  "Raspberry Pi Pico": { label: "Raspberry Pi Pico", src: devicon("raspberrypi") },
  "Espressif": { label: "Espressif", src: simpleIcon("espressif") },
  "SQL": { label: "SQL", mark: "SQL", kind: "binary" },

  "3D": { label: "3D graphics", mark: "3D", kind: "software" },
  "2.5D": { label: "2.5D graphics", mark: "2.5D", kind: "software" },
};

const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderIcon = (spec: IconSpec): string => {
  const label = escapeAttribute(spec.label);

  if ("src" in spec) {
    const fallbackMark = escapeAttribute(spec.label.slice(0, 4).toUpperCase());
    return `<span class="layer-icon-chip brand-icon" role="img" aria-label="${label}" title="${label}">
      <span class="brand-icon-fallback" aria-hidden="true">${fallbackMark}</span>
      <img src="${escapeAttribute(spec.src)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'" />
    </span>`;
  }

  return `<span class="layer-icon-chip text-icon" role="text" aria-label="${label}" title="${label}">
    <span class="text-icon-label">${label}</span>
  </span>`;
};

export const renderLayerIcons = (names: readonly string[]): string => {
  const branded: string[] = [];
  const textItems: string[] = [];

  for (const name of names) {
    const spec = specs[name] ?? { label: name, mark: name.slice(0, 4).toUpperCase(), kind: "tool" as const };
    if ("src" in spec) branded.push(renderIcon(spec));
    else textItems.push(spec.label);
  }

  const fallbackText = textItems.length > 0
    ? `<span class="layer-text-fallbacks">${textItems.map(escapeAttribute).join(" · ")}</span>`
    : "";

  return `<div class="layer-icon-strip" aria-label="${escapeAttribute(names.join(", "))}">${branded.join("")}${fallbackText}</div>`;
};

export const renderResumeTechnologyIcons = (names: readonly string[]): string => {
  const items = names.map((name) => {
    const spec = specs[name] ?? { label: name, mark: name.slice(0, 4).toUpperCase(), kind: "tool" as const };
    if ("src" in spec) {
      return renderIcon(spec).replace("layer-icon-chip", "resume-tech-icon");
    }
    return `<span class="resume-tech-inline-text">${escapeAttribute(spec.label)}</span>`;
  });

  const separators = `<span class="resume-tech-separator" aria-hidden="true"> · </span>`;
  return `<div class="resume-tech-icons" aria-label="${escapeAttribute(names.join(", "))}"><p class="resume-tech-inline">${items.join(separators)}</p></div>`;
};

export const layerIconNames = Object.freeze(Object.keys(specs));
export const officialBrandIconNames = Object.freeze(
  Object.entries(specs)
    .filter(([, spec]) => "src" in spec)
    .map(([name]) => name),
);
