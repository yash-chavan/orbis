export type Mode = "city" | "wilderness" | "ocean";

export type SpotData = {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  temperature: number;
  weatherCode: number;
  weatherCondition: string;
  localTime: string;
  mode: Mode;
  biome: string;
};

const WEATHER: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌦️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "⛈️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm", icon: "⛈️" },
  99: { label: "Hailstorm", icon: "⛈️" },
};

export function weatherInfo(code: number) {
  return WEATHER[code] ?? { label: "Mysterious skies", icon: "🌍" };
}

export function biomeFor(lat: number, mode: Mode): string {
  if (mode === "ocean") return "Open Ocean";
  const a = Math.abs(lat);
  if (a > 66) return "Polar Ice Frontier";
  if (a > 55) return "Boreal Taiga";
  if (a > 35) return "Temperate Wildland";
  if (a > 23) return "Arid Steppe & Desert";
  return "Tropical Wilds";
}

type Geo = { country: string | null; code: string | null; city: string | null };

async function bigDataCloud(lat: number, lng: number): Promise<Geo | null> {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    );
    const j = (await r.json()) as Record<string, unknown>;
    if (j["status"] === 402 || j["status"] === 403) return null;
    return {
      country: (j["countryName"] as string) || null,
      code: (j["countryCode"] as string) || null,
      city: ((j["city"] as string) || (j["locality"] as string) || null) as string | null,
    };
  } catch {
    return null;
  }
}

async function nominatim(lat: number, lng: number): Promise<Geo | null> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lng}`,
    );
    const j = (await r.json()) as { address?: Record<string, string>; error?: string };
    if (j.error || !j.address) return { country: null, code: null, city: null };
    const a = j.address;
    return {
      country: a["country"] ?? null,
      code: a["country_code"] ? a["country_code"].toUpperCase() : null,
      city: a["city"] ?? a["town"] ?? a["village"] ?? a["municipality"] ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadSpot(lat: number, lng: number): Promise<SpotData> {
  const [geoPrimary, wxRes] = await Promise.all([
    bigDataCloud(lat, lng),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`,
    )
      .then((r) => r.json() as Promise<Record<string, unknown>>)
      .catch(() => ({}) as Record<string, unknown>),
  ]);

  let geo = geoPrimary;
  if (!geo || (!geo.country && !geo.city)) {
    const alt = await nominatim(lat, lng);
    if (alt && (alt.country || alt.city)) geo = alt;
    else if (!geo) geo = alt;
  }

  const elevation = wxRes["elevation"] as number | undefined;
  const countryName = geo?.country ?? null;
  const countryCode = geo?.code ?? null;
  const city = geo?.city ?? null;

  const looksOcean = !countryName && !city && (geo !== null || (elevation ?? 0) <= 0);
  const mode: Mode = looksOcean ? "ocean" : city ? "city" : "wilderness";


  const cw = (wxRes["current_weather"] as Record<string, number> | undefined) ?? undefined;
  const offset = (wxRes["utc_offset_seconds"] as number) ?? Math.round((lng / 15) * 3600);
  const local = new Date(Date.now() + offset * 1000);
  const localTime = `${String(local.getUTCHours()).padStart(2, "0")}:${String(
    local.getUTCMinutes(),
  ).padStart(2, "0")}`;

  const weatherCode = cw?.["weathercode"] ?? 0;

  return {
    lat,
    lng,
    city: mode === "city" ? city : null,
    country: countryName,
    countryCode,
    temperature: cw?.["temperature"] ?? 0,
    weatherCode,
    weatherCondition: weatherInfo(weatherCode).label,
    localTime,
    mode,
    biome: biomeFor(lat, mode),
  };
}

export function flagUrl(code: string | null) {
  if (!code) return null;
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}

export function titleFor(spot: SpotData) {
  if (spot.mode === "city") return spot.city ?? spot.country ?? "Unknown";
  if (spot.mode === "ocean") return "Deep Sea Expedition Mode";
  return spot.biome;
}

export function fmtCoord(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lng).toFixed(2)}° ${ew}`;
}
