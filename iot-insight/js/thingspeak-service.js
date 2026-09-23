const CHANNEL_ID = "2601398";
const FEED_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=100`;

export async function loadThingSpeakData() {
    const response = await fetch(FEED_URL);
    if (!response.ok) throw new Error(`ThingSpeak request failed (${response.status}).`);
    const payload = await response.json();
    const channel = payload.channel || {};
    const fieldNames = Object.fromEntries(Object.entries(channel).filter(([key]) => /^field\d+$/.test(key) && channel[key]).map(([key, value]) => [key, value]));
    const readings = (payload.feeds || []).flatMap(feed => Object.entries(fieldNames).map(([fieldKey, parameterName]) => {
        const rawValue = feed[fieldKey];
        if (rawValue === null || rawValue === undefined || rawValue === "") return null;
        const value = Number(rawValue);
        return { id: `thingspeak-${feed.entry_id}-${fieldKey}`, deviceId: `thingspeak-${CHANNEL_ID}`, parameterName, fieldName: fieldKey, timestamp: feed.created_at, entryId: String(feed.entry_id || ""), rawValue, value: Number.isFinite(value) ? value : rawValue, state: "", source: "ThingSpeak" };
    }).filter(Boolean));
    const parameters = Object.entries(fieldNames).map(([fieldName, parameterName]) => ({ parameterName, fieldName, deviceId: `thingspeak-${CHANNEL_ID}`, unit: "" }));
    return { readings, parameters, devices: [{ deviceId: `thingspeak-${CHANNEL_ID}`, deviceName: channel.name || `ThingSpeak channel ${CHANNEL_ID}`, location: "ThingSpeak public channel", status: "online", source: "ThingSpeak" }], source: "ThingSpeak", channel };
}
