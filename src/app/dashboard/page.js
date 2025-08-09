'use client';

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [passwords, setPasswords] = useState([]);
  const [newEntry, setNewEntry] = useState({ website: "", username: "", password: "" });
  const [addPromptVisible, setAddPromptVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [decryptedMap, setDecryptedMap] = useState({});
  const [promptVisible, setPromptVisible] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [targetWebsite, setTargetWebsite] = useState("");
  const [error, setError] = useState("");
  const [hasMounted, setHasMounted] = useState(false); // ✅ Hydration fix
  const [deletePrompt, setDeletePrompt] = useState({ visible: false, website: "", username: "" });

  // ✅ Prevent SSR hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      fetchPasswords();
    }
  }, [hasMounted]);

  const fetchPasswords = async () => {
    const res = await fetch("http://localhost:5000/passwords");
    const data = await res.json();
    setPasswords(data);
  };

  const handleAdd = async () => {
    const { website, username, password } = newEntry;
    if (!website || !username || !password) return;

    await fetch("http://localhost:5000/passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    });

    setNewEntry({ website: "", username: "", password: "" });
    setAddPromptVisible(false);
    fetchPasswords();
  };

  const handleDelete = async (website, username) => {
    await fetch("http://localhost:5000/passwords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website, username }),
    });
    setDeletePrompt({ visible: false, website: "", username: "" });
    fetchPasswords();
  };

  const handleUpdate = async (index) => {
    const { website, username } = passwords[index];
    const newPassword = decryptedMap[website];
    await fetch("http://localhost:5000/passwords", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website, username, password: newPassword }),
    });

    setEditIndex(null);
    fetchPasswords();
  };

  const promptDecryption = (website) => {
    setTargetWebsite(website);
    setMasterPassword("");
    setError("");
    setPromptVisible(true);
  };

  const decryptPassword = async () => {
    const res = await fetch("http://localhost:5000/passwords/decrypt-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: targetWebsite, password: masterPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Invalid master password.");
      return;
    }

    setDecryptedMap((prev) => ({ ...prev, [targetWebsite]: data.decrypted_password }));
    setPromptVisible(false);
  };

  // ✅ Prevent rendering until after mount to avoid hydration mismatch
  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">🔐 Password Dashboard</h1>

      {/* Add New Password Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setAddPromptVisible(true)}
          className="bg-teal-600 hover:bg-teal-700 rounded py-2 px-4 text-lg font-semibold"
        >
          ➕ Add New Password
        </button>
      </div>

      {/* Password List */}
      <div className="max-w-3xl mx-auto">
        {passwords.map(([website, username], index) => (
          <div key={`${website}-${username}`} className="bg-gray-900 p-4 mb-4 rounded shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p><strong>Website:</strong> {website}</p>
                <p><strong>Username:</strong> {username}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletePrompt({ visible: true, website, username })}
                  className="p-1"
                  title="Delete Password"
                >
                  <img src="/trash-bin.png" alt="Delete" className="w-8 h-8 rounded-full hover:opacity-[0.50]" />
                </button>
      {/* Delete Confirmation Prompt */}
      {deletePrompt.visible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2 text-red-400">Are you sure?</h2>
            <p className="mb-4">Are you sure you want to delete the entry for <span className="font-semibold">{deletePrompt.website}</span> / <span className="font-semibold">{deletePrompt.username}</span>?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setDeletePrompt({ visible: false, website: "", username: "" })} className="text-gray-300">Cancel</button>
              <button onClick={() => handleDelete(deletePrompt.website, deletePrompt.username)} className="text-red-400">Delete</button>
            </div>
          </div>
        </div>
      )}
                <button onClick={() => promptDecryption(website)} className="p-1" title="Decrypt Password">
                  <img src="/unlock-lock.png" alt="Decrypt" className="w-8 h-8 rounded-full hover:opacity-[0.50]" />
                </button>
              </div>
            </div>

            {decryptedMap[website] && (
              <div className="mt-2">
                {editIndex === index ? (
                  <>
                    <input
                      type="text"
                      value={decryptedMap[website]}
                      onChange={(e) =>
                        setDecryptedMap({ ...decryptedMap, [website]: e.target.value })
                      }
                      className="p-2 rounded bg-gray-700 mt-2 w-full"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleUpdate(index)} className="text-green-400">💾 Save</button>
                      <button onClick={() => setEditIndex(null)} className="text-gray-400">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-400 mt-2">🔑 Password: {decryptedMap[website]}</p>
                    <button onClick={() => setEditIndex(index)} className="text-blue-400 mt-1">✏️ Edit</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Password Prompt */}
      {addPromptVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Add New Password</h2>
            <input
              type="text"
              placeholder="Website"
              className="w-full p-2 rounded bg-gray-700 mb-2"
              value={newEntry.website}
              onChange={(e) => setNewEntry({ ...newEntry, website: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 rounded bg-gray-700 mb-2"
              value={newEntry.username}
              onChange={(e) => setNewEntry({ ...newEntry, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 rounded bg-gray-700 mb-2"
              value={newEntry.password}
              onChange={(e) => setNewEntry({ ...newEntry, password: e.target.value })}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAddPromptVisible(false)} className="text-gray-300">Cancel</button>
              <button onClick={handleAdd} className="text-green-400">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Master Password Prompt */}
      {promptVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Enter Master Password</h2>
            <input
              type="password"
              placeholder="Master Password"
              className="w-full p-2 rounded bg-black border border-gray-500"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPromptVisible(false)} className="text-gray-300">Cancel</button>
              <button onClick={decryptPassword} className="text-green-400">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
