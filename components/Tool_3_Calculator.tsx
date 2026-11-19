import React, { useEffect, useState } from 'react';
import { Card, SectionTitle, Button, Input, Select, AIOutputBox } from './UI';
import { CalcMode, Refrigerant, ViewState } from '../types';
import { logicService } from '../services/logicService';
import { supportSessionService } from '../services/supportSessionService';
import { useGlobal } from '../contexts/GlobalContext';

const buildCombinedDiagnosis = (
    fluid: Refrigerant,
    shClass: 'BAIXO' | 'IDEAL' | 'ALTO' | null,
    scClass: 'BAIXO' | 'IDEAL' | 'ALTO' | null
): { title: string; badgeTone: string; guidance: string } | null => {
    if (!shClass || !scClass) return null;

    if (shClass === 'BAIXO') {
        return {
            title: 'RISCO DE RETORNO DE LÍQUIDO AO COMPRESSOR',
            badgeTone: 'border-red-500/45 bg-red-500/12 text-red-100',
            guidance:
                'Com Sup.Aque baixo (< 7K), há risco imediato de diluição do óleo e golpe de líquido, independentemente do Sub.Res. Confira primeiro se o bulbo da válvula de expansão está firme, limpo e isolado, verifique se o agitador está funcionando e feche a válvula 1/4 de volta por vez aguardando 10 a 15 minutos.'
        };
    }

    if (shClass === 'ALTO' && scClass === 'BAIXO') {
        const r407Note =
            fluid === Refrigerant.R407C
                ? ' Atenção no R-407C: após corrigir o vazamento, NÃO complete a carga — recolha e recarregue com fluido virgem em fase líquida.'
                : '';
        return {
            title: 'FALTA DE FLUIDO / VAZAMENTO / FLASH GAS',
            badgeTone: 'border-[#ff6600]/45 bg-[#ff6600]/12 text-[#ffe5d1]',
            guidance: `Sup.Aque ALTO + Sub.Res BAIXO indica evaporador faminto por falta de reserva líquida no condensador. NÃO abra a válvula de expansão primeiro! Procure vazamento (vestígios de óleo nas conexões) e verifique bolhas no visor antes de ajustar a carga.${r407Note}`
        };
    }

    if (shClass === 'ALTO' && (scClass === 'IDEAL' || scClass === 'ALTO')) {
        return {
            title: 'RESTRIÇÃO NA LINHA DE LÍQUIDO OU VÁLVULA DE EXPANSÃO FECHADA',
            badgeTone: 'border-[#ff6600]/45 bg-[#ff6600]/12 text-[#ffe5d1]',
            guidance:
                'Sup.Aque ALTO com Sub.Res normal ou alto comprova que há fluido líquido acumulado no condensador, mas ele não está chegando ao evaporador. Verifique diferença de temperatura entre entrada e saída do filtro secador, válvula solenoide, tela de entrada e abertura da válvula de expansão.'
        };
    }

    if (shClass === 'IDEAL' && scClass === 'BAIXO') {
        return {
            title: 'RESERVA DE LÍQUIDO BAIXA NO CONDENSADOR',
            badgeTone: 'border-[#ff6600]/40 bg-[#ff6600]/10 text-[#ffe5d1]',
            guidance:
                'O evaporador está alimentado no momento, mas a reserva líquida está no limite. Confira se há início de vazamento, queda de pressão antes do ponto medido ou carga ligeiramente incompleta.'
        };
    }

    if (shClass === 'IDEAL' && scClass === 'ALTO') {
        return {
            title: 'ALTA CONDENSAÇÃO / CONDENSADOR SUJO OU EXCESSO DE CARGA',
            badgeTone: 'border-[#ff6600]/40 bg-[#ff6600]/10 text-[#ffe5d1]',
            guidance:
                'Antes de retirar fluido, lave a colmeia do condensador, confira os ventiladores, a recirculação de ar quente na sala e descarte ar/não-condensáveis no sistema.'
        };
    }

    return {
        title: 'CICLO FRIGORÍFICO EQUILIBRADO (OPERAÇÃO NORMAL)',
        badgeTone: 'border-[#00d9ff]/40 bg-[#00d9ff]/10 text-[#d8f7ff]',
        guidance:
            'Tanto o Sup.Aque (7K a 12K) quanto o Sub.Res (4K a 8K) estão dentro da janela ideal de campo. Se o leite ainda demorar a baixar, verifique agitação, carga térmica de entrada ou outro circuito do tanque.'
    };
};

