export interface SchematicPdfItem {
    id: string;
    title: string;
    category: 'Tanques Grandes (CLP)' | 'Painéis CIP' | 'Unidades Remotas / Separadas' | 'Limpeza / Especiais';
    voltage: string;
    filename: string;
    keywords: string[];
}

const GITHUB_RAW_BASE =
    'https://raw.githubusercontent.com/marlonkuhn123-ops/friotech-ai.vercel.app/main/Subir_PDFs/';

export const getSchematicDownloadUrl = (filename: string) =>
    `${GITHUB_RAW_BASE}${encodeURIComponent(filename)}`;

export const getSchematicViewerUrl = (filename: string) =>
    `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(getSchematicDownloadUrl(filename))}`;

export const SCHEMATICS_CATALOG: SchematicPdfItem[] = [
    {
        id: 'tanque-20000-380v',
        title: 'Tanque 20.000L Limpeza Automática (3~ 380V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '380V 3F',
        filename: 'PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 380V.pdf.pdf',
        keywords: ['20000', '20 mil', '380', 'mcd 202', 'soft', '4 compressores', 'clp']
    },
    {
        id: 'tanque-20000-220v',
        title: 'Tanque 20.000L Limpeza Automática (3~ 220V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '220V 3F',
        filename: 'PE - TANQUE 20000L LIMPEZA AUTOMATICA - TRIFÁSICO 220V.pdf  1.pdf',
        keywords: ['20000', '20 mil', '220', 'mcd 202', 'soft', '4 compressores', 'clp']
    },
    {
        id: 'tanque-5comp-pe-380v',
        title: 'Tanque 5 Compressores Limpeza Automática — Esquema Elétrico (3~ 380V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '380V 3F',
        filename: 'PE - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.pdf',
        keywords: ['5 comp', '5 compressores', '25000', '30000', '380', 'mcd 202', 'clp']
    },
    {
        id: 'tanque-5comp-pm-380v',
        title: 'Tanque 5 Compressores Limpeza Automática — Painel / Montagem (3~ 380V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '380V 3F',
        filename: 'PM - TANQUE 5 COMP LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.0.pdf',
        keywords: ['5 comp', '5 compressores', 'montagem', 'painel', '380', 'clp']
    },
    {
        id: 'tanque-6000-380v',
        title: 'Tanque 6.000L Limpeza Automática (3~ 380V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '380V 3F',
        filename: 'PE - TANQUE 6000L LIMPEZA AUTOMATICA - TRIFÁSICO 380V - V1.0.1.pdf',
        keywords: ['6000', '6 mil', '380', 'trifasico', 'clp', 'limpeza automatica']
    },
    {
        id: 'tanque-6000-220v-3f',
        title: 'Tanque 6.000L Limpeza Automática (3~ 220V)',
        category: 'Tanques Grandes (CLP)',
        voltage: '220V 3F',
        filename: 'PE - TANQUE 6000L LIMPEZA AUTOMATICA - TRIFÁSICO 220V - V1.0.1.pdf',
        keywords: ['6000', '6 mil', '220', 'trifasico', 'clp', 'limpeza automatica']
    },
    {
        id: 'tanque-6000-220v-1f',
        title: 'Tanque 6.000L Limpeza Automática (1~ 220V Mono)',
        category: 'Tanques Grandes (CLP)',
        voltage: '220V Mono',
        filename: 'PE - TANQUE 6000L LIMPEZA AUTOMATICA - MONOFÁSICO 220V - V1.0.1.pdf',
        keywords: ['6000', '6 mil', '220', 'monofasico', 'mono', 'clp']
    },
    {
        id: 'painel-cip-4comp',
        title: 'Painel CIP 4 Compressores (Sem Régua)',
        category: 'Painéis CIP',
        voltage: 'CLP Panasonic',
        filename: 'PAINEL CIP 4 COMPRESSORES SEM REGUA (1).pdf',
        keywords: ['cip', '4 compressores', '10000', '12000', '15000', '20000', 'agitador', 'ye', 'rl6', 'rl18', 'clp']
    },
    {
        id: 'painel-cip-3comp',
        title: 'Painel CIP 3 Compressores (6.000L a 15.000L — Sem Régua)',
        category: 'Painéis CIP',
        voltage: 'CLP Panasonic',
        filename: 'PAINEL CIP 3 COMPRESSORES SEM REGUA (1).pdf',
        keywords: ['cip', '3 compressores', '6000', '8000', '10000', '10 mil', '12000', '15000', 'agitador', 'ye', 'rl6', 'rl18', 'clp']
    },
    {
        id: 'painel-cip-2comp',
        title: 'Painel CIP 2 Compressores (Sem Régua)',
        category: 'Painéis CIP',
        voltage: 'CLP Panasonic',
        filename: 'PAINEL CIP 2 COMPRESSORES SEM REGUA (1).pdf',
        keywords: ['cip', '2 compressores', '4000', '5000', '6000', 'agitador', 'ye', 'rl6', 'rl18', 'clp']
    },
    {
        id: 'quadro-limpeza-regua-qcla3stre',
        title: 'Quadro Limpeza com Régua Eletrônica (QCLA3STRE)',
        category: 'Painéis CIP',
        voltage: 'CLP Panasonic',
        filename: 'QUADRO LIMPEZA COM RÉGUA ELETRONICA - QCLA3STRE (1).pdf',
        keywords: ['regua', 'qcla3stre', 'limpeza', 'cip', 'eletronica']
    },
    {
        id: 'tanque-2unid-auto-380v',
        title: 'Tanque 2 Unidades Limpeza Automática (3~ 380V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '380V 3F',
        filename: 'TANQUE 2 UNIDADES LIMPEZA AUTOMATICA 3_380V .pdf',
        keywords: ['2 unidades', 'limpeza automatica', '380', 'remota', 'separada']
    },
    {
        id: 'tanque-2unid-remota-semi-380v-novo',
        title: 'Tanque 2 Unidades Remotas Limpeza Semi-Auto (3~ 380V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '380V 3F',
        filename: 'TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI 3_380V (1).pdf',
        keywords: ['2 unidade', 'remota', 'separada', 'semi', '380']
    },
    {
        id: 'pe-2unid-separada-semi-380v',
        title: 'PE Tanque 2 Unidades Separadas Limpeza Semi-Auto (3~ 380V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '380V 3F',
        filename: 'PE - TANQUE 2 UNIDADES SEPARADA LIMPEZA SEMI-AUTO - 3~380V - V1.0.0.pdf',
        keywords: ['2 unidades', 'separada', 'remota', 'semi', '380']
    },
    {
        id: 'pe-2unid-remota-semi-220v',
        title: 'PE Tanque 2 Unidades Remotas Limpeza Semi-Auto (3~ 220V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '220V 3F',
        filename: 'PE - TANQUE 2 UNIDADE REMOTA LIMPEZA SEMI-AUTO - 3~220V.pdf',
        keywords: ['2 unidade', 'remota', 'separada', 'semi', '220']
    },
    {
        id: 'pe-2unid-separada-semi-v1',
        title: 'PE Tanque 2 Unidades Separadas Limpeza Semi-Auto (V1.0.0)',
        category: 'Unidades Remotas / Separadas',
        voltage: '220V / 380V',
        filename: 'PE - TANQUE 2 UNIDADES SEPARADA LIMPEZA SEMI-AUTO - V1.0.0.pdf',
        keywords: ['2 unidades', 'separada', 'remota', 'semi']
    },
    {
        id: 'pe-2unid-remota-sem-limpeza-380v',
        title: 'PE Tanque 2 Unidades Remotas Sem Limpeza (3~ 380V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '380V 3F',
        filename: 'PE - TANQUE 2 UNIDADE REMOTA SEM LIMPEZA - 3~380V - V1.0.0.pdf',
        keywords: ['2 unidade', 'remota', 'sem limpeza', '380']
    },
    {
        id: 'pe-2unid-separada-sem-limpeza-220v',
        title: 'PE Tanque 2 Unidades Separadas Sem Limpeza (3~ 220V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '220V 3F',
        filename: 'PE - TANQUE 2 UNIDADE SEPARADA SEM LIMPEZA - 3~220V - V1.0.0.pdf',
        keywords: ['2 unidade', 'separada', 'sem limpeza', '220']
    },
    {
        id: 'pe-2unid-remota-sem-limpeza-1f-220v',
        title: 'PE Tanque 2 Unidades Remotas Sem Limpeza (1~ 220V Mono)',
        category: 'Unidades Remotas / Separadas',
        voltage: '220V Mono',
        filename: 'PE - TANQUE 2 UNIDADE REMOTA SEM LIMPEZA - 1~220V - V1.0.0.pdf',
        keywords: ['2 unidade', 'remota', 'sem limpeza', '220', 'mono', 'monofasico']
    },
    {
        id: 'quadro-1unid-separada-220v',
        title: 'Quadro Comando 1 Unidade Separada Automático (1~ 220V)',
        category: 'Unidades Remotas / Separadas',
        voltage: '220V Mono',
        filename: 'QUADRO COMANDO 1 UNIDADE SEPARADA 3~220V AUTOMÁTICO (1).pdf',
        keywords: ['1 unidade', 'separada', 'quadro comando', '220', 'automatico', 'mono']
    },
    {
        id: 'limpeza-robo-boumatic',
        title: 'Esquema Elétrico e Montagem — Limpeza Robô BouMatic',
        category: 'Limpeza / Especiais',
        voltage: 'Especial',
        filename: 'ESQUEMA ELETRICO E DE MONTAGEM LIMPEZA ROBO BOUMATIC (1).pdf',
        keywords: ['robo', 'boumatic', 'ordenha robotizada', 'limpeza']
    },
    {
        id: 'esquem-2-geral',
        title: 'Esquema Elétrico Clássico (ESQUEM_2)',
        category: 'Limpeza / Especiais',
        voltage: 'Padrão',
        filename: 'ESQUEM_2 (1).PDF',
        keywords: ['esquem_2', 'classico', 'antigo', 'full gauge', 'ageon']
    }
];

