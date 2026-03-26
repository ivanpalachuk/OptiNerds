'use strict';

// ============================================================
//  ESTADO
// ============================================================
const state = {
    pieces: [],
    nextId: 1,
    colorIdx: 0,
    lastResult: null   // { bins, unfitted, sw, sh, k }
};

// ============================================================
//  PALETA DE COLORES
// ============================================================
const COLORS = [
    '#93C5FD', '#FCA5A5', '#86EFAC', '#FDE68A', '#C4B5FD',
    '#FDBA74', '#6EE7B7', '#F9A8D4', '#BAE6FD', '#D9F99D',
    '#A5F3FC', '#FECDD3', '#BBF7D0', '#FEF08A', '#DDD6FE',
    '#FED7AA', '#CFFAFE', '#FCE7F3', '#DCFCE7', '#FEF9C3',
];

function nextColor() {
    return COLORS[state.colorIdx++ % COLORS.length];
}

// ============================================================
//  DOM HELPERS
// ============================================================
const $ = id => document.getElementById(id);

const getSheetW    = () => Math.max(1, parseFloat($('sheetW').value)     || 2440);
const getSheetH    = () => Math.max(1, parseFloat($('sheetH').value)     || 1220);
const getSheetQty  = () => Math.max(1, parseInt($('sheetQty').value)     || 1);
const getKerf      = () => Math.max(0, parseFloat($('kerf').value)       || 0);

// ============================================================
//  MAXRECTS BIN PACKING
//  Algoritmo de empaquetado 2D — MAXRECTS con BSSF (Best Short Side Fit)
// ============================================================
class MaxRectsBin {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.free = [{ x: 0, y: 0, w, h }];
        this.placed = [];
    }

    /** Intenta colocar una pieza de tamaño pw x ph. Devuelve true si tuvo exito. */
    insert(pw, ph, meta) {
        let best = null;
        let bestScore = Infinity;

        for (const fr of this.free) {
            // Orientacion normal
            if (pw <= fr.w && ph <= fr.h) {
                // Short side fit: minimizar el lado más corto del espacio restante
                const score = Math.min(fr.w - pw, fr.h - ph);
                if (score < bestScore) {
                    bestScore = score;
                    best = { x: fr.x, y: fr.y, w: pw, h: ph, rotated: false };
                }
            }
            // Orientacion rotada (solo si diferente)
            if (pw !== ph && ph <= fr.w && pw <= fr.h) {
                const score = Math.min(fr.w - ph, fr.h - pw);
                if (score < bestScore) {
                    bestScore = score;
                    best = { x: fr.x, y: fr.y, w: ph, h: pw, rotated: true };
                }
            }
        }

        if (!best) return false;

        this._split(best);
        this._prune();
        this.placed.push({
            x: best.x,
            y: best.y,
            w: best.w,
            h: best.h,
            rotated: best.rotated,
            // origW/origH = dimensiones de dibujo POST-rotacion (sin kerf)
            origW: best.rotated ? meta.origH : meta.origW,
            origH: best.rotated ? meta.origW : meta.origH,
            // labelW/labelH = dimensiones originales PRE-rotacion para mostrar en etiqueta
            labelW: meta.origW,
            labelH: meta.origH,
            name: meta.name,
            color: meta.color
        });
        return true;
    }

    _split(placed) {
        const next = [];
        for (const fr of this.free) {
            if (!_overlaps(placed, fr)) {
                next.push(fr);
                continue;
            }
            // Arriba
            if (placed.y > fr.y)
                next.push({ x: fr.x, y: fr.y, w: fr.w, h: placed.y - fr.y });
            // Abajo
            if (placed.y + placed.h < fr.y + fr.h)
                next.push({ x: fr.x, y: placed.y + placed.h, w: fr.w, h: (fr.y + fr.h) - (placed.y + placed.h) });
            // Izquierda
            if (placed.x > fr.x)
                next.push({ x: fr.x, y: fr.y, w: placed.x - fr.x, h: fr.h });
            // Derecha
            if (placed.x + placed.w < fr.x + fr.w)
                next.push({ x: placed.x + placed.w, y: fr.y, w: (fr.x + fr.w) - (placed.x + placed.w), h: fr.h });
        }
        this.free = next;
    }

    _prune() {
        // Eliminar rectángulos libres que estan completamente contenidos en otro
        this.free = this.free.filter((a, i) =>
            !this.free.some((b, j) =>
                i !== j &&
                b.x <= a.x && b.y <= a.y &&
                b.x + b.w >= a.x + a.w &&
                b.y + b.h >= a.y + a.h
            )
        );
    }

    get usedArea() {
        return this.placed.reduce((s, p) => s + p.origW * p.origH, 0);
    }

    get efficiency() {
        return ((this.usedArea / (this.w * this.h)) * 100).toFixed(1);
    }
}