export const Tool_Calculator: React.FC = () => {
    const { setView } = useGlobal();
    const [fluid, setFluid] = useState<Refrigerant>(Refrigerant.R22);
    const [press, setPress] = useState('');
    const [temp, setTemp] = useState('');
    const [mode, setMode] = useState<CalcMode>('Superaquecimento');
    const [pairPress, setPairPress] = useState('');
    const [pairTemp, setPairTemp] = useState('');
    const [result, setResult] = useState('');

    const localAudit = logicService.getCalculatorAudit(fluid, press, temp, mode);
    const pairedMode: CalcMode = mode === 'Superaquecimento' ? 'Sub-resfriamento' : 'Superaquecimento';
    const pairedAudit = logicService.getCalculatorAudit(fluid, pairPress, pairTemp, pairedMode);

    const shAudit = mode === 'Superaquecimento' ? localAudit : pairedAudit;
    const scAudit = mode === 'Sub-resfriamento' ? localAudit : pairedAudit;
    const combinedDiagnosis =
        shAudit.ready && scAudit.ready
            ? buildCombinedDiagnosis(fluid, shAudit.classification, scAudit.classification)
            : null;

    const pressureLabel = mode === 'Superaquecimento' ? 'Pressão Baixa (PSIG)' : 'Pressão Alta (PSIG)';
    const temperatureLabel = mode === 'Superaquecimento' ? 'Temp. Sucção (C)' : 'Temp. Linha Líquida (C)';
    const temperaturePlaceholder = mode === 'Superaquecimento' ? 'Saída evaporador/bulbo' : 'Linha líquida';

    const pairedPressureLabel = pairedMode === 'Superaquecimento' ? 'Pressão Baixa (PSIG)' : 'Pressão Alta (PSIG)';
    const pairedTemperatureLabel = pairedMode === 'Superaquecimento' ? 'Temp. Sucção (C)' : 'Temp. Linha Líquida (C)';
    const pairedTemperaturePlaceholder = pairedMode === 'Superaquecimento' ? 'Saída evaporador/bulbo' : 'Linha líquida';

    useEffect(() => {
        setResult('');
    }, [fluid, press, temp, mode, pairPress, pairTemp]);

    const buildLocalResult = () => {
        if (!localAudit.ready) {
            return [
                'RESULTADO LOCAL NÃO CONCLUÍDO',
                localAudit.warning || 'Revise pressão e temperatura antes de interpretar o equipamento.',
                `Fonte: ${localAudit.sourceLabel}`,
            ].join('\n');
        }

        const lines = [
            'RESULTADO LOCAL AUDITÁVEL',
            `Fluido: ${fluid}`,
            `Modo: ${mode} (${localAudit.modeShortLabel})`,
            localAudit.tsatLabel,
            localAudit.resultLabel,
            localAudit.classificationLabel,
            localAudit.referenceLabel,
            `Curva usada: ${localAudit.curveLabel}`,
            `Conduta: ${localAudit.actionLabel}`,
        ];

        if (pairedAudit.ready && combinedDiagnosis) {
            lines.push(
                '',
                `--- CRUZAMENTO COM ${pairedAudit.modeShortLabel.toUpperCase()} ---`,
                pairedAudit.tsatLabel,
                pairedAudit.resultLabel,
                pairedAudit.classificationLabel,
                `Diagnóstico Cruzado: ${combinedDiagnosis.title}`,
                `Orientação: ${combinedDiagnosis.guidance}`
            );
        }

        lines.push(`Fonte: ${localAudit.sourceLabel}`);
        return lines.join('\n');
    };

    const run = () => {
        if (!press || !temp) return;
        setResult(buildLocalResult());
    };

    const handleSendToSupport = () => {
        if (!localAudit.ready) return;

        const lowPress = mode === 'Superaquecimento' ? press : pairPress;
        const highPress = mode === 'Sub-resfriamento' ? press : pairPress;

        const pieces: string[] = [`Fluido ${fluid}`];
        if (shAudit.ready) {
            pieces.push(`sucção ${lowPress} PSIG, ${shAudit.resultLabel} (${shAudit.classification})`);
        }
        if (scAudit.ready) {
            pieces.push(`descarga ${highPress} PSIG, ${scAudit.resultLabel} (${scAudit.classification})`);
        }
        const draftMessage = `${pieces.join(', ')}. Qual o diagnóstico e próximo teste?`;

        const existing = supportSessionService.load();
        supportSessionService.save({
            mode: 'REF',
            draft: draftMessage,
            messages: existing ? supportSessionService.hydrateMessages(existing) : [],
            diagnosticContext: {
                ...(existing?.diagnosticContext ?? {}),
                refrigerant: fluid
            },
            attachmentsMeta: existing?.attachmentsMeta ?? []
        });

        setView(ViewState.DIAGNOSTIC);
    };

    const classificationTone = localAudit.classification === 'IDEAL'
        ? 'border-[#00d9ff]/35 bg-[#00d9ff]/8 text-[#d8f7ff]'
        : localAudit.classification
            ? 'border-[#ff6600]/35 bg-[#ff6600]/10 text-[#ffe5d1]'
            : 'border-[#4a5c73] bg-[#2a3646]/65 text-[#d7dee8]';

    return (
        <div className="animate-fadeIn">
            <SectionTitle icon="fa-solid fa-calculator" title="3. CÁLCULO TÉCNICO" />
            <Card>
                <Select label="Fluido Refrigerante" value={fluid} onChange={e => setFluid(e.target.value as Refrigerant)}>
                    <option value={Refrigerant.R22}>R-22</option>
                    <option value={Refrigerant.R404A}>R-404A</option>
                    <option value={Refrigerant.R407C}>R-407C</option>
                </Select>

                <div className="flex gap-2">
                    <Input label={pressureLabel} type="number" value={press} onChange={e => setPress(e.target.value)} placeholder="Manômetro" />
                    <Input label={temperatureLabel} type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder={temperaturePlaceholder} />
                </div>

                <Select label="Modo de Cálculo" value={mode} onChange={e => setMode(e.target.value as CalcMode)}>
                    <option value="Superaquecimento">Superaquecimento (Baixa/Sucção)</option>
                    <option value="Sub-resfriamento">Sub-resfriamento (Alta/Líquido)</option>
                </Select>

                <div className="mb-4 p-3 rounded-xl border border-[#4a5c73]/80 bg-[#1e293b]/60">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#00d9ff]">
                            <i className="fa-solid fa-arrows-split-up-and-left mr-1.5"></i>
                            Cruzar com {pairedMode} (Opcional)
                        </span>
                        {(pairPress || pairTemp) && (
                            <button
                                type="button"
                                onClick={() => { setPairPress(''); setPairTemp(''); }}
                                className="text-[9px] font-bold uppercase tracking-wider text-white/60 hover:text-white"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            label={pairedPressureLabel}
                            type="number"
                            value={pairPress}
                            onChange={e => setPairPress(e.target.value)}
                            placeholder="Opcional"
                        />
                        <Input
                            label={pairedTemperatureLabel}
                            type="number"
                            value={pairTemp}
                            onChange={e => setPairTemp(e.target.value)}
                            placeholder={pairedTemperaturePlaceholder}
                        />
                    </div>
                </div>

                <div className="mb-4 p-3 rounded-lg border text-[10px] font-medium leading-relaxed flex items-start gap-2 transition-colors bg-[#2a3646]/50 border-[#4a5c73] text-[#9ca7b8]">
                    <i className="fa-solid fa-circle-info mt-0.5 text-xs text-[#00d9ff]"></i>
                    <span>
                        {mode === 'Superaquecimento'
                            ? "SUP.AQUE: use pressão baixa em PSIG. Para ajuste da válvula de expansão, prefira medir na saída do evaporador/bulbo; perto do compressor vira superaquecimento total."
                            : "SUB.RES: use pressão alta em PSIG. Em R404A e R407C o app usa bubble/líquido. Considere o ponto medido: saída do condensador ou antes da válvula de expansão."}
                    </span>
                </div>

                <div className={`mb-4 rounded-[18px] border overflow-hidden ${classificationTone}`}>
                    <div className="px-4 py-2.5 border-b border-white/10 bg-black/10 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] font-heading">CÁLCULO LOCAL AUDITÁVEL</p>
                            <p className="text-[11px] mt-1 opacity-90">A conta abaixo é o valor de referência do app.</p>
                        </div>
                        <div className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[10px] font-bold uppercase tracking-[0.12em]">
                            {localAudit.modeShortLabel}
                        </div>
                    </div>

                    <div className="px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-80 mb-2">
                            DIREÇÃO DO CÁLCULO
                        </div>
                        <div className="rounded-[14px] border border-white/10 bg-black/15 px-3 py-2.5 text-[13px] font-mono text-white mb-3">
                            {localAudit.directionLabel}
                        </div>

                        {localAudit.ready ? (
                            <>
                                <div className="rounded-[16px] border border-white/10 bg-[#111827]/55 px-3 py-3 font-mono text-[14px] text-white space-y-2">
                                    <p>{localAudit.tsatLabel}</p>
                                    <p>{localAudit.resultLabel}</p>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] font-semibold">
                                        {localAudit.classificationLabel}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] font-semibold">
                                        {localAudit.referenceLabel}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-[11px] font-semibold">
                                        {localAudit.curveLabel}
                                    </span>
                                </div>

                                <div className="mt-3 rounded-[14px] border border-white/10 bg-black/15 px-3 py-2.5 text-[11px] leading-relaxed">
                                    <strong className="uppercase tracking-[0.12em]">Conduta:</strong> {localAudit.actionLabel}
                                </div>

                                <p className="mt-3 text-[11px] leading-relaxed opacity-90">
                                    Fonte local: {localAudit.sourceLabel}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="rounded-[16px] border border-[#ff6600]/25 bg-[#111827]/55 px-3 py-3 text-[12px] leading-relaxed text-white">
                                    {localAudit.warning}
                                </div>
                                <p className="mt-3 text-[11px] leading-relaxed opacity-90">
                                    Fonte local: {localAudit.sourceLabel}
                                </p>
                                <p className="mt-2 text-[11px] leading-relaxed opacity-90">
                                    Revise os dados e confira a tabela PT antes de agir no equipamento.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {combinedDiagnosis && (
                    <div className={`mb-4 rounded-[18px] border p-4 ${combinedDiagnosis.badgeTone}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                                <i className="fa-solid fa-code-merge mr-1.5"></i>
                                Diagnóstico Cruzado (Sup.Aque + Sub.Res)
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-black/25 border border-white/15 text-[9.5px] font-black uppercase">
                                {shAudit.modeShortLabel}: {shAudit.classification} • {scAudit.modeShortLabel}: {scAudit.classification}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 font-mono text-[12px] text-white">
                            <div className="rounded-xl bg-[#111827]/65 border border-white/10 px-3 py-2">
                                <p className="text-[10px] uppercase opacity-70">{shAudit.modeShortLabel}</p>
                                <p>{shAudit.resultLabel}</p>
                            </div>
                            <div className="rounded-xl bg-[#111827]/65 border border-white/10 px-3 py-2">
                                <p className="text-[10px] uppercase opacity-70">{scAudit.modeShortLabel}</p>
                                <p>{scAudit.resultLabel}</p>
                            </div>
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-wide mb-1">{combinedDiagnosis.title}</p>
                        <p className="text-[11px] leading-relaxed opacity-95">{combinedDiagnosis.guidance}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <Button onClick={run} disabled={!press || !temp}>CALCULAR AGORA</Button>
                    {localAudit.ready && (
                        <button
                            type="button"
                            onClick={handleSendToSupport}
                            className="w-full py-3 px-4 rounded-xl bg-[#1e293b] hover:bg-[#26354d] border border-[#00d9ff]/40 text-[#00d9ff] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <i className="fa-solid fa-headset"></i>
                            <span>Levar Medidas para o Suporte IA</span>
                        </button>
                    )}
                </div>
                <AIOutputBox content={result} isLoading={false} title={`RESULTADO LOCAL ${mode}`} />
            </Card>
        </div>
    );
};
