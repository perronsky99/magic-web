import React from "react";
// Pantalla para chat grupal
export default function GroupChatScreen({ group, user, token, onBack }) {
  return (
    <div>
      <h2>Grupo: {group?.name}</h2>
      {/* Aquí irá la ventana de mensajes grupales, input, audio, imágenes, etc */}
      <button onClick={onBack}>Volver</button>
    </div>
  );
}
