/* =========================================================
   《学期攻略》网页版 - 界面层 (依赖 game.js 的 SG)
   ========================================================= */
(function () {
    'use strict';

    var app = document.getElementById('app');

    function el(sel, fn) {
        var nodes = app.querySelectorAll(sel);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].addEventListener('click', fn);
        }
    }

    // ================= 美术资源探测 =================
    var ART = { cards: {}, enemies: {}, chars: {}, events: {} };
    var artPending = 0;

    function probe(kind, key) {
        var img = new Image();
        artPending++;
        img.onload = function () { ART[kind][key] = true; artDone(); };
        img.onerror = function () { ART[kind][key] = false; artDone(); };
        img.src = 'assets/' + kind + '/' + key + (kind === 'cards' ? '.svg' : '.png');
    }
    function artDone() {
        artPending--;
        if (artPending === 0) render();
    }
    function preloadArt() {
        SG.CARDS.forEach(function (c, i) {
            probe('cards', c.name);
            probe('cards', 'c' + i);
        });
        for (var i = 0; i < 10; i++) probe('enemies', 'e' + i);
        for (var j = 0; j < 4; j++) probe('chars', 'ch' + j);
        for (var k = 0; k < 9; k++) probe('events', 'ev' + k);
    }
    function cardArtSrc(name, id) {
        if (ART.cards[name]) return 'assets/cards/' + name + '.svg';
        if (ART.cards['c' + id]) return 'assets/cards/c' + id + '.svg';
        return null;
    }
    function enemyArtSrc(id) { return ART.enemies['e' + id] ? 'assets/enemies/e' + id + '.png' : null; }
    function charArtSrc(id) { return ART.chars['ch' + id] ? 'assets/chars/ch' + id + '.png' : null; }
    function eventArtSrc(id) { return ART.events['ev' + id] ? 'assets/events/ev' + id + '.png' : null; }

    // ================= 通用组件 =================
    var TYPE_CLASS = ['ct-know', 'ct-moral', 'ct-social', 'ct-stress'];
    var TYPE_COLOR = ['#4a7fd4', '#43a868', '#c9a227', '#d4604f'];
    var TYPE_ICON = ['📘', '💚', '💼', '🔥'];
    var ROOM_NAME = ['战斗', '精英', '首领', '事件', '休息', '商店', '宝箱'];

    function cardHTML(c, id, opts) {
        opts = opts || {};
        var src = cardArtSrc(c.name, id);
        var art = src
            ? '<img class="card-img" src="' + src + '" alt="">'
            : '<div class="card-img fallback" style="background:' + TYPE_COLOR[c.type] + '">' +
              TYPE_ICON[c.type] + '</div>';
        return '<div class="card ' + TYPE_CLASS[c.type] + ' ' + (c.up ? 'upgraded' : '') +
            (opts.cls ? ' ' + opts.cls : '') + '"' +
            (opts.attr ? ' ' + opts.attr : '') + '>' +
            '<div class="card-cost">' + c.cost + '</div>' +
            '<div class="card-art">' + art + '</div>' +
            '<div class="card-name">' + SG.cardName(c) + '</div>' +
            '<div class="card-desc">' + c.desc + '</div>' +
            '</div>';
    }

    function bar(value, max, color, warnColor) {
        var pct = Math.max(0, Math.min(100, value / max * 100));
        var col = warnColor && value / max < 0.35 ? warnColor : color;
        return '<div class="bar"><div class="bar-fill" style="width:' + pct + '%;background:' + col + '"></div>' +
            '<span class="bar-text">' + value + '/' + max + '</span></div>';
    }

    function enemyHTML(e, idx, targetable) {
        var src = enemyArtSrc(e.id);
        var art = src
            ? '<img class="enemy-img" src="' + src + '" alt="">'
            : '<div class="enemy-img fallback" style="background:#5b3a6e">👾</div>';
        var intent = '';
        if (e.hp > 0) {
            var it = '💭 意图: ';
            if (e.intentT === SG.IA_ATTACK) it += '⚔️ 攻击' + e.intentV;
            else if (e.intentT === SG.IA_STRESS) it += '😰 施压+' + e.intentV;
            else if (e.intentT === SG.IA_SHIELD) it += '🛡️ 防御+' + e.intentV;
            else if (e.intentT === SG.IA_DEBUFF) it += '🤢 疲劳' + e.intentV + '层';
            else it += '✨ 强化';
            if (e.intentV2 > 0) it += ' +' + e.intentV2 + '压';
            if (e.doubleAtk) it += ' (下回合翻倍!)';
            intent = '<div class="enemy-intent">' + it + '</div>';
        }
        var debs = [];
        if (e.confuse > 0) debs.push('🤔困惑' + e.confuse);
        if (e.tired > 0) debs.push('🥱疲劳' + e.tired);
        if (e.poison > 0) debs.push('☠️中毒' + e.poison);
        if (e.sleep > 0) debs.push('😴昏睡');
        var cls = 'enemy';
        if (e.hp <= 0) cls += ' dead';
        if (targetable) cls += ' targetable';
        return '<div class="' + cls + '" data-enemy="' + idx + '">' +
            '<div class="enemy-art">' + art + '</div>' +
            '<div class="enemy-name">' + e.name + '</div>' +
            (e.hp <= 0 ? '<div class="enemy-dead">已倒下</div>' :
                bar(e.hp, e.maxHp, '#d4604f', '#a33a2a') + (e.shield > 0 ? '<div class="enemy-shield">🛡️盾' + e.shield + '</div>' : '')) +
            intent +
            (debs.length ? '<div class="enemy-debuffs">' + debs.join(' ') + '</div>' : '') +
            '</div>';
    }

    // ================= 主渲染 =================
    function render() {
        var ph = SG.phase();
        var html = '';
        switch (ph) {
            case 'title': html = screenTitle(); break;
            case 'char': html = screenChar(); break;
            case 'diff': html = screenDiff(); break;
            case 'bonus': html = screenBonus(); break;
            case 'map': html = screenMap(); break;
            case 'battle': html = screenBattle(); break;
            case 'reward': html = screenReward(); break;
            case 'course': html = screenCourse(); break;
            case 'event': html = screenEvent(); break;
            case 'rest': html = screenRest(); break;
            case 'upgrade': html = screenUpgrade(false); break;
            case 'shop': html = screenShop(); break;
            case 'chest': html = screenChest(); break;
            case 'bossintro': html = screenBossIntro(); break;
            case 'stageend': html = screenStageEnd(); break;
            case 'win': html = screenWinLose(true); break;
            case 'lose': html = screenWinLose(false); break;
            case 'status': html = screenStatus(); break;
            case 'meta': html = screenMeta(); break;
            case 'creditshop': html = screenCreditShop(); break;
            case 'help': html = screenHelp(); break;
        }
        app.innerHTML = html;
        bindScreen(ph);
    }

    // ================= 标题 =================
    function screenTitle() {
        var M = SG.M;
        var courses = ['高等数学(默认)'];
        if (M.lit) courses.push('大学语文');
        if (M.biz) courses.push('微观经济学');
        if (M.artc) courses.push('艺术鉴赏');
        if (M.eng) courses.push('大学英语');
        if (M.pe) courses.push('体育课');
        var chars = ['新生(默认)'];
        if (M.trans) chars.push('转学生');
        if (M.exch) chars.push('交换生');
        return '<div class="screen screen-title" style="background-image:url(assets/bg/title.svg)">' +
            '<div class="title-overlay"></div>' +
            '<div class="title-box">' +
            '<h1>《学期攻略》</h1>' +
            '<div class="subtitle">校园卡牌肉鸽 · 网页版 v1.0</div>' +
            '<div class="title-stats">' +
            '<span>📜 通过 ' + M.wins + ' 学期</span><span>💔 失败 ' + M.losses + '</span><span>🎓 学分 ' + M.credit + '</span>' +
            '<span>课程: ' + courses.join(' / ') + '</span><span>角色: ' + chars.join(' / ') + '</span>' +
            '</div>' +
            '<div class="menu">' +
            '<button class="btn btn-big" data-action="start">🎒 开始新学期</button>' +
            '<button class="btn" data-action="meta">🏆 局外状态 / 成就</button>' +
            '<button class="btn" data-action="shop">🎓 学分商店</button>' +
            '<button class="btn" data-action="help">📖 游戏说明</button>' +
            '</div></div></div>';
    }

    // ================= 角色选择 =================
    function screenChar() {
        var M = SG.M;
        var chars = [
            { name: '大一新生', desc: '初始金币+15', lock: false, hint: '' },
            { name: '转学生', desc: '每场战斗开始多抽2张', lock: !M.trans, hint: '通关2次解锁' },
            { name: '复读生', desc: '压力惩罚阈值+10', lock: !M.rep, hint: '失败3次解锁' },
            { name: '交换生', desc: '战斗开始金币+10,多抽1张', lock: !M.exch, hint: '难度5以上通关解锁' }
        ];
        if (window.SEM_CHARS) chars = chars.map(function (c, i) {
            var o = window.SEM_CHARS[i];
            return o ? { name: o.name || c.name, desc: o.desc || c.desc, lock: c.lock, hint: c.hint } : c;
        });
        var html = '<div class="screen"><h2>🎒 选择角色</h2><div class="grid4">';
        chars.forEach(function (c, i) {
            var src = charArtSrc(i);
            var art = src ? '<img class="char-img" src="' + src + '">' :
                '<div class="char-img fallback">🎓</div>';
            html += '<div class="panel char-card' + (c.lock ? ' locked' : '') + '" data-char="' + i + '">' +
                '<div class="char-art">' + art + '</div>' +
                '<div class="char-name">' + (c.lock ? '????' : c.name) + '</div>' +
                '<div class="char-desc">' + (c.lock ? c.hint : c.desc) + '</div></div>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="back">← 返回</button></div></div>';
    }

    // ================= 难度选择 =================
    function screenDiff() {
        var maxDiff = Math.min(SG.M.wins, 10);
        var eff = [
            '基础难度', '普通敌人+10%HP', '精英敌人+15%HP', 'Boss+20%HP', '初始心态-10',
            '初始卡组+2摸鱼', '商店价格+25%', '休息恢复-30%', '压力惩罚阈值-10',
            '每回合少抽1张', '期末考试增加补考阶段'
        ];
        var html = '<div class="screen"><h2>⚔️ 选择难度 (通关次数解锁)</h2><div class="diff-list">';
        for (var d = 0; d <= maxDiff; d++) {
            html += '<button class="btn diff-btn" data-diff="' + d + '">难度 ' + d + ' — ' + eff[d] + '</button>';
        }
        return html + '</div><div class="row-center"><button class="btn" data-action="back">← 返回</button></div></div>';
    }

    // ================= 初始奖励 =================
    function screenBonus() {
        var opts = [
            '新生奖学金: 初始金币+50',
            '保送入学: 初始卡组多2张稀有卡',
            'gap year归来: 初始心态+20, 压力上限+10',
            '学长经验: 战斗开始时获得1个随机物品'
        ];
        var html = '<div class="screen"><h2>🎁 选择初始奖励</h2><div class="diff-list">';
        opts.forEach(function (o, i) {
            html += '<button class="btn diff-btn" data-bonus="' + i + '">' + o + '</button>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="back">← 返回</button></div></div>';
    }

    // ================= 地图 =================
    function mapSvg(run, adjs) {
        // 布局: viewBox 960x520, 节点按 (col,row) 定位, 3 行
        var C = run.rooms.reduce(function (m, r) { return Math.max(m, r.col + 1); }, 0);
        var W = 960, H = 500;
        var MX = 90, MY = 90;
        var cw = (W - MX * 2) / Math.max(1, C - 1);
        var px = function (col) { return MX + col * cw; };
        var py = function (row) { return MY + row * ((H - MY * 2) / 2); };

        // 房间类型样式
        var STYLE = {
            0: { color: '#d4604f', icon: '⚔️', label: '战斗' },    // battle
            1: { color: '#c9a227', icon: '⭐', label: '精英' },    // elite
            2: { color: '#ffd76e', icon: '👹', label: '首领' },    // boss
            3: { color: '#4a7fd4', icon: '❓', label: '事件' },    // event
            4: { color: '#43a868', icon: '☕', label: '休息' },    // rest
            5: { color: '#7ab8ff', icon: '🛒', label: '商店' },    // shop
            6: { color: '#c58aff', icon: '🎁', label: '宝箱' }     // chest
        };

        // 连接线 (去重: 只画一次每条边)
        var edges = {};
        var paths = '';
        run.rooms.forEach(function (r, i) {
            r.next.forEach(function (j) {
                var k = i < j ? i + ':' + j : j + ':' + i;
                if (edges[k] || !run.rooms[j]) return;
                edges[k] = true;
                var a = run.rooms[i], b = run.rooms[j];
                var x1 = px(a.col), y1 = py(a.row), x2 = px(b.col), y2 = py(b.row);
                var xm = (x1 + x2) / 2, ym = (y1 + y2) / 2;
                var bulge = (y2 - y1) * 0.28; // 让竖线有弧线感
                var stroke = '#33415e';
                var width = 3;
                if (a.cleared && b.cleared) { stroke = '#43a868'; width = 3.5; }
                else if (adjs.indexOf(i) >= 0 || adjs.indexOf(j) >= 0) { stroke = '#ffd76e'; width = 4; }
                paths += '<path d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
                    ' Q ' + xm.toFixed(1) + ' ' + (ym - bulge).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
                    '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-opacity="0.8"/>';
            });
        });

        // 节点
        var nodes = '';
        run.rooms.forEach(function (r, i) {
            var x = px(r.col), y = py(r.row);
            var st = STYLE[r.type] || STYLE[0];
            var isCur = (i === run.cur);
            var canGo = adjs.indexOf(i) >= 0;
            var cleared = r.cleared;

            if (isCur) {
                // 当前位置: 脉冲光环 + 金色描边
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="30" fill="none" stroke="#ffd76e" stroke-width="2" stroke-opacity="0.5">' +
                    '<animate attributeName="r" values="24;34;24" dur="1.8s" repeatCount="indefinite"/>' +
                    '<animate attributeName="stroke-opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite"/></circle>';
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="22" fill="#ffd76e" fill-opacity="0.18" stroke="#ffd76e" stroke-width="2.5"/>';
            } else if (canGo) {
                // 可前往: 高亮发光
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="23" fill="#ffd76e" fill-opacity="0.12" stroke="#ffd76e" stroke-width="2.5"/>';
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="none" stroke="#ffd76e" stroke-width="1" stroke-opacity="0.6"/>';
            } else if (cleared) {
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="20" fill="#1a2438" fill-opacity="0.9" stroke="#43a868" stroke-width="2"/>';
            } else {
                nodes += '<circle cx="' + x + '" cy="' + y + '" r="20" fill="#222c40" stroke="#46597a" stroke-width="2"/>';
            }
            // 图标
            var icon = cleared ? '✓' : st.icon;
            var fontSize = cleared ? 16 : (icon.length > 2 ? 20 : 22);
            var iconColor = cleared ? '#43a868' : (isCur || canGo ? '#ffd76e' : '#cfd6e0');
            nodes += '<text x="' + x + '" y="' + (y + fontSize * 0.36) + '" text-anchor="middle" font-size="' + fontSize + '" fill="' + iconColor + '">' + icon + '</text>';
        });

        return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="map-svg">' +
            '<defs><filter id="pathglow" x="-40%" y="-40%" width="180%" height="180%">' +
            '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
            '<g filter="url(#pathglow)">' + paths + '</g>' + nodes + '</svg>';
    }

    function screenMap() {
        var run = SG.state.run;
        var P = run.P;
        var adjs = SG.mapAdjs();
        var svgMap = mapSvg(run, adjs);
        var msgs = (SG.state.unlockMsgs || []).map(function (m) { return '<div class="log-msg">' + m + '</div>'; }).join('');
        return '<div class="screen map-screen" style="background-image:url(assets/bg/map.svg)">' +
            '<div class="battle-overlay"></div>' +
            '<div class="map-head">' +
            '<span>🗓️ 阶段 ' + (run.stage + 1) + '/4</span>' +
            '<span>❤️ 心态 ' + P.morale + '</span>' +
            '<span>😰 压力 ' + P.stress + ' (' + zoneNameOf(P) + ')</span>' +
            '<span>💰 金币 ' + P.gold + '</span>' +
            '</div>' +
            '<div class="map-wrap">' + svgMap + '</div>' +
            '<div class="map-legend">⭐精英 &nbsp;👹首领 &nbsp;❓事件 &nbsp;☕休息 &nbsp;🛒商店 &nbsp;🎁宝箱 &nbsp;<span class="ml-cur">●当前位置</span> &nbsp;<span class="ml-go">●可前往</span> &nbsp;<span class="ml-done">✓已通关</span></div>' +
            '<div class="map-adj">' + (adjs.length ? adjs.map(function (t) {
                return '<button class="btn btn-small" data-go="' + t + '">前往「' + ROOM_NAME[run.rooms[t].type] + '」</button>';
            }).join(' ') : '<span class="dim">已到尽头, 击败首领进入下一阶段</span>') + '</div>' +
            (msgs ? '<div class="log-box small">' + msgs + '</div>' : '') +
            '<div class="row-center"><button class="btn" data-action="status">📋 查看状态 (S)</button></div>' +
            '</div>';
    }

    // ================= 战斗 =================
    function screenBattle() {
        var B = SG.state.battle;
        var P = SG.state.run.P;
        if (!B) return '';
        var bg = 'battle.svg';
        if (B.es.some(function (e) { return e.id === 5 || e.id === 9; })) bg = 'boss.svg';
        if (B.firstTurn && B.showBg) bg = B.es.some(function (e) { return e.id === 5 || e.id === 9; }) ? 'boss.svg' : 'battle.svg';

        var enemyRow = '<div class="enemy-row">';
        B.es.forEach(function (e, i) {
            enemyRow += enemyHTML(e, i, targetMode !== null);
        });
        enemyRow += '</div>';

        var z = zoneIdxOf(P);
        var stressColor = z >= 4 ? '#ff4444' : z >= 3 ? '#ff8c42' : z >= 2 ? '#ffd23f' : '#43a868';
        var playerBar = '<div class="player-bar">' +
            '<div class="pb-item"><span class="pb-label">❤️心态</span>' + bar(P.morale, 100, '#43a868', '#d4604f') + '</div>' +
            '<div class="pb-item"><span class="pb-label">😰压力</span>' + bar(P.stress, StressCapOf(), stressColor) + '</div>' +
            '<div class="pb-item pb-num"><span class="pb-label">⚡精力</span><b>' + P.energy + '</b>/' + baseEnergyOf() + '</div>' +
            '<div class="pb-item pb-num">🛡️' + P.shield + '</div>' +
            '<div class="pb-item pb-num">💰' + P.gold + '</div>' +
            '<div class="pb-item pb-num">状态:' + zoneNameOf(P) + '</div>' +
            (P.combo > 0 ? '<div class="pb-item pb-num">🔥连击' + P.combo + '</div>' : '') +
            (P.learnTurns > 0 ? '<div class="pb-item pb-num">📖学习' + P.learnTurns + '回合</div>' : '') +
            (P.fatigue > 0 ? '<div class="pb-item pb-num">🥱疲劳' + P.fatigue + '</div>' : '') +
            '</div>';

        var hand = '<div class="hand">';
        P.hand.forEach(function (c, i) {
            var playable = SG.canPlayCard(i);
            var cls = playable ? 'playable' : 'unplayable';
            if (targetMode !== null && targetMode === i) cls += ' selected';
            hand += cardHTML(c, c._id, { cls: cls, attr: 'data-hand="' + i + '"' });
        });
        hand += '</div>';

        var log = '<div class="log-box">' + B.log.slice(-60).map(function (m) {
            return '<div class="log-msg">' + m + '</div>';
        }).join('') + '</div>';

        var endBtn = '<button class="btn btn-big" data-action="endturn" ' +
            (B.over ? 'disabled' : '') + '>⏭️ 结束回合 (E)</button>';

        var modal = '';
        if (B.prompt) {
            if (B.prompt.kind === 'report') {
                modal = modalHTML('🤨 翻书作弊!', '期末考试在翻书作弊! 要举报吗? 举报则立即进入第三阶段, 压力+15',
                    [{ label: '✅ 举报!', act: 'prompt-yes', k: 'y' }, { label: '❌ 沉默, 硬吃这一击', act: 'prompt-no', k: 'n' }]);
            } else if (B.prompt.kind === 'blank') {
                modal = modalHTML('📄 交白卷?', '期末考试威胁你交白卷! 交了立即失败!',
                    [{ label: '📄 交白卷(失败)', act: 'prompt-yes', k: 'y' }, { label: '💪 拒绝!', act: 'prompt-no', k: 'n' }]);
            }
        }

        return '<div class="screen battle-screen" style="background-image:url(assets/bg/' + bg + ')">' +
            '<div class="battle-overlay"></div>' +
            '<div class="battle-top">' + enemyRow + playerBar + '</div>' +
            log +
            '<div class="battle-bottom">' + hand +
            '<div class="battle-actions">' +
            '<span class="piles">🂠 抽牌堆 ' + P.draw.length + ' &nbsp; ♻️ 弃牌堆 ' + P.discard.length + '</span>' +
            endBtn + '</div></div>' + modal + '</div>';
    }

    // ================= 奖励 =================
    function screenReward() {
        var r = SG.state.reward;
        if (!r) return '';
        var P = SG.state.run.P;
        var html = '<div class="screen"><h2>🎉 战斗奖励' + (SG.state.pendingGold > 0 ? ' — 金币+' + SG.state.pendingGold : '') + '</h2>' +
            '<div class="subtitle">三选一加入卡组</div><div class="grid4">';
        r.cand.forEach(function (id, i) {
            var c = SG.CARDS[id];
            html += '<div class="reward-card" data-reward="' + i + '" data-key="' + (i + 1) + '">' +
                cardHTML(c, id) + '<div class="reward-hint">点击加入卡组</div></div>';
        });
        return html + '</div><div class="row-center"><span class="dim">当前金币: ' + P.gold + '</span></div></div>';
    }

    // ================= 课程奖励 =================
    function screenCourse() {
        var av = SG.state.courseAvail;
        if (!av) return '';
        var html = '<div class="screen"><h2>🎓 精英战胜利! 选择一门新课程(被动可叠加)</h2><div class="grid4">';
        av.forEach(function (c, i) {
            var info = SG.COURSE_INFO[c];
            html += '<div class="panel course-card" data-course="' + i + '" data-key="' + (i + 1) + '">' +
                '<div class="course-name">《' + info.n + '》</div>' +
                '<div class="course-desc">' + info.pn + '</div>' +
                '<div class="course-sub">+5张课程卡</div></div>';
        });
        return html + '</div></div>';
    }

    // ================= 事件 =================
    function screenEvent() {
        var ev = SG.state.event ? SG.state.event.id : 0;
        var texts = [
            ['📚 图书馆占座', '你来到图书馆, 发现一个好位置, 但旁边的同学似乎也想要...',
                ['硬刚占座: 获得1张稀有知识卡, 但+10压力', '让给别人: 恢复15心态, -5压力', '换个位置: 获得20金币']],
            ['🎪 社团招新日', '社团招新日, 各个社团都在拉人...',
                ['加入学术社团: 获得1张知识卡+1张心态卡', '加入社交社团: 获得1张社交卡+随机物品', '都不加入: 恢复10心态, -10压力']],
            ['🎮 室友打游戏', '室友凌晨2点还在打游戏, 声音很大...',
                ['一起打: +15压力, 获得1张「摆烂」', '委婉提醒: +5压力, +5心态', '戴耳塞忍着: +8压力, 下场战斗开场+10护盾']],
            ['🍚 食堂插队', '食堂人很多, 有人插到你前面...',
                ['理论一番: +8压力, 获得1张「议论文」', '默默忍受: +3压力', '换个窗口: 什么都没发生']],
            ['🏅 奖学金评选', '奖学金评选开始了, 要不要申请?',
                ['申请(心态>50): 50%成功: +50金币+1史诗卡; 失败+15压力', '不申请: -5压力']],
            ['🍢 深夜食堂', '深夜食堂开张, 烧烤摊香气扑鼻...',
                ['豪华加餐(花20金): 恢复20心态, -5压力', '蹭同学的烤串: +10心态, +10压力', '忍痛减肥: -8压力']],
            ['📖 图书馆奇遇', '图书馆奇遇: 一位学霸正在整理旧笔记...',
                ['上前请教: 获得1张随机卡, +5压力', '捡到旧笔记本: 获得1个随机物品', '太累了, 眯一会: 恢复12心态']],
            ['🏃 操场夜跑', '操场夜跑时间! 今晚的空气格外清新...',
                ['跑5圈: 恢复10心态, -8压力', '慢跑1圈: +5心态', '躺平看星星: 获得10金币, +5压力']],
            ['💌 表白墙', '表白墙前挤满了人, 有人在围观最新留言...',
                ['大胆写下表白: 60%成功: -15压力+15心态; 失败+10压力', '吃瓜围观: 恢复6心态, -5压力', '默默路过: +5金币']]
        ];
        var t = texts[ev];
        var src = eventArtSrc(ev);
        var art = src ? '<div class="event-art"><img src="' + src + '"></div>' : '';
        var html = '<div class="screen"><h2>' + t[0] + '</h2>' + art +
            '<div class="event-text">' + t[1] + '</div><div class="diff-list">';
        t[2].forEach(function (o, i) {
            html += '<button class="btn diff-btn" data-event="' + i + '" data-key="' + (i + 1) + '">' + o + '</button>';
        });
        return html + '</div></div>';
    }

    // ================= 休息 =================
    function screenRest() {
        var opts = ['😴 睡一觉: 恢复25心态', '🎮 打游戏放松: 恢复15心态, 移除1张基础卡',
            '📚 泡图书馆: +15压力, 获得1张随机卡', '✏️ 复习冲刺: 升级1张卡牌'];
        var html = '<div class="screen"><h2>☕ 休息点</h2><div class="diff-list">';
        opts.forEach(function (o, i) {
            html += '<button class="btn diff-btn" data-rest="' + i + '" data-key="' + (i + 1) + '">' + o + '</button>';
        });
        return html + '</div></div>';
    }

    // ================= 升级 =================
    function screenUpgrade(fromShop) {
        var list = SG.upgradeList();
        if (list.length === 0) {
            return '<div class="screen"><h2>✏️ 升级卡牌</h2><div class="dim">没有可升级的卡牌!</div>' +
                '<div class="row-center"><button class="btn" data-action="upback">← 返回</button></div></div>';
        }
        var P = SG.state.run.P;
        var html = '<div class="screen"><h2>✏️ 选择要升级的卡牌</h2><div class="grid4">';
        list.forEach(function (di, i) {
            html += '<div class="reward-card" data-up="' + i + '" data-key="' + (i + 1) + '">' +
                cardHTML(P.deck[di], di) + '<div class="reward-hint">点击升级</div></div>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="upback">← 返回</button></div></div>';
    }

    // ================= 商店 =================
    function screenShop() {
        var S = SG.state.shopStock;
        var P = SG.state.run.P;
        if (!S) return '';
        if (S.removing) {
            var html = '<div class="screen"><h2>🗑️ 移除卡牌 (' + SG.shopPrice(50) + '金)</h2><div class="grid4">';
            P.deck.forEach(function (c, i) {
                html += '<div class="reward-card" data-remove="' + i + '">' + cardHTML(c, i) + '</div>';
            });
            return html + '</div><div class="row-center"><button class="btn" data-action="upback">← 取消</button></div></div>';
        }
        if (S.upgrading) {
            return screenUpgrade(true);
        }
        var html = '<div class="screen"><h2>🛒 小卖部 <span class="dim">— 金币: ' + P.gold + '</span></h2>' +
            '<div class="subtitle">-- 卡牌 --</div><div class="grid4">';
        S.cards.forEach(function (id, i) {
            var c = SG.CARDS[id];
            var price = SG.shopCardPrice(id);
            html += '<div class="reward-card" data-buy="c' + i + '" data-key="' + (i + 1) + '">' +
                cardHTML(c, id) + '<div class="reward-hint">💰 ' + price + '金 购买</div></div>';
        });
        html += '</div><div class="subtitle">-- 物品 (80金/个) --</div><div class="grid4">';
        S.items.forEach(function (it, i) {
            html += '<div class="panel item-card" data-buy="i' + i + '" data-key="' + (5 + i) + '">' +
                '<div class="item-name">🎒 ' + SG.itemDB[it].name + '</div>' +
                '<div class="item-desc">' + SG.itemDB[it].desc + '</div>' +
                '<div class="reward-hint">💰 ' + SG.shopPrice(80) + '金 购买</div></div>';
        });
        html += '</div><div class="row-center wrap">' +
            '<button class="btn" data-action="shopremove">🗑️ 移除卡牌 (' + SG.shopPrice(50) + '金)</button>' +
            '<button class="btn" data-action="shopupgrade">✏️ 升级卡牌 (' + SG.shopPrice(60) + '金)</button>' +
            '<button class="btn" data-action="shopleave">🚪 离开</button></div></div>';
        return html;
    }

    // ================= 宝箱 =================
    function screenChest() {
        return '<div class="screen"><h2>🎁 宝箱</h2>' +
            '<div class="event-text">' + SG.state.chestMsg + '</div>' +
            '<div class="row-center"><button class="btn btn-big" data-action="chestnext">继续</button></div></div>';
    }

    // ================= Boss房 =================
    function screenBossIntro() {
        var bi = SG.state.bossIntro;
        if (!bi) return '';
        var run = SG.state.run;
        if (bi.stage < 3) {
            return '<div class="screen" style="background-image:url(assets/bg/boss.svg)"><div class="battle-overlay"></div>' +
                '<div class="center-box"><h2>👹 首领房</h2>' +
                '<div class="event-text">一股强大的压迫感袭来... 击败首领, 才能进入下一阶段!</div>' +
                '<button class="btn btn-big" data-action="bossfight">⚔️ 迎战首领</button></div></div>';
        }
        var hidden = SG.courseCount(run.P) >= 2;
        var html = '<div class="screen" style="background-image:url(assets/bg/boss.svg)"><div class="battle-overlay"></div>' +
            '<div class="center-box"><h2>📝 期末考试</h2>' +
            '<div class="event-text">最终挑战! 撑过这一场, 学期就结束了!</div>';
        if (hidden) {
            html += '<div class="event-text">(你已修满' + SG.courseCount(run.P) + '门课...)</div>' +
                '<div class="event-text">一个神秘人影出现: 想挑战隐藏Boss「毕业答辩」吗? (+50学分)</div>' +
                '<div class="row-center wrap">' +
                '<button class="btn" data-action="hiddentrue">😈 挑战隐藏Boss</button>' +
                '<button class="btn" data-action="hiddenfalse">😌 只打期末考试</button></div>';
        } else {
            html += '<button class="btn btn-big" data-action="bossfight">📝 开始考试</button>';
        }
        return html + '</div></div>';
    }

    // ================= 阶段结算 =================
    function screenStageEnd() {
        var run = SG.state.run;
        var P = run.P;
        var tip = run.stage === 0 ? '下一站: 期中季, 两个敌人开始同场出现...' :
            run.stage === 1 ? '下一站: 期末季, 战斗更加凶险!' : '下一站: 冲刺季! 期末考试就在眼前!';
        return '<div class="screen"><h2>🎉 阶段 ' + (run.stage + 1) + ' 完成!</h2>' +
            '<div class="event-text">❤️ 心态: ' + P.morale + ' &nbsp; 😰 压力: ' + P.stress +
            ' &nbsp; 💰 金币: ' + P.gold + '</div>' +
            '<div class="event-text">' + tip + '</div>' +
            '<div class="row-center"><button class="btn btn-big" data-action="stagenext">继续 🚶</button></div></div>';
    }

    // ================= 胜利/失败 =================
    function screenWinLose(win) {
        var run = SG.state.run;
        var P = run ? run.P : null;
        var msgs = (SG.state.unlockMsgs || []).map(function (m) { return '<div class="log-msg">' + m + '</div>'; }).join('');
        var stats = P ? '<div class="event-text">❤️ 心态: ' + P.morale + ' &nbsp; 😰 压力: ' + P.stress +
            ' &nbsp; 💰 金币: ' + P.gold + ' &nbsp; 🂠 卡组: ' + P.deck.length + '张 &nbsp; 🎓 课程: ' +
            SG.courseCount(P) + '门</div>' : '';
        if (win) {
            return '<div class="screen win-screen" style="background-image:url(assets/bg/win.svg)"><div class="battle-overlay"></div>' +
                '<div class="center-box"><h2>🎓 期末考试通过! 学期结束!</h2>' + stats +
                '<div class="event-text">学期结算: +100学分 (当前学分: ' + SG.M.credit + ')</div>' +
                (msgs ? '<div class="log-box small">' + msgs + '</div>' : '') +
                '<button class="btn btn-big" data-action="title">返回主菜单</button></div></div>';
        }
        return '<div class="screen"><h2>💔 学期失败...</h2>' +
            '<div class="event-text">心态崩溃了。下学期, 重新开始构筑吧。</div>' + stats +
            '<div class="event-text">结算: +30学分 (当前学分: ' + SG.M.credit + ')</div>' +
            (msgs ? '<div class="log-box small">' + msgs + '</div>' : '') +
            '<div class="row-center"><button class="btn btn-big" data-action="title">返回主菜单</button></div></div>';
    }

    // ================= 状态 =================
    function screenStatus() {
        var P = SG.state.run.P;
        var d = SG.statusData();
        var courses = [];
        if (P.courses & SG.C_SCI) courses.push('高等数学(理工: 首张知识卡+3)');
        if (P.courses & SG.C_LIT) courses.push('大学语文(文科: debuff+1层)');
        if (P.courses & SG.C_BIZ) courses.push('微观经济学(商科: 首张0费牌免费)');
        if (P.courses & SG.C_ART) courses.push('艺术鉴赏(艺术: 首张牌-1费)');
        if (P.courses & SG.C_ENG) courses.push('大学英语(外语: 每回合多抽1张)');
        if (P.courses & SG.C_PE) courses.push('体育课(体育: 每回合开始+2护盾)');
        var html = '<div class="screen"><h2>📋 当前状态</h2>' +
            '<div class="event-text">❤️ 心态: ' + d.morale + ' &nbsp; 😰 压力: ' + d.stress +
            ' &nbsp; 💰 金币: ' + d.gold + '</div>' +
            '<div class="subtitle">课程: ' + (courses.length ? courses.join(' / ') : '无') + '</div>' +
            '<div class="subtitle">物品 (' + d.items.length + '/6): ' +
            (d.items.length ? d.items.map(function (i) { return SG.itemDB[i].name; }).join(' / ') : '无') + '</div>' +
            '<div class="subtitle">卡组 (' + d.deckTotal + '张):</div><div class="deck-groups">';
        d.deck.forEach(function (g) {
            html += '<div class="deck-group"><span class="deck-name">' + g.name + '</span><span class="deck-cnt">×' + g.cnt + '</span></div>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="backmap">← 返回地图</button></div></div>';
    }

    // ================= 局外状态 =================
    function screenMeta() {
        var M = SG.M;
        var courseGot = 1 + M.lit + M.biz + M.artc + M.eng + M.pe;
        var charGot = 1 + M.trans + M.rep + M.exch;
        var courses = [
            { n: '高等数学(理工)', got: true, hint: '初始自带' },
            { n: '大学语文(文科)', got: !!M.lit, hint: '通关1次' },
            { n: '微观经济学(商科)', got: !!M.biz, hint: '通关时选修高等数学' },
            { n: '艺术鉴赏(艺术)', got: !!M.artc, hint: '高压通关(压力>80)' },
            { n: '大学英语(外语)', got: !!M.eng, hint: '通关3次' },
            { n: '体育课(体育)', got: !!M.pe, hint: '低压力通关' }
        ];
        var chars = [
            { n: '大一新生', got: true, hint: '初始自带' },
            { n: '转学生', got: !!M.trans, hint: '通关2次' },
            { n: '复读生', got: !!M.rep, hint: '失败3次' },
            { n: '交换生', got: !!M.exch, hint: '难度5以上通关' }
        ];
        var maxDiff = Math.min(M.wins, 10);
        var html = '<div class="screen"><h2>🏆 局外状态</h2>' +
            '<div class="event-text">📜 通过 ' + M.wins + ' 学期 / 💔 失败 ' + M.losses +
            ' / ⚔️ 最高难度 ' + M.maxDiffWon + ' / 🎓 学分 ' + M.credit +
            ' / 👹 隐藏Boss: ' + (M.hiddenBoss ? '是' : '否') + '</div>' +
            '<div class="subtitle">--- 课程收集 (' + courseGot + '/6) ---</div><div class="meta-grid">';
        courses.forEach(function (c) {
            html += '<div class="meta-item ' + (c.got ? 'got' : '') + '">' +
                '<b>' + (c.got ? '✅' : '🔒') + ' ' + c.n + '</b><span>' + (c.got ? '已解锁' : '需要: ' + c.hint) + '</span></div>';
        });
        html += '</div><div class="subtitle">--- 角色收集 (' + charGot + '/4) ---</div><div class="meta-grid">';
        chars.forEach(function (c) {
            html += '<div class="meta-item ' + (c.got ? 'got' : '') + '">' +
                '<b>' + (c.got ? '✅' : '🔒') + ' ' + c.n + '</b><span>' + (c.got ? '已解锁' : '需要: ' + c.hint) + '</span></div>';
        });
        html += '</div><div class="subtitle">--- 难度解锁 ---</div>' +
            '<div class="event-text">已解锁: 难度0' + (maxDiff > 0 ? ' / ' + Array.from({ length: maxDiff }, function (_, i) { return i + 1; }).join(' / ') : '') +
            (maxDiff < 10 ? ' — 再通关1次解锁难度' + (maxDiff + 1) : ' — 全部解锁!') + '</div>' +
            '<div class="subtitle">--- 成就徽章 ---</div><div class="meta-grid">';
        var ach = SG.achievements();
        var got = ach.filter(function (a) { return a.got; }).length;
        html += '<div class="event-text">已达成 ' + got + '/' + ach.length + '</div>';
        ach.forEach(function (a) {
            html += '<div class="meta-item ' + (a.got ? 'got' : '') + '">' +
                '<b>' + (a.got ? '🏅' : '🎖️') + ' ' + a.name + '</b><span>' + a.desc + '</span></div>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="title">← 返回</button></div></div>';
    }

    // ================= 学分商店 =================
    function screenCreditShop() {
        var html = '<div class="screen"><h2>🎓 学分商店 <span class="dim">— 学分: ' + SG.M.credit + '</span></h2><div class="diff-list">';
        SG.CREDIT_ITEMS.forEach(function (it, i) {
            var lv = SG.M[it.key];
            html += '<button class="btn diff-btn" data-credit="' + i + '" data-key="' + (i + 1) + '">' +
                it.name + ' (' + it.cost + '学分) [等级 ' + lv + '/' + it.maxLv + ']' +
                (lv >= it.maxLv ? ' ✅' : '') + '</button>';
        });
        return html + '</div><div class="row-center"><button class="btn" data-action="title">← 返回</button></div></div>';
    }

    // ================= 帮助 =================
    function screenHelp() {
        return '<div class="screen help"><h2>📖 游戏说明</h2><div class="help-text">' +
            '<p>1. ❤️心态(HP): 归零则学期失败</p>' +
            '<p>2. ⚡精力: 每回合3点, 打出卡牌需要消耗</p>' +
            '<p>3. 😰压力: 0-100。高压力有负面效果, 但也是资源:</p>' +
            '<p>&nbsp;&nbsp;0-30 轻松(无负面) / 31-50 疲惫: 每回合初心态-1</p>' +
            '<p>&nbsp;&nbsp;51-70 焦虑: 心态-2, 少抽1张 / 71-90 崩溃边缘: 心态-4, 少抽2张, 精力-1</p>' +
            '<p>&nbsp;&nbsp;91-100 心态爆炸: 心态-8, 无法获得护盾</p>' +
            '<p>4. 🎓选课即构筑: 精英战胜利后可选择课程包(5张卡+被动)</p>' +
            '<p>&nbsp;&nbsp;理工=首张知识卡+3 / 文科=debuff+1层 / 商科=首张0费免费 / 艺术=首张牌-1费 / 外语=每回合多抽1张 / 体育=每回合+2护盾</p>' +
            '<p>5. 🗺️元气骑士式随机地图: 每阶段随机生成房间网格, 走到相邻房间推进, 击败首领房进入下一阶段</p>' +
            '<p>6. ✨新机制: 中毒(每回合持续掉血) / 昏睡(跳过行动) / 连击(出牌数) / 困惑 / 疲劳</p>' +
            '<p>7. 💥暴击: 基础5%概率, 幸运星再+10%, 暴击造成1.5倍伤害</p>' +
            '<p>8. ✏️卡牌升级: 休息点或商店可升级卡牌, 名称带+号</p>' +
            '<p>9. 😈隐藏Boss「毕业答辩」: 拥有2门以上课程时可在期末挑战(+50学分)</p>' +
            '<p>10. 🎓学分商店: 通关+100学分/失败+30学分, 可永久强化开局</p>' +
            '<p>11. 🖼️美术资源: 把AI生成的图放入 assets/cards|enemies|chars|events 目录即可显示</p>' +
            '<p>操作: 鼠标点击 / 数字键1-9 / E结束回合 / S查看状态</p></div>' +
            '<div class="row-center"><button class="btn" data-action="title">← 返回</button></div></div>';
    }

    // ================= 模态 =================
    function modalHTML(title, text, btns) {
        var b = btns.map(function (x) {
            return '<button class="btn btn-big" data-action="' + x.act + '" data-key="' + x.k + '">' + x.label + '</button>';
        }).join('');
        return '<div class="modal"><div class="modal-box"><h3>' + title + '</h3>' +
            '<div class="event-text">' + text + '</div><div class="row-center wrap">' + b + '</div></div></div>';
    }

    // ================= 辅助 =================
    function zoneNameOf(p) { return SG.zoneName(p); }
    function zoneIdxOf(p) { return SG.zoneIdx(p); }
    function StressCapOf() { return SG.stressCap(); }
    function baseEnergyOf() { return 3 + (SG.M.qe || 0); }

    // ================= 事件绑定 =================
    var targetMode = null;
    var G;

    function bindScreen(ph) {
        G = SG.state;
        if (ph !== 'battle') targetMode = null;

        switch (ph) {
            case 'title':
                el('[data-action="start"]', function () { SG.pickChar(0); render(); });
                el('[data-action="meta"]', function () { G.phase = 'meta'; render(); });
                el('[data-action="shop"]', function () { G.phase = 'creditshop'; render(); });
                el('[data-action="help"]', function () { G.phase = 'help'; render(); });
                break;
            case 'char':
                el('[data-char]', function () {
                    var i = +this.getAttribute('data-char');
                    SG.pickChar(i); render();
                });
                el('[data-action="back"]', function () { G.phase = 'title'; render(); });
                break;
            case 'diff':
                el('[data-diff]', function () {
                    SG.pickDiff(+this.getAttribute('data-diff')); render();
                });
                el('[data-action="back"]', function () { G.phase = 'char'; render(); });
                break;
            case 'bonus':
                el('[data-bonus]', function () {
                    SG.pickBonus(+this.getAttribute('data-bonus')); render();
                });
                el('[data-action="back"]', function () { G.phase = 'diff'; render(); });
                break;
            case 'map':
                el('[data-go]', function () {
                    SG.mapGo(+this.getAttribute('data-go')); render();
                });
                el('[data-action="status"]', function () { G.phase = 'status'; render(); });
                break;
            case 'battle':
                bindBattle();
                break;
            case 'reward':
                el('[data-reward]', function () {
                    SG.rewardPick(+this.getAttribute('data-reward')); render();
                });
                break;
            case 'course':
                el('[data-course]', function () {
                    SG.coursePick(+this.getAttribute('data-course')); render();
                });
                break;
            case 'event':
                el('[data-event]', function () {
                    SG.eventPick(+this.getAttribute('data-event')); render();
                });
                break;
            case 'rest':
                el('[data-rest]', function () {
                    SG.restPick(+this.getAttribute('data-rest')); render();
                });
                break;
            case 'upgrade':
                el('[data-up]', function () {
                    SG.upgradePick(+this.getAttribute('data-up'), false); render();
                });
                el('[data-action="upback"]', function () { G.restUpgrading = false; G.phase = 'map'; render(); });
                break;
            case 'shop':
                bindShop();
                break;
            case 'chest':
                el('[data-action="chestnext"]', function () { SG.chestNext(); render(); });
                break;
            case 'bossintro':
                el('[data-action="bossfight"]', function () { SG.bossStartBattle(false); render(); });
                el('[data-action="hiddentrue"]', function () { SG.bossStartBattle(true); render(); });
                el('[data-action="hiddenfalse"]', function () { SG.bossStartBattle(false); render(); });
                break;
            case 'stageend':
                el('[data-action="stagenext"]', function () { SG.stageNext(); render(); });
                break;
            case 'win':
            case 'lose':
                el('[data-action="title"]', function () { SG.backToTitle(); render(); });
                break;
            case 'status':
                el('[data-action="backmap"]', function () { G.phase = 'map'; render(); });
                break;
            case 'meta':
            case 'help':
            case 'creditshop':
                el('[data-action="title"]', function () { G.phase = 'title'; render(); });
                el('[data-credit]', function () {
                    SG.creditBuy(+this.getAttribute('data-credit')); render();
                });
                break;
        }
    }

    function bindBattle() {
        var B = SG.state.battle;
        var P = SG.state.run.P;
        if (B.prompt) {
            el('[data-action="prompt-yes"]', function () { SG.bossAnswer(true); render(); });
            el('[data-action="prompt-no"]', function () { SG.bossAnswer(false); render(); });
            return;
        }
        if (B.over) return;
        el('[data-action="endturn"]', function () { SG.battleEndTurn(); render(); });
        el('[data-hand]', function () {
            var i = +this.getAttribute('data-hand');
            if (targetMode !== null) return;
            if (SG.battleNeedsTarget(i)) {
                targetMode = i;
                render();
            } else {
                SG.battlePlayCard(i, 0);
                render();
            }
        });
        el('[data-enemy]', function () {
            if (targetMode === null) return;
            var ei = +this.getAttribute('data-enemy');
            var i = targetMode;
            targetMode = null;
            SG.battlePlayCard(i, ei);
            render();
        });
    }

    function bindShop() {
        var S = SG.state.shopStock;
        if (!S) return;
        if (S.removing) {
            el('[data-remove]', function () {
                SG.shopRemovePick(+this.getAttribute('data-remove')); render();
            });
            el('[data-action="upback"]', function () { S.removing = false; render(); });
            return;
        }
        if (S.upgrading) {
            el('[data-up]', function () {
                SG.shopUpgradePick(+this.getAttribute('data-up')); render();
            });
            el('[data-action="upback"]', function () { S.upgrading = false; render(); });
            return;
        }
        el('[data-buy]', function () {
            var v = this.getAttribute('data-buy');
            if (v[0] === 'c') SG.shopBuy('card', +v.slice(1));
            else SG.shopBuy('item', +v.slice(1));
            render();
        });
        el('[data-action="shopremove"]', function () { SG.shopRemoveMode(); render(); });
        el('[data-action="shopupgrade"]', function () { SG.shopUpgradeMode(); render(); });
        el('[data-action="shopleave"]', function () { SG.shopLeave(); render(); });
    }

    // ================= 键盘 =================
    document.addEventListener('keydown', function (e) {
        var key = e.key.toLowerCase();
        if (key === 'e' && SG.phase() === 'battle') {
            var btn = app.querySelector('[data-action="endturn"]');
            if (btn) btn.click();
            return;
        }
        if (key === 's' && SG.phase() === 'map') {
            var st = app.querySelector('[data-action="status"]');
            if (st) st.click();
            return;
        }
        if (key === 'y' || key === 'n') {
            var pb = app.querySelector('[data-key="' + key + '"]');
            if (pb) pb.click();
            return;
        }
        if (/^[0-9]$/.test(key)) {
            var b = app.querySelector('[data-key="' + key + '"]');
            if (b) b.click();
            return;
        }
        if (/^[1-9]$/.test(key) && SG.phase() === 'battle') {
            var i = +key - 1;
            var card = app.querySelector('[data-hand="' + i + '"]');
            if (card) card.click();
        }
    });

    // ================= 初始化 =================
    SG.initCards();
    SG.loadMeta();
    preloadArt();
    render();
})();
