// Configuration
const DEFAULT_GRID_SIZE = 32;
const PIXEL_SIZE = 16;
const DEFAULT_COLORS = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#90EE90', '#FFB6C1'
];

// State
let gridSize = DEFAULT_GRID_SIZE;
let currentColor = '#000000';
let currentTool = 'draw';
let isDrawing = false;
let pixels = {};

// Elements
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const gridSizeInput = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const gridSizeValue2 = document.getElementById('gridSizeValue2');
const colorPalette = document.getElementById('colorPalette');
const customColorInput = document.getElementById('customColor');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const toolButtons = document.querySelectorAll('.tool-btn');

// Initialize
function init() {
    setupCanvas();
    setupColorPalette();
    setupEventListeners();
    render();
}

function setupCanvas() {
    canvas.width = gridSize * PIXEL_SIZE;
    canvas.height = gridSize * PIXEL_SIZE;
}

function setupColorPalette() {
    DEFAULT_COLORS.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'color-btn';
        colorBtn.style.backgroundColor = color;
        if (color === currentColor) colorBtn.classList.add('active');
        colorBtn.addEventListener('click', () => selectColor(color, colorBtn));
        colorPalette.appendChild(colorBtn);
    });
}

function setupEventListeners() {
    // Canvas events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    // Tool buttons
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    // Grid size
    gridSizeInput.addEventListener('input', (e) => {
        gridSize = parseInt(e.target.value);
        gridSizeValue.textContent = gridSize;
        gridSizeValue2.textContent = gridSize;
        pixels = {};
        setupCanvas();
        render();
    });

    // Custom color
    customColorInput.addEventListener('input', (e) => {
        selectColor(e.target.value);
    });

    // Action buttons
    downloadBtn.addEventListener('click', downloadImage);
    clearBtn.addEventListener('click', clearCanvas);
}

function handleMouseDown(e) {
    isDrawing = true;
    const { x, y } = getGridPosition(e);
    applyTool(x, y);
}

function handleMouseMove(e) {
    if (!isDrawing) return;
    const { x, y } = getGridPosition(e);
    if (currentTool !== 'fill') {
        applyTool(x, y);
    }
}

function handleMouseUp() {
    isDrawing = false;
}

function getGridPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    return { x, y };
}

function applyTool(x, y) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    const key = `${x},${y}`;

    switch (currentTool) {
        case 'draw':
            pixels[key] = currentColor;
            break;
        case 'erase':
            delete pixels[key];
            break;
        case 'fill':
            floodFill(x, y, pixels[key] || '#FFFFFF', currentColor);
            break;
    }

    render();
}

function floodFill(startX, startY, targetColor, fillColor) {
    if (targetColor === fillColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
        if (visited.has(key)) continue;

        const currentPixelColor = pixels[key] || '#FFFFFF';
        if (currentPixelColor !== targetColor) continue;

        visited.add(key);
        pixels[key] = fillColor;

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
}

function selectColor(color, btn = null) {
    currentColor = color;
    customColorInput.value = color;
    currentTool = 'draw';
    
    // Update active tool button
    toolButtons.forEach(b => b.classList.remove('active'));
    toolButtons[0].classList.add('active');

    // Update active color
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SIZE, 0);
        ctx.lineTo(i * PIXEL_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SIZE);
        ctx.lineTo(canvas.width, i * PIXEL_SIZE);
        ctx.stroke();
    }

    // Draw pixels
    Object.entries(pixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    });
}

function downloadImage() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    const exportPixelSize = 10;

    exportCanvas.width = gridSize * exportPixelSize;
    exportCanvas.height = gridSize * exportPixelSize;

    exportCtx.fillStyle = '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    Object.entries(pixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        exportCtx.fillStyle = color;
        exportCtx.fillRect(
            x * exportPixelSize,
            y * exportPixelSize,
            exportPixelSize,
            exportPixelSize
        );
    });

    exportCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pixel-art-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas?')) {
        pixels = {};
        render();
    }
}

// Start the app
init();