function _overlaps(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x ||
             a.y + a.h <= b.y || b.y + b.h <= a.y);
}

// ============================================================
//  OPTIMIZACION
// ============================================================
function optimize() {
    if (state.pieces.length === 0) {
        showToast('Agrega al menos una pieza antes de optimizar.', 'warn');
        return;
    }

    const sw   = getSheetW();
    const sh   = getSheetH();
    const k    = getKerf();
    const maxSheets = getSheetQty();

    // 1. Expandir piezas por cantidad, agregando kerf
    const allPieces = [];
    for (const p of state.pieces) {
        for (let i = 0; i < p.qty; i++) {
            allPieces.push({
                pw: p.w + k,   // dimension efectiva con kerf
                ph: p.h + k,
                origW: p.w,
                origH: p.h,
                name: p.qty > 1 ? `${p.name} (${i + 1})` : p.name,
                color: p.color
            });
        }
    }

    // 2. Ordenar de mayor a menor area (FFD — First Fit Decreasing)
    allPieces.sort((a, b) => b.pw * b.ph - a.pw * a.ph);

    // 3. Empaquetar
    const bins = [];
    const unfitted = [];

    for (const piece of allPieces) {
        // ¿Entra en la placa siquiera?
        const fitsNormal  = piece.pw <= sw && piece.ph <= sh;
        const fitsRotated = piece.ph <= sw && piece.pw <= sh;

        if (!fitsNormal && !fitsRotated) {
            unfitted.push(piece);
            continue;
        }

        // Intentar en bins existentes
        let placed = false;
        for (const bin of bins) {
            if (bin.insert(piece.pw, piece.ph, piece)) {
                placed = true;
                break;
            }
        }

        if (!placed) {
            if (bins.length >= maxSheets) {
                unfitted.push(piece);
                continue;
            }
            const newBin = new MaxRectsBin(sw, sh);
            bins.push(newBin);
            newBin.insert(piece.pw, piece.ph, piece);
        }
    }

    state.lastResult = { bins, unfitted, sw, sh, k };
    renderResults(bins, unfitted, sw, sh, k);
}

