'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { cn } from '@/lib/utils/cn';
import * as Select from '@radix-ui/react-select';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { 
    Cpu, 
    Settings2, 
    Send, 
    Key, 
    Layers, 
    Plus, 
    X, 
    Check, 
    ChevronDown,
    Bot,
    User,
    ArrowUpRight
} from 'lucide-react';

const PRESET_MODELS = [
    { id: 'Opus 4.6', label: 'Claude 3 Opus' },
    { id: 'GPT-5.4', label: 'GPT-4o' },
    { id: 'Grok 4.1 Flash', label: 'Grok Beta' },
    { id: 'custom', label: 'Custom' }
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
    const [openRouterKey, setOpenRouterKey] = useState('');
    const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
    const [newMCPServer, setNewMCPServer] = useState({ name: '', url: '' });

    useEffect(() => {
        const savedMCP = localStorage.getItem('memepro_mcp_servers');
        if (savedMCP) {
            try { setMCPServers(JSON.parse(savedMCP)); } catch (e) {}
        }
        const savedKey = localStorage.getItem('memepro_openrouter_key');
        if (savedKey) setOpenRouterKey(savedKey);
    }, []);

    useEffect(() => {
        localStorage.setItem('memepro_mcp_servers', JSON.stringify(mcpServers));
    }, [mcpServers]);

    useEffect(() => {
        localStorage.setItem('memepro_openrouter_key', openRouterKey);
    }, [openRouterKey]);

    const chatHelpers = useChat({
        api: '/api/research/chat',
        body: {
            modelId: selectedModel === 'custom' ? customModelId : selectedModel,
            openRouterKey,
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

    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-emerald-500/30">
            <Header />
            <Navigation />

            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 h-[calc(100vh-112px)]">
                {/* Control Bar */}
                <div className="flex items-center justify-between mb-6 shrink-0 border border-[var(--border)] bg-[#050505] p-2 rounded-lg">
                    <div className="flex items-center gap-4 px-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Researcher</span>
                        </div>
                        
                        <div className="h-4 w-px bg-[var(--border)]" />

                        <Select.Root value={selectedModel} onValueChange={setSelectedModel}>
                            <Select.Trigger className="flex items-center gap-2 text-[11px] font-medium text-[#888] hover:text-white transition-colors focus:outline-none">
                                <Select.Value placeholder="Select model" />
                                <Select.Icon><ChevronDown className="w-3 h-3" /></Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className="z-50 bg-black border border-[var(--border)] rounded-md shadow-2xl min-w-[160px] animate-in fade-in zoom-in-95 overflow-hidden">
                                    <Select.Viewport className="p-1">
                                        {PRESET_MODELS.map(model => (
                                            <Select.Item key={model.id} value={model.id} className="text-[11px] px-3 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between group">
                                                <Select.ItemText>{model.label}</Select.ItemText>
                                                <Select.ItemIndicator><Check className="w-3 h-3 text-emerald-500" /></Select.ItemIndicator>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>

                        {selectedModel === 'custom' && (
                            <input 
                                type="text"
                                value={customModelId}
                                onChange={(e) => setCustomModelId(e.target.value)}
                                placeholder="Model ID"
                                className="bg-transparent border-b border-[var(--border)] text-[11px] px-1 py-0.5 w-32 focus:border-emerald-500/50 focus:outline-none transition-colors"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#444]" />
                            <input 
                                type="password"
                                value={openRouterKey}
                                onChange={(e) => setOpenRouterKey(e.target.value)}
                                placeholder="API Key"
                                className="bg-black border border-[var(--border)] text-[10px] pl-8 pr-3 py-1.5 rounded focus:border-emerald-500/50 focus:outline-none w-32 font-mono transition-all"
                            />
                        </div>

                        <Dialog.Root>
                            <Dialog.Trigger asChild>
                                <button className="p-1.5 rounded hover:bg-white/5 border border-transparent hover:border-[var(--border)] transition-all">
                                    <Settings2 className="w-4 h-4 text-[#666]" />
                                </button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
                                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#0a0a0a] border border-[var(--border)] p-6 rounded-lg shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <Dialog.Title className="text-xs font-bold uppercase tracking-[0.2em] text-[#888]">MCP Protocol Settings</Dialog.Title>
                                        <Dialog.Close className="text-[#444] hover:text-white"><X className="w-4 h-4" /></Dialog.Close>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            {mcpServers.map(server => (
                                                <div key={server.id} className="flex items-center justify-between bg-black/50 border border-[var(--border)] p-2 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={server.enabled} 
                                                            onChange={() => setMCPServers(mcpServers.map(s => s.id === server.id ? {...s, enabled: !s.enabled} : s))}
                                                            className="w-3 h-3 accent-emerald-500"
                                                        />
                                                        <div className="overflow-hidden">
                                                            <div className="text-[11px] font-bold truncate">{server.name}</div>
                                                            <div className="text-[9px] text-[#444] font-mono truncate">{server.url}</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setMCPServers(mcpServers.filter(s => s.id !== server.id))} className="text-[#444] hover:text-red-500 transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border)]">
                                            <input 
                                                type="text" 
                                                value={newMCPServer.name}
                                                onChange={(e) => setNewMCPServer({...newMCPServer, name: e.target.value})}
                                                placeholder="Server name"
                                                className="bg-black border border-[var(--border)] text-xs px-3 py-2 rounded focus:border-emerald-500/50 outline-none"
                                            />
                                            <input 
                                                type="text" 
                                                value={newMCPServer.url}
                                                onChange={(e) => setNewMCPServer({...newMCPServer, url: e.target.value})}
                                                placeholder="SSE Endpoint URL"
                                                className="bg-black border border-[var(--border)] text-xs px-3 py-2 rounded focus:border-emerald-500/50 outline-none"
                                            />
                                            <button onClick={addMCPServer} className="w-full bg-white text-black py-2 rounded text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-[#ccc] transition-colors mt-2">
                                                <Plus className="w-3 h-3" /> Register Server
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                </div>

                {/* Chat Engine */}
                <div className="flex-1 min-h-0 flex flex-col border border-[var(--border)] bg-[#020202] rounded-lg overflow-hidden relative shadow-inner">
                    <ScrollArea.Root className="flex-1">
                        <ScrollArea.Viewport className="h-full w-full p-6">
                            {!openRouterKey ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-12 h-12 border border-[var(--border)] flex items-center justify-center rounded-full mb-4 bg-white/5">
                                        <Key className="w-5 h-5 text-[#444]" />
                                    </div>
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-[#888] mb-2">Auth Required</h2>
                                    <p className="text-[10px] text-[#444] max-w-xs font-mono leading-relaxed">PROVIDE OPENROUTER API KEY IN CONTROL BAR TO INITIALIZE SESSION</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-12 h-12 border border-[var(--border)] flex items-center justify-center rounded-full mb-4 bg-emerald-500/5">
                                        <Layers className="w-5 h-5 text-emerald-500/50" />
                                    </div>
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500/50 mb-2">Researcher Online</h2>
                                    <p className="text-[10px] text-[#444] max-w-xs font-mono mb-8">HOOKED INTO PUMP.FUN + HELIUS + MCP</p>
                                    
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        <button 
                                            onClick={() => handleInputChange({ target: { value: "Scan final stretch tokens" } } as any)} 
                                            className="text-[10px] border border-[var(--border)] px-4 py-2 rounded hover:border-emerald-500/50 transition-all font-mono uppercase text-[#666] hover:text-white"
                                        >
                                            Scan Final Stretch
                                        </button>
                                        <button 
                                            onClick={() => handleInputChange({ target: { value: "Analyze new pair distributions" } } as any)} 
                                            className="text-[10px] border border-[var(--border)] px-4 py-2 rounded hover:border-emerald-500/50 transition-all font-mono uppercase text-[#666] hover:text-white"
                                        >
                                            Top Holders Analysis
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {messages.map((m: any) => (
                                        <ChatMessage key={m.id} message={m} />
                                    ))}
                                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                        <div className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-md border border-emerald-500/30 flex items-center justify-center bg-emerald-500/5 shrink-0">
                                                <Bot className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 pt-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#444]">Researcher</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold animate-pulse-subtle">THINKING</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-3 w-full bg-white/5 rounded animate-shimmer" />
                                                    <div className="h-3 w-[90%] bg-white/5 rounded animate-shimmer" style={{ animationDelay: '0.2s' }} />
                                                    <div className="h-3 w-[70%] bg-white/5 rounded animate-shimmer" style={{ animationDelay: '0.4s' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} className="h-4" />
                                </div>
                            )}
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar className="flex select-none touch-none p-0.5 bg-black/50 transition-colors w-1.5" orientation="vertical">
                            <ScrollArea.Thumb className="flex-1 bg-[#222] rounded-full relative before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>

                    {/* Input Area */}
                    <div className="p-4 border-t border-[var(--border)] bg-[#050505]">
                        <form onSubmit={handleSubmit} className="relative group">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder={openRouterKey ? "Enter prompt..." : "Provider key required"}
                                className="w-full bg-black border border-[var(--border)] text-sm text-white pl-4 pr-12 py-4 rounded-md focus:outline-none focus:border-emerald-500/30 transition-all placeholder-[#333] font-medium"
                                disabled={isLoading || !openRouterKey}
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading || !openRouterKey || !input?.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white text-black rounded hover:bg-[#ccc] disabled:opacity-20 disabled:grayscale transition-all active:scale-90"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

const ChatMessage = memo(({ message }: { message: any }) => {
    const isBot = message.role === 'assistant';
    
    return (
        <div className={cn(
            "flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300",
            !isBot && "flex-row-reverse"
        )}>
            <div className={cn(
                "w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                isBot 
                    ? "border-emerald-500/20 bg-emerald-500/5 group-hover:border-emerald-500/40" 
                    : "border-white/10 bg-white/5"
            )}>
                {isBot ? <Bot className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-[#666]" />}
            </div>

            <div className={cn(
                "flex-1 pt-1",
                !isBot && "text-right"
            )}>
                <div className={cn(
                    "flex items-center gap-2 mb-3",
                    !isBot && "flex-row-reverse"
                )}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#444] group-hover:text-[#666] transition-colors">
                        {isBot ? 'Researcher' : 'Session Operator'}
                    </span>
                </div>
                
                <div className={cn(
                    "max-w-3xl inline-block text-left",
                    isBot ? "text-[#eee]" : "bg-[#111] border border-[var(--border)] px-4 py-3 rounded-lg text-white"
                )}>
                    <div className="prose prose-invert prose-sm max-w-none 
                        prose-headings:text-white prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-wider prose-headings:mb-4
                        prose-p:text-[#aaa] prose-p:leading-relaxed prose-p:mb-4
                        prose-a:text-emerald-500 prose-a:no-underline hover:prose-a:text-emerald-400
                        prose-strong:text-white prose-strong:font-bold
                        prose-code:text-emerald-400 prose-code:bg-emerald-500/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-black/50 prose-pre:border prose-pre:border-[var(--border)]
                        prose-ul:list-disc prose-ul:pl-4
                        prose-li:text-[#aaa] prose-li:mb-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {/* Tool Call Activity */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                        <div className="mt-6 flex flex-col gap-2">
                            {message.toolInvocations.map((tool: any) => (
                                <div key={tool.toolCallId} className="flex items-center gap-2 text-[9px] text-[#444] font-mono bg-black/30 px-3 py-2 rounded border border-white/5">
                                    <Check className="w-3 h-3 text-emerald-500/50" />
                                    <span>PROTOCOL_EXEC:</span>
                                    <span className="text-[#888]">{tool.toolName.toUpperCase()}</span>
                                    <ArrowUpRight className="w-2.5 h-2.5 text-[#333]" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
