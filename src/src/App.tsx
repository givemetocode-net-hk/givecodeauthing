/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Server, Shield, Key } from "lucide-react";

export default function App() {
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    RETURN_URL: 'Loading...',
    PASSWORD_HASH: 'Loading...'
  });

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data.reverse());
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    // In a real app we'd fetch config from an endpoint, 
    // but here we'll just mock the display for the demo
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Server className="text-emerald-400" size={32} />
            <h1 className="text-3xl font-bold tracking-tighter">AUTH_API_v1.0</h1>
          </div>
          <p className="text-slate-400 text-sm">Backend Authentication Service Status & Logs</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800 text-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield size={16} className="text-blue-400" /> ENDPOINTS
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] space-y-2 text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-emerald-400">POST</span>
                <span>/api/signup</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-emerald-400">POST</span>
                <span>/api/login</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-blue-400">GET</span>
                <span>/api/delete_user</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-blue-400">GET</span>
                <span>/api/logs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-slate-50 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key size={16} className="text-orange-400" /> ENVIRONMENT_CONFIG
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] grid grid-cols-2 gap-4 text-slate-400">
              <div className="space-y-1">
                <p className="text-slate-500 uppercase tracking-widest text-[9px]">Return URL</p>
                <p className="font-mono text-slate-200 truncate">https://return_url./return_handle</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 uppercase tracking-widest text-[9px]">Password Hashing</p>
                <p className="font-mono text-slate-200">Enabled (SHA-256)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-slate-50">
          <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History size={16} className="text-emerald-400" /> LIVE_TRAFFIC_LOGS
            </CardTitle>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest">Live</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] w-full">
              <div className="divide-y divide-slate-800">
                {logs.length === 0 && (
                  <div className="p-8 text-center text-slate-600 italic text-sm">
                    Waiting for incoming requests...
                  </div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          log.type === 'login' ? (log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400') :
                          log.type === 'signup' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.serverTimestamp}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-mono group-hover:text-slate-400">ID: {log.cookie_id?.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-[11px] font-mono">
                      <div className="col-span-1"><span className="text-slate-600">USER:</span> <span className="text-slate-300">{log.username || log.Username}</span></div>
                      <div className="col-span-1"><span className="text-slate-600">IP:</span> <span className="text-slate-300">{log.ip}</span></div>
                      <div className="col-span-2 truncate"><span className="text-slate-600">UA:</span> <span className="text-slate-500">{log.device}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <footer className="text-center py-8">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
            Secure Auth Node.js Microservice &bull; JSON Storage Engine
          </p>
        </footer>
      </div>
    </div>
  );
}


