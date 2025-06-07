import fs from 'fs';
import { getPlayerData } from './players';
import { PlayerInfo, fetchGuildAllyCodes } from './guild';
import { json } from 'stream/consumers';

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

const main = async () => {
    // Load platoons
    const roteData: RoteData = JSON.parse(fs.readFileSync('rote_platoons.json', 'utf-8'))
    // Load Players
    let players: PlayerInfo[] = [];

    if (fs.existsSync('allyCodes.json')) {
        players = JSON.parse(fs.readFileSync('allyCodes.json', 'utf-8'));
    } else {
        players = await fetchGuildAllyCodes(GUILD_ID)
    }

    // Get each player roster
    const playerUnitsMap = new Map<string, any[]>()
    for (const player of players) {
        const data = await getPlayerData(player.allyCode);

        if (data) {
             playerUnitsMap.set(player.allyCode, data.units || data.roster || []);
        }
    }

    for (const phase of Object.keys(roteData)) {
    console.log(`\n=== ${phase.toUpperCase()} ===`);

    const planets = roteData[phase];
    for (const planet of Object.keys(planets)) {
      console.log(`\n--- Planète: ${planet} ---`);

      const chars = planets[planet];
      for (const charReq of chars) {
        // Pour chaque perso requis, cherche les candidats
        const candidates: { player: PlayerInfo; relicLevel: number; stars: number }[] = [];

        for (const player of players) {
          const units = playerUnitsMap.get(player.allyCode);
          if (!units) continue;

          const unit = units.find(u => u.data.name === charReq.name);
          if (!unit) continue;

             const relicOrStars = unit.relic_tier || 0;

          candidates.push({
            player,
            relicLevel: relicOrStars,
            stars: unit.rarity
          });
        }

        if (candidates.length === 0) {
          console.log(`❌ Aucun joueur ne possède ${charReq.name}`);
          continue;
        }

        const readyPlayers = candidates.filter(c => c.relicLevel >= charReq.required_relic);
        if (readyPlayers.length > 0) {
          console.log(`✅ ${charReq.name} déjà prêt chez :`);
          readyPlayers.forEach(c => {
            console.log(`   - ${c.player.name} (Relic: ${c.relicLevel})`);
          });
        } else {
          const closest = candidates.reduce((prev, curr) =>
            curr.relicLevel > prev.relicLevel ? curr : prev
          );
          console.log(`❗ ${charReq.name} non prêt, mais proche : ${closest.player.name} (Relic: ${closest.relicLevel})`);
        }
      }
    }
  }
}

main();