// ============================================================
//  RENDER RESULTADOS
// ============================================================
function renderResults(bins, unfitted, sw, sh, k) {
    const totalPieces  = state.pieces.reduce((s, p) => s + p.qty, 0);
    const placedCount  = bins.reduce((s, b) => s + b.placed.length, 0);
    const totalArea    = bins.length * sw * sh;
    const usedArea     = bins.reduce((s, b) => s + b.usedArea, 0);
    const efficiency   = totalArea > 0 ? (usedArea / totalArea * 100).toFixed(1) : '0';
    const wasteM2      = ((totalArea - usedArea) / 1_000_000).toFixed(4);

    $('statSheets').textContent     = bins.length;
    $('statEfficiency').textContent = efficiency + '%';
    $('statPieces').textContent     = `${placedCount}/${totalPieces}`;
    $('statWaste').textContent      = wasteM2 + ' m²';
    $('resultsBar').hidden          = false;

    const area = $('canvasArea');
    area.innerHTML = '';

    // Advertencia de piezas que no entraron
    if (unfitted.length > 0) {
        const w = document.createElement('div');
        w.className = 'unfit-warning';
        w.innerHTML = `<strong>⚠ ${unfitted.length} pieza${unfitted.length > 1 ? 's' : ''} no entraron en las placas disponibles</strong>
            ${unfitted.map(p => `${p.name} (${p.origW}×${p.origH}mm)`).join(', ')}`;
        area.appendChild(w);
    }

    // Resumen de cantos
    const cantosMm = state.pieces.reduce((sum, p) => {
        return sum + ((p.cantosW ?? 0) * p.w + (p.cantosH ?? 0) * p.h) * p.qty;
    }, 0);
    if (cantosMm > 0) {
        const cantosDiv = document.createElement('div');
        cantosDiv.className = 'cantos-summary';
        cantosDiv.innerHTML = `Canto necesario: <strong>${(cantosMm / 1000).toFixed(2)} m lineales</strong>`;
        area.appendChild(cantosDiv);
    }

    // Dibujar cada placa
    bins.forEach((bin, idx) => {
        const eff = parseFloat(bin.efficiency);
        const badgeClass = eff >= 70 ? '' : eff >= 50 ? 'low' : 'very-low';

        const wrapper = document.createElement('div');
        wrapper.className = 'sheet-wrapper';
        wrapper.innerHTML = `
            <div class="sheet-label">
                Placa ${idx + 1}
                <span class="efficiency-badge ${badgeClass}">${bin.efficiency}% eficiencia</span>
                <span style="color:var(--text-subtle);font-size:12px;font-weight:400">
                    — ${bin.placed.length} piezas
                </span>
            </div>`;

        const canvas = document.createElement('canvas');
        drawBin(canvas, bin, sw, sh, k);
        wrapper.appendChild(canvas);

        // Leyenda compacta
        const uniquePieces = [...new Map(
            bin.placed.map(p => [p.color, { color: p.color, name: p.name.replace(/ \(\d+\)$/, '') }])
        ).values()];

        if (uniquePieces.length > 0) {
            const legend = document.createElement('div');
            legend.className = 'legend';
            legend.innerHTML = uniquePieces.map(p => `
                <div class="legend-item">
                    <span class="legend-color" style="background:${p.color}"></span>
                    ${escHtml(p.name)}
                </div>`).join('');
            wrapper.appendChild(legend);
        }

        area.appendChild(wrapper);
    });

    if (bins.length === 0) {
        area.innerHTML = '<div class="unfit-warning"><strong>Ninguna pieza pudo ser colocada.</strong> Verifica que las dimensiones sean correctas.</div>';
    }
}

// ============================================================
//  DIBUJAR PLACA EN CANVAS
// ============================================================
function drawBin(canvas, bin, sw, sh, k) {
    const MAX_W = Math.min(900, $('canvasArea').clientWidth - 20);
    const MAX_H = 520;
    const scale = Math.min(MAX_W / sw, MAX_H / sh);

    canvas.width  = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);

    const ctx = canvas.getContext('2d');

    // Fondo madera
    ctx.fillStyle = '#F5EDD8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grilla cada 100mm
    ctx.strokeStyle = '#EAE0C8';
    ctx.lineWidth = 0.5;
    const step = 100 * scale;
    for (let x = step; x < canvas.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = step; y < canvas.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Dibujar piezas
    for (const p of bin.placed) {
        const x = p.x * scale;
        const y = p.y * scale;
        const w = p.origW * scale;   // Dibujar sin el kerf (visual real)
        const h = p.origH * scale;

        // Fondo de la pieza
        ctx.fillStyle = p.color + 'D0';
        ctx.fillRect(x, y, w, h);

        // Borde
        ctx.strokeStyle = hexToRgba(p.color, 0.6);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);

        // Zona de kerf (si hay)
        if (k > 0) {
            const ks = k * scale;
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(x + w, y, ks, p.h * scale);       // kerf derecho
            ctx.fillRect(x, y + h, p.w * scale, ks);       // kerf inferior
        }

        // Texto
        if (w > 24 && h > 14) {
            const fontSize = Math.max(8, Math.min(13, h * 0.22, w * 0.12));
            ctx.font = `600 ${fontSize}px -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const cx = x + w / 2;
            const cy = y + h / 2;

            // Sombra de texto
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(truncate(p.name, 16), cx + 0.5, cy - fontSize * 0.6 + 0.5);

            ctx.fillStyle = '#1E3A5F';
            ctx.fillText(truncate(p.name, 16), cx, cy - fontSize * 0.6);

            if (h > 28) {
                const dimFont = Math.max(7, fontSize * 0.8);
                ctx.font = `${dimFont}px -apple-system, sans-serif`;
                ctx.fillStyle = 'rgba(30,58,95,0.55)';
                ctx.fillText(`${p.labelW}×${p.labelH}${p.rotated ? ' ®' : ''}`, cx, cy + fontSize * 0.55);
            }
        }
    }

    // Marco de la placa
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Cotas
    ctx.fillStyle = '#64748B';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${sw} mm`, canvas.width - 4, canvas.height - 2);
    ctx.save();
    ctx.translate(4, canvas.height - 4);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right';
    ctx.fillText(`${sh} mm`, 0, 0);
    ctx.restore();
}

