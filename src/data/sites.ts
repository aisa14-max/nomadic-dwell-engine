import pineHollow from "@/assets/sites/pine-hollow.jpg";
import myrarCliff from "@/assets/sites/myrar-cliff.jpg";
import skyeMoor from "@/assets/sites/skye-moor.jpg";
import mosiPlains from "@/assets/sites/mosi-plains.jpg";
import blackPines from "@/assets/sites/black-pines.jpg";
import oliveRidge from "@/assets/sites/olive-ridge.jpg";
import cedarBasin from "@/assets/sites/cedar-basin.jpg";
import redMesa from "@/assets/sites/red-mesa.jpg";
import yukonBend from "@/assets/sites/yukon-bend.jpg";
import bayouHollow from "@/assets/sites/bayou-hollow.jpg";
import sierraCrest from "@/assets/sites/sierra-crest.jpg";
import greatLakesCove from "@/assets/sites/great-lakes-cove.jpg";
import atacamaPlateau from "@/assets/sites/atacama-plateau.jpg";
import amazonReach from "@/assets/sites/amazon-reach.jpg";
import patagoniaFjord from "@/assets/sites/patagonia-fjord.jpg";
import pampasStretch from "@/assets/sites/pampas-stretch.jpg";
import andesRidge from "@/assets/sites/andes-ridge.jpg";
import cerradoFlats from "@/assets/sites/cerrado-flats.jpg";
import sahelPan from "@/assets/sites/sahel-pan.jpg";
import riftHighlands from "@/assets/sites/rift-highlands.jpg";
import congoCanopy from "@/assets/sites/congo-canopy.jpg";
import capeBluff from "@/assets/sites/cape-bluff.jpg";
import atlasSpine from "@/assets/sites/atlas-spine.jpg";
import namibDune from "@/assets/sites/namib-dune.jpg";
import gobiEdge from "@/assets/sites/gobi-edge.jpg";
import mekongBend from "@/assets/sites/mekong-bend.jpg";
import hokkaidoForest from "@/assets/sites/hokkaido-forest.jpg";
import himalayaPass from "@/assets/sites/himalaya-pass.jpg";
import anatoliaSteppe from "@/assets/sites/anatolia-steppe.jpg";
import baliCove from "@/assets/sites/bali-cove.jpg";
import redCentre from "@/assets/sites/red-centre.jpg";
import fiordlandEdge from "@/assets/sites/fiordland-edge.jpg";
import coralAtoll from "@/assets/sites/coral-atoll.jpg";
import tasmanBluff from "@/assets/sites/tasman-bluff.jpg";
import highlandSpire from "@/assets/sites/highland-spire.jpg";
import reefShoal from "@/assets/sites/reef-shoal.jpg";
import rossShelf from "@/assets/sites/ross-shelf.jpg";
import vinsonSaddle from "@/assets/sites/vinson-saddle.jpg";
import dryValley from "@/assets/sites/dry-valley.jpg";
import pineGlacier from "@/assets/sites/pine-glacier.jpg";
import halleyPlain from "@/assets/sites/halley-plain.jpg";
import concordiaDome from "@/assets/sites/concordia-dome.jpg";
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

