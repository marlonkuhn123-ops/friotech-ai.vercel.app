import React, { useState } from 'react';
import { Card, SectionTitle, Button, Input, AIOutputBox } from './UI';
import { generateTechResponse } from '../services/geminiService';
import { supportSessionService } from '../services/supportSessionService';
import { useGlobal } from '../contexts/GlobalContext';
import { ViewState } from '../types';

type ControllerFamily = 'Full Gauge' | 'Ageon' | 'CLP Panasonic' | 'Soft-Starter MCD 202';

interface OfflineErrorEntry {
    controller: ControllerFamily;
    codes: string[];
    displayCode: string;
    meaning: string;
    causes: string;
    action: string;
}

const CONTROLLER_FAMILIES: ControllerFamily[] = [
    'Full Gauge',
    'Ageon',
    'CLP Panasonic',
    'Soft-Starter MCD 202'
];

const OFFLINE_ERROR_CODES: OfflineErrorEntry[] = [
    // Full Gauge
    {
        controller: 'Full Gauge',
        codes: ['E1', 'ER1', 'ERR1', 'E01'],
        displayCode: 'E1 / Er1',
        meaning: 'Falha no Sensor S1 (Temperatura do Leite / Ambiente).',
        causes: 'Sensor desconectado, cabo rompido, umidade na emenda, sensor em curto ou fora da faixa de leitura.',
        action: 'Desenergize, confira os bornes do sensor S1 no controlador e meça a resistência ôhmica do sensor (NTC 10k a 25°C ~ 10 kΩ). Confira emendas úmidas no poço térmico.'
    },
    {
        controller: 'Full Gauge',
        codes: ['E2', 'ER2', 'ERR2', 'E02'],
        displayCode: 'E2 / Er2',
        meaning: 'Falha no Sensor S2 (Evaporador / Auxiliar).',
        causes: 'Cabo partido, mau contato no borne do controlador ou sensor S2 danificado por infiltração.',
        action: 'Verifique a continuidade do cabo do sensor S2 e meça sua resistência. Se o controlador não usa S2 nesse tanque, confirme se o parâmetro de S2 está desabilitado.'
    },
    {
        controller: 'Full Gauge',
        codes: ['AH', 'HI', 'ALTA'],
        displayCode: 'AH / HI',
        meaning: 'Alarme de Temperatura Alta do Leite.',
        causes: 'Compressor não partiu, falta de fluido refrigerante, condensador obstruído, agitador parado ou entrada de grande volume de leite quente.',
        action: 'Verifique se o compressor e o agitador estão operando, confira pressões no manifold e limpe o condensador.'
    },
    {
        controller: 'Full Gauge',
        codes: ['AL', 'LO', 'BAIXA'],
        displayCode: 'AL / LO',
        meaning: 'Alarme de Temperatura Baixa (Risco de Congelamento do Leite).',
        causes: 'Setpoint muito baixo, sensor descalibrado, contatora colada mantendo compressor ligado direto ou agitador parado.',
        action: 'Desligue o compressor imediatamente se houver gelo no fundo, confira o setpoint (padrão 3,5°C a 4,0°C), teste o agitador e verifique se a contatora não está colada.'
    },
    {
        controller: 'Full Gauge',
        codes: ['PPP', 'E3', 'ER3', 'EEPROM'],
        displayCode: 'PPP / E3',
        meaning: 'Parâmetros de fábrica corrompidos na memória do controlador.',
        causes: 'Pico de tensão na rede elétrica, queda brusca de energia ou interferência eletromagnética sem supressor RC na bobina da contatora.',
        action: 'Reconfigure os parâmetros básicos (setpoint, diferencial, retardo de partida). Instale/confira supressor RC nos bornes A1/A2 das contatoras.'
    },
    {
        controller: 'Full Gauge',
        codes: ['OP', 'DO', 'OPEN'],
        displayCode: 'OP / dO',
        meaning: 'Entrada digital aberta (Porta / Proteção externa / Pressostato).',
        causes: 'Contato de proteção em série aberto (pressostato, disjuntor-motor, termostato de segurança ou chave de tampa).',
        action: 'Verifique a cadeia de segurança ligada à entrada digital do controlador antes de forçar partida.'
    },
    // Ageon
    {
        controller: 'Ageon',
        codes: ['E1', 'ER1', 'E01'],
        displayCode: 'E1 / Er1',
        meaning: 'Erro na Sonda 1 (Sensor Principal de Temperatura).',
        causes: 'Sonda desconectada, fio quebrado, emenda oxidada ou sensor NTC queimado.',
        action: 'Confira o aperto nos bornes do Ageon e meça a resistência da sonda NTC. Substitua se estiver aberta (infinito) ou em curto (0 Ω).'
    },
    {
        controller: 'Ageon',
        codes: ['E2', 'ER2', 'E02'],
        displayCode: 'E2 / Er2',
        meaning: 'Erro na Sonda 2 (Sensor Auxiliar / Evaporador).',
        causes: 'Fio rompido ou sonda em curto.',
        action: 'Verifique os bornes da sonda 2 e meça sua resistência ôhmica.'
    },
    {
        controller: 'Ageon',
        codes: ['E04', 'E4', 'ER4'],
        displayCode: 'E04 / E4',
        meaning: 'Alarme de Proteção Externa / Falha de Entrada Digital ou Limite Crítico.',
        causes: 'Pressostato de alta/baixa atuado, disjuntor-motor aberto ou falta de fase na entrada de segurança.',
        action: 'Inspecione pressostatos (alta/baixa), disjuntor-motor (DM) e relé de falta de fase antes de rearmar.'
    },
    {
        controller: 'Ageon',
        codes: ['E05', 'E5', 'ER5'],
        displayCode: 'E05 / E5',
        meaning: 'Falha de Memória / Erro Interno de Configuração ou Sensor Fora de Faixa.',
        causes: 'Oscilação forte de tensão ou leitura fora do range configurado.',
        action: 'Desligue o disjuntor geral por 30 segundos, religue e confira os parâmetros e a tensão de alimentação.'
    },
    // CLP Panasonic
    {
        controller: 'CLP Panasonic',
        codes: ['X9', 'LED X9', 'RFF', 'FASE'],
        displayCode: 'LED X9 Piscando',
        meaning: 'Rede elétrica instável ou atuação do Relé de Falta/Sequência de Fase (RFF).',
        causes: 'Falta de uma fase, inversão de fase, subtensão/sobretensão (> ±10%) ou desequilíbrio acima de 2% entre fases.',
        action: 'Meça L1-L2, L2-L3 e L1-L3 na entrada do quadro geral. Confira o LED do relé falta de fase (RFF) e o contato auxiliar que alimenta a entrada X9 do CLP Panasonic.'
    },
    {
        controller: 'CLP Panasonic',
        codes: ['RL1', 'NIVEL', 'CIP', 'AGUA'],
        displayCode: 'Falha CIP / RL1',
        meaning: 'Bomba de limpeza (CIP) bloqueada por falta de nível de água/solução.',
        causes: 'Relé de nível (RL1) não detectou água suficiente, eletrodos sujos/isolados com gordura de leite ou válvula solenoide de entrada de água travada.',
        action: 'Verifique a chegada de água, limpe os eletrodos de nível e confira se o relé de nível RL1 fecha contato quando o tanque enche.'
    },
    {
        controller: 'CLP Panasonic',
        codes: ['PA', 'ALTA PRESSAO', 'PRESSOSTATO'],
        displayCode: 'Alta Pressão (P.A.)',
        meaning: 'Desarme do Pressostato de Alta Pressão.',
        causes: 'Condensador sujo/entupido, ventilador parado ou girando lento, recirculação de ar quente na sala, excesso de fluido ou ar no sistema.',
        action: 'Lave a colmeia do condensador, confira os ventiladores e meça a pressão de descarga antes de rearmar o pressostato.'
    },
    {
        controller: 'CLP Panasonic',
        codes: ['2K2', 'OSCILA', 'SENSOR'],
        displayCode: 'Temp. Oscilando (2K2)',
        meaning: 'Leitura instável de temperatura na IHM / CLP.',
        causes: 'Resistor de 2K2 na entrada analógica do CLP alterado/solto, malha de blindagem sem aterramento ou sensor PT100/NTC com umidade.',
        action: 'Verifique o resistor 2K2 nos bornes de entrada do CLP Panasonic, o aperto dos conectores e o aterramento do painel.'
    },
    // Soft-Starter Danfoss MCD 202
    {
        controller: 'Soft-Starter MCD 202',
        codes: ['F1', '1X', 'SOBRECARGA'],
        displayCode: '1 Piscada (Sobrecarga)',
        meaning: 'Desarme por sobrecarga térmica do motor no Soft-Starter Danfoss MCD 202.',
        causes: 'Corrente do compressor acima do nominal (alta condensação, tensão baixa, retorno de líquido ou compressor travando).',
        action: 'Meça a corrente nas 3 fases com alicate amperímetro, confira pressão de alta/condensador e verifique o ajuste de corrente nominal (FLC) no MCD 202.'
    },
    {
        controller: 'Soft-Starter MCD 202',
        codes: ['F2', '2X', 'TEMPERATURA', 'PARTIDAS'],
        displayCode: '2 Piscadas (Excesso Temp.)',
        meaning: 'Sobretemperatura interna do Soft-Starter MCD 202.',
        causes: 'Mais de 6 partidas por hora (limite máximo do conjunto compressor + soft-starter), ventilação do painel bloqueada ou temperatura ambiente elevada.',
        action: 'Aguarde o resfriamento, verifique por que o compressor está ciclando rápido (pressostato/curto-ciclo) e confira a ventilação do quadro elétrico.'
    },
    {
        controller: 'Soft-Starter MCD 202',
        codes: ['F3', '3X', 'FASE', 'DESEQUILIBRIO'],
        displayCode: '3 Piscadas (Falta/Desq. Fase)',
        meaning: 'Falta de fase ou desequilíbrio de tensão/corrente no MCD 202.',
        causes: 'Fusível queimado, borne solto na entrada/saída, queda de fase na rede rural ou desequilíbrio > 2%.',
        action: 'Meça a tensão nas 3 fases na entrada do soft-starter (L1/L2/L3) com carga e confira fusíveis/disjuntores e reaperto dos bornes.'
    },
    {
        controller: 'Soft-Starter MCD 202',
        codes: ['F5', '5X', 'TEMPO', 'TRAVADO'],
        displayCode: '5 Piscadas (Tempo Partida)',
        meaning: 'Tempo máximo de rampa de partida excedido.',
        causes: 'Compressor tentando partir contra alta pressão diferencial, tensão caindo na partida ou rotor mecanicamente travado.',
        action: 'Confira a queda de tensão na partida, verifique equalização de pressões e teste a resistência/isolação das bobinas do compressor.'
    }
];

