import React, { useEffect } from "react";

const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;

function Callback() {
  useEffect(() => {
    // Obtener el hash de la URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Extraer los parámetros del hash
    const accessToken = params.get("access_token");

    // Verificar si el token de acceso está presente en la URL
    if (accessToken) {
      localStorage.setItem("bungie_access_token", accessToken);
      window.location.href = "/"; // Redirigir a la página principal
    }
  }, []);

  return <h2>Procesando autenticación...</h2>;
}

export default Callback;