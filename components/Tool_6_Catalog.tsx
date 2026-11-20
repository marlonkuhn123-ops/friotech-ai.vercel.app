
import React, { useState, useEffect, useRef } from 'react';
import { Card, SectionTitle, Button, Select, Input, AIOutputBox } from './UI'; 
import { knowledgeService } from "../services/knowledgeService";
import { FieldTip } from "../types";
import { BOM_DATABASE } from "../bom_database";
import {
    SCHEMATICS_CATALOG,
    getSchematicDownloadUrl,
    getSchematicViewerUrl
} from "../data/schematics_catalog";

export const Tool_Catalog: React.FC = () => {
    // Inicializa com o primeiro modelo da lista nova para evitar estado vazio
    const [selectedModel, setSelectedModel] = useState(Object.keys(BOM_DATABASE)[0] || '');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [schematicSearch, setSchematicSearch] = useState('');
    // Cada consulta recebe um número. Trocar o modelo invalida a consulta anterior,
    // para a ficha de um modelo nunca aparecer sob o título de outro.
    const requestIdRef = useRef(0);

    useEffect(() => {
        requestIdRef.current += 1;
        setResult('');
        setLoading(false);
    }, [selectedModel]);

    // Memória de Campo
    const [tips, setTips] = useState<FieldTip[]>([]);
    const [newTip, setNewTip] = useState('');

    useEffect(() => {
        setTips(knowledgeService.getTips());
    }, []);

    const fetchData = async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        // Pequeno delay para simular consulta à biblioteca segura
        await new Promise(r => setTimeout(r, 600));
        if (requestId !== requestIdRef.current) return;

        const bomData = BOM_DATABASE[selectedModel];
        if (bomData) {
            const formatted = bomData.map(item => 
                `✅ **${item.descricao}**\n   Código: ${item.codigo} | Qtd: ${item.quantidade}`
            ).join('\n\n');
            setResult(formatted);
        } else {
            setResult("⚠️ MODELO EM CADASTRAMENTO: Este modelo ainda não possui lista de peças completa.");
        }
        setLoading(false);
    };

    const handleAddTip = () => {
        if (!newTip.trim()) return;
        knowledgeService.saveTip(newTip);
        setTips(knowledgeService.getTips());
        setNewTip('');
    };

    const handleDeleteTip = (id: string) => {
        knowledgeService.deleteTip(id);
        setTips(knowledgeService.getTips());
    };

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-boxes-stacked" title="6. DADOS TÉCNICOS (BOM)" />
            
            <Card className="mb-6">
                <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} label="SELECIONE O MODELO EXATO (LISTA OFICIAL)">
                    {Object.keys(BOM_DATABASE).map(model => (
                        <option key={model} value={model}>{model}</option>
                    ))}
                    <option value="OUTRO">OUTROS MODELOS (CONSULTAR FÁBRICA)</option>
                </Select>
                
                <div className="mb-4 p-3 rounded-lg border text-[10px] font-medium leading-relaxed flex items-start gap-2 transition-colors bg-[#2a3646]/50 border-[#4a5c73] text-[#9ca7b8]">
                    <i className="fa-solid fa-database mt-0.5 text-xs text-[#00d9ff]"></i>
                    <span>Consulta ESTRITA à Base V35 (Engenharia). Dados oficiais de fábrica.</span>
                </div>

                <Button onClick={fetchData} disabled={loading}>
                    CONSULTAR FICHA TÉCNICA
                </Button>
                
                <AIOutputBox content={result} isLoading={loading} title={`FICHA TÉCNICA: ${selectedModel}`} />
            </Card>

            <SectionTitle icon="fa-solid fa-file-pdf" title="ESQUEMAS ELÉTRICOS OFICIAIS (PDF)" />
            <Card className="mb-6 border-t-4 border-t-[#f97316] !mt-4">
                <p className="text-[10px] text-[#9ca7b8] mb-3 leading-relaxed">
                    Consulte e dê zoom nos diagramas oficiais direto no celular. Pesquise por capacidade, tensão ou painel (ex: <span className="text-white font-bold">20000</span>, <span className="text-white font-bold">6000</span>, <span className="text-white font-bold">CIP</span>, <span className="text-white font-bold">380V</span>, <span className="text-white font-bold">remota</span>).
                </p>
                <Input
                    placeholder="Buscar esquema elétrico (ex: 20000, CIP, 380V)..."
                    value={schematicSearch}
                    onChange={e => setSchematicSearch(e.target.value)}
                    className="!mb-3 !p-3 text-xs"
                />
                <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                    {SCHEMATICS_CATALOG.filter(item => {
                        const q = schematicSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                        if (!q) return true;
                        const hay = `${item.title} ${item.category} ${item.voltage} ${item.keywords.join(' ')}`
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .toLowerCase();
                        return hay.includes(q);
                    }).map(item => (
                        <div key={item.id} className="bg-[#111827]/75 border border-[#334155] rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[11px] font-bold text-white leading-snug">{item.title}</p>
                                    <p className="text-[9px] text-[#9ca7b8] uppercase tracking-wider mt-0.5">
                                        {item.category} • <span className="text-[#00d9ff] font-bold">{item.voltage}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={getSchematicViewerUrl(item.filename)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-3 rounded-lg bg-[#00d9ff]/15 hover:bg-[#00d9ff]/25 border border-[#00d9ff]/40 text-[#00d9ff] text-[10px] font-black uppercase tracking-wider text-center transition-all"
                                >
                                    <i className="fa-solid fa-magnifying-glass-plus mr-1.5"></i>
                                    Visualizar PDF
                                </a>
                                <a
                                    href={getSchematicDownloadUrl(item.filename)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-2 px-3 rounded-lg bg-[#1e293b] hover:bg-[#2a3950] border border-white/15 text-white/85 text-[10px] font-bold uppercase tracking-wider text-center transition-all"
                                >
                                    <i className="fa-solid fa-download mr-1"></i>
                                    Baixar
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <SectionTitle icon="fa-solid fa-brain" title="MEMÓRIA DE CAMPO (A IA APRENDE AQUI)" />
            <Card className="border-t-4 border-t-[#00d9ff] !mt-4">
                <p className="text-[10px] text-[#9ca7b8] mb-3 leading-relaxed">
                    Escreva abaixo suas descobertas ou regras que a IA deve lembrar. 
                    <span className="text-[#00d9ff] font-bold ml-1">Ela usará isso para te dar respostas melhores no Suporte.</span>
                </p>
                <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                        <Input 
                            placeholder="Ex: No modelo X, capacitor 35uF..." 
                            value={newTip} 
                            onChange={e => setNewTip(e.target.value)}
                            className="!mb-0 !p-3 text-xs"
                        />
                    </div>
                    <button 
                        onClick={handleAddTip}
                        className="bg-[#00d9ff] text-black font-bold w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] hover:bg-[#00b8cc] transition-colors shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(0,217,255,0.4)] active:scale-95"
                    >
                        <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {tips.length === 0 ? (
                        <p className="text-[9px] text-center text-gray-600 italic">Nenhum aprendizado registrado ainda.</p>
                    ) : (
                        tips.map(tip => (
                            <div key={tip.id} className="bg-[#1a1a1a] p-2 rounded border border-[#333] flex justify-between items-start gap-3">
                                <p className="text-[10px] text-gray-300 leading-tight flex-1">{tip.content}</p>
                                <button onClick={() => handleDeleteTip(tip.id)} className="text-red-900 hover:text-red-500 transition-colors">
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
