
import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, Select, AIOutputBox } from './UI';
import { useGlobal } from '../contexts/GlobalContext';
import { CALCULATOR_REFERENCE_RANGES, logicService } from '../services/logicService';
import { generateTechResponse } from '../services/geminiService';
import { runSystemDiagnostics } from '../services/testSuite';

const SUPERHEAT_RANGE = CALCULATOR_REFERENCE_RANGES['Superaquecimento'];
const SUBCOOLING_RANGE = CALCULATOR_REFERENCE_RANGES['Sub-resfriamento'];

const INSTALL_STEPS = [
    {
        title: "1. POSICIONAMENTO E INFRAESTRUTURA (A BASE)",
        points: [
            "Inspeção do Local: Verificar se o piso suporta o peso (tanque cheio) e desnível.",
            "Posição do Tanque: Boca de saída facilitando conexão com caminhão.",
            "Espaço livre para abrir tampa e sacar régua sem bater no teto.",
            "Unidade Condensadora: LOCAL AREJADO e ventilado (CRÍTICO).",
            "PROIBIDO: 'Casinhas' fechadas sem exaustão (evitar looping térmico)."
        ]
    },
    {
        title: "2. NIVELAMENTO DE PRECISÃO",
        points: [
            "Nivelamento Grosso: Mangueira de nível/laser nos 4 pontos de fábrica.",
            "Nivelamento Fino: Água mínima tocando pontos da régua.",
            "Conferência Cruzada: Medição Frente vs Trás idêntica."
        ]
    },
    {
        title: "3. TUBULAÇÃO E BRASAGEM",
        points: [
            "Brasagem com Nitrogênio (Passante): Evitar oxidação interna (borra).",
            "Limpeza Pós-Brasagem: Carga forte de N2 se não usou durante.",
            "Teste de Estanqueidade: Pressurizar 150-200 PSI (Espuma em tudo).",
            "Desidratação (Vácuo): <500 Microns (Obrigatório leitura, não tempo).",
            "Isolamento Térmico: Sucção completa e Bulbo da Válvula."
        ]
    },
    {
        title: "4. ELÉTRICA E SEGURANÇA",
        points: [
            "Aterramento: Conectado e Testado.",
            "Painel Elétrico: Reaperto geral de bornes (evitar ponto quente).",
            "Alimentação: Tensão de entrada dentro da faixa nominal.",
            "Comando: Cabos conectados seguindo as anilhas/diagrama."
        ]
    },
    {
        title: "5. HIDRÁULICA DE LIMPEZA",
        points: [
            "Água Quente: Conectada e com temperatura >70°C na chegada.",
            "Água Fria: Pressão adequada para enxágue."
        ]
    },
    {
        title: "6. STARTUP E AJUSTES FINOS",
        points: [
            "Sentido de Giro: Bomba de Limpeza e Agitador (Jogando p/ baixo).",
            "Nível de Óleo: Entre 1/4 e 3/4 do visor (estável).",
            `Sup.Aque (Superaquecimento): Ajustar entre ${SUPERHEAT_RANGE.min}K e ${SUPERHEAT_RANGE.max}K.`,
            `Sub.Res (Sub-resfriamento): Ajustar entre ${SUBCOOLING_RANGE.min}K e ${SUBCOOLING_RANGE.max}K.`,
            "Teste de Gelo: Verificar retorno de líquido na sucção."
        ]
    },
    {
        title: "7. ENTREGA E TREINAMENTO",
        points: [
            "Ciclo CIP Completo: Ácido + Alcalino + Sanitizante.",
            "Drenagem: Fundo seco após lavagem (sem poças).",
            "Calibração Régua Eletrônica: Igualar com régua física.",
            "Treinamento: Ensinar limpeza condensador e operação."
        ]
    }
];