// ============================================================
//  GESTION DE PIEZAS
// ============================================================
function addPiece() {
    const name     = $('pieceName').value.trim() || `Pieza ${state.nextId}`;
    const w        = parseFloat($('pieceW').value);
    const h        = parseFloat($('pieceH').value);
    const qty      = Math.max(1, parseInt($('pieceQty').value) || 1);
    const cantosW  = parseInt($('pieceCantosW').value) || 0;
    const cantosH  = parseInt($('pieceCantosH').value) || 0;

    if (!w || !h || w <= 0 || h <= 0) {
        showToast('Ingresa dimensiones validas (ancho y alto > 0).', 'warn');
        return;
    }

    const sw = getSheetW(), sh = getSheetH();
    const fitsNorm = w <= sw && h <= sh;
    const fitsRot  = h <= sw && w <= sh;
    if (!fitsNorm && !fitsRot) {
        showToast(`La pieza ${w}×${h}mm no entra en la placa ${sw}×${sh}mm.`, 'error');
        return;
    }

    state.pieces.push({ id: state.nextId++, name, w, h, qty, cantosW, cantosH, color: nextColor() });

    $('pieceName').value       = '';
    $('pieceW').value          = '';
    $('pieceH').value          = '';
    $('pieceQty').value        = '1';
    $('pieceCantosW').value    = '0';
    $('pieceCantosH').value    = '0';
    $('pieceW').focus();

    renderPiecesList();
    updateSheetSummary();
}

function removePiece(id) {
    state.pieces = state.pieces.filter(p => p.id !== id);
    renderPiecesList();
    updateSheetSummary();
}

function renderPiecesList() {
    const list = $('piecesList');
    if (state.pieces.length === 0) {
        list.innerHTML = '<p class="empty-list">No hay piezas cargadas</p>';
        return;
    }
    list.innerHTML = state.pieces.map(p => {
        const cantosLabel = (p.cantosW || p.cantosH)
            ? `<span class="piece-cantos">C: ↔${p.cantosW ?? 0} ↕${p.cantosH ?? 0}</span>`
            : '';
        return `
        <div class="piece-item">
            <span class="piece-color" style="background:${p.color}"></span>
            <span class="piece-name">${escHtml(p.name)}</span>
            <span class="piece-dims">${p.w}×${p.h}mm</span>
            ${cantosLabel}
            <span class="piece-qty">×${p.qty}</span>
            <button class="remove-btn" onclick="removePiece(${p.id})" title="Eliminar">✕</button>
        </div>`;
    }).join('');
}

// ============================================================
//  INFO DE PLACA Y KERF
// ============================================================
function updateSheetSummary() {
    const sw = getSheetW(), sh = getSheetH(), thick = parseFloat($('sheetThick').value) || 18;
    const areaM2 = (sw * sh / 1_000_000).toFixed(4);
    const totalPieces = state.pieces.reduce((s, p) => s + p.qty, 0);
    const totalPieceArea = state.pieces.reduce((s, p) => s + p.w * p.h * p.qty, 0);
    const coverPct = sw * sh > 0 ? (totalPieceArea / (sw * sh) * 100).toFixed(0) : 0;

    $('sheetSummary').innerHTML =
        `Placa: <strong>${sw} × ${sh} mm</strong> — ${areaM2} m² — Espesor: ${thick}mm
        ${totalPieces > 0 ? ` &nbsp;|&nbsp; Piezas: ${totalPieces} piezas (${coverPct}% del area de una placa)` : ''}`;
}

function updateKerfInfo() {
    const k = getKerf();
    const info = $('kerfInfo');
    if (k === 0) {
        info.innerHTML = 'Sin kerf — corte sin perdida de material por la hoja.';
        return;
    }
    const sw = getSheetW(), sh = getSheetH();
    // Estimacion de lineas de corte horizontales y verticales (rough)
    const estLinesH = Math.round(sh / 200);
    const estLinesV = Math.round(sw / 200);
    const estLoss = ((estLinesH * sw + estLinesV * sh) * k / 1_000_000).toFixed(4);

    info.innerHTML = `Kerf de <strong>${k}mm</strong> — cada corte consume ${k}mm de material.
        <br>Estimacion en una placa tipica: ~<strong>${estLoss} m²</strong> de perdida por cortes.`;
}

