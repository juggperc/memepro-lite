'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';

const PRESET_MODELS = [
    { id: 'Opus 4.6', label: 'Opus 4.6 (Anthropic)' },
    { id: 'GPT-5.4', label: 'GPT-5.4 (OpenAI)' },
    { id: 'Grok 4.1 Flash', label: 'Grok 4.1 Flash (xAI)' },
    { id: 'custom', label: 'Custom Model' }
];

interface MCPServer {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
}

export default function ResearchPage() {
    const [selectedModel, setSelectedModel] = useState('Opus 4.6');
    const [customModelId, setCustomModelId] = useState('');
    const [showMCPSettings, setShowMCPSettings] = useState(false);
    const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
    const [newMCPServer, setNewMCPServer] = useState({ name: '', url: '' });

    // Load MCP servers from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('memepro_mcp_servers');
        if (saved) {
            try {
                setMCPServers(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load MCP servers');
            }
        }
    }, []);

    // Save MCP servers to localStorage
    useEffect(() => {
        localStorage.setItem('memepro_mcp_servers', JSON.stringify(mcpServers));
    }, [mcpServers]);

    const chatHelpers = useChat({
        api: '/api/research/chat',
        body: {
            modelId: selectedModel === 'custom' ? customModelId : selectedModel,
            mcpServers: mcpServers.filter(s => s.enabled).map(s => s.url)
        }
    } as any) as any;

    const { messages, input, handleInputChange, handleSubmit, isLoading } = chatHelpers;

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addMCPServer = () => {
        if (!newMCPServer.name || !newMCPServer.url) return;
        const server: MCPServer = {
            id: Math.random().toString(36).substring(7),
            name: newMCPServer.name,
            url: newMCPServer.url,
            enabled: true
        };
        setMCPServers([...mcpServers, server]);
        setNewMCPServer({ name: '', url: '' });
    };

    const removeMCPServer = (id: string) => {
        setMCPServers(mcpServers.filter(s => s.id !== id));
    };

    const toggleMCPServer = (id: string) => {
        setMCPServers(mcpServers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Header />
            <Navigation />

            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 overflow-hidden h-[calc(100vh-120px)]">
                {/* Header & Settings */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                    <div>
                        <h1 className="text-xl font-bold font-mono tracking-widest uppercase flex items-center gap-2">
                            <span className="text-emerald-500">⚡</span> AI Researcher
                        </h1>
                        <p className="text-xs text-[#666] mt-1">Pump.fun + Helius + User MCP Support</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowMCPSettings(!showMCPSettings)}
                            className={`text-[10px] uppercase font-bold px-3 py-1.5 border transition-all ${showMCPSettings ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-[#222] text-[#666] hover:text-white'}`}
                        >
                            MCP Servers ({mcpServers.filter(s => s.enabled).length})
                        </button>

                        <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] p-1 rounded-md">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-transparent text-xs text-white p-1.5 focus:outline-none focus:ring-0 cursor-pointer"
                            >
                                {PRESET_MODELS.map(m => (
                                    <option key={m.id} value={m.id} className="bg-black text-white">{m.label}</option>
                                ))}
                            </select>
                            
                            {selectedModel === 'custom' && (
                                <input 
                                    type="text"
                                    value={customModelId}
                                    onChange={(e) => setCustomModelId(e.target.value)}
                                    placeholder="OpenRouter ID"
                                    className="bg-black border border-[#222] text-xs px-2 py-1.5 rounded w-32 focus:border-[#444] focus:outline-none"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* MCP Settings Panel */}
                {showMCPSettings && (
                    <div className="mb-6 bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-lg animate-in fade-in slide-in-from-top-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#666] mb-4">User-Supplied MCP Servers (SSE)</h3>
                        <div className="space-y-3 mb-4">
                            {mcpServers.map(server => (
                                <div key={server.id} className="flex items-center justify-between bg-black p-2 border border-[#1a1a1a] rounded">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={server.enabled} 
                                            onChange={() => toggleMCPServer(server.id)}
                                            className="accent-emerald-500"
                                        />
                                        <div>
                                            <div className="text-xs font-bold">{server.name}</div>
                                            <div className="text-[10px] text-[#444] font-mono">{server.url}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeMCPServer(server.id)} className="text-[#444] hover:text-red-500 text-xs px-2">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newMCPServer.name}
                                onChange={(e) => setNewMCPServer({...newMCPServer, name: e.target.value})}
                                placeholder="Server Name"
                                className="flex-1 bg-black border border-[#222] text-xs px-3 py-2 rounded focus:border-[#444] focus:outline-none"
                            />
                            <input 
                                type="text" 
                                value={newMCPServer.url}
                                onChange={(e) => setNewMCPServer({...newMCPServer, url: e.target.value})}
                                placeholder="SSE URL (e.g. http://localhost:3001/sse)"
                                className="flex-[2] bg-black border border-[#222] text-xs px-3 py-2 rounded focus:border-[#444] focus:outline-none"
                            />
                            <button 
                                onClick={addMCPServer}
                                className="bg-white text-black text-[10px] font-bold px-4 rounded hover:bg-[#ccc]"
                            >
                                ADD
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto mb-4 border border-[#1a1a1a] bg-[#050505] rounded-lg p-4 space-y-6 scrollbar-hide">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#555] space-y-4 text-center">
                            <div className="w-16 h-16 border border-[#222] flex items-center justify-center rounded-full bg-black">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <div>
                                <p className="text-sm font-mono max-w-md mx-auto">
                                    I am hooked into the live stream and on-chain data.
                                </p>
                                <p className="text-[10px] text-[#444] mt-2 max-w-sm mx-auto uppercase tracking-wider">
                                    You can also connect your own tools via MCP servers above.
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center mt-4">
                                <button onClick={() => handleInputChange({ target: { value: "Scan the final stretch tokens for healthy distributions." } } as any)} className="text-[10px] border border-[#222] px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                                    "Scan final stretch"
                                </button>
                                <button onClick={() => handleInputChange({ target: { value: "Analyze the top holders for the latest 3 new pairs." } } as any)} className="text-[10px] border border-[#222] px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors">
                                    "Analyze top holders"
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((m: any) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-4 ${
                                    m.role === 'user' 
                                        ? 'bg-[#111] border border-[#222] text-[#eee]' 
                                        : 'bg-transparent border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-white'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${m.role === 'user' ? 'bg-[#444]' : 'bg-emerald-500'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                                            {m.role === 'user' ? 'You' : 'Researcher'}
                                        </span>
                                    </div>
                                    
                                    <div className="prose prose-invert prose-sm max-w-none 
                                        prose-headings:text-emerald-400 prose-headings:font-mono prose-headings:uppercase 
                                        prose-a:text-emerald-500 hover:prose-a:text-emerald-400
                                        prose-strong:text-white
                                        prose-code:text-[#f59e0b] prose-code:bg-[#111] prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Tool Calls indicator */}
                                    {m.toolInvocations && m.toolInvocations.length > 0 && (
                                        <div className="mt-4 flex flex-col gap-2">
                                            {m.toolInvocations.map((toolCall: any) => (
                                                <div key={toolCall.toolCallId} className="flex items-center gap-2 text-[10px] text-[#555] font-mono bg-black p-2 rounded border border-[#1a1a1a]">
                                                    <span className="animate-spin inline-block w-3 h-3 border border-[#555] border-t-emerald-500 rounded-full" />
                                                    Executing tool: <span className="text-emerald-500">{toolCall.toolName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                         <div className="flex justify-start">
                             <div className="max-w-[85%] rounded-lg p-4 bg-transparent border border-emerald-500/20">
                                 <div className="flex gap-1 items-center h-4">
                                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                 </div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="shrink-0 relative">
                    <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask the researcher..."
                        className="w-full bg-[#0a0a0a] border border-[#222] text-sm text-white px-4 py-4 rounded-lg focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all pr-12 placeholder-[#444]"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-white text-black rounded-md hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </form>
            </main>
        </div>
    );
}
