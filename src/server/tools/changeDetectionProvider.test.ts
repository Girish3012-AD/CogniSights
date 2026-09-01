import { detectChangeProvider } from "./changeDetectionProvider.js";
import { expect, test, describe } from 'vitest';

describe("Temporal Change Detection", () => {
  const createPoly = (lng: number, lat: number) => ({
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[lng, lat], [lng+0.0001, lat], [lng+0.0001, lat+0.0001], [lng, lat+0.0001], [lng, lat]]]
    }
  });

  const getOutput = (featuresStart: any[], featuresEnd: any[]) => ({
    dependencyOutputs: {
      "step_1_detect_buildings_start": {
        features: { type: "FeatureCollection", features: featuresStart },
        count: featuresStart.length,
        source: "Mock T1",
        acquisitionDate: "2020"
      },
      "step_2_detect_buildings_end": {
        features: { type: "FeatureCollection", features: featuresEnd },
        count: featuresEnd.length,
        source: "Mock T2",
        acquisitionDate: "2026"
      }
    }
  });

  test("A. Identical buildings -> added=0, removed=0, unchanged=1", async () => {
    const poly = createPoly(73.85, 18.52);
    const result = await detectChangeProvider(getOutput([poly], [poly]));
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(0);
    expect(result.data?.summary.removedCount).toBe(0);
    expect(result.data?.summary.unchangedCount).toBe(1);
  });

  test("B. New building at T2 -> added=1", async () => {
    const poly = createPoly(73.85, 18.52);
    const result = await detectChangeProvider(getOutput([], [poly]));
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(1);
    expect(result.data?.summary.removedCount).toBe(0);
  });

  test("C. Building removed at T2 -> removed=1", async () => {
    const poly = createPoly(73.85, 18.52);
    const result = await detectChangeProvider(getOutput([poly], []));
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(0);
    expect(result.data?.summary.removedCount).toBe(1);
  });

  test("D. Multiple buildings matching deterministically", async () => {
    const p1 = createPoly(73.85, 18.52);
    const p2 = createPoly(73.86, 18.53);
    const p3 = createPoly(73.87, 18.54); // only in T1
    const p4 = createPoly(73.88, 18.55); // only in T2
    const result = await detectChangeProvider(getOutput([p1, p2, p3], [p2, p1, p4])); // Order differs
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(1); // p4
    expect(result.data?.summary.removedCount).toBe(1); // p3
    expect(result.data?.summary.unchangedCount).toBe(2); // p1, p2
  });

  test("E. Slight geometry variation (within 15m) -> unchanged", async () => {
    const p1 = createPoly(73.85, 18.52);
    const p2 = createPoly(73.85001, 18.52001); // Distance is ~1.5 meters
    const result = await detectChangeProvider(getOutput([p1], [p2]));
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(0);
    expect(result.data?.summary.removedCount).toBe(0);
    expect(result.data?.summary.unchangedCount).toBe(1);
  });

  test("F. Completely different buildings -> added, removed", async () => {
    const p1 = createPoly(73.85, 18.52);
    const p2 = createPoly(74.00, 19.00); // 100+ km away
    const result = await detectChangeProvider(getOutput([p1], [p2]));
    expect(result.status).toBe("SUCCESS");
    expect(result.data?.summary.addedCount).toBe(1);
    expect(result.data?.summary.removedCount).toBe(1);
    expect(result.data?.summary.unchangedCount).toBe(0);
  });

  test("Dependency failure -> fails gracefully", async () => {
    const result = await detectChangeProvider({ dependencyOutputs: { "step_1_detect_buildings_start": {} } });
    expect(result.status).toBe("FAILED");
  });
});
