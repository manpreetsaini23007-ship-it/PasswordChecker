// DOM Elements
const input = document.getElementById('pwd-input');
const btnToggle = document.getElementById('btn-toggle');
const btnCopy = document.getElementById('btn-copy');
const btnGenerate = document.getElementById('btn-generate');
const copyToast = document.getElementById('copy-toast');
const strengthLabel = document.getElementById('strength-label');
const segments = [
    document.getElementById('seg-1'),
    document.getElementById('seg-2'),
    document.getElementById('seg-3'),
    document.getElementById('seg-4'),
    document.getElementById('seg-5')
];
const root = document.documentElement;

// Criteria
const criteria = {
    len8: { el: document.getElementById('crit-len8'), regex: /.{8,}/ },
    upper: { el: document.getElementById('crit-upper'), regex: /[A-Z]/ },
    lower: { el: document.getElementById('crit-lower'), regex: /[a-z]/ },
    num: { el: document.getElementById('crit-num'), regex: /[0-9]/ },
    sym: { el: document.getElementById('crit-sym'), regex: /[^A-Za-z0-9]/ },
    len16: { el: document.getElementById('crit-len16'), regex: /.{16,}/ }
};

// Stats
const statLen = document.getElementById('stat-len');
const statEnt = document.getElementById('stat-ent');
const statChar = document.getElementById('stat-char');
const statBoxes = document.querySelectorAll('.stat-box');
const crackTime = document.getElementById('crack-time');

// Colors
const colors = {
    empty: '#1a1a1a',
    weak: '#ff2244',
    fair: '#ff8800',
    good: '#ffee00',
    strong: '#00ff88',
    extreme: '#00ffff'
};

const levels = ['EMPTY', 'WEAK', 'FAIR', 'GOOD', 'STRONG', 'EXTREME'];

// Canvas Setup
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let mouse = { x: -1000, y: -1000 };
let target = { x: -1000, y: -1000 };
let cols, rows;
const cellSize = 50;

const particles = [];
const numParticles = 70;

