import { state } from './app.js';
import { $ } from './utils.js';

// ========================================
// Charts Module - Canvas-based, no library
// ========================================

export function drawBarChart(canvas, data, options = {}) {
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 16, bottom: 40, left: 40 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = (chartWidth / data.length) * 0.6;
    const barGap = (chartWidth / data.length) * 0.4;

    const computedStyles = getComputedStyle(document.documentElement);
    const textColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#7A6B5D';
    const barColor = options.color || computedStyles.getPropertyValue('--color-terracotta').trim() || '#C75B39';
    const gridColor = computedStyles.getPropertyValue('--color-cream-dark').trim() || '#EDE6D8';

    ctx.clearRect(0, 0, width, height);

    const gridLines = 4;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const val = Math.round(maxVal - (maxVal / gridLines) * i);
        ctx.fillStyle = textColor;
        ctx.font = '11px "Source Sans 3", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    data.forEach((d, i) => {
        const x = padding.left + (chartWidth / data.length) * i + barGap / 2;
        const barHeight = (d.value / maxVal) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        ctx.fillStyle = barColor;
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, padding.top + chartHeight);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = '11px "Source Sans 3", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, height - padding.bottom + 20);
    });
}

export function drawLineChart(canvas, data, options = {}) {
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 16, bottom: 40, left: 48 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => d.value);
    const minVal = Math.min(...values) - 1;
    const maxVal = Math.max(...values) + 1;
    const range = maxVal - minVal || 1;

    const computedStyles = getComputedStyle(document.documentElement);
    const textColor = computedStyles.getPropertyValue('--color-text-muted').trim() || '#7A6B5D';
    const lineColor = options.color || computedStyles.getPropertyValue('--color-olive').trim() || '#6B7B3A';
    const gridColor = computedStyles.getPropertyValue('--color-cream-dark').trim() || '#EDE6D8';
    const dotColor = lineColor;

    ctx.clearRect(0, 0, width, height);

    const gridLines = 4;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const val = (maxVal - (range / gridLines) * i).toFixed(1);
        ctx.fillStyle = textColor;
        ctx.font = '11px "Source Sans 3", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${val} kg`, padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    const points = data.map((d, i) => ({
        x: padding.left + (chartWidth / Math.max(data.length - 1, 1)) * i,
        y: padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight
    }));

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, lineColor + '20');
    gradient.addColorStop(1, lineColor + '00');
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.lineTo(points[0].x, padding.top + chartHeight);
    ctx.fillStyle = gradient;
    ctx.fill();

    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (data.length <= 10 || i % Math.ceil(data.length / 10) === 0) {
            ctx.fillStyle = textColor;
            ctx.font = '10px "Source Sans 3", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(data[i].label, p.x, height - padding.bottom + 18);
        }
    });
}
