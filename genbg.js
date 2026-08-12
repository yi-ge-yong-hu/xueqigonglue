'use strict';
// 生成背景美术: 4 张矢量场景 SVG
var fs = require('fs');
var path = require('path');
var web = 'D:\\opencode\\web\\assets\\bg';

// ---------- 工具 ----------
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function rand(seed) {
    var s = seed;
    return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

function stars(rng, n, x0, x1, y0, y1, color, opacityMin) {
    var out = '';
    for (var i = 0; i < n; i++) {
        var x = x0 + rng() * (x1 - x0), y = y0 + rng() * (y1 - y0);
        var r = 0.6 + rng() * 1.8;
        var op = (opacityMin || 0.25) + rng() * 0.6;
        out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + color + '" fill-opacity="' + op.toFixed(2) + '"/>';
    }
    return out;
}

// ---------- 1. 标题背景: 夜空下的大学校园 ----------
function bgTitle() {
    var rng = rand(20240812);
    var W = 1920, H = 1080;
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>';
    s += '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#050a18"/>' +
        '<stop offset="0.45" stop-color="#0a1a3a"/>' +
        '<stop offset="0.75" stop-color="#14264e"/>' +
        '<stop offset="1" stop-color="#1c3560"/>' +
        '</linearGradient>';
    s += '<radialGradient id="moonGlow" cx="0.72" cy="0.22" r="0.5">' +
        '<stop offset="0" stop-color="#ffe9b8" stop-opacity="0.35"/>' +
        '<stop offset="0.5" stop-color="#ffd98a" stop-opacity="0.10"/>' +
        '<stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>' +
        '</radialGradient>';
    s += '<linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#1b2c52"/>' +
        '<stop offset="1" stop-color="#0c1830"/>' +
        '</linearGradient>';
    s += '<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0a1428"/>' +
        '<stop offset="1" stop-color="#060d1c"/>' +
        '</linearGradient>';
    s += '</defs>';
    // 天空
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#sky)"/>';
    // 极光带
    s += '<path d="M0 300 Q 480 220 960 300 T 1920 260 L1920 560 Q 1200 480 0 560 Z" fill="#2f6fce" fill-opacity="0.05"/>';
    s += '<path d="M0 380 Q 420 310 850 380 T 1920 350 L1920 590 Q 1000 520 0 560 Z" fill="#57c9ff" fill-opacity="0.04"/>';
    // 月亮+光晕
    s += '<circle cx="1430" cy="230" r="620" fill="url(#moonGlow)"/>';
    s += '<circle cx="1430" cy="230" r="86" fill="#ffe9b8" fill-opacity="0.92"/>';
    s += '<circle cx="1406" cy="210" r="70" fill="#fdf3d8" fill-opacity="0.5"/>';
    // 星星(远处密 近处稀)
    s += stars(rng, 130, 0, W, 0, 520, '#ffffff', 0.2);
    s += stars(rng, 55, 0, W, 0, 520, '#9fd0ff', 0.25);
    s += stars(rng, 18, 0, W, 0, 520, '#ffd98a', 0.4);
    // 星芒
    for (var k = 0; k < 5; k++) {
        var sx = 100 + rng() * (W - 200), sy = 40 + rng() * 300;
        s += '<path d="M' + sx + ' ' + (sy - 14) + ' L' + sx + ' ' + (sy + 14) + ' M' + (sx - 14) + ' ' + sy + ' L' + (sx + 14) + ' ' + sy + '" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.4"/>';
    }
    // 远方建筑群
    var bxs = [0, 130, 250, 430, 560, 720, 900, 1060, 1200, 1380, 1520, 1700];
    bxs.forEach(function (b, i) {
        var w = 130 + rng() * 90, h = 150 + rng() * 140;
        var x = b, y = 640 - h + (i % 2) * 20;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (640 - y) + '" fill="#16294e"/>';
        // 窗户
        for (var r = 0; r < Math.floor(h / 55); r++) {
            for (var c = 0; c < Math.floor(w / 55); c++) {
                if (rng() < 0.4) {
                    s += '<rect x="' + (x + 15 + c * 45) + '" y="' + (y + 18 + r * 52) + '" width="18" height="22" rx="2" fill="#ffd76e" fill-opacity="' + (0.25 + rng() * 0.45).toFixed(2) + '"/>';
                }
            }
        }
    });
    // 灯塔(主楼)
    s += '<rect x="820" y="380" width="280" height="260" fill="#1f3562"/>';
    s += '<rect x="900" y="330" width="120" height="50" fill="#243c6e"/>';
    s += '<path d="M900 330 L960 270 L1020 330 Z" fill="#2c4a85"/>';
    s += '<rect x="840" y="600" width="240" height="40" fill="#2a4480"/>';
    // 主楼窗户
    for (var r2 = 0; r2 < 3; r2++) {
        for (var c2 = 0; c2 < 3; c2++) {
            s += '<rect x="' + (850 + c2 * 78) + '" y="' + (410 + r2 * 62) + '" width="34" height="38" rx="3" fill="#ffd76e" fill-opacity="0.35"/>';
        }
    }
    s += '<rect x="948" y="330" width="24" height="26" rx="3" fill="#ffd76e" fill-opacity="0.85"/>';
    // 主楼钟塔
    s += '<circle cx="960" cy="395" r="17" fill="#0c1830" stroke="#ffd76e" stroke-width="2"/>';
    s += '<path d="M960 395 L960 384 M960 395 L968 398" stroke="#ffd76e" stroke-width="1.6"/>';
    // 树木剪影
    var trees = [[60, 620, 70], [420, 640, 85], [1750, 610, 80], [1840, 630, 60]];
    trees.forEach(function (t) {
        s += '<ellipse cx="' + t[0] + '" cy="' + (t[1] - t[2] * 0.6) + '" rx="' + t[2] * 0.62 + '" ry="' + t[2] + '" fill="#0c1a33"/>';
        s += '<rect x="' + (t[0] - 7) + '" y="' + (t[1] - 8) + '" width="14" height="40" fill="#081226"/>';
    });
    // 地面
    s += '<rect y="628" width="' + W + '" height="' + (H - 628) + '" fill="url(#ground)"/>';
    // 地面光斑
    s += '<ellipse cx="960" cy="800" rx="500" ry="90" fill="#2f5fc0" fill-opacity="0.06"/>';
    // 前景栏杆
    s += '<path d="M0 960 L1920 960" stroke="#223252" stroke-opacity="0" stroke-width="0"/>';
    s += '<rect y="958" width="' + W + '" height="6" fill="#1a2c50" fill-opacity="0.8"/>';
    s += '<rect y="930" width="' + W + '" height="4" fill="#172741" fill-opacity="0.7"/>';
    for (var p = 0; p < 26; p++) {
        s += '<rect x="' + (p * 76 + 20) + '" y="890" width="7" height="70" fill="#1a2c50" fill-opacity="0.9"/>';
    }
    s += '</svg>';
    return s;
}

// ---------- 2. 战斗背景: 教室课桌 ----------
function bgBattle() {
    var rng = rand(777001);
    var W = 1920, H = 1080;
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>';
    s += '<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#12202e"/>' +
        '<stop offset="0.6" stop-color="#0d1824"/>' +
        '<stop offset="1" stop-color="#0a121c"/>' +
        '</linearGradient>';
    s += '<linearGradient id="board" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#1c4a42"/>' +
        '<stop offset="1" stop-color="#0f2e28"/>' +
        '</linearGradient>';
    s += '<radialGradient id="lamp" cx="0.5" cy="0.6" r="0.55">' +
        '<stop offset="0" stop-color="#ffd98a" stop-opacity="0.22"/>' +
        '<stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>' +
        '</radialGradient>';
    s += '<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#5a4a33"/>' +
        '<stop offset="1" stop-color="#2e2418"/>' +
        '</linearGradient>';
    s += '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#wall)"/>';
    // 教室暗调+灯晕
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#lamp)"/>';
    // 黑板
    s += '<rect x="260" y="90" width="1400" height="360" rx="10" fill="#101d2c"/>';
    s += '<rect x="280" y="110" width="1360" height="320" rx="6" fill="url(#board)"/>';
    s += '<rect x="280" y="110" width="1360" height="320" rx="6" fill="none" stroke="#0a1e18" stroke-width="14"/>';
    // 粉笔痕迹
    s += '<path d="M420 250 L760 250 M420 290 L900 290 M760 250 L760 290 M430 340 Q 600 370 780 340" stroke="#cfd8d4" stroke-opacity="0.16" stroke-width="3" fill="none" stroke-linecap="round"/>';
    s += '<path d="M1000 180 L1280 180 L1280 420 L1000 420 Z M1000 180 L1000 420" stroke="#ffd76e" stroke-opacity="0.2" stroke-width="3" fill="none"/>';
    s += '<path d="M1360 200 L1520 200 M1360 250 L1510 250 M1360 300 L1480 300" stroke="#9fe8c8" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>';
    // 黑板粉笔灰
    s += '<rect x="270" y="180" width="26" height="18" rx="3" fill="#d8deda" fill-opacity="0.5"/>';
    // 窗
    s += '<rect x="60" y="120" width="150" height="220" rx="8" fill="#0a1826" stroke="#22324a" stroke-width="10"/>';
    s += '<rect x="76" y="136" width="118" height="188" fill="#1b3552"/>';
    s += '<path d="M135 136 L135 324 M76 230 L194 230" stroke="#22324a" stroke-width="6"/>';
    s += '<circle cx="170" cy="160" r="22" fill="#ffd98a" fill-opacity="0.5"/>';
    s += '<rect x="1710" y="120" width="150" height="220" rx="8" fill="#0a1826" stroke="#22324a" stroke-width="10"/>';
    s += '<rect x="1726" y="136" width="118" height="188" fill="#1b3552"/>';
    s += '<path d="M1785 136 L1785 324 M1726 230 L1844 230" stroke="#22324a" stroke-width="6"/>';
    // 课桌(前景左右)
    s += '<path d="M-80 850 L-80 700 L420 700 L520 850 Z" fill="url(#desk)"/>';
    s += '<rect x="-80" y="690" width="640" height="26" rx="6" fill="#6b5638"/>';
    s += '<rect x="-80" y="690" width="640" height="8" rx="4" fill="#7d6543" fill-opacity="0.8"/>';
    // 桌上课本
    var bk = [[60, 640, 90, 34, '#c94f3d'], [170, 630, 96, 40, '#3d6bb0'], [280, 650, 84, 30, '#4e9a6a']];
    bk.forEach(function (b) {
        s += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="4" fill="' + b[4] + '" fill-opacity="0.85"/>';
        s += '<rect x="' + (b[0] + 6) + '" y="' + (b[1] + 5) + '" width="' + (b[2] - 12) + '" height="2" fill="#ffffff" fill-opacity="0.35"/>';
    });
    // 铅笔
    s += '<rect x="520" y="760" width="180" height="14" rx="7" transform="rotate(-18 520 760)" fill="#e0a33a"/>';
    s += '<path d="M700 733 L712 712 L690 718 Z" fill="#e8c184"/>';
    // 右侧桌子
    s += '<path d="M1920 940 L1920 760 L1460 760 L1360 940 Z" fill="url(#desk)" fill-opacity="0.9"/>';
    s += '<rect x="1360" y="750" width="620" height="26" rx="6" fill="#6b5638"/>';
    // 角落时钟
    s += '<circle cx="1800" cy="420" r="44" fill="#101d2c" stroke="#ffd76e" stroke-width="3"/>';
    s += '<circle cx="1800" cy="420" r="36" fill="#1a2c46"/>';
    s += '<path d="M1800 420 L1800 396 M1800 420 L1816 434" stroke="#ffd76e" stroke-width="3.4" stroke-linecap="round"/>';
    // 地面
    s += '<rect y="760" width="' + W + '" height="' + (H - 760) + '" fill="#0a1018"/>';
    s += '<path d="M0 800 L1920 800 M0 880 L1920 880 M0 960 L1920 960 M0 1040 L1920 1040" stroke="#1a2534" stroke-width="2"/>';
    s += '<ellipse cx="960" cy="860" rx="420" ry="60" fill="#ffffff" fill-opacity="0.03"/>';
    s += '</svg>';
    return s;
}

// ---------- 3. Boss背景: 考场危机 ----------
function bgBoss() {
    var rng = rand(555000);
    var W = 1920, H = 1080;
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>';
    s += '<linearGradient id="red" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#2a0d10"/>' +
        '<stop offset="0.5" stop-color="#3a1216"/>' +
        '<stop offset="1" stop-color="#1c0a0e"/>' +
        '</linearGradient>';
    s += '<radialGradient id="core" cx="0.5" cy="0.45" r="0.6">' +
        '<stop offset="0" stop-color="#ff5a3c" stop-opacity="0.30"/>' +
        '<stop offset="0.6" stop-color="#e0321f" stop-opacity="0.10"/>' +
        '<stop offset="1" stop-color="#e0321f" stop-opacity="0"/>' +
        '</radialGradient>';
    s += '<linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#3d1620"/>' +
        '<stop offset="1" stop-color="#200a12"/>' +
        '</linearGradient>';
    s += '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#red)"/>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#core)"/>';
    // 警示斜纹(低对比)
    s += '<path d="M0 0 L360 0 L-60 1080 L-420 1080 Z" fill="#ff5a3c" fill-opacity="0.05"/>';
    s += '<path d="M560 0 L920 0 L500 1080 L140 1080 Z" fill="#ff5a3c" fill-opacity="0.04"/>';
    s += '<path d="M1120 0 L1480 0 L1060 1080 L700 1080 Z" fill="#ff5a3c" fill-opacity="0.05"/>';
    s += '<path d="M1680 0 L2040 0 L1620 1080 L1260 1080 Z" fill="#ff5a3c" fill-opacity="0.04"/>';
    // 飘浮试卷(被吹散)
    for (var i = 0; i < 9; i++) {
        var px = 120 + rng() * (W - 260), py = 90 + rng() * 700;
        var rot = -25 + rng() * 50;
        s += '<g transform="translate(' + px + ',' + py + ') rotate(' + rot.toFixed(0) + ')">' +
            '<rect x="-52" y="-68" width="104" height="136" rx="4" fill="#e8e2d0" fill-opacity="' + (0.05 + rng() * 0.07).toFixed(2) + '"/>' +
            '<line x1="-38" y1="-50" x2="38" y2="-50" stroke="#3a1208" stroke-opacity="0.25" stroke-width="4"/>' +
            '<line x1="-38" y1="-34" x2="20" y2="-34" stroke="#3a1208" stroke-opacity="0.2" stroke-width="4"/>' +
            '<line x1="-38" y1="-18" x2="30" y2="-18" stroke="#3a1208" stroke-opacity="0.2" stroke-width="4"/>' +
            '</g>';
    }
    // 大时钟(悬空)
    s += '<g transform="translate(960 300)">';
    s += '<circle cx="0" cy="0" r="170" fill="#1a0a0e" stroke="#ffb03c" stroke-width="10"/>';
    s += '<circle cx="0" cy="0" r="148" fill="#241016"/>';
    s += '<circle cx="0" cy="0" r="148" fill="none" stroke="#ff5a3c" stroke-opacity="0.35" stroke-width="3"/>';
    for (var t = 0; t < 12; t++) {
        var a = t / 12 * Math.PI * 2;
        s += '<line x1="' + (Math.cos(a) * 132).toFixed(1) + '" y1="' + (Math.sin(a) * 132).toFixed(1) + '" x2="' + (Math.cos(a) * 144).toFixed(1) + '" y2="' + (Math.sin(a) * 144).toFixed(1) + '" stroke="#ffb03c" stroke-width="5"/>';
    }
    s += '<path d="M0 0 L0 -95 M0 0 L62 34" stroke="#ffb03c" stroke-width="9" stroke-linecap="round"/>';
    s += '<circle cx="0" cy="0" r="11" fill="#3a1216" stroke="#ffb03c" stroke-width="4"/>';
    s += '<circle cx="0" cy="0" r="240" fill="none" stroke="#ff5a3c" stroke-opacity="0.15" stroke-width="2"/>';
    s += '<text x="0" y="230" text-anchor="middle" fill="#ffb03c" font-size="26" font-family="sans-serif" font-weight="bold" fill-opacity="0.5">FINAL EXAM</text>';
    s += '</g>';
    // 底部暗影(如巨物)
    s += '<ellipse cx="960" cy="1080" rx="900" ry="260" fill="#000000" fill-opacity="0.55"/>';
    s += '<path d="M300 1080 Q 400 850 700 830 Q 1000 810 1300 830 Q 1560 850 1620 1080 Z" fill="url(#cape)"/>';
    s += '<path d="M600 1080 Q 680 900 900 890 Q 1100 880 1320 900 Q 1460 920 1520 1080 Z" fill="#2a0d12" fill-opacity="0.8"/>';
    // 火焰小苗
    s += '<path d="M420 1080 Q 430 1020 450 1000 Q 470 980 460 1040 Q 456 1070 470 1080 Z" fill="#ff6a3c" fill-opacity="0.5"/>';
    s += '<path d="M1560 1080 Q 1570 1030 1586 1010 Q 1602 990 1596 1045 Q 1590 1070 1604 1080 Z" fill="#ff6a3c" fill-opacity="0.4"/>';
    // 地面裂痕
    s += '<path d="M700 1080 L760 1020 L800 1032 L880 990 L940 1060 L980 1010 L1060 1050 L1160 990 L1220 1080" stroke="#000000" stroke-opacity="0.5" stroke-width="10" fill="none" stroke-linecap="round"/>';
    // 数字尘埃 (10 9 8...)
    s += stars(rng, 60, 0, W, 0, 600, '#ff8a5c', 0.3);
    s += '</svg>';
    return s;
}

// ---------- 4. 胜利背景: 毕业庆典 ----------
function bgWin() {
    var rng = rand(999003);
    var W = 1920, H = 1080;
    var s = '';
    s += '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<defs>';
    s += '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#2b1a08"/>' +
        '<stop offset="0.4" stop-color="#4a2e0e"/>' +
        '<stop offset="0.75" stop-color="#2f1e0a"/>' +
        '<stop offset="1" stop-color="#1f1206"/>' +
        '</linearGradient>';
    s += '<radialGradient id="sun" cx="0.5" cy="0.35" r="0.55">' +
        '<stop offset="0" stop-color="#ffdf9e" stop-opacity="0.5"/>' +
        '<stop offset="0.5" stop-color="#ffb03c" stop-opacity="0.18"/>' +
        '<stop offset="1" stop-color="#ffb03c" stop-opacity="0"/>' +
        '</radialGradient>';
    s += '<linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#3a2a14"/>' +
        '<stop offset="1" stop-color="#1c1206"/>' +
        '</linearGradient>';
    s += '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#gold)"/>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#sun)"/>';
    // 放射光线
    for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2 - Math.PI / 2;
        var x1 = 960 + Math.cos(a) * 300, y1 = 378 + Math.sin(a) * 300;
        var x2 = 960 + Math.cos(a) * 1400, y2 = 378 + Math.sin(a) * 1400;
        s += '<line x1="' + x1.toFixed(0) + '" y1="' + y1.toFixed(0) + '" x2="' + x2.toFixed(0) + '" y2="' + y2.toFixed(0) + '" stroke="#ffd76e" stroke-opacity="0.05" stroke-width="26"/>';
    }
    // 星芒大爆炸
    for (var k = 0; k < 10; k++) {
        var sx = 150 + rng() * (W - 300), sy = 80 + rng() * 420;
        s += '<path d="M' + sx + ' ' + (sy - 18) + ' L' + sx + ' ' + (sy + 18) + ' M' + (sx - 18) + ' ' + sy + ' L' + (sx + 18) + ' ' + sy + '" stroke="#ffd76e" stroke-opacity="' + (0.3 + rng() * 0.4).toFixed(2) + '" stroke-width="2"/>';
    }
    s += stars(rng, 90, 0, W, 0, 500, '#ffe9b8', 0.25);
    // 飘带
    var rib = ['#ff6a5c', '#5cb8ff', '#7be0a8', '#ffd76e', '#c58aff'];
    for (var j = 0; j < 8; j++) {
        var rx0 = 60 + rng() * (W - 120), ry0 = 60 + rng() * 500;
        var len = 160 + rng() * 220, ang = 20 + rng() * 140;
        var a2 = ang * Math.PI / 180;
        var rx1 = rx0 + Math.cos(a2) * len, ry1 = ry0 + Math.sin(a2) * len;
        s += '<path d="M' + rx0.toFixed(0) + ' ' + ry0.toFixed(0) + ' Q ' + ((rx0 + rx1) / 2 + (rng() - 0.5) * 120).toFixed(0) + ' ' + ((ry0 + ry1) / 2 + (rng() - 0.5) * 120).toFixed(0) + ' ' + rx1.toFixed(0) + ' ' + ry1.toFixed(0) + '" stroke="' + rib[j % rib.length] + '" stroke-opacity="0.5" stroke-width="9" fill="none" stroke-linecap="round"/>';
    }
    // 学位帽(主体)
    s += '<g transform="translate(960 340)">';
    s += '<rect x="-150" y="-14" width="300" height="24" rx="6" fill="#ffd76e" fill-opacity="0.85"/>';
    s += '<rect x="-150" y="-14" width="300" height="8" rx="4" fill="#ffe9b8" fill-opacity="0.6"/>';
    // 帽顶
    s += '<path d="M-120 -14 L-40 -80 L40 -80 L120 -14 Z" fill="#ffd76e"/>';
    s += '<path d="M-120 -14 L-40 -80 L40 -80 L120 -14 Z" fill="none" stroke="#b88414" stroke-width="3"/>';
    s += '<path d="M-120 -14 L0 4 L120 -14 Z" fill="#b88414" fill-opacity="0.6"/>';
    s += '<circle cx="0" cy="-80" r="10" fill="#ffd76e"/>';
    s += '<path d="M0 -80 L0 -130" stroke="#ffd76e" stroke-width="5"/>';
    // 流苏
    s += '<path d="M0 -80 Q 30 -40 34 0 Q 36 26 22 66" stroke="#c22b2b" stroke-width="4" fill="none"/>';
    s += '<path d="M20 60 L34 46 L40 70 Z" fill="#c22b2b"/>';
    s += '</g>';
    // 光柱
    s += '<path d="M760 340 L1160 340 L1260 900 L660 900 Z" fill="#ffd76e" fill-opacity="0.07"/>';
    s += '<path d="M820 340 L1100 340 L1160 900 L760 900 Z" fill="#ffe9b8" fill-opacity="0.05"/>';
    // 舞台
    s += '<path d="M0 900 L1920 900 L1920 1080 L0 1080 Z" fill="url(#stage)"/>';
    s += '<rect y="896" width="' + W + '" height="8" fill="#b88414" fill-opacity="0.8"/>';
    // 彩带堆
    for (var c = 0; c < 6; c++) {
        var cx = 260 + c * 280, cy = 940 + rng() * 60;
        s += '<path d="M' + cx + ' ' + (cy - 60) + ' Q ' + (cx + 18) + ' ' + (cy - 20) + ' ' + (cx + 26) + ' ' + cy + ' Q ' + (cx + 14) + ' ' + (cy - 10) + ' ' + cx + ' ' + cy + '" fill="' + rib[c % rib.length] + '" fill-opacity="0.55"/>';
    }
    // 礼花点
    for (var fl = 0; fl < 40; fl++) {
        var fx = 100 + rng() * (W - 200), fy = 720 + rng() * 300;
        s += '<circle cx="' + fx.toFixed(0) + '" cy="' + fy.toFixed(0) + '" r="' + (2 + rng() * 4).toFixed(1) + '" fill="#ffd76e" fill-opacity="' + (0.2 + rng() * 0.4).toFixed(2) + '"/>';
    }
    s += '</svg>';
    return s;
}

// ---------- 生成 ----------
var bgs = { 'title': bgTitle, 'battle': bgBattle, 'boss': bgBoss, 'win': bgWin };
if (!fs.existsSync(web)) fs.mkdirSync(web, { recursive: true });
Object.keys(bgs).forEach(function (name) {
    var file = path.join(web, name + '.svg');
    fs.writeFileSync(file, bgs[name]());
    var old = path.join(web, name + '.png');
    if (fs.existsSync(old)) fs.unlinkSync(old);
    console.log('generated bg/' + name + '.svg (' + fs.statSync(file).size + ' bytes)');
});