import axios from "axios";
import fs from 'fs';

const guildId : string = "OwKdDi5bQ6uReLfiPP5HkA"
export interface PlayerInfo {
    name: string;
    allyCode: string
}

export const fetchGuildAllyCodes = async (guildId: string) : Promise<PlayerInfo[]> => {
    try {
        const res = await axios.get(`https://swgoh.gg/api/guild-profile/${guildId}/`)
        console.log(JSON.stringify(res.data.data.members))
        const players = res.data.data.members
       const playerList: PlayerInfo[] = players.map((member:any) => ({
        name: member.player_name,
        allyCode : member.ally_code.toString()
       }))

        fs.writeFileSync('data/allyCodes.json', JSON.stringify(playerList, null, 2))
        console.log(`${playerList.length} registered players`)

        return playerList;
    } catch (error) {
        console.error('Fail to get guild data')
        return []
 
    }
}