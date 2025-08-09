'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Login successful!");
        setError("");
        setTimeout(() => router.push("/dashboard"), 800);
      } else {
        setError(data.message || "Invalid password");
        setSuccess("");
      }
    } catch {
      setError("Server error. Please try again later.");
      setSuccess("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg p-8 w-full max-w-sm text-white">
        <h1 className="text-3xl font-semibold text-center mb-6">
          🔐 Secure Password Manager
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-gray-800 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 font-semibold py-2 rounded transition duration-200"
          >
            Login
          </button>
        </form>

        {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
        {success && <p className="mt-4 text-green-400 text-sm text-center">{success}</p>}
      </div>
    </div>
  );
}
