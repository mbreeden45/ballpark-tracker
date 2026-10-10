import { geoAlbers, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import statesTopo from 'us-atlas/states-10m.json';
import worldTopo from 'world-atlas/countries-110m.json';

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 600;

/**
 * Albers conic projection with the standard USA parallels. Unlike geoAlbersUsa it does not
 * discard points outside the lower 48, so southern Ontario (Rogers Centre) renders cleanly.
 */
export function createAlbersProjection(): GeoProjection {
  return geoAlbers()
    .rotate([96, 0])
    .center([0, 38.5])
    .parallels([29.5, 45.5])
    .scale(1150)
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
}

export const US_STATES_TOPOLOGY = statesTopo as unknown as Topology;
export const WORLD_TOPOLOGY = worldTopo as unknown as Topology;

/** Country ids (ISO numeric) drawn as context around the US: Canada, Mexico. */
const CONTEXT_COUNTRY_IDS = new Set(['124', '484']);

export function usStatesFeatures(): FeatureCollection<Geometry> {
  const states = US_STATES_TOPOLOGY.objects.states as GeometryCollection;
  return feature(US_STATES_TOPOLOGY, states) as unknown as FeatureCollection<Geometry>;
}

export function contextCountryFeatures(): FeatureCollection<Geometry> {
  const countries = WORLD_TOPOLOGY.objects.countries as GeometryCollection;
  const all = feature(WORLD_TOPOLOGY, countries) as unknown as FeatureCollection<Geometry>;
  return { ...all, features: all.features.filter((f) => CONTEXT_COUNTRY_IDS.has(String(f.id))) };
}

export interface StaticMapPaths {
  states: string[];
  context: string[];
}

/** Pre-rendered SVG path strings for static maps (share cards). */
export function buildStaticPaths(projection: GeoProjection): StaticMapPaths {
  const path = geoPath(projection);
  return {
    states: usStatesFeatures().features.map((f) => path(f) ?? '').filter(Boolean),
    context: contextCountryFeatures().features.map((f) => path(f) ?? '').filter(Boolean),
  };
}
