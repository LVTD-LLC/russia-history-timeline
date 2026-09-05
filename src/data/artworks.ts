import catalogue from "./artworks.json" with { type: "json" };
export type Artwork = {
  id: string;
  painter: string;
  title: string;
  date: string;
  image: string;
  source: string;
  credit: string;
  license: string;
};
export const artworks: Artwork[] = catalogue;