// ============================================================
//  IMPORTAR CSV
// ============================================================
function handleCSV(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        let added = 0, errors = 0;

        for (const line of lines) {
            // Soporta coma o punto y coma como separador
            const parts = line.split(/[,;]/).map(s => s.trim());
            const [rawName, rawW, rawH, rawQty] = parts;
            const pw = parseFloat(rawW), ph = parseFloat(rawH);

            if (isNaN(pw) || isNaN(ph) || pw <= 0 || ph <= 0) { errors++; continue; }

            const qty = Math.max(1, parseInt(rawQty) || 1);
            const name = rawName || `Pieza ${state.nextId}`;

            state.pieces.push({ id: state.nextId++, name, w: pw, h: ph, qty, color: nextColor() });
            added++;
        }

        renderPiecesList();
        updateSheetSummary();
        showToast(`${added} piezas importadas${errors > 0 ? ` (${errors} lineas ignoradas)` : ''}.`, 'ok');
        $('csvFileInput').value = '';
    };
    reader.readAsText(file);
}

// ============================================================
//  DATOS DE EJEMPLO
// ============================================================
function loadDemo() {
    state.pieces = [];
    state.colorIdx = 0;
    const demo = [
        { name: 'Tapa superior',  w: 900,  h: 450, qty: 1 },
        { name: 'Tapa inferior',  w: 900,  h: 450, qty: 1 },
        { name: 'Lateral',        w: 450,  h: 600, qty: 2 },
        { name: 'Fondo',          w: 880,  h: 580, qty: 1 },
        { name: 'Estante',        w: 860,  h: 350, qty: 3 },
        { name: 'Puerta',         w: 430,  h: 580, qty: 2 },
        { name: 'Zocalo',         w: 870,  h: 80,  qty: 1 },
        { name: 'Refuerzo',       w: 200,  h: 100, qty: 4 },
    ];
    demo.forEach(d => state.pieces.push({ ...d, id: state.nextId++, color: nextColor() }));
    renderPiecesList();
    updateSheetSummary();
    showToast('Ejemplo cargado. Hace click en Optimizar.', 'ok');
}

// ============================================================
//  EXPORTAR PNG
// ============================================================
function exportPNG() {
    const canvases = $('canvasArea').querySelectorAll('canvas');
    if (canvases.length === 0) return;

    // Si hay una sola placa, exportar directa
    if (canvases.length === 1) {
        downloadCanvas(canvases[0], 'OptiNerds_placa_1.png');
        return;
    }

    // Multiples placas: combinar verticalmente
    const padding = 20;
    const totalH = Array.from(canvases).reduce((s, c) => s + c.height + padding, 0);
    const maxW   = Math.max(...Array.from(canvases).map(c => c.width));

    const merged = document.createElement('canvas');
    merged.width  = maxW + padding * 2;
    merged.height = totalH + padding;
    const ctx = merged.getContext('2d');
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, merged.width, merged.height);

    let offsetY = padding / 2;
    canvases.forEach((c, i) => {
        ctx.drawImage(c, padding, offsetY);
        offsetY += c.height + padding;
    });

    downloadCanvas(merged, 'OptiNerds_cortes.png');
}

