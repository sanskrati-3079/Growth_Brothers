import React, { useCallback, useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

const PLATFORMS = [
  { key: "youtube", label: "YouTube", oauth: "/auth/login" },
  { key: "linkedin", label: "LinkedIn", oauth: "/auth/linkedin/login" },
  { key: "facebook", label: "Facebook", oauth: "/auth/facebook/login" },
  { key: "instagram", label: "Instagram", oauth: "/auth/instagram/login" },
];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/accounts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connectedFor = (platformKey) =>
    accounts.filter((a) => (a.platform || "").toLowerCase() === platformKey);

  const handleConnect = (oauthPath) => {
    window.location.href = `${API}${oauthPath}`;
  };

  const handleDisconnect = async (platform, accountId) => {
    setRemoving(`${platform}:${accountId}`);
    try {
      const res = await fetch(`${API}/auth/accounts/${platform}/${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (err) {
      alert(err.message || "Failed to disconnect");
    } finally {
      setRemoving("");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-dark">Connected Accounts</h2>
            <p className="text-sm text-slate-600">Connect platforms to publish from this app.</p>
          </div>
          <button onClick={load} className="btn btn-secondary">Refresh</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </header>

      <div className="card">
        {loading ? (
          <p className="text-sm text-slate-500">Loading accounts...</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {PLATFORMS.map((p) => {
              const connected = connectedFor(p.key);
              return (
                <li key={p.key} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-primary-dark">{p.label}</p>
                      {connected.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {connected.map((a) => (
                            <li key={a.account_id} className="flex items-center gap-3">
                              {a.thumbnail && (
                                <img src={a.thumbnail} alt="" className="h-6 w-6 rounded-full object-cover" />
                              )}
                              <span className="font-medium">{a.account_name}</span>
                              <span className="text-xs text-slate-400">{a.account_id}</span>
                              <button
                                onClick={() => handleDisconnect(p.key, a.account_id)}
                                disabled={removing === `${p.key}:${a.account_id}`}
                                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                {removing === `${p.key}:${a.account_id}` ? "Removing..." : "Disconnect"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">Not connected</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleConnect(p.oauth)}
                      className="btn btn-primary shrink-0"
                    >
                      {connected.length > 0 ? "Add another" : "Connect"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
