#!/usr/bin/env node
/*
 * Kök dizindeki kaynak dosyalardan arayuzun kullandigi il/ilce verisini
 * uretir:  src/data/<ulke-kodu>-locations.json
 *
 * Kaynaklar:
 *   il_ilce.csv      -> tr  (il,ilce baslikli CSV)
 *   il_ilce_sy.json  -> sy  ({ "Il": ["Ilce", ...] })
 *
 * Yeni ulke eklemek icin SOURCES listesine bir satir ekleyip kaynak dosyayi
 * kök dizine koymak yeterlidir.
 *
 * Calistirma:  npm run locations:generate -w @fieldlead/web
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "../../..");
const outputDir = resolve(scriptDir, "../src/data");

const LOCALE = "tr";
const compare = (left, right) => left.localeCompare(right, LOCALE);

function readCsv(path) {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [header, ...rows] = lines;

  if (header?.trim().toLowerCase() !== "il,ilce") {
    throw new Error(
      `${path}: beklenmeyen CSV basligi "${header}", "il,ilce" bekleniyordu.`,
    );
  }

  const source = {};

  for (const row of rows) {
    const separatorIndex = row.indexOf(",");

    if (separatorIndex === -1) {
      continue;
    }

    const province = row.slice(0, separatorIndex).trim();
    const district = row.slice(separatorIndex + 1).trim();

    if (!province || !district) {
      continue;
    }

    (source[province] ??= []).push(district);
  }

  return source;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const SOURCES = [
  { code: "tr", file: "il_ilce.csv", read: readCsv },
  { code: "sy", file: "il_ilce_sy.json", read: readJson },
];

function normalize(source) {
  const locations = new Map();

  for (const [rawProvince, rawDistricts] of Object.entries(source)) {
    const province = String(rawProvince).trim();

    if (!province || !Array.isArray(rawDistricts)) {
      continue;
    }

    const districts = new Set(
      rawDistricts.map((district) => String(district).trim()).filter(Boolean),
    );

    if (districts.size === 0) {
      continue;
    }

    locations.set(province, districts);
  }

  return Object.fromEntries(
    [...locations.entries()]
      .sort(([left], [right]) => compare(left, right))
      .map(([province, districts]) => [province, [...districts].sort(compare)]),
  );
}

mkdirSync(outputDir, { recursive: true });

for (const source of SOURCES) {
  const input = resolve(projectRoot, source.file);

  if (!existsSync(input)) {
    console.log(`atlandi (kaynak yok): ${source.file}`);
    continue;
  }

  const normalized = normalize(source.read(input));
  const output = resolve(outputDir, `${source.code}-locations.json`);

  writeFileSync(output, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  const districtCount = Object.values(normalized).reduce(
    (total, districts) => total + districts.length,
    0,
  );

  console.log(
    `${source.code}: ${Object.keys(normalized).length} il, ${districtCount} ilce -> ${output}`,
  );
}
