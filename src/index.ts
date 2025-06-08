import fs from "fs";
import { getPlayerData } from "./players";
import { PlayerInfo, fetchGuildAllyCodes } from "./guild";

const GUILD_ID = "OwKdDi5bQ6uReLfiPP5HkA";

type PlatoonChar = {
  name: string;
  required_relic: number;
};

type PhaseData = {
  [planet: string]: PlatoonChar[];
};

type RoteData = {
  [phase: string]: PhaseData;
};

const normalize = (str: string) => str.trim().toLowerCase().replace(/’/g, "'");

const main = async () => {
  const roteData: RoteData = JSON.parse(
    fs.readFileSync("data/rote_platoons.json", "utf-8")
  );

  // Load Players
  let players: PlayerInfo[] = [];

  if (fs.existsSync("data/allyCodes.json")) {
    players = JSON.parse(fs.readFileSync("data/allyCodes.json", "utf-8"));
  } else {
    players = await fetchGuildAllyCodes(GUILD_ID);
  }

  // Get each player roster
  const playerUnitsMap = new Map<string, any[]>();
  for (const player of players) {
    const data = await getPlayerData(player.allyCode);
    if (data) {
      playerUnitsMap.set(
        player.allyCode,
        (data || []).filter((u: any) => u.data?.combat_type === 1)
      );
    }
  }

  for (const phase of Object.keys(roteData)) {
    console.log(`\n=== ${phase.toUpperCase()} ===`);
    const planets = roteData[phase];

    for (const planet of Object.keys(planets)) {
      console.log(`\n--- Planète: ${planet} ---`);
      const chars = planets[planet];

      for (const charReq of chars) {
        const candidates: {
          player: PlayerInfo;
          relicLevel: number;
          status: string;
        }[] = [];

        for (const player of players) {
          const units = playerUnitsMap.get(player.allyCode);
          if (!units) continue;

          const unit = units.find(
            (u) => normalize(u.data?.name) === normalize(charReq.name)
          );
          if (!unit) continue;

          const relicTier = unit.data.relic_tier ?? -1;

          let relicLevel = relicTier - 2;

          let status = "";

          if (relicTier < 2) {
  // reliqueTier 1 = pas Gear 13
  candidates.push({
    player,
    relicLevel: -1,
    status: "❗ Pas Gear 13",
  });
} else {
  const relic = relicTier - 2; // relique réelle, 0 si relicTier=2
  if (relic >= charReq.required_relic) {
    candidates.push({
      player,
      relicLevel: relic,
      status: "✅ OK",
    });
  } else if (relic === 0) {
    candidates.push({
      player,
      relicLevel: relic,
      status: "❗ Juste Gear 13",
    });
  } else {
    candidates.push({
      player,
      relicLevel: relic,
      status: "❗ Relic trop basse",
    });
  }
}
        }

        if (candidates.length === 0) {
          console.log(`❌ Aucun joueur ne possède ${charReq.name}`);
          continue;
        }

        const ok = candidates.filter((c) => c.status === "✅ OK");
        if (ok.length > 0) {
          console.log(`✅ ${charReq.name} prêt chez :`);
          ok.forEach((c) => {
            console.log(`   - ${c.player.name} (Relic ${c.relicLevel})`);
          });
        }

        const notReady = candidates.filter((c) => c.status !== "✅ OK");
        if (notReady.length > 0) {
          console.log(`❗ ${charReq.name} non prêt mais possédé par :`);
          notReady.forEach((c) => {
            c.relicLevel >0 ? 
            console.log(
              `   - ${c.player.name} (${c.status}, Relic ${c.relicLevel}) `
            ) : console.log(
              `   - ${c.player.name} (${c.status}) `
            )
          });
        }
      }
    }
  }
};

main();
