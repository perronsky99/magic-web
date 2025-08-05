import React from "react";
// Pantalla para lista y gestión de grupos
export default function GroupsScreen({ user, token, onSelectGroup, onBack }) {
  return (
    <div>
      <h2>Grupos</h2>
      {/* Aquí irá la lista de grupos y opciones para crear/editar/salir */}
      <button onClick={onBack}>Volver</button>
    </div>
  );
}
