import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const CLIENT_ID = "49241";
const CLIENT_SECRET = "RXjxDHlOr0VZf3fZAu6MRE67PbRaYwk7wsz9FXw1WCE"; // ⚠️ No expongas esto en producción
const TOKEN_URL = "https://www.bungie.net/platform/app/oauth/token/";

function Callback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      fetchAccessToken(code);
    }
  }, [code]);

  const fetchAccessToken = async (authCode) => {
    try {
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });

      const data = await response.json();
      console.log("Token de acceso:", data);

      if (data.access_token) {
        localStorage.setItem("bungie_access_token", data.access_token);
        window.location.href = "/"; // Redirigir a la página principal
      }
    } catch (error) {
      console.error("Error obteniendo el token:", error);
    }
  };

  return <h2>Procesando autenticación...</h2>;
}

export default Callback;