const normalizeCode = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();

export const Tool_Errors: React.FC = () => {
    const { setView } = useGlobal();
    const [selectedFamily, setSelectedFamily] = useState<ControllerFamily | ''>('');
    const [model, setModel] = useState('');
    const [code, setCode] = useState('');
    const [result, setResult] = useState('');
    const [isOfflineResult, setIsOfflineResult] = useState(false);
    const [loading, setLoading] = useState(false);

    const findOfflineMatch = (targetCode: string, targetModel: string): OfflineErrorEntry | null => {
        const normCode = normalizeCode(targetCode);
        if (!normCode) return null;
        const normModel = normalizeCode(targetModel);

        const matches = OFFLINE_ERROR_CODES.filter(entry =>
            entry.codes.some(c => normCode === c || normCode.includes(c) || c.includes(normCode))
        );
        if (matches.length === 0) return null;

        if (normModel) {
            const familyMatch = matches.find(m => normalizeCode(m.controller).includes(normModel) || normModel.includes(normalizeCode(m.controller).split(' ')[0]));
            if (familyMatch) return familyMatch;
        }
        return matches[0];
    };

    const formatOfflineEntry = (entry: OfflineErrorEntry) => [
        `⚡ CONSULTA LOCAL INSTANTÂNEA (FUNCIONA OFFLINE)`,
        `CONTROLADOR: ${entry.controller}`,
        `CÓDIGO: ${entry.displayCode}`,
        '',
        `SIGNIFICADO: ${entry.meaning}`,
        '',
        `CAUSAS PROVÁVEIS: ${entry.causes}`,
        '',
        `O QUE VERIFICAR AGORA: ${entry.action}`
    ].join('\n');

    const handleSelectFamily = (family: ControllerFamily) => {
        if (selectedFamily === family) {
            setSelectedFamily('');
            setModel('');
        } else {
            setSelectedFamily(family);
            setModel(family);
        }
        setResult('');
        setIsOfflineResult(false);
    };

    const handleQuickCode = (entry: OfflineErrorEntry) => {
        setSelectedFamily(entry.controller);
        setModel(entry.controller);
        setCode(entry.displayCode);
        setResult(formatOfflineEntry(entry));
        setIsOfflineResult(true);
    };

    const runWithAi = async (customCode?: string, customModel?: string) => {
        const effectiveCode = (customCode ?? code).trim();
        const effectiveModel = (customModel ?? model).trim();
        if (!effectiveCode) return;

        setLoading(true);
        setIsOfflineResult(false);
        try {
            const prompt = `
            COMANDO: BUSCAR CÓDIGO DE ERRO.
            CONTROLADOR: ${effectiveModel || 'Genérico'}.
            CÓDIGO: ${effectiveCode}.

            INSTRUÇÃO: Retorne APENAS o significado técnico, causas prováveis e a ordem direta de verificação em campo.
            SEM BOM DIA. SEM TEXTO DE APOIO. APENAS O DADO TÉCNICO OBJETIVO.
            `;
            const text = await generateTechResponse(prompt, "ERRORS");
            setResult(text);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Falha ao decodificar erro.";
            setResult(`ERRO NA ANÁLISE ONLINE: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const run = async () => {
        if (!code.trim()) return;
        const offlineHit = findOfflineMatch(code, model || selectedFamily);
        if (offlineHit) {
            setResult(formatOfflineEntry(offlineHit));
            setIsOfflineResult(true);
            return;
        }
        await runWithAi();
    };

    const handleSendToSupport = () => {
        if (!code.trim()) return;
        const ctrlName = model.trim() || selectedFamily || 'controlador';
        const draftMessage = `Apareceu o erro/alarme "${code.trim()}" no ${ctrlName}. Qual o passo a passo de teste em campo?`;
        const existing = supportSessionService.load();
        supportSessionService.save({
            mode: 'ELEC',
            draft: draftMessage,
            messages: existing ? supportSessionService.hydrateMessages(existing) : [],
            diagnosticContext: {
                ...(existing?.diagnosticContext ?? {}),
                code: code.trim()
            },
            attachmentsMeta: existing?.attachmentsMeta ?? []
        });
        setView(ViewState.DIAGNOSTIC);
    };

    const visibleQuickCodes = selectedFamily
        ? OFFLINE_ERROR_CODES.filter(e => e.controller === selectedFamily)
        : OFFLINE_ERROR_CODES.slice(0, 6);

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-triangle-exclamation" title="2. ERROS DO CONTROLADOR" />
            <Card>
                <div className="mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9ca7b8] mb-2">
                        Selecione o Controlador / Equipamento (1 Toque)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {CONTROLLER_FAMILIES.map(family => {
                            const active = selectedFamily === family;
                            return (
                                <button
                                    key={family}
                                    type="button"
                                    onClick={() => handleSelectFamily(family)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                                        active
                                            ? 'bg-[#00d9ff] text-[#0a0e14] border-[#00d9ff] shadow-[0_0_12px_rgba(0,217,255,0.35)]'
                                            : 'bg-[#1e293b] text-white/80 border-[#4a5c73] hover:border-[#00d9ff]/50'
                                    }`}
                                >
                                    {family}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Input
                    label="Modelo do Controlador"
                    placeholder="Ex: Full Gauge MT-50, Ageon, CLP Panasonic..."
                    value={model}
                    onChange={e => setModel(e.target.value)}
                />
                <Input
                    label="Código no Visor / Alarme"
                    placeholder="Ex: E1, E04, AH, LED X9, F1..."
                    value={code}
                    onChange={e => setCode(e.target.value)}
                />

                <div className="mb-4">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#00d9ff]/85 mb-2">
                        <i className="fa-solid fa-bolt mr-1"></i>
                        Códigos Frequentes (Consulta Offline Instantânea)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {visibleQuickCodes.map((entry, idx) => (
                            <button
                                key={`${entry.controller}-${idx}`}
                                type="button"
                                onClick={() => handleQuickCode(entry)}
                                className="px-2.5 py-1 rounded-lg bg-[#111827]/70 hover:bg-[#1e293b] border border-[#4a5c73]/80 text-[10px] font-bold text-[#d8f7ff] transition-all active:scale-95"
                            >
                                <span className="text-[#00d9ff]">{entry.displayCode}</span>
                                {!selectedFamily && <span className="text-white/50 ml-1">({entry.controller.split(' ')[0]})</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Button onClick={run} disabled={loading || !code.trim()}>
                        ANALISAR FALHA
                    </Button>

                    {isOfflineResult && (
                        <button
                            type="button"
                            onClick={() => void runWithAi()}
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#2a3646] hover:bg-[#344458] border border-white/15 text-white/90 font-bold text-[10.5px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <i className="fa-solid fa-wand-magic-sparkles text-[#00d9ff]"></i>
                            <span>Aprofundar com IA (Online)</span>
                        </button>
                    )}

                    {result && !loading && (
                        <button
                            type="button"
                            onClick={handleSendToSupport}
                            className="w-full py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-[#26354d] border border-[#00d9ff]/40 text-[#00d9ff] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <i className="fa-solid fa-headset"></i>
                            <span>Levar este Erro para o Suporte IA</span>
                        </button>
                    )}
                </div>

                <AIOutputBox content={result} isLoading={loading} title="DIAGNÓSTICO DO ERRO" />
            </Card>
        </div>
    );
};
