import pineHollow from "@/assets/sites/pine-hollow.jpg";
import myrarCliff from "@/assets/sites/myrar-cliff.jpg";
import atacamaPlateau from "@/assets/sites/atacama-plateau.jpg";
import skyeMoor from "@/assets/sites/skye-moor.jpg";
import mosiPlains from "@/assets/sites/mosi-plains.jpg";
import blackPines from "@/assets/sites/black-pines.jpg";
import type { RegionId } from "./regions";
import type { ClimateId } from "./climates";

export type Level = "Low" | "Medium" | "High";
export type InternetSpeed = "Slow" | "Medium" | "Fast";

export interface Site {
  title: string;
  region: string;
  regionId: RegionId;
  climateId: ClimateId;
  temperature: string;
  rainfall: string;
  costOfLiving: Level;
  internetSpeed: InternetSpeed;
  safety: Level;
  image: string;
}

// Image pool — reused across sites until unique art is added.
const IMG = [pineHollow, myrarCliff, atacamaPlateau, skyeMoor, mosiPlains, blackPines];
const img = (i: number) => IMG[i % IMG.length];

export const SITES: Site[] = [
  // Europe
  { title: "Pine Hollow",     region: "Lapland, SE",     regionId: "europe", climateId: "polar",       temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(0) },
  { title: "Mýrar Cliff",     region: "Faroe, FO",       regionId: "europe", climateId: "temperate",   temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: img(1) },
  { title: "Skye Moor",       region: "Highlands, UK",   regionId: "europe", climateId: "temperate",   temperature: "Temperate", rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: img(3) },
  { title: "Mosi Plains",     region: "Suðurland, IS",   regionId: "europe", climateId: "polar",       temperature: "Cold",      rainfall: "Wet",      costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: img(4) },
  { title: "Black Pines",     region: "Karelia, FI",     regionId: "europe", climateId: "continental", temperature: "Cold",      rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(5) },
  { title: "Olive Ridge",     region: "Peloponnese, GR", regionId: "europe", climateId: "temperate",   temperature: "Warm",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "High",   image: img(2) },

  // North America
  { title: "Cedar Basin",     region: "British Columbia, CA", regionId: "north-america", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(0) },
  { title: "Red Mesa",        region: "Utah, US",             regionId: "north-america", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Fast",   safety: "Medium", image: img(2) },
  { title: "Yukon Bend",      region: "Yukon, CA",            regionId: "north-america", climateId: "polar",           temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: img(4) },
  { title: "Bayou Hollow",    region: "Louisiana, US",        regionId: "north-america", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(1) },
  { title: "Sierra Crest",    region: "California, US",       regionId: "north-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: img(5) },
  { title: "Great Lakes Cove",region: "Ontario, CA",          regionId: "north-america", climateId: "continental",     temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(3) },

  // South America
  { title: "Atacama Plateau", region: "Antofagasta, CL",   regionId: "south-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(2) },
  { title: "Amazon Reach",    region: "Amazonas, BR",      regionId: "south-america", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: img(1) },
  { title: "Patagonia Fjord", region: "Aysén, CL",         regionId: "south-america", climateId: "polar",           temperature: "Cold",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: img(4) },
  { title: "Pampas Stretch",  region: "Buenos Aires, AR",  regionId: "south-america", climateId: "temperate",       temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(3) },
  { title: "Andes Ridge",     region: "Cusco, PE",         regionId: "south-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(5) },
  { title: "Cerrado Flats",   region: "Goiás, BR",         regionId: "south-america", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(0) },

  // Africa
  { title: "Sahel Pan",       region: "Agadez, NE",        regionId: "africa", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: img(2) },
  { title: "Rift Highlands",  region: "Rift Valley, KE",   regionId: "africa", climateId: "mountain-alpine", temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(5) },
  { title: "Congo Canopy",    region: "Cuvette, CG",       regionId: "africa", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: img(1) },
  { title: "Cape Bluff",      region: "Western Cape, ZA",  regionId: "africa", climateId: "temperate",       temperature: "Warm",      rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "Medium", image: img(3) },
  { title: "Atlas Spine",     region: "High Atlas, MA",    regionId: "africa", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(0) },
  { title: "Namib Dune",      region: "Erongo, NA",        regionId: "africa", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: img(4) },

  // Asia
  { title: "Gobi Edge",       region: "Ömnögovi, MN",      regionId: "asia", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(2) },
  { title: "Mekong Bend",     region: "Luang Prabang, LA", regionId: "asia", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(1) },
  { title: "Hokkaido Forest", region: "Hokkaido, JP",      regionId: "asia", climateId: "continental",     temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: img(5) },
  { title: "Himalaya Pass",   region: "Ladakh, IN",        regionId: "asia", climateId: "mountain-alpine", temperature: "Cold",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Medium", image: img(4) },
  { title: "Anatolia Steppe", region: "Cappadocia, TR",    regionId: "asia", climateId: "temperate",       temperature: "Warm",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: img(3) },
  { title: "Bali Cove",       region: "Bali, ID",          regionId: "asia", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Fast",   safety: "High",   image: img(0) },

  // Oceania
  { title: "Red Centre",      region: "Northern Territory, AU", regionId: "oceania", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: img(2) },
  { title: "Fiordland Edge",  region: "South Island, NZ",       regionId: "oceania", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: img(3) },
  { title: "Coral Atoll",     region: "Tuamotu, PF",            regionId: "oceania", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "High",   internetSpeed: "Medium", safety: "High",   image: img(1) },
  { title: "Tasman Bluff",    region: "Tasmania, AU",           regionId: "oceania", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(0) },
  { title: "Highland Spire",  region: "Southern Alps, NZ",      regionId: "oceania", climateId: "mountain-alpine", temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "High",   internetSpeed: "Medium", safety: "High",   image: img(5) },
  { title: "Reef Shoal",      region: "Queensland, AU",         regionId: "oceania", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: img(4) },

  // Antarctica
  { title: "Ross Shelf",      region: "Ross Sea, AQ",       regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: img(0) },
  { title: "Vinson Saddle",   region: "Ellsworth, AQ",      regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: img(4) },
  { title: "Dry Valley",      region: "McMurdo, AQ",        regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: img(2) },
  { title: "Pine Glacier",    region: "West Antarctica, AQ",regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: img(5) },
  { title: "Halley Plain",    region: "Brunt Ice Shelf, AQ",regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Medium", safety: "Medium", image: img(1) },
  { title: "Concordia Dome",  region: "Dome C, AQ",         regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: img(3) },
];
