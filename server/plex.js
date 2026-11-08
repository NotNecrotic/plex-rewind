export const CID = process.env.PLEX_CLIENT_ID || "plex-rewind";

const H = {
  "X-Plex-Client-Identifier": CID,
  "X-Plex-Product": "Plex Rewind",
  Accept: "application/json",
};

export const createPin = () =>
  fetch("https://plex.tv/api/v2/pins?strong=true", {
    method: "POST",
    headers: H,
  }).then((r) => r.json());

export const checkPin = (id, code) =>
  fetch(`https://plex.tv/api/v2/pins/${id}?code=${code}`, { headers: H }).then(
    (r) => r.json(),
  );

export const getUser = (t) =>
  fetch("https://plex.tv/api/v2/user", {
    headers: { ...H, "X-Plex-Token": t },
  }).then((r) => r.json());

export const authUrl = (code, fwd) =>
  `https://app.plex.tv/auth#?clientID=${CID}&code=${code}&forwardUrl=${encodeURIComponent(fwd)}&context%5Bdevice%5D%5Bproduct%5D=Plex%20Rewind`;