export const Tool_Report: React.FC = () => {
    const { techData, updateTechData } = useGlobal();

    // --- ESTADO GERAL ---
    const [serviceMode, setServiceMode] = useState<'maintenance' | 'installation'>('installation');

    // Dados do Relatório
    const [client, setClient] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [model, setModel] = useState('');

    // Leituras Técnicas
    const [finalTemp, setFinalTemp] = useState('');
    const [superHeat, setSuperHeat] = useState('');
    const [subCooling, setSubCooling] = useState('');

    // Checklist Manutenção
    const [maintChecks, setMaintChecks] = useState({
        vacuum: false, nitrogen: false, electricCheck: false, cleaning: false
    });
    const [vacuumMicrons, setVacuumMicrons] = useState('');
    const [obs, setObs] = useState('');

    // Checklist Instalação
    const [installChecked, setInstallChecked] = useState<Set<string>>(new Set());

    // Resultado
    const [report, setReport] = useState('');
    const [loading, setLoading] = useState(false);

    const readLastCalc = (): { sh?: string; sc?: string; fluid?: string } | null => {
        if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem('friotech_last_calc');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const lastCalc = readLastCalc();

    const handleImportFromCalculator = () => {
        const calc = readLastCalc();
        if (!calc) return;
        if (calc.sh) setSuperHeat(calc.sh);
        if (calc.sc) setSubCooling(calc.sc);
    };

    const handleSendWhatsApp = () => {
        if (!report.trim()) return;
        const header = `*FRIO TECH / AGENTE AI ❄ — ${serviceMode === 'installation' ? 'CERTIFICADO DE ENTREGA TÉCNICA' : 'LAUDO TÉCNICO'}*\nCliente: ${client || 'N/I'} | Data: ${date}\nTécnico: ${techData.name || 'Especialista FrioTech AI'}\n\n`;
        const cleanBody = report.replace(/\*\*/g, '*');
        const url = `https://wa.me/?text=${encodeURIComponent(header + cleanBody)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleExportPdf = () => {
        if (!report.trim() || typeof window === 'undefined') return;
        const printWin = window.open('', '_blank', 'width=860,height=900');
        if (!printWin) {
            alert('Permita pop-ups no navegador para gerar o PDF do laudo.');
            return;
        }

        const escapeHtml = (s: string) =>
            s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const formattedHtml = escapeHtml(report)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');

        const docTitle = serviceMode === 'installation' ? 'CERTIFICADO DE ENTREGA TÉCNICA' : 'RELATÓRIO / LAUDO TÉCNICO DE SERVIÇO';
        printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${docTitle} - ${escapeHtml(client || 'Cliente')}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 32px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00a8cc; padding-bottom: 14px; margin-bottom: 20px; }
  .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
  .brand span { color: #0099cc; }
  .doc-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569; margin-top: 4px; }
  .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px; }
  .meta-item strong { color: #334155; text-transform: uppercase; font-size: 11px; display: block; }
  .params { display: flex; gap: 16px; margin-bottom: 20px; }
  .param-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; text-align: center; }
  .param-box span { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; }
  .param-box b { font-size: 16px; color: #0f172a; }
  .content { font-size: 13px; white-space: normal; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background: #ffffff; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; text-align: center; font-size: 12px; color: #475569; }
  .sig-line { border-top: 1px solid #334155; padding-top: 8px; }
  .footer { margin-top: 28px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Frio<span>Tech</span> ❄ <small style="font-size:13px;color:#64748b;">AGENTE AI</small></div>
      <div class="doc-title">${docTitle}</div>
    </div>
    <div style="text-align:right;font-size:12px;color:#475569;">
      <strong>Data:</strong> ${escapeHtml(date)}<br/>
      <strong>Equipamento:</strong> ${escapeHtml(model || 'Não informado')}
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><strong>Cliente / Fazenda</strong>${escapeHtml(client || 'Não informado')}</div>
    <div class="meta-item"><strong>Técnico Responsável</strong>${escapeHtml(techData.name || 'Especialista FrioTech AI')}</div>
  </div>
  <div class="params">
    <div class="param-box"><span>Sup.Aque</span><b>${escapeHtml(superHeat || 'N/A')} K</b></div>
    <div class="param-box"><span>Sub.Res</span><b>${escapeHtml(subCooling || 'N/A')} K</b></div>
    <div class="param-box"><span>Temp. Final Leite</span><b>${escapeHtml(finalTemp || 'N/A')} °C</b></div>
  </div>
  <div class="content">${formattedHtml}</div>
  <div class="signatures">
    <div class="sig-line"><strong>${escapeHtml(techData.name || 'Técnico Responsável')}</strong><br/>Assistência Técnica FrioTech AI</div>
    <div class="sig-line"><strong>${escapeHtml(client || 'Cliente / Responsável')}</strong><br/>Ciente e Aprovado</div>
  </div>
  <div class="footer">Documento gerado pelo sistema FrioTech / Agente AI ❄</div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
        printWin.document.close();
    };

    const handleRunTests = () => {
        console.log("--- INICIANDO DIAGNÓSTICO DO SISTEMA ---");
        const report = runSystemDiagnostics();
        if (report.errors.length > 0) {
            console.error(`🔴 TESTES FALHARAM: ${report.errors.length} de ${report.total} com erro.`);
            console.table(report.errors.map(e => ({ Erro: e })));
        } else {
            console.log(`✅ SUCESSO: Todos os ${report.total} testes passaram.`);
        }
        console.log("--- DIAGNÓSTICO DO SISTEMA CONCLUÍDO ---");
        alert(`Diagnóstico do sistema executado.

Verifique o console do navegador (F12) para ver o resultado detalhado.`);
    };

    // Calculo de progresso
    const totalPoints = INSTALL_STEPS.reduce((acc, s) => acc + s.points.length, 0);
    const installProgress = Math.round((installChecked.size / totalPoints) * 100);

    // --- HANDLERS ---
    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = e.target.value === 'Instalação' ? 'installation' : 'maintenance';
        setServiceMode(mode);
        setReport('');
    };

    const toggleMaintCheck = (key: keyof typeof maintChecks) => {
        setMaintChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleInstallCheck = (id: string) => {
        const newSet = new Set(installChecked);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setInstallChecked(newSet);
    };

    const generate = async () => {
        if (!client) { alert("Preencha o nome do cliente."); return; }
        setLoading(true);

        try {
            let procedureText = "";
            if (serviceMode === 'installation') {
                const completedSteps: string[] = [];
                INSTALL_STEPS.forEach((step, sIdx) => {
                    step.points.forEach((pt, pIdx) => {
                        if (installChecked.has(`${sIdx}-${pIdx}`)) {
                            completedSteps.push(pt);
                        }
                    });
                });
                procedureText = `ITENS VISTORIADOS E APROVADOS NA ENTREGA TÉCNICA:\n- ${completedSteps.join('\n- ')}\n\nPROGRESSO TOTAL: ${installProgress}%`;
            } else {
                procedureText = `PROCEDIMENTOS REALIZADOS (MANUTENÇÃO):\n${maintChecks.vacuum ? '- Desidratação/Vácuo (' + vacuumMicrons + ' microns)' : ''}\n${maintChecks.nitrogen ? '- Teste de Estanqueidade (N2)' : ''}\n${maintChecks.electricCheck ? '- Revisão/Reaperto Elétrico' : ''}\n${maintChecks.cleaning ? '- Limpeza Química do Condensador' : ''}`;
            }

            const prompt = logicService.formatReportPrompt({
                client, date, techName: techData.name || "Especialista FrioTech AI",
                model, serviceMode,
                params: { sh: superHeat || 'N/A', sc: subCooling || 'N/A', temp: finalTemp || 'N/A' },
                procedureText, obs
            });

            // CHAMADA REAL À IA PARA GERAR O TEXTO FINAL
            const finalDoc = await generateTechResponse(prompt, "REPORT");
            setReport(finalDoc);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha na comunicação com a IA.";
            setReport(`ERRO AO GERAR DOCUMENTO: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-file-signature" title="5. SERVIÇOS TÉCNICOS" />

            {/* --- SELETOR DE MODO --- */}
            <Card className="mb-3 !py-2 bg-[#252525]">
                <Select
                    value={serviceMode === 'installation' ? 'Instalação' : 'Manutenção'}
                    onChange={handleServiceChange}
                    className="!mb-0 font-bold text-orange-500 text-center bg-transparent border-none focus:bg-transparent"
                >
                    <option value="Instalação">INSTALAÇÃO / ENTREGA TÉCNICA</option>
                    <option value="Manutenção">MANUTENÇÃO / VISITA</option>
                </Select>
            </Card>

            <Card className="mb-4">
                {/* 1. DADOS CADASTRAIS (COMPACTO) */}
                <div className="mb-4 border-b border-[#333] pb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-id-card"></i> Identificação
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                            label="Cliente"
                            value={client}
                            onChange={e => setClient(e.target.value)}
                            placeholder="Nome / Fazenda"
                            className="!p-2 text-xs !mb-0"
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="!p-2 text-xs !mb-0"
                        />
                        <Input
                            label="Técnico"
                            value={techData.name}
                            onChange={e => updateTechData({ name: e.target.value })}
                            placeholder="Resp. Técnico"
                            className="!p-2 text-xs !mb-0"
                        />
                        <Input
                            label="Modelo"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            placeholder="Ex: 4000L"
                            className="!p-2 text-xs !mb-0"
                        />
                    </div>
                </div>

                {/* 2. LEITURAS TÉCNICAS (COMPACTO) */}
                <div className="mb-4 border-b border-[#333] pb-3">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <i className="fa-solid fa-gauge-high"></i> Parâmetros
                        </p>
                        {lastCalc && (lastCalc.sh || lastCalc.sc) && (
                            <button
                                type="button"
                                onClick={handleImportFromCalculator}
                                className="px-2.5 py-1 rounded-full bg-[#00d9ff]/15 border border-[#00d9ff]/40 text-[#00d9ff] text-[9px] font-black uppercase tracking-wider hover:bg-[#00d9ff]/25 active:scale-95 transition-all"
                            >
                                <i className="fa-solid fa-calculator mr-1"></i>
                                Puxar da Calculadora
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input label="Sup.Aque (K)" type="number" value={superHeat} onChange={e => setSuperHeat(e.target.value)} placeholder="0" className="!p-2 text-xs !mb-0 border-orange-500/30" />
                        <Input label="Sub.Res (K)" type="number" value={subCooling} onChange={e => setSubCooling(e.target.value)} placeholder="0" className="!p-2 text-xs !mb-0 border-orange-500/30" />
                        <Input label="Temp Final" type="number" value={finalTemp} onChange={e => setFinalTemp(e.target.value)} placeholder="°C" className="!p-2 text-xs !mb-0" />
                    </div>
                </div>

                {/* 3. ÁREA PRINCIPAL: CHECKLISTS DETALHADOS */}
                {serviceMode === 'maintenance' ? (
                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-2">Procedimentos de Rotina</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <button onClick={() => toggleMaintCheck('vacuum')} className={`p-3 rounded-lg border text-[9px] font-bold uppercase ${maintChecks.vacuum ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-transparent border-[#404040] text-gray-500'}`}>Vácuo</button>
                            <button onClick={() => toggleMaintCheck('nitrogen')} className={`p-3 rounded-lg border text-[9px] font-bold uppercase ${maintChecks.nitrogen ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-transparent border-[#404040] text-gray-500'}`}>Nitrogênio</button>
                            <button onClick={() => toggleMaintCheck('electricCheck')} className={`p-3 rounded-lg border text-[9px] font-bold uppercase ${maintChecks.electricCheck ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-transparent border-[#404040] text-gray-500'}`}>Elétrica</button>
                            <button onClick={() => toggleMaintCheck('cleaning')} className={`p-3 rounded-lg border text-[9px] font-bold uppercase ${maintChecks.cleaning ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-transparent border-[#404040] text-gray-500'}`}>Limpeza</button>
                        </div>
                        {maintChecks.vacuum && <Input label="Microns" type="number" value={vacuumMicrons} onChange={e => setVacuumMicrons(e.target.value)} placeholder="450" className="!p-2" />}
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                                ENTREGA TÉCNICA - DETALHADA ({installProgress}%)
                            </p>
                            <div className="w-1/3 h-1.5 bg-[#333] rounded-full">
                                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${installProgress}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {INSTALL_STEPS.map((step, idx) => (
                                <div key={idx} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
                                    <p className="text-[10px] font-bold text-gray-300 mb-3 border-b border-[#333] pb-1 uppercase tracking-wide">
                                        {step.title}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {step.points.map((pt, pIdx) => {
                                            const id = `${idx}-${pIdx}`;
                                            const checked = installChecked.has(id);
                                            return (
                                                <button
                                                    key={pIdx}
                                                    onClick={() => toggleInstallCheck(id)}
                                                    className={`p-3 rounded text-[10px] font-medium transition-all flex items-start text-left gap-3 ${checked
                                                            ? 'bg-emerald-900/20 border border-emerald-500/40 text-emerald-400'
                                                            : 'bg-[#252525] border border-[#404040] text-gray-400 hover:border-gray-500'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 min-w-[16px] rounded border flex items-center justify-center ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#555]'
                                                        }`}>
                                                        {checked && <i className="fa-solid fa-check text-[8px]"></i>}
                                                    </div>
                                                    <span className="leading-relaxed">{pt}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Input label="Observações / Peças Trocadas" value={obs} onChange={e => setObs(e.target.value)} className="!p-3 text-xs" />

                <Button onClick={generate} disabled={loading}>
                    <i className="fa-solid fa-file-shield mr-2"></i>
                    {serviceMode === 'installation' ? 'GERAR CERTIFICADO OFICIAL' : 'GERAR LAUDO TÉCNICO'}
                </Button>

                <Button onClick={handleRunTests} disabled={loading} className="!bg-slate-600 hover:!bg-slate-500 mt-3">
                    <i className="fa-solid fa-stethoscope mr-2"></i>
                    Executar Diagnóstico do Sistema
                </Button>
            </Card>

            <AIOutputBox
                content={report}
                isLoading={loading}
                title={serviceMode === 'installation' ? "CERTIFICADO DE ENTREGA TÉCNICA" : "RELATÓRIO DE SERVIÇO"}
            />

            {report && !loading && !report.startsWith('ERRO AO GERAR') && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={handleSendWhatsApp}
                        className="w-full py-3 px-4 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Enviar no WhatsApp</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="w-full py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-[#26354d] border border-[#00d9ff]/40 text-[#00d9ff] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <i className="fa-solid fa-file-pdf text-sm"></i>
                        <span>Gerar PDF FrioTech AI</span>
                    </button>
                </div>
            )}
        </div>
    );
};
