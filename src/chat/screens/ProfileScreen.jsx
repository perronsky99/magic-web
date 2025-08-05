import React from "react";
// Pantalla para ver y editar el perfil de usuario
export default function ProfileScreen({ user, token, onBack }) {
  return (
    <div>
      <h2>Mi perfil</h2>
      {/* Aquí irá la info del usuario y formulario de edición */}
      <button onClick={onBack}>Volver</button>
    </div>
  );
}
