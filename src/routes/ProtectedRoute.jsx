import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, isAuth }) {
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
