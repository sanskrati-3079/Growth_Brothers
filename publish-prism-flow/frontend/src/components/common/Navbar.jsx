import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-semibold tracking-tight text-primary">
          Growth Brother
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link className="hover:text-primary-dark" to="/upload">Upload</Link>
          <Link className="hover:text-primary-dark" to="/ai">AI Studio</Link>
          <Link className="hover:text-primary-dark" to="/repurpose">Repurpose</Link>
          <Link className="hover:text-primary-dark" to="/scheduler">Scheduler</Link>
          <Link className="hover:text-primary-dark" to="/analytics">Analytics</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/accounts" className="btn btn-secondary hidden sm:inline-flex">Accounts</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-slate-600 max-w-[120px] truncate">
                {user.name || user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-primary text-sm">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
