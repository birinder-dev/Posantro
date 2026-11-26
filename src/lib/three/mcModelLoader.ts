import * as THREE from "three";

type Axis = "x" | "y" | "z";
type FaceName = "east" | "west" | "up" | "down" | "south" | "north";

interface McFace {
  uv?: [number, number, number, number];
  rotation?: number;
  texture: string;
}

interface McElement {
  name?: string;
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: Axis;
    angle: number;
  };
  faces: Partial<Record<FaceName, McFace>>;
}

export interface McModelJson {
  textures?: Record<string, string>;
  elements: McElement[];
}

// Three.js BoxGeometry material/face order: +X, -X, +Y, -Y, +Z, -Z
const BOX_FACE_ORDER: FaceName[] = [
  "east",
  "west",
  "up",
  "down",
  "south",
  "north",
];

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

function loadPixelTexture(url: string): THREE.Texture {
  const cached = textureCache.get(url);
  if (cached) return cached;

  const tex = loader.load(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  textureCache.set(url, tex);
  return tex;
}

function resolveTextureUrl(
  ref: string,
  textures: Record<string, string>,
  textureBasePath: string
): string | null {
  const key = ref.startsWith("#") ? ref.slice(1) : ref;
  const target = textures[key];
  if (!target) return null;

  const name = target.includes("/") ? target.split("/").pop()! : target;
  return `${textureBasePath}/${name}.png`;
}

function applyFaceUv(
  uvAttr: THREE.BufferAttribute,
  faceIndex: number,
  uv: [number, number, number, number],
  rotation = 0
) {
  const u1 = uv[0] / 16;
  const v1 = 1 - uv[1] / 16;
  const u2 = uv[2] / 16;
  const v2 = 1 - uv[3] / 16;

  let corners: [number, number][] = [
    [u1, v1],
    [u2, v1],
    [u1, v2],
    [u2, v2],
  ];

  const steps = (((rotation % 360) + 360) % 360) / 90;
  for (let s = 0; s < steps; s++) {
    corners = [corners[2], corners[0], corners[3], corners[1]];
  }

  const offset = faceIndex * 4;
  for (let i = 0; i < 4; i++) {
    uvAttr.setXY(offset + i, corners[i][0], corners[i][1]);
  }
}

/**
 * Converts a Minecraft Blockbench JSON model into a centered Three.js Group.
 */
export function buildMcModel(
  model: McModelJson,
  textureBasePath = "/models/create/textures"
): THREE.Group {
  const root = new THREE.Group();
  const textures = model.textures ?? {};
  const materialCache = new Map<string, THREE.MeshStandardMaterial>();
  const hiddenMaterial = new THREE.MeshBasicMaterial({ visible: false });

  const getMaterial = (url: string): THREE.MeshStandardMaterial => {
    const existing = materialCache.get(url);
    if (existing) return existing;

    const mat = new THREE.MeshStandardMaterial({
      map: loadPixelTexture(url),
      roughness: 0.75,
      metalness: 0.1,
      alphaTest: 0.1,
    });
    materialCache.set(url, mat);
    return mat;
  };

  for (const el of model.elements) {
    const sizeX = (el.to[0] - el.from[0]) / 16;
    const sizeY = (el.to[1] - el.from[1]) / 16;
    const sizeZ = (el.to[2] - el.from[2]) / 16;

    const geometry = new THREE.BoxGeometry(
      Math.max(sizeX, 0.0001),
      Math.max(sizeY, 0.0001),
      Math.max(sizeZ, 0.0001)
    );

    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    const materials: THREE.Material[] = [];

    BOX_FACE_ORDER.forEach((faceName, faceIndex) => {
      const face = el.faces[faceName];
      if (!face) {
        materials.push(hiddenMaterial);
        return;
      }

      const url = resolveTextureUrl(face.texture, textures, textureBasePath);
      if (!url) {
        materials.push(hiddenMaterial);
        return;
      }

      materials.push(getMaterial(url));
      if (face.uv) {
        applyFaceUv(uvAttr, faceIndex, face.uv, face.rotation ?? 0);
      }
    });

    uvAttr.needsUpdate = true;

    const mesh = new THREE.Mesh(geometry, materials);
    const centerX = (el.from[0] + el.to[0]) / 2;
    const centerY = (el.from[1] + el.to[1]) / 2;
    const centerZ = (el.from[2] + el.to[2]) / 2;

    if (el.rotation) {
      const [ox, oy, oz] = el.rotation.origin;
      const pivot = new THREE.Group();
      pivot.position.set((ox - 8) / 16, (oy - 8) / 16, (oz - 8) / 16);
      pivot.rotation[el.rotation.axis] = THREE.MathUtils.degToRad(
        el.rotation.angle
      );
      mesh.position.set(
        (centerX - ox) / 16,
        (centerY - oy) / 16,
        (centerZ - oz) / 16
      );
      pivot.add(mesh);
      root.add(pivot);
    } else {
      mesh.position.set(
        (centerX - 8) / 16,
        (centerY - 8) / 16,
        (centerZ - 8) / 16
      );
      root.add(mesh);
    }
  }

  return root;
}

export async function loadMcModel(
  modelUrl: string,
  textureBasePath = "/models/create/textures"
): Promise<THREE.Group> {
  const res = await fetch(modelUrl);
  if (!res.ok) {
    throw new Error(`Failed to load model ${modelUrl}: ${res.status}`);
  }
  const json = (await res.json()) as McModelJson;
  return buildMcModel(json, textureBasePath);
}
