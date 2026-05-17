import pineHollow from "@/assets/sites/pine-hollow.jpg";
import myrarCliff from "@/assets/sites/myrar-cliff.jpg";
import atacamaPlateau from "@/assets/sites/atacama-plateau.jpg";
import skyeMoor from "@/assets/sites/skye-moor.jpg";
import mosiPlains from "@/assets/sites/mosi-plains.jpg";
import blackPines from "@/assets/sites/black-pines.jpg";
import type { RegionId } from "./regions";
import type { ClimateId } from "./climates";

export interface Site {
  title: string;
  region: string;
  regionId: RegionId;
  climateId: ClimateId;
  solar: string;
  wind: string;
  water: string;
  climate: string;
  image: string;
}

export const SITES: Site[] = [
  { title: "Pine Hollow",     region: "Lapland, SE",      regionId: "europe",        climateId: "polar",           solar: "5.1", wind: "12", water: "Stream",  climate: "Sub-arctic",  image: pineHollow },
  { title: "Mýrar Cliff",     region: "Faroe, FO",        regionId: "europe",        climateId: "temperate",       solar: "3.8", wind: "34", water: "Rain",    climate: "Maritime",    image: myrarCliff },
  { title: "Atacama Plateau", region: "Antofagasta, CL",  regionId: "south-america", climateId: "mountain-alpine", solar: "9.2", wind: "8",  water: "Tank",    climate: "Arid alpine", image: atacamaPlateau },
  { title: "Skye Moor",       region: "Highlands, UK",    regionId: "europe",        climateId: "temperate",       solar: "3.2", wind: "26", water: "Spring",  climate: "Temperate",   image: skyeMoor },
  { title: "Mosi Plains",     region: "Suðurland, IS",    regionId: "europe",        climateId: "polar",           solar: "4.0", wind: "22", water: "Glacial", climate: "Sub-arctic",  image: mosiPlains },
  { title: "Black Pines",     region: "Karelia, FI",      regionId: "europe",        climateId: "continental",     solar: "4.6", wind: "10", water: "Lake",    climate: "Boreal",      image: blackPines },
];