// ============================================================
//  EXPORTAR TEXTO (issue #4)
// ============================================================
function exportText() {
    if (!state.lastResult) return;
    const { bins, unfitted, sw, sh, k } = state.lastResult;

    const totalPieces = bins.reduce((s, b) => s + b.placed.length, 0) + unfitted.length;
    const totalArea   = bins.length * sw * sh;
    const usedArea    = bins.reduce((s, b) => s + b.usedArea, 0);
    const efficiency  = totalArea > 0 ? (usedArea / totalArea * 100).toFixed(1) : '0';
    const wasteM2     = ((totalArea - usedArea) / 1_000_000).toFixed(4);

    const lines = [];
    lines.push('📋 Lista de Cortes — OptiNerds');
    lines.push(`Placa: ${sw} × ${sh}mm  |  Kerf: ${k}mm  |  Eficiencia total: ${efficiency}%`);
    lines.push('');

    bins.forEach((bin, idx) => {
        lines.push(`Placa ${idx + 1}  (eficiencia: ${bin.efficiency}%)`);

        // Agrupar piezas identicas (mismo nombre y dimensiones)
        const groups = new Map();
        for (const p of bin.placed) {
            const key = `${p.labelW}x${p.labelH}|${p.name.replace(/ \(\d+\)$/, '')}`;
            if (!groups.has(key)) groups.set(key, { name: p.name.replace(/ \(\d+\)$/, ''), w: p.labelW, h: p.labelH, qty: 0, rotated: p.rotated });
            groups.get(key).qty++;
        }

        for (const g of groups.values()) {
            const rot    = g.rotated ? ' (rot.)' : '';
            const src    = state.pieces.find(p => p.name === g.name || g.name.startsWith(p.name));
            const cW     = src?.cantosW ?? 0;
            const cH     = src?.cantosH ?? 0;
            const cantos = (cW || cH) ? `  | cantos ↔${cW} ↕${cH}` : '';
            const namePad = g.name.padEnd(20);
            lines.push(`  ✂  ${namePad}  ${g.w} × ${g.h}mm  ×${g.qty}${rot}${cantos}`);
        }
        lines.push('');
    });

    if (unfitted.length > 0) {
        lines.push(`⚠ No entraron: ${unfitted.map(p => `${p.name} (${p.origW}×${p.origH}mm)`).join(', ')}`);
        lines.push('');
    }

    const cantosMm = state.pieces.reduce((s, p) => s + ((p.cantosW ?? 0) * p.w + (p.cantosH ?? 0) * p.h) * p.qty, 0);
    lines.push(`Total: ${totalPieces} piezas en ${bins.length} placa${bins.length !== 1 ? 's' : ''}`);
    lines.push(`Desperdicio: ${wasteM2} m²`);
    if (cantosMm > 0) lines.push(`Canto necesario: ${(cantosMm / 1000).toFixed(2)} m lineales`);

    const text = lines.join('\n');

    // Web Share API (mobile) o clipboard (desktop)
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        navigator.share({ title: 'Lista de Cortes — OptiNerds', text })
            .catch(() => copyToClipboard(text));
    } else {
        copyToClipboard(text);
    }
}

// ============================================================
//  IMPRIMIR (issue #3)
// ============================================================
function printList() {
    if (!state.lastResult) return;
    const { bins, unfitted, sw, sh, k } = state.lastResult;
    const thick    = parseFloat($('sheetThick').value) || 18;
    const totalPieces = bins.reduce((s, b) => s + b.placed.length, 0);
    const totalArea   = bins.length * sw * sh;
    const usedArea    = bins.reduce((s, b) => s + b.usedArea, 0);
    const efficiency  = totalArea > 0 ? (usedArea / totalArea * 100).toFixed(1) : '0';
    const wasteM2     = ((totalArea - usedArea) / 1_000_000).toFixed(4);
    const date        = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Obtener imagenes de los canvas actuales
    const canvases = $('canvasArea').querySelectorAll('canvas');
    const canvasImgs = Array.from(canvases).map(c => c.toDataURL('image/png'));

    let html = `
    <div class="print-header">
        <div class="print-logo">OptiNerds</div>
        <div class="print-meta">
            <span>Fecha: ${date}</span>
            <span>Placa: ${sw} × ${sh}mm  |  Espesor: ${thick}mm  |  Kerf: ${k}mm</span>
            <span>Eficiencia total: ${efficiency}%  |  Desperdicio: ${wasteM2} m²</span>
        </div>
    </div>`;

    bins.forEach((bin, idx) => {
        // Expandir cada pieza en filas individuales para el checklist
        const rows = [];
        for (const p of bin.placed) {
            rows.push({ name: p.name.replace(/ \(\d+\)$/, ''), w: p.labelW, h: p.labelH, rotated: p.rotated });
        }
        // Ordenar por nombre
        rows.sort((a, b) => a.name.localeCompare(b.name));

        html += `
        <div class="print-sheet">
            <div class="print-sheet-title">
                Placa ${idx + 1} &nbsp;—&nbsp; ${sw} × ${sh}mm &nbsp;|&nbsp; Eficiencia: ${bin.efficiency}%
                &nbsp;(${bin.placed.length} piezas)
            </div>
            ${canvasImgs[idx] ? `<img class="print-diagram" src="${canvasImgs[idx]}" alt="Diagrama placa ${idx + 1}">` : ''}
            <table class="print-table">
                <thead>
                    <tr>
                        <th class="col-check">Hecho</th>
                        <th class="col-name">Pieza</th>
                        <th class="col-dims">Dimensiones</th>
                        <th class="col-cantos">Cantos</th>
                        <th class="col-note">Nota</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => {
                        const src    = state.pieces.find(p => r.name === p.name || r.name.startsWith(p.name));
                        const cW     = src?.cantosW ?? 0;
                        const cH     = src?.cantosH ?? 0;
                        const cantos = (cW || cH) ? `↔${cW} ↕${cH}` : '—';
                        return `
                    <tr>
                        <td class="col-check"><span class="checkbox"></span></td>
                        <td class="col-name">${escHtml(r.name)}</td>
                        <td class="col-dims">${r.w} × ${r.h} mm</td>
                        <td class="col-cantos">${cantos}</td>
                        <td class="col-note">${r.rotated ? 'Rotar' : ''}</td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    });

    if (unfitted.length > 0) {
        html += `<div class="print-warning">
            ⚠ No entraron: ${unfitted.map(p => `${escHtml(p.name)} (${p.origW}×${p.origH}mm)`).join(', ')}
        </div>`;
    }

    html += `
    <div class="print-footer">
        Total: ${totalPieces} piezas en ${bins.length} placa${bins.length !== 1 ? 's' : ''}
        &nbsp;—&nbsp; Desperdicio: ${wasteM2} m²
        &nbsp;—&nbsp; Generado con OptiNerds
    </div>`;

    $('printArea').innerHTML = html;
    window.print();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showToast('Lista copiada al portapapeles.', 'ok'))
        .catch(() => {
            // Fallback para navegadores sin clipboard API
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('Lista copiada al portapapeles.', 'ok');
        });
}

