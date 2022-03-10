import got from "got";

interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

interface Pokemon {
  randomBattleMoves?: string[];
  randomBattleLevel?: number;
  randomDoubleBattleMoves?: string[];
  randomDoubleBattleLevel?: number;
  randomBattleNoDynamaxMoves?: string[];
  tier: string;
  doublesTier?: string;
  num: number;
  name: string;
  types: string[];
}

async function fetchData(noNFELC?: boolean) {
  let formatData = await got
    .get(
      "https://raw.githubusercontent.com/smogon/pokemon-showdown/5a92c87869afff1f91deae9162dbda993656ed73/data/formats-data.ts"
    )
    .then((res) =>
      res.body.slice(
        "export const FormatsData: {[k: string]: SpeciesFormatsData} = "
          .length - 1
      )
    );

  let dexData = await got
    .get(
      "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/pokedex.ts"
    )
    .then((res) =>
      res.body.slice(
        "export const Pokedex: {[speciesid: string]: SpeciesData} = ".length - 1
      )
    );

  formatData = formatData.slice(0, formatData.length - 2);
  dexData = dexData.slice(0, dexData.length - 2);

  const data = eval(`(${formatData})`);
  const dexStuff = eval(`(${dexData})`);

  let res = new Map<string, Pokemon>();

  for (let key in data) {
    res.set(key, data[key]);
  }

  for (let key in data) {
    let ds = dexStuff[key];
    if (!ds) {
      res.delete(key);
      continue;
    }
    let temp = res.get(key);
    if (!temp) {
      continue;
    }
    temp.num = ds.num;
    temp.name = ds.name;
    temp.types = ds.types;
    res.set(key, temp);
  }

  for (let [key, value] of res) {
    // removes custom mons

    let { tier } = value;

    if (!tier) {
      console.log(key + " tier is undefined");
      res.delete(key);
      continue;
    }
    if (tier.startsWith("CAP")) {
      console.log(key + " is custom pokemon");
      res.delete(key);
      continue;
    } else if (tier == "Illegal") {
      console.log(key + " is illegal");
      res.delete(key);
      continue;
    }
  }

  if (noNFELC) return new Map([...res].filter(nfelc));
  return res;
}

const singles = (a: [string, Pokemon], b: [string, Pokemon]) => {
  let ta = tiers.indexOf(a[1].tier);
  let tb = tiers.indexOf(b[1].tier);

  return ta - tb;
};

const nfelc = (stuff: [string, Pokemon]) =>
  stuff[1].tier != "NFE" && stuff[1].tier != "LC";

const notGmax = (stuff: [string, Pokemon]) => !stuff[0].endsWith("gmax");

const tiers = [
  "NFE",
  "LC",
  "(PU)",
  "PU",
  "PUBL",
  "NU",
  "NUBL",
  "RU",
  "RUBL",
  "UU",
  "UUBL",
  "OU",
  "Uber",
  "AG",
];

const dtiers = [
  "NFE",
  "LC",
  "(DUU)",
  "DUU",
  "(DOU)",
  "DOU",
  "(DUber)",
  "DUber",
];

const types = [
  "Normal",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dark",
  "Dragon",
  "Steel",
  "Fairy",
];

const scoreType = (type: string, pokemon: Map<string, Pokemon>) => {
  let total = 0;
  let count = 0;

  let filtered = new Map(
    [...pokemon]
      .filter((stuff: [string, Pokemon]) => stuff[1].types.includes(type))
      .filter(notGmax)
  );

  for (let [k, v] of filtered) {
    total += tiers.indexOf(v.tier);
    count++;
  }

  return total / count;
};

const doubleScoreType = (type: string, pokemon: Map<string, Pokemon>) => {
  let total = 0;
  let count = 0;

  let filtered = new Map(
    [...pokemon]
      .filter((stuff: [string, Pokemon]) => !!stuff[1].doublesTier)
      .filter((stuff: [string, Pokemon]) => stuff[1].types.includes(type))
      .filter(notGmax)
  );

  for (let [k, v] of filtered) {
    if (!v.doublesTier) continue;
    total += dtiers.indexOf(v.doublesTier);
    count++;
  }

  return total / count;
};

const getEffectiveTier = (val: number, doubles?: boolean) => {
  // rounds up if the tier is a bl tier
  let index = Math.round(val);
  let tier = doubles ? dtiers[index] : tiers[index];

  if (tier.endsWith("BL")) tier = tiers[index + 1];

  return tier;
};

const getFloorTier = (val: number, doubles?: boolean) => {
  // uses Math.floor
  let index = Math.floor(val);
  let tier = doubles ? dtiers[index] : tiers[index];

  return tier;
};

const getRoundTier = (val: number, doubles?: boolean) => {
  // uses Math.round
  let index = Math.round(val);
  let tier = doubles ? dtiers[index] : tiers[index];

  return tier;
};

const getCeilTier = (val: number, doubles?: boolean) => {
  // uses Math.ceil
  let index = Math.ceil(val);
  let tier = doubles ? dtiers[index] : tiers[index];

  return tier;
};

fetchData(true).then((res) => {
  const pokemon = new Map([...res.entries()]);

  let temp = new Map<string, number>();
  for (let type of types) {
    let s = doubleScoreType(type, pokemon);

    temp.set(type, s);
  }

  let info = new Map(
    [...temp.entries()].sort(
      (a: [string, number], b: [string, number]) => a[1] - b[1]
    )
  );
  for (let [k, v] of info) {
    console.log(`${k}: ${getRoundTier(v, true)}`);
  }
});
