import got from "got";

interface Pokemon {
  randomBattleMoves?: string[];
  randomBattleLevel?: number;
  randomDoubleBattleMoves?: string[];
  randomDoubleBattleLevel?: number;
  randomBattleNoDynamaxMoves?: string[];
  tier: string;
  doublesTier?: string;
}

async function fetchData() {
  let stuff = await got
    .get(
      "https://raw.githubusercontent.com/smogon/pokemon-showdown/5a92c87869afff1f91deae9162dbda993656ed73/data/formats-data.ts"
    )
    .then((res) =>
      res.body.slice(
        "export const FormatsData: {[k: string]: SpeciesFormatsData} = "
          .length - 1
      )
    );

  stuff = stuff.slice(0, stuff.length - 2);
  const data = eval(`(${stuff})`);

  let res = new Map<string, Pokemon>();

  for (let key in data) {
    res.set(key, data[key]);
  }

  return res;
}

fetchData().then(console.log);
