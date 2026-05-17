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
  temperature: string; // one word, e.g. "Temperate"
  rainfall: string;    // one word, e.g. "Rainy"
  costOfLiving: Level;
  internetSpeed: InternetSpeed;
  safety: Level;
  image: string;
}

export const SITES: Site[] = [
  { title: "Pine Hollow",     region: "Lapland, SE",      regionId: "europe",        climateId: "polar",           temperature: "Cold",      rainfall: "Snowy",   costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: pineHollow },
  { title: "Mýrar Cliff",     region: "Faroe, FO",        regionId: "europe",        climateId: "temperate",       temperature: "Cool",      rainfall: "Rainy",   costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: myrarCliff },
  { title: "Atacama Plateau", region: "Antofagasta, CL",  regionId: "south-america", climateId: "mountain-alpine", temperature: "Cool",      rainfall: "Dry",     costOfLiving: "Low",    internetSpeed: "Medium", safety: "Medium", image: atacamaPlateau },
  { title: "Skye Moor",       region: "Highlands, UK",    regionId: "europe",        climateId: "temperate",       temperature: "Temperate", rainfall: "Rainy",   costOfLiving: "Medium", internetSpeed: "Medium", safety: "High",   image: skyeMoor },
  { title: "Mosi Plains",     region: "Suðurland, IS",    regionId: "europe",        climateId: "polar",           temperature: "Cold",      rainfall: "Wet",     costOfLiving: "High",   internetSpeed: "Fast",   safety: "High",   image: mosiPlains },
  { title: "Black Pines",     region: "Karelia, FI",      regionId: "europe",        climateId: "continental",     temperature: "Cold",      rainfall: "Moderate", costOfLiving: "Medium", internetSpeed: "Fast",   safety: "High",   image: blackPines },
];