export const SITES: Site[] = [
  // Europe
  { title: "Pine Hollow",     region: "Lapland, SE",     regionId: "europe", climateId: "polar",       temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: pineHollow },
  { title: "Mýrar Cliff",     region: "Faroe, FO",       regionId: "europe", climateId: "temperate",   temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: myrarCliff },
  { title: "Skye Moor",       region: "Highlands, UK",   regionId: "europe", climateId: "temperate",   temperature: "Temperate", rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: skyeMoor },
  { title: "Mosi Plains",     region: "Suðurland, IS",   regionId: "europe", climateId: "polar",       temperature: "Cold",      rainfall: "Wet",      costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: mosiPlains },
  { title: "Black Pines",     region: "Karelia, FI",     regionId: "europe", climateId: "continental", temperature: "Cold",      rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: blackPines },
  { title: "Olive Ridge",     region: "Peloponnese, GR", regionId: "europe", climateId: "temperate",   temperature: "Warm",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "High",   image: oliveRidge },

  // North America
  { title: "Cedar Basin",     region: "British Columbia, CA", regionId: "north-america", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: cedarBasin },
  { title: "Red Mesa",        region: "Utah, US",             regionId: "north-america", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Fast",   safety: "Medium", image: redMesa },
  { title: "Yukon Bend",      region: "Yukon, CA",            regionId: "north-america", climateId: "polar",           temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: yukonBend },
  { title: "Bayou Hollow",    region: "Louisiana, US",        regionId: "north-america", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: bayouHollow },
  { title: "Sierra Crest",    region: "California, US",       regionId: "north-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: sierraCrest },
  { title: "Great Lakes Cove",region: "Ontario, CA",          regionId: "north-america", climateId: "continental",     temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: greatLakesCove },

  // South America
  { title: "Atacama Plateau", region: "Antofagasta, CL",   regionId: "south-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: atacamaPlateau },
  { title: "Amazon Reach",    region: "Amazonas, BR",      regionId: "south-america", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: amazonReach },
  { title: "Patagonia Fjord", region: "Aysén, CL",         regionId: "south-america", climateId: "polar",           temperature: "Cold",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: patagoniaFjord },
  { title: "Pampas Stretch",  region: "Buenos Aires, AR",  regionId: "south-america", climateId: "temperate",       temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: pampasStretch },
  { title: "Andes Ridge",     region: "Cusco, PE",         regionId: "south-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: andesRidge },
  { title: "Cerrado Flats",   region: "Goiás, BR",         regionId: "south-america", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: cerradoFlats },

  // Africa
  { title: "Sahel Pan",       region: "Agadez, NE",        regionId: "africa", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: sahelPan },
  { title: "Rift Highlands",  region: "Rift Valley, KE",   regionId: "africa", climateId: "mountain-alpine", temperature: "Temperate", rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: riftHighlands },
  { title: "Congo Canopy",    region: "Cuvette, CG",       regionId: "africa", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Low",    image: congoCanopy },
  { title: "Cape Bluff",      region: "Western Cape, ZA",  regionId: "africa", climateId: "temperate",       temperature: "Warm",      rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "Medium", image: capeBluff },
  { title: "Atlas Spine",     region: "High Atlas, MA",    regionId: "africa", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: atlasSpine },
  { title: "Namib Dune",      region: "Erongo, NA",        regionId: "africa", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: namibDune },

  // Asia
  { title: "Gobi Edge",       region: "Ömnögovi, MN",      regionId: "asia", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: gobiEdge },
  { title: "Mekong Bend",     region: "Luang Prabang, LA", regionId: "asia", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: mekongBend },
  { title: "Hokkaido Forest", region: "Hokkaido, JP",      regionId: "asia", climateId: "continental",     temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: hokkaidoForest },
  { title: "Himalaya Pass",   region: "Ladakh, IN",        regionId: "asia", climateId: "mountain-alpine", temperature: "Cold",      rainfall: "Dry",      costOfLiving: "Low",    internetSpeed: "Slow",   safety: "Medium", image: himalayaPass },
  { title: "Anatolia Steppe", region: "Cappadocia, TR",    regionId: "asia", climateId: "temperate",       temperature: "Warm",      rainfall: "Moderate", costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: anatoliaSteppe },
  { title: "Bali Cove",       region: "Bali, ID",          regionId: "asia", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Low",    internetSpeed: "Fast",   safety: "High",   image: baliCove },

  // Oceania
  { title: "Red Centre",      region: "Northern Territory, AU", regionId: "oceania", climateId: "dry-arid",        temperature: "Hot",       rainfall: "Dry",      costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: redCentre },
  { title: "Fiordland Edge",  region: "South Island, NZ",       regionId: "oceania", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: fiordlandEdge },
  { title: "Coral Atoll",     region: "Tuamotu, PF",            regionId: "oceania", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "High",   internetSpeed: "Medium", safety: "High",   image: coralAtoll },
  { title: "Tasman Bluff",    region: "Tasmania, AU",           regionId: "oceania", climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",    costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: tasmanBluff },
  { title: "Highland Spire",  region: "Southern Alps, NZ",      regionId: "oceania", climateId: "mountain-alpine", temperature: "Cold",      rainfall: "Snowy",    costOfLiving: "High",   internetSpeed: "Medium", safety: "High",   image: highlandSpire },
  { title: "Reef Shoal",      region: "Queensland, AU",         regionId: "oceania", climateId: "tropical",        temperature: "Hot",       rainfall: "Wet",      costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: reefShoal },

  // Antarctica
  { title: "Ross Shelf",      region: "Ross Sea, AQ",       regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: rossShelf },
  { title: "Vinson Saddle",   region: "Ellsworth, AQ",      regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: vinsonSaddle },
  { title: "Dry Valley",      region: "McMurdo, AQ",        regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: dryValley },
  { title: "Pine Glacier",    region: "West Antarctica, AQ",regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: pineGlacier },
  { title: "Halley Plain",    region: "Brunt Ice Shelf, AQ",regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Snowy", costOfLiving: "High", internetSpeed: "Medium", safety: "Medium", image: halleyPlain },
  { title: "Concordia Dome",  region: "Dome C, AQ",         regionId: "antarctica", climateId: "polar", temperature: "Cold", rainfall: "Dry",   costOfLiving: "High", internetSpeed: "Slow",   safety: "Medium", image: concordiaDome },
];
