// epic.js
require("dotenv").config();

const TOKEN_URL =
  process.env.EPIC_TOKEN_URL ||
  "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token";

const PROFILE_URL =
  process.env.PROFILE_URL ||
  "https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2/profile";

function getEpicCredentials() {
  const clientId = process.env.EPIC_CLIENT_ID;
  const clientSecret = process.env.EPIC_CLIENT_SECRET;
  const redirectUri = process.env.EPIC_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing EPIC_CLIENT_ID, EPIC_CLIENT_SECRET, or EPIC_REDIRECT_URI in .env"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

async function getAccessToken(authCode) {
  const { clientId, clientSecret, redirectUri } = getEpicCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: authCode,
    redirect_uri: redirectUri,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.errorMessage || data.error_description || data.error || "Unknown error";
    throw new Error(`Epic API Error (${response.status}): ${errorMessage}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accountId: data.account_id,
    expiresIn: data.expires_in,
    raw: data,
  };
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getEpicCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.errorMessage || data.error_description || data.error || "Unknown error";
    throw new Error(`Epic API Error (${response.status}): ${errorMessage}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accountId: data.account_id,
    expiresIn: data.expires_in,
    raw: data,
  };
}

async function getLocker(accessToken, accountId) {
  const url = `${PROFILE_URL}/${accountId}/client/QueryProfile?profileId=athena&rvn=-1`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: "{}",
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.errorMessage || data.error_description || data.error || "Unknown error";

    if (response.status === 401) {
      const error = new Error("Token expired");
      error.code = "TOKEN_EXPIRED";
      throw error;
    }

    throw new Error(`Epic API Error (${response.status}): ${errorMessage}`);
  }

  return data;
}

module.exports = {
  getAccessToken,
  refreshAccessToken,
  getLocker,
};