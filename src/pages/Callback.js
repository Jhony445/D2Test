import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
const TOKEN_URL = "https://www.bungie.net/platform/app/oauth/token/";
const REDIRECT_URI = "https://d2-test.vercel.app/callback"; // Asegúrate de que coincida con lo registrado en Bungie

function Callback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    console.log("Código recibido desde Bungie:", code);
    if (code) {
      fetchAccessToken(code);
    }
  }, [code]);

  const fetchAccessToken = async (authCode) => {
    try {
      console.log("Iniciando solicitud de token...");
      
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: authCode,
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI, // Agregado porque es requerido en algunas configuraciones
        }),
      });

      console.log("Respuesta de Bungie recibida:", response);

      const data = await response.json();
      console.log("Datos del token obtenidos:", data);

      if (data.access_token) {
        console.log("Token de acceso obtenido con éxito:", data.access_token);
        localStorage.setItem("bungie_access_token", data.access_token);
        window.location.href = "/"; // Redirigir a la página principal
      } else {
        console.error("Error en la respuesta de Bungie:", data);
      }
    } catch (error) {
      console.error("Error obteniendo el token:", error);
    }
  };

  return <h2>Procesando autenticación...</h2>;
}

export default Callback;
