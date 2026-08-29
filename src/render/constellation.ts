import { categoryHubs, worldSize } from "../data/portfolio.js";

interface Point {
  readonly x: number;
  readonly y: number;
}

type StarTone = "cyan" | "lime" | "violet";

interface ConstellationStar extends Point {
  readonly radius: number;
  readonly tone: StarTone;
  readonly anchor: boolean;
}

interface ConstellationEdge {
  readonly from: number;
  readonly to: number;
  readonly major: boolean;
}

interface SystemRing extends Point {
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotation: number;
  readonly tone: StarTone;
}

const TAU = Math.PI * 2;
const WORLD_MARGIN = 86;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const toneForIndex = (index: number): StarTone =>
  index % 5 === 2 ? "violet" : index % 3 === 1 ? "lime" : "cyan";

const buildConstellation = (): {
  readonly stars: readonly ConstellationStar[];
  readonly edges: readonly ConstellationEdge[];
  readonly rings: readonly SystemRing[];
} => {
  const random = seededRandom(0x50454e15);
  const stars: ConstellationStar[] = [];
  const edges: ConstellationEdge[] = [];
  const clusterIndices: number[][] = [];

  categoryHubs.forEach((hub, clusterIndex) => {
    const indices: number[] = [];
    const centreIndex = stars.length;
    stars.push({
      x: hub.position.x,
      y: hub.position.y,
      radius: 2.45,
      tone: toneForIndex(clusterIndex),
      anchor: true,
    });
    indices.push(centreIndex);

    const outerCount = clusterIndex === 2 ? 10 : 8;
    const spreadX = clusterIndex === 2 ? 330 : 250 + random() * 52;
    const spreadY = clusterIndex === 2 ? 235 : 170 + random() * 48;

    for (let index = 0; index < outerCount; index += 1) {
      const angle = (index / outerCount) * TAU + (random() - 0.5) * 0.42;
      const distance = 0.64 + random() * 0.38;
      const starIndex = stars.length;
      stars.push({
        x: clamp(hub.position.x + Math.cos(angle) * spreadX * distance, WORLD_MARGIN, worldSize.width - WORLD_MARGIN),
        y: clamp(hub.position.y + Math.sin(angle) * spreadY * distance, WORLD_MARGIN, worldSize.height - WORLD_MARGIN),
        radius: 1.05 + random() * 1.2,
        tone: index % 4 === 0 ? "lime" : index % 5 === 0 ? "violet" : "cyan",
        anchor: index % 3 === 0,
      });
      indices.push(starIndex);
      edges.push({ from: centreIndex, to: starIndex, major: index % 3 === 0 });

      if (index > 0) {
        const previous = indices[index];
        if (previous !== undefined) edges.push({ from: previous, to: starIndex, major: false });
      }
    }

    const firstOuter = indices[1];
    const lastOuter = indices.at(-1);
    if (firstOuter !== undefined && lastOuter !== undefined) {
      edges.push({ from: lastOuter, to: firstOuter, major: false });
    }
    clusterIndices.push(indices);
  });

  for (let clusterIndex = 0; clusterIndex < clusterIndices.length - 1; clusterIndex += 1) {
    const current = clusterIndices[clusterIndex]?.[0];
    const next = clusterIndices[clusterIndex + 1]?.[0];
    if (current !== undefined && next !== undefined) edges.push({ from: current, to: next, major: true });
  }

  const backgroundStart = stars.length;
  const backgroundCount = 92;
  for (let index = 0; index < backgroundCount; index += 1) {
    const depth = 0.2 + random() * 0.8;
    stars.push({
      x: WORLD_MARGIN + random() * (worldSize.width - WORLD_MARGIN * 2),
      y: WORLD_MARGIN + random() * (worldSize.height - WORLD_MARGIN * 2),
      radius: 0.45 + depth * 0.92 + random() * 0.42,
      tone: random() > 0.92 ? "violet" : random() > 0.76 ? "lime" : "cyan",
      anchor: random() > 0.88,
    });
  }

  const degree = new Uint8Array(stars.length);
  for (let from = backgroundStart; from < stars.length; from += 1) {
    if ((degree[from] ?? 0) >= 2) continue;
    const fromStar = stars[from];
    if (!fromStar) continue;

    let nearest = -1;
    let nearestDistance = 205;
    for (let to = from + 1; to < stars.length; to += 1) {
      if ((degree[to] ?? 0) >= 2) continue;
      const toStar = stars[to];
      if (!toStar) continue;
      const distance = Math.hypot(toStar.x - fromStar.x, toStar.y - fromStar.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = to;
      }
    }

    if (nearest >= 0 && random() > 0.28) {
      edges.push({ from, to: nearest, major: false });
      degree[from] = (degree[from] ?? 0) + 1;
      degree[nearest] = (degree[nearest] ?? 0) + 1;
    }
  }

  const rings: readonly SystemRing[] = [
    { x: 690, y: 1770, radiusX: 176, radiusY: 88, rotation: -18, tone: "cyan" },
    { x: 1690, y: 340, radiusX: 210, radiusY: 96, rotation: 12, tone: "violet" },
    { x: 1870, y: 1900, radiusX: 145, radiusY: 72, rotation: 28, tone: "lime" },
    { x: 3190, y: 1770, radiusX: 185, radiusY: 82, rotation: -24, tone: "cyan" },
  ];

  return { stars, edges, rings };
};

const constellation = buildConstellation();

const renderMarkup = (): string => {
  const rings = constellation.rings
    .map(
      (ring) => `<ellipse class="constellation-system-ring tone-${ring.tone}" cx="${ring.x}" cy="${ring.y}" rx="${ring.radiusX}" ry="${ring.radiusY}" transform="rotate(${ring.rotation} ${ring.x} ${ring.y})" />`,
    )
    .join("");

  const edges = constellation.edges
    .map((edge) => {
      const from = constellation.stars[edge.from];
      const to = constellation.stars[edge.to];
      if (!from || !to) return "";
      return `<line class="constellation-edge ${edge.major ? "constellation-edge-major" : ""}" x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" />`;
    })
    .join("");

  const stars = constellation.stars
    .map(
      (star) => `<circle class="constellation-star tone-${star.tone} ${star.anchor ? "constellation-star-anchor" : ""}" cx="${star.x.toFixed(1)}" cy="${star.y.toFixed(1)}" r="${star.radius.toFixed(2)}" />`,
    )
    .join("");

  return `${rings}${edges}${stars}`;
};

const constellationMarkup = renderMarkup();

export const renderConstellationField = (): string => `
  <svg
    class="constellation-field"
    viewBox="0 0 ${worldSize.width} ${worldSize.height}"
    width="${worldSize.width}"
    height="${worldSize.height}"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >${constellationMarkup}</svg>`;
