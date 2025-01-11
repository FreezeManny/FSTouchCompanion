export const AtcType = {
  UNKNOWN: 0,
  DELIVERY: 1,
  GROUND: 2,
  TOWER: 3,
  DEPARTURE: 4,
  APPROACH: 5,
  RADAR: 6,
  ATIS: 7,
};

class ATC {
  constructor() {
    this.atcData = [];
  }

  async get(source) {
    if (!source) {
      throw new Error("No source provided");
    }

    const apiUrl = `https://api.flybywiresim.com/api/v1/atc?source=${source}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      this.atcData = data;
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching ATC data:", error);
      return [];
    }
  }
}

export const loadAtc = async (currentLatitude, currentLongitude, atisSource) => {
  if (!atisSource || (atisSource.toLowerCase() !== "vatsim" && atisSource.toLowerCase() !== "ivao")) {
    return [];
  }

  const atisSourceReq = atisSource.toLowerCase();
  const atcInstance = new ATC();

  try {
    const atcRes = await atcInstance.get(atisSourceReq);
    if (!atcRes) return [];

    let allAtc = atcRes.filter((a) => !a.callsign.includes("_OBS") && parseFloat(a.frequency) <= 136.975);

    allAtc.forEach((a) => {
      a.distance = getDistanceFromLatLonInNm(a.latitude, a.longitude, currentLatitude, currentLongitude);
      if (a.visualRange === 0 && a.type === AtcType.ATIS) {
        a.visualRange = 100;
      }
    });

    allAtc.sort((a1, a2) => (a1.distance > a2.distance ? 1 : -1));
    allAtc = allAtc.slice(0, 26);

    allAtc.push({
      callsign: "UNICOM",
      frequency: "122.800",
      type: AtcType.RADAR,
      visualRange: 999999,
      distance: 0,
      latitude: 0,
      longitude: 0,
      textAtis: [],
    });

    return allAtc.filter((a) => a.distance <= a.visualRange);
  } catch (e) {
    console.error(`Error loading ATC data: ${e.message}`);
    return [];
  }
};

const getDistanceFromLatLonInNm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2Rad(lat2 - lat1);
  const dLon = deg2Rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2Rad(lat1)) * Math.cos(deg2Rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.5399568; // Convert to nautical miles
};

const deg2Rad = (deg) => deg * (Math.PI / 180);