function downloadCanvas(canvas, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
}

// ============================================================
//  TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'ok') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    t.style.cssText = `
        position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
        background:${type === 'error' ? '#FEE2E2' : type === 'warn' ? '#FEF9C3' : '#DCFCE7'};
        color:${type === 'error' ? '#991B1B' : type === 'warn' ? '#854D0E' : '#166534'};
        border:1px solid ${type === 'error' ? '#FECACA' : type === 'warn' ? '#FDE68A' : '#BBF7D0'};
        padding:10px 20px; border-radius:8px; font-size:14px; font-weight:500;
        box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:999; white-space:nowrap;
        animation: fadeIn 0.2s ease;
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ============================================================
//  UTILIDADES
// ============================================================
function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
//  INICIALIZACION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    renderPiecesList();
    updateSheetSummary();
    updateKerfInfo();

    $('addPieceBtn').addEventListener('click', addPiece);
    $('optimizeBtn').addEventListener('click', optimize);
    $('demoBtn').addEventListener('click', loadDemo);
    $('clearPiecesBtn').addEventListener('click', () => {
        state.pieces = [];
        state.colorIdx = 0;
        renderPiecesList();
        updateSheetSummary();
    });
    $('importCSVBtn').addEventListener('click', () => $('csvFileInput').click());
    $('csvFileInput').addEventListener('change', e => {
        if (e.target.files[0]) handleCSV(e.target.files[0]);
    });
    $('kerf').addEventListener('input', updateKerfInfo);
    $('sheetW').addEventListener('input', updateSheetSummary);
    $('sheetH').addEventListener('input', updateSheetSummary);
    $('sheetThick').addEventListener('input', updateSheetSummary);

    $('exportBtn').addEventListener('click', exportPNG);
    $('copyTextBtn').addEventListener('click', exportText);
    $('printBtn').addEventListener('click', printList);

    // Mostrar botones de exportar cuando hay resultados
    const observer = new MutationObserver(() => {
        const hasCanvas = !!$('canvasArea').querySelector('canvas');
        $('exportBtn').hidden = !hasCanvas;
        $('copyTextBtn').hidden = !hasCanvas;
        $('printBtn').hidden = !hasCanvas;
    });
    observer.observe($('canvasArea'), { childList: true, subtree: true });

    // Enter en formulario de piezas
    ['pieceName', 'pieceW', 'pieceH', 'pieceQty'].forEach(id => {
        $(id).addEventListener('keydown', e => { if (e.key === 'Enter') addPiece(); });
    });

    // Animacion CSS para toast
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }';
    document.head.appendChild(style);
});