const glitchChars = "0123456789アイウエオカキクケコサシスセソタチツテト#@$%&*";

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / cellSize);
    rows = Math.ceil(height / cellSize);
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * height; // initial random spread
    }
    reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100;
        this.size = Math.random() * 2 + 1;
        this.speedY = -(Math.random() * 0.8 + 0.2);
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.color = Math.random() > 0.5 ? '0, 255, 255' : '255, 0, 204';
        this.alpha = Math.random() * 0.6 + 0.2;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        
        // drift towards cursor
        if (target.x > 0) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                this.x += dx * 0.002;
                this.y += dy * 0.002;
            }
        }

        if (this.y < -10 || this.x < -10 || this.x > width + 10) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(${this.color}, 0.8)`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
    }
}

for (let i = 0; i < numParticles; i++) particles.push(new Particle());

let time = 0;
const trail = [];

function draw() {
    // Add a very subtle trail effect by using semi-transparent fill instead of clearRect
    ctx.fillStyle = 'rgba(6, 6, 13, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Lerp cursor (faster response)
    target.x += (mouse.x - target.x) * 0.35;
    target.y += (mouse.y - target.y) * 0.35;
    
    // Add a glowing spotlight behind the cursor
    if (target.x > 0) {
        const gradient = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 400);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.06)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 204, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // Draw Grid
    ctx.lineWidth = 1;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = i * cellSize;
            const y = j * cellSize;
            const cx = x + cellSize / 2;
            const cy = y + cellSize / 2;
            
            const dx = cx - target.x;
            const dy = cy - target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let alpha = 0.02;
            let fillAlpha = 0;
            let textAlpha = 0;
            
            if (dist < 300) {
                const factor = 1 - (dist / 300);
                alpha += factor * 0.2;
                fillAlpha = factor * 0.05;
                textAlpha = factor * 0.5;
            }
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.strokeRect(x, y, cellSize, cellSize);
            
            if (fillAlpha > 0) {
                ctx.fillStyle = `rgba(0, 255, 255, ${fillAlpha})`;
                ctx.fillRect(x, y, cellSize, cellSize);
            }
            
            if (textAlpha > 0.1 && Math.random() < 0.03) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
                ctx.fillStyle = `rgba(0, 255, 255, ${textAlpha})`;
                ctx.font = "14px 'Share Tech Mono'";
                ctx.fillText(glitchChars[Math.floor(Math.random() * glitchChars.length)], cx - 5, cy + 5);
                ctx.shadowBlur = 0; // reset
            }
        }
    }

    // Bioluminescent Fluid Trail
    if (target.x > 0) {
        trail.push({ x: target.x, y: target.y });
        if (trail.length > 25) trail.shift();
        
        if (trail.length > 1) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 1; i < trail.length; i++) {
                const pt1 = trail[i - 1];
                const pt2 = trail[i];
                
                const ratio = i / trail.length;
                ctx.beginPath();
                ctx.moveTo(pt1.x, pt1.y);
                ctx.lineTo(pt2.x, pt2.y);
                
                // Color shifts from magenta to cyan based on position in trail
                const r = Math.floor(255 * (1 - ratio));
                const g = Math.floor(255 * ratio);
                const b = Math.floor(204 + 51 * ratio); // 204 to 255
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ratio * 0.8})`;
                ctx.lineWidth = ratio * 8 + 1; // Tapers off at the end
                ctx.shadowBlur = 15;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${ratio})`;
                
                ctx.stroke();
            }
            ctx.shadowBlur = 0; // reset
        }
    }

    // Constellation lines between particles
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 120) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.15 * (1 - dist/120)})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    // Particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(draw);
}
draw();

// UI Logic
function evaluatePassword(pwd) {
    if (!pwd) return { score: 0, length: 0, charset: 0, entropy: 0, level: 0 };
    
    let score = 0;
    let charset = 0;
    
    const len = pwd.length;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (len >= 16) score++;
    if (len >= 20) score++;
    
    let hasUpper = /[A-Z]/.test(pwd);
    let hasLower = /[a-z]/.test(pwd);
    let hasNum = /[0-9]/.test(pwd);
    let hasSym = /[^A-Za-z0-9]/.test(pwd);
    
    if (hasLower) charset += 26;
    if (hasUpper) charset += 26;
    if (hasNum) charset += 10;
    if (hasSym) charset += 32;
    
    if (hasUpper && hasLower) score++;
    if (hasNum) score++;
    if (hasSym) score++;
    
    const entropy = len > 0 && charset > 0 ? len * Math.log2(charset) : 0;
    
    let level = 0;
    if (score >= 1 && score <= 2) level = 1;
    else if (score == 3) level = 2;
    else if (score == 4) level = 3;
    else if (score >= 5 && score <= 6) level = 4;
    else if (score >= 7) level = 5;
    
    return { score, length: len, charset, entropy, level };
}

function formatCrackTime(guesses) {
    if (guesses <= 0) return "INSTANTLY";
    const sec = guesses / 10000000000;
    
    if (sec < 0.001) return "< 1 MS";
    if (sec < 1) return (sec * 1000).toFixed(0) + " MS";
    if (sec < 60) return sec.toFixed(1) + " SEC";
    if (sec < 3600) return (sec / 60).toFixed(1) + " MIN";
    if (sec < 86400) return (sec / 3600).toFixed(1) + " HR";
    if (sec < 31536000) return (sec / 86400).toFixed(1) + " DAYS";
    
    const years = sec / 31536000;
    if (years < 1000) return years.toFixed(1) + " YEARS";
    if (years < 1000000) return (years / 1000).toFixed(1) + " K YEARS";
    if (years < 1000000000) return (years / 1000000).toFixed(1) + " M YEARS";
    
    return "HEAT DEATH OF UNIVERSE";
}

function updateUI() {
    const pwd = input.value;
    const res = evaluatePassword(pwd);
    
    // Update Criteria
    for (let key in criteria) {
        if (pwd && criteria[key].regex.test(pwd)) {
            criteria[key].el.classList.add('met');
        } else {
            criteria[key].el.classList.remove('met');
        }
    }
    
    // Update Stats
    statLen.textContent = res.length;
    statEnt.textContent = Math.round(res.entropy);
    statChar.textContent = res.charset;
    
    statBoxes.forEach(box => {
        if (pwd) box.classList.add('active');
        else box.classList.remove('active');
    });
    
    // Update Crack Time
    let guesses = res.charset > 0 ? Math.pow(res.charset, res.length) : 0;
    crackTime.textContent = pwd ? formatCrackTime(guesses) : "INSTANTLY";
    
    // Update Level Colors
    let colorVar;
    let labelText = pwd ? levels[res.level] : 'AWAITING SEQUENCE';
    
    switch(res.level) {
        case 1: colorVar = colors.weak; break;
        case 2: colorVar = colors.fair; break;
        case 3: colorVar = colors.good; break;
        case 4: colorVar = colors.strong; break;
        case 5: colorVar = colors.extreme; break;
        default: colorVar = colors.empty; break;
    }
    
    root.style.setProperty('--current-color', colorVar);
    strengthLabel.textContent = labelText;
    
    if (res.level === 5) {
        strengthLabel.classList.add('extreme-anim');
    } else {
        strengthLabel.classList.remove('extreme-anim');
    }
    
    // Update Segments
    segments.forEach((seg, i) => {
        if (i < res.level) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });
}

input.addEventListener('input', updateUI);

// Toggle Visibility
btnToggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btnToggle.innerHTML = isPassword ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>';
});

// Copy
btnCopy.addEventListener('click', () => {
    if (!input.value) return;
    navigator.clipboard.writeText(input.value);
    copyToast.classList.add('show');
    setTimeout(() => {
        copyToast.classList.remove('show');
    }, 1600);
});

// Auto Generate
function generatePassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    
    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += nums[Math.floor(Math.random() * nums.length)];
    pwd += syms[Math.floor(Math.random() * syms.length)];
    
    const all = upper + lower + nums + syms;
    for (let i = 0; i < 16; i++) {
        pwd += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    
    input.value = pwd;
    input.type = 'text';
    btnToggle.innerHTML = '<i class="ti ti-eye-off"></i>';
    
    input.style.background = 'rgba(0, 255, 136, 0.2)';
    setTimeout(() => {
        input.style.background = '#000';
    }, 300);
    
    updateUI();
}

btnGenerate.addEventListener('click', generatePassword);
