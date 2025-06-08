import axios from 'axios';

export const getPlayerData = async (allyCode: string) : Promise<any | null> => {
    try {
        const res = await axios.get(`https://swgoh.gg/api/player/${allyCode}`)
        return res.data.units;
    } catch (error) {
        console.error (`Fail to get data for ${allyCode} :`, error)
        return null
    }
}