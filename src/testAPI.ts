import fs from 'fs';
import { getPlayerData } from './players';
import { log } from 'console';


const TEST_ALLY_CODE = '559529347'; 

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

const runTest = async () => {
  // Charge les données du fichier JSON des pelotons
  const roteData: RoteData = JSON.parse(fs.readFileSync('data/rote_platoons.json', 'utf-8'));

  // Charge les données du joueur
  const playerData = await getPlayerData(TEST_ALLY_CODE);
  if (!playerData) {
    console.error("Impossible de récupérer les données du joueur.");
    return;
  }
console.log(playerData.units)
  // Garde uniquement les personnages (combat_type === 1)
  const units = playerData.filter((u: any) => u.data?.combat_type === 1);

  // Extrais les noms des personnages
  const unitNames = units.map((u: any) => u.data.name);

  console.log(`\n📋 Persos du joueur ${TEST_ALLY_CODE} :`);
  // Pour chaque perso requis dans le fichier JSON, cherche s'il est dans le roster
  console.log("\n🔍 Vérification des correspondances avec le fichier rote_platoons.json :");

  for (const phase of Object.keys(roteData)) {
    const planets = roteData[phase];
    for (const planet of Object.keys(planets)) {
      const chars = planets[planet];
      for (const charReq of chars) {
        const matched = units.find((u: any) =>
          normalize(u.data.name) === normalize(charReq.name)
        );
        
       if (matched) {
  const relicTier = matched.data.relic_tier;

  if (relicTier == null || relicTier < 2) {
    console.log(`❗ ${charReq.name} trouvé, mais sans relique (requis: Relic ${charReq.required_relic})`);
  } else {
    const relic = relicTier - 2;
    if (relic >= charReq.required_relic) {
      console.log(`✅ ${charReq.name} trouvé et prêt (Relic: ${relic} / requis: ${charReq.required_relic})`);
    } else {
      console.log(`❗ ${charReq.name} trouvé, mais pas assez (Relic: ${relic} / requis: ${charReq.required_relic})`);
    }
  }
} else {
  console.log(`❌ Manquant: ${charReq.name}`);
}


      }
    }
  }
};

runTest();
 