const normalizeSearch = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

export const matchSchematicsForSupportMessage = (
    text: string,
    contextModel?: string,
    contextVoltage?: string
): SchematicPdfItem[] => {
    const combined = normalizeSearch(`${text} ${contextModel || ''} ${contextVoltage || ''}`);
    // Só sugere PDF quando a mensagem realmente trata de parte elétrica / esquema / painel / CLP
    const isElectricalTopic = /\b(clp|panasonic|esquema|contatora|rele|rl6|rl18|rl16|rl1|saida ye|saida yc|borne|disjuntor|soft-starter|mcd 202|painel|quadro|a1\/a2|agitador|cip|boumatic|unidade remota|unidade separada)\b/.test(combined);
    if (!isElectricalTopic) return [];

    const scored = SCHEMATICS_CATALOG.map(item => {
        let score = 0;
        item.keywords.forEach(kw => {
            if (combined.includes(normalizeSearch(kw))) {
                score += kw.length >= 4 ? 3 : 2;
            }
        });
        if (contextVoltage) {
            const normV = normalizeSearch(contextVoltage);
            const itemV = normalizeSearch(item.voltage);
            if ((normV.includes('380') && itemV.includes('380')) || (normV.includes('220') && itemV.includes('220'))) {
                score += 2;
            }
            if (normV.includes('mono') && itemV.includes('mono')) {
                score += 3;
            }
        }
        return { item, score };
    })
        .filter(entry => entry.score >= 3)
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, 2).map(entry => entry.item);
};
