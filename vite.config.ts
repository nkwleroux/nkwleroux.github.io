import { defineConfig } from "vite";

// Keep page entries relative to the Vite project root. Windows download-folder
// names such as "PEN-download-copy(2)" are therefore never passed to the bundler as
// input values and cannot be interpreted as glob syntax.
const pages = {
  main: "index.html",
  network: "network/index.html",
  resume: "resume.html",
  staticResume: "nojs.html",
  notFound: "404.html",
  profile: "profile/index.html",
  haia: "work/haia/index.html",
  ilac: "work/haia/ilac/index.html",
  axians: "experience/axians/index.html",
  networked: "projects/networked/index.html",
  embeddedLab: "projects/embedded-lab/index.html",
  applicationsLab: "projects/applications-lab/index.html",
  visionMl: "projects/vision-ml/index.html",
  quantResearch: "projects/quant-research/index.html",
  education: "education/index.html",
  avans: "education/avans/index.html",
  yonsei: "education/yonsei/index.html",
  skills: "skills/index.html",
  contact: "contact/index.html",
} as const;

export default defineConfig({
  base: "/",
  input: pages,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
