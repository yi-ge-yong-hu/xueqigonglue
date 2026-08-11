/* =========================================================
   《学期攻略》网页版 - 游戏核心逻辑 (由 semester_full.cpp 移植)
   纯逻辑, 不依赖 DOM, 可在 Node 中无头测试
   ========================================================= */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) module.exports = factory();
    else root.SG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ================= 随机数 =================
    var _seed = 12345;
    function setSeed(s) { _seed = s; }
    function rand() {
        _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
        var t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function rnd(a, b) { return a + Math.floor(rand() * (b - a + 1)); }

    // ================= 常量 =================
    var BASE_MORALE = 80, BASE_ENERGY = 3, BASE_DRAW = 5;
    var CT_KNOW = 0, CT_MORAL = 1, CT_SOCIAL = 2, CT_STRESS = 3;
    var IA_ATTACK = 1, IA_STRESS = 2, IA_SHIELD = 3, IA_BUFF = 4, IA_DEBUFF = 5;

    var SP_NONE = 0, SP_LOWHP_PLUS = 1, SP_CHAIN = 2, SP_ENERGY_DMG = 3,
        SP_STRESS_X2 = 4, SP_LEARN = 5, SP_STRESS_ENG = 6, SP_MONOPOLY = 7,
        SP_NEXT_COST = 8, SP_DEAD_DASH = 9, SP_STRESS_DR = 10, SP_SLOUGH = 11,
        SP_DEBUFF_BONUS = 12, SP_STRESS_LOW = 13, SP_POISON = 14, SP_SLEEP = 15,
        SP_COMBO = 16;

    var C_SCI = 1, C_LIT = 2, C_BIZ = 4, C_ART = 8, C_ENG = 16, C_PE = 32;

    var RS_BATTLE = 0, RS_ELITE = 1, RS_BOSS = 2, RS_EVENT = 3,
        RS_REST = 4, RS_SHOP = 5, RS_CHEST = 6;

    // ================= 卡牌数据 =================
    // 字段: name desc type cost dmg shield heal stUp stDown draw energy debuff debVal pierce special aoe up
    var CARDS = [];
    var GEN_POOL = [];
    var gMath = [], gLit = [], gBiz = [], gArt = [], gEng = [], gPe = [];
    var STARTER_DECK = []; // 卡ID列表

    function addCard(n, d, t, c, dm, sh, he, su, sd, dr, en, db, dv, pi, sp) {
        CARDS.push({ name: n, desc: d, type: t, cost: c, dmg: dm, shield: sh, heal: he,
            stUp: su, stDown: sd, draw: dr, energy: en, debuff: db, debVal: dv,
            pierce: pi, special: sp, aoe: 0, up: 0 });
    }

    function initCards() {
        CARDS.length = 0; GEN_POOL.length = 0;
        STARTER_DECK = [0, 0, 0, 1, 1, 2, 3, 4, 5, 6];
        // 初始卡组 (0-4)
        addCard('认真听讲', '造成6点知识伤害。', CT_KNOW, 1, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); //0
        addCard('做笔记', '获得5点心态护盾。', CT_MORAL, 1, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); //1
        addCard('课间休息', '恢复3点心态,降低2点压力。', CT_MORAL, 1, 0, 0, 3, 0, 2, 0, 0, 0, 0, 0, SP_NONE); //2
        addCard('临时抱佛脚', '造成10点伤害,增加3点压力。', CT_STRESS, 1, 10, 0, 0, 3, 0, 0, 0, 0, 0, 0, SP_NONE); //3
        addCard('摸鱼', '获得4点护盾,增加2点压力。', CT_MORAL, 0, 0, 4, 0, 2, 0, 0, 0, 0, 0, 0, SP_NONE); //4
        // 理工科: 高等数学
        addCard('微积分', '造成8点伤害。若敌人HP低于50%,额外4点。', CT_KNOW, 1, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_LOWHP_PLUS); //5
        gMath[0] = CARDS.length - 1;
        addCard('线性代数', '造成12点伤害,无视50%护盾。', CT_KNOW, 2, 12, 0, 0, 0, 0, 0, 0, 0, 0, 1, SP_NONE); //6
        gMath[1] = CARDS.length - 1;
        addCard('数学归纳法', '造成4点伤害,抽1张。若本回合已打知识卡,再+4。', CT_KNOW, 1, 4, 0, 0, 0, 0, 1, 0, 0, 0, 0, SP_CHAIN); //7
        gMath[2] = CARDS.length - 1;
        addCard('极限运算', '造成X点伤害,X=当前精力*5。', CT_KNOW, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_ENERGY_DMG); //8
        gMath[3] = CARDS.length - 1;
        addCard('哥德巴赫猜想', '造成25点伤害。若压力大于50,伤害翻倍。', CT_KNOW, 3, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_STRESS_X2); //9
        gMath[4] = CARDS.length - 1;
        // 文科: 大学语文
        addCard('议论文', '对所有敌人造成4点伤害。', CT_KNOW, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); //10
        CARDS[CARDS.length - 1].aoe = 1;
        gLit[0] = CARDS.length - 1;
        addCard('修辞手法', '施加3层困惑(敌人每回合3伤/层)。', CT_KNOW, 1, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, SP_NONE); //11
        gLit[1] = CARDS.length - 1;
        addCard('引经据典', '造成6点伤害,抽2张牌。', CT_KNOW, 2, 6, 0, 0, 0, 0, 2, 0, 0, 0, 0, SP_NONE); //12
        gLit[2] = CARDS.length - 1;
        addCard('长篇大论', '所有敌人获得5层疲劳(攻击-2/层)。', CT_KNOW, 2, 0, 0, 0, 0, 0, 0, 0, 2, 5, 0, SP_NONE); //13
        CARDS[CARDS.length - 1].aoe = 1;
        gLit[3] = CARDS.length - 1;
        addCard('舌战群儒', '造成12点伤害,施加3层困惑(全体)。', CT_KNOW, 3, 12, 0, 0, 0, 0, 0, 0, 1, 3, 0, SP_NONE); //14
        CARDS[CARDS.length - 1].aoe = 1;
        gLit[4] = CARDS.length - 1;
        // 商科: 微观经济学
        addCard('成本核算', '获得1点精力(本回合有效)。', CT_SOCIAL, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, SP_NONE); //15
        gBiz[0] = CARDS.length - 1;
        addCard('风险投资', '抽2张牌,增加3点压力。', CT_SOCIAL, 1, 0, 0, 0, 3, 0, 2, 0, 0, 0, 0, SP_NONE); //16
        gBiz[1] = CARDS.length - 1;
        addCard('复利效应', '获得2层学习buff(每回合初抽1张,持续3回合)。', CT_SOCIAL, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_LEARN); //17
        gBiz[2] = CARDS.length - 1;
        addCard('资源优化', '将所有压力转化为精力(每5点压力=1精力)。', CT_SOCIAL, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_STRESS_ENG); //18
        gBiz[3] = CARDS.length - 1;
        addCard('垄断', '本回合所有卡牌费用-2,每打出一张牌+1精力。', CT_SOCIAL, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_MONOPOLY); //19
        gBiz[4] = CARDS.length - 1;
        // 艺术课: 艺术鉴赏
        addCard('素描', '造成5点伤害。若敌人有debuff,再+3。', CT_KNOW, 1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_DEBUFF_BONUS); //20
        gArt[0] = CARDS.length - 1;
        addCard('调色盘', '获得5点护盾,获得1点精力。', CT_MORAL, 1, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0, SP_NONE); //21
        gArt[1] = CARDS.length - 1;
        addCard('湖畔写生', '恢复5点心态,降低3点压力。', CT_MORAL, 1, 0, 0, 5, 0, 3, 0, 0, 0, 0, 0, SP_NONE); //22
        gArt[2] = CARDS.length - 1;
        addCard('泼墨', '对所有敌人造成2点伤害,施加2层困惑。', CT_KNOW, 2, 2, 0, 0, 0, 0, 0, 0, 1, 2, 0, SP_NONE); //23
        CARDS[CARDS.length - 1].aoe = 1;
        gArt[3] = CARDS.length - 1;
        addCard('艺术展', '所有敌人获得3层疲劳,抽2张牌。', CT_SOCIAL, 3, 0, 0, 0, 0, 2, 0, 2, 3, 0, SP_NONE); //24
        CARDS[CARDS.length - 1].aoe = 1;
        gArt[4] = CARDS.length - 1;
        // 外语课: 大学英语
        addCard('词汇量碾压', '造成8点伤害。', CT_KNOW, 1, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); //25
        gEng[0] = CARDS.length - 1;
        addCard('口语对线', '获得6点护盾,获得1点精力。', CT_MORAL, 1, 0, 6, 0, 0, 0, 0, 1, 0, 0, 0, SP_NONE); //26
        gEng[1] = CARDS.length - 1;
        addCard('四六级冲刺', '造成13点伤害。若压力低于50,再+5。', CT_KNOW, 2, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_STRESS_LOW); //27
        gEng[2] = CARDS.length - 1;
        addCard('晨读打卡', '获得4点护盾,抽1张牌。', CT_MORAL, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, SP_NONE); //28
        gEng[3] = CARDS.length - 1;
        addCard('英语演讲', '对所有敌人造成8点伤害。', CT_KNOW, 3, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); //29
        CARDS[CARDS.length - 1].aoe = 1;
        gEng[4] = CARDS.length - 1;
        // 体育课
        addCard('晨跑', '恢复4点心态,抽1张牌。', CT_MORAL, 1, 0, 0, 4, 0, 0, 1, 0, 0, 0, 0, SP_NONE); //30
        gPe[0] = CARDS.length - 1;
        addCard('俯卧撑', '造成9点伤害,增加1点压力。', CT_STRESS, 1, 9, 0, 0, 1, 0, 0, 0, 0, 0, 0, SP_NONE); //31
        gPe[1] = CARDS.length - 1;
        addCard('篮球赛', '造成12点伤害。若敌人有debuff,再+6。', CT_KNOW, 2, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_DEBUFF_BONUS); //32
        gPe[2] = CARDS.length - 1;
        addCard('拉伸运动', '降低4点压力,获得3点护盾。', CT_MORAL, 0, 0, 3, 0, 0, 4, 0, 0, 0, 0, 0, SP_NONE); //33
        gPe[3] = CARDS.length - 1;
        addCard('运动会冲刺', '造成18点伤害,无视50%护盾。', CT_KNOW, 3, 18, 0, 0, 0, 0, 0, 0, 0, 0, 1, SP_NONE); //34
        gPe[4] = CARDS.length - 1;
        // 通用卡池
        addCard('划重点', '造成8点伤害。', CT_KNOW, 1, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //35
        addCard('思维导图', '获得8点护盾,抽1张牌。', CT_MORAL, 1, 0, 8, 0, 0, 0, 1, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //36
        addCard('小组讨论', '下回合所有卡牌费用-1。', CT_SOCIAL, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NEXT_COST); GEN_POOL.push(CARDS.length - 1); //37
        addCard('深呼吸', '降低6点压力。', CT_MORAL, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //38
        addCard('睡前复习', '恢复4点心态,降低3点压力。', CT_MORAL, 1, 0, 0, 4, 0, 3, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //39
        addCard('考前突击', '造成9点伤害。', CT_KNOW, 2, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //40
        addCard('通宵爆肝', '造成15点伤害,增加8点压力。', CT_STRESS, 2, 15, 0, 0, 8, 0, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //41
        addCard('死线冲刺', '消耗所有压力,每点压力造成2点伤害。', CT_STRESS, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_DEAD_DASH); GEN_POOL.push(CARDS.length - 1); //42
        addCard('压力转化', '消耗10点压力,抽3张牌。', CT_SOCIAL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_STRESS_DR); GEN_POOL.push(CARDS.length - 1); //43
        addCard('摆烂', '获得与压力1/2相等的护盾。', CT_STRESS, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_SLOUGH); GEN_POOL.push(CARDS.length - 1); //44
        addCard('刷题', '造成6点伤害,抽1张牌。', CT_KNOW, 1, 6, 0, 0, 0, 0, 1, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //45
        addCard('抱大腿', '抽2张牌,增加1点压力。', CT_SOCIAL, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //46
        addCard('番茄工作法', '获得1点精力。', CT_SOCIAL, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //47
        addCard('抄作业', '抽1张牌。', CT_SOCIAL, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //48
        addCard('小组聚餐', '恢复6点心态,增加2点压力。', CT_MORAL, 1, 0, 0, 6, 2, 0, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //49
        addCard('二手笔记', '抽1张牌,降低2点压力。', CT_SOCIAL, 1, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //50
        addCard('高分喷雾', '造成10点伤害,无视50%护盾。', CT_KNOW, 2, 10, 0, 0, 0, 0, 0, 0, 0, 0, 1, SP_NONE); GEN_POOL.push(CARDS.length - 1); //51
        addCard('摸底考试', '造成6点伤害。若敌人有疲劳,再+3。', CT_KNOW, 1, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_DEBUFF_BONUS); GEN_POOL.push(CARDS.length - 1); //52
        addCard('冥想', '恢复5点心态,抽1张牌。', CT_MORAL, 1, 0, 0, 5, 0, 0, 1, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //53
        addCard('图书馆通宵', '造成13点伤害,增加6点压力。', CT_STRESS, 2, 13, 0, 0, 6, 0, 0, 0, 0, 0, 0, SP_NONE); GEN_POOL.push(CARDS.length - 1); //54
        addCard('投毒', '造成2点伤害,施加3层中毒(每回合3伤/层,逐层衰减)。', CT_KNOW, 1, 2, 0, 0, 0, 0, 0, 0, 0, 3, 0, SP_POISON); GEN_POOL.push(CARDS.length - 1); //55
        addCard('催眠曲', '造成3点伤害,使目标昏睡1回合(跳过行动)。', CT_SOCIAL, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_SLEEP); GEN_POOL.push(CARDS.length - 1); //56
        addCard('连续出招', '造成4点伤害。本回合连击数>=3时再+6。', CT_KNOW, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, SP_COMBO); GEN_POOL.push(CARDS.length - 1); //57
    }

    function cardName(c) { return c.up ? (c.name + '+') : c.name; }

    function cloneCard(id) {
        var c = CARDS[id];
        return { name: c.name, desc: c.desc, type: c.type, cost: c.cost, dmg: c.dmg,
            shield: c.shield, heal: c.heal, stUp: c.stUp, stDown: c.stDown, draw: c.draw,
            energy: c.energy, debuff: c.debuff, debVal: c.debVal, pierce: c.pierce,
            special: c.special, aoe: c.aoe, up: 0, _id: id };
    }

    function upgradeCard(c) {
        if (c.up) return;
        if (c.dmg > 0) c.dmg += 1;
        if (c.shield > 0) c.shield += 2;
        if (c.heal > 0) c.heal += 1;
        if (c.stDown > 0) c.stDown += 2;
        if (c.draw > 0) c.draw += 1;
        if (c.energy > 0) c.energy += 1;
        if (c.debVal > 0) c.debVal += 2;
        c.up = 1;
    }
    function canUpgrade(c) {
        if (c.up) return false;
        return (c.dmg > 0 || c.shield > 0 || c.heal > 0 || c.stDown > 0 ||
            c.draw > 0 || c.energy > 0 || c.debVal > 0);
    }

    // ================= 物品 =================
    var itemDB = [
        { name: '咖啡', desc: '每回合开始精力+1,但每回合增加2点压力。' },
        { name: '保温杯', desc: '每回合开始降低2点压力。' },
        { name: '笔记本电脑', desc: '战斗开始时抽2张牌。' },
        { name: '学霸笔记', desc: '知识卡伤害+20%。' },
        { name: '降噪耳机', desc: '压力负面效果阈值提高20。' },
        { name: '奶茶', desc: '每场战斗开始时恢复5点心态。' },
        { name: '游戏手柄', desc: '休息点效果翻倍。' },
        { name: '锦鲤挂件', desc: '卡牌奖励多1个选项。' },
        { name: '死线战士徽章', desc: '压力大于50时,所有卡牌费用-1。' },
        { name: '幸运星', desc: '暴击率+10%。(基础暴击率5%)' },
        { name: '社团笔记本', desc: '战斗金币奖励+50%。' }
    ];

    // ================= 元进度 (存档) =================
    var META_KEY = 'semesterWeb_meta_v1';
    var M = { wins: 0, losses: 0, lit: 0, biz: 0, artc: 0, trans: 0, rep: 0,
        eng: 0, pe: 0, exch: 0, credit: 0, qg: 0, qh: 0, qb: 0, qe: 0, qs: 0,
        maxDiffWon: 0, hiddenBoss: 0 };

    function saveMeta() {
        try { localStorage.setItem(META_KEY, JSON.stringify(M)); } catch (e) {}
    }
    function loadMeta() {
        try {
            var s = localStorage.getItem(META_KEY);
            if (s) { var o = JSON.parse(s); for (var k in M) if (o[k] !== undefined) M[k] = o[k]; }
        } catch (e) {}
    }

    // ================= 全局局内变量 =================
    var Difficulty = 0, StressCap = 100, CharSel = 0;

    // ================= 玩家 =================
    function newPlayer() {
        return { morale: 0, energy: 0, stress: 0, gold: 0, shield: 0, fatigue: 0,
            learnVal: 0, learnTurns: 0, costDownActive: 0, nextCostDown: 0,
            nextShieldBonus: 0, artInspire: 1, combo: 0, econFree: true,
            knowPlayed: false, monopoly: false, courses: 0, items: [],
            deck: [], draw: [], hand: [], discard: [] };
    }

    function hasItem(p, idx) { return p.items.indexOf(idx) >= 0; }
    function addItem(p, idx) {
        if (hasItem(p, idx)) return;
        if (p.items.length >= 6) return;
        p.items.push(idx);
    }

    // ================= 抽牌/洗牌 =================
    function myShuffle(v) {
        for (var i = v.length - 1; i > 0; i--) {
            var j = rnd(0, i);
            var t = v[i]; v[i] = v[j]; v[j] = t;
        }
    }
    function drawCards(p, n) {
        while (n > 0) {
            if (p.draw.length === 0) {
                if (p.discard.length === 0) break;
                p.draw = p.discard;
                p.discard = [];
                myShuffle(p.draw);
            }
            p.hand.push(p.draw.pop());
            n--;
        }
    }

    // ================= 压力区间 =================
    function zoneIdx(p) {
        var eff = p.stress;
        if (hasItem(p, 4)) eff -= 20;
        if (CharSel === 2) eff -= 10;
        if (Difficulty >= 8) eff += 10;
        if (eff < 0) eff = 0;
        if (eff > 90) return 4;
        if (eff > 70) return 3;
        if (eff > 50) return 2;
        if (eff > 30) return 1;
        return 0;
    }
    function zoneName(p) {
        switch (zoneIdx(p)) {
            case 0: return '轻松';
            case 1: return '疲惫';
            case 2: return '焦虑';
            case 3: return '崩溃边缘';
            default: return '心态爆炸';
        }
    }

    // ================= 敌人 =================
    function makeEnemy(kind, factor) {
        var e = { name: '', id: 0, hp: 0, maxHp: 0, atkBuff: 0, shield: 0,
            confuse: 0, tired: 0, poison: 0, sleep: 0, intentT: 0, intentV: 0,
            intentV2: 0, idx: 0, phase: 0, phaseTurn: 0, doubleAtk: false, revived: false };
        var base = 25;
        if (kind === 0) { e.name = '随堂小测'; e.id = 0; base = 25; }
        else if (kind === 1) { e.name = '作业Deadline'; e.id = 1; base = 35; }
        else if (kind === 2) { e.name = '小组作业·猪队友'; e.id = 2; base = 30; }
        else if (kind === 3) { e.name = '课程论文(精英)'; e.id = 3; base = 60; }
        else if (kind === 4) { e.name = '期中考试(精英)'; e.id = 4; base = 80; }
        else if (kind === 5) { e.name = '期末考试(BOSS)'; e.id = 5; base = 150; }
        else if (kind === 6) { e.name = '早八查岗'; e.id = 6; base = 28; }
        else if (kind === 7) { e.name = '吃瓜同桌'; e.id = 7; base = 32; }
        else if (kind === 8) { e.name = '社团面试(精英)'; e.id = 8; base = 110; }
        else { e.name = '毕业答辩(隐藏BOSS)'; e.id = 9; base = 180; }

        var isNormal = (e.id <= 2 || e.id === 6 || e.id === 7);
        var isElite = (e.id === 3 || e.id === 4 || e.id === 8);
        if (isNormal && Difficulty >= 1) base = Math.floor(base * 1.10);
        if (isElite && Difficulty >= 2) base = Math.floor(base * 1.15);
        if ((e.id === 5 || e.id === 9) && Difficulty >= 3) base = Math.floor(base * 1.20);

        e.maxHp = Math.floor(base * factor);
        if (e.maxHp < 1) e.maxHp = 1;
        e.hp = e.maxHp;
        return e;
    }

    function intentName(t) {
        if (t === IA_ATTACK) return '攻击';
        if (t === IA_STRESS) return '施压';
        if (t === IA_SHIELD) return '防御';
        if (t === IA_BUFF) return '划水/强化';
        if (t === IA_DEBUFF) return '施加负面';
        return '-';
    }

    function enemyIntent(e) {
        var i = e.idx, tp = IA_ATTACK, v = 0, v2 = 0;
        switch (e.id) {
            case 0: tp = IA_ATTACK; v = (i % 2 === 0) ? 5 : 7; break;
            case 1:
                if (i % 3 === 0) { tp = IA_STRESS; v = 5; }
                else if (i % 3 === 1) { tp = IA_ATTACK; v = 8; }
                else { tp = IA_SHIELD; v = 8; }
                break;
            case 2:
                if (i % 3 === 0) { tp = IA_BUFF; v = 0; }
                else if (i % 3 === 1) { tp = IA_ATTACK; v = 6; v2 = 3; }
                else { tp = IA_DEBUFF; v = 2; }
                break;
            case 3:
                if (i % 4 === 0) { tp = IA_ATTACK; v = 8; }
                else if (i % 4 === 1) { tp = IA_SHIELD; v = 10; }
                else if (i % 4 === 2) { tp = IA_ATTACK; v = 10; v2 = 5; }
                else { tp = IA_ATTACK; v = 15; }
                break;
            case 4: {
                var r = e.hp / e.maxHp;
                if (r > 0.60) { tp = IA_ATTACK; v = 6; }
                else if (r > 0.30) {
                    if (i % 2 === 0) { tp = IA_ATTACK; v = 10; }
                    else { tp = IA_STRESS; v = 8; }
                } else {
                    tp = IA_ATTACK; v = 8;
                    if (i % 2 === 0) v += 3;
                }
                break;
            }
            case 5: {
                var r5 = e.hp / e.maxHp;
                if (e.revived) {
                    if (e.phaseTurn % 2 === 0) { tp = IA_ATTACK; v = 12; }
                    else { tp = IA_STRESS; v = 6; }
                    break;
                }
                if (r5 > 0.70) {
                    if (i % 3 === 0) { tp = IA_ATTACK; v = 8; }
                    else if (i % 3 === 1) { tp = IA_ATTACK; v = 6; v2 = 4; }
                    else { tp = IA_SHIELD; v = 12; }
                } else if (r5 > 0.40) {
                    if (i % 3 === 0) { tp = IA_STRESS; v = 10; }
                    else if (i % 3 === 1) { tp = IA_ATTACK; v = 12; }
                    else { tp = IA_ATTACK; v = 15; }
                } else {
                    tp = IA_ATTACK; v = 10 + (e.phaseTurn - 1) * 2;
                }
                break;
            }
            case 6:
                if (i % 3 === 0) { tp = IA_ATTACK; v = 4; }
                else if (i % 3 === 1) { tp = IA_ATTACK; v = 9; }
                else { tp = IA_SHIELD; v = 3; }
                break;
            case 7:
                if (i % 3 === 0) { tp = IA_STRESS; v = 3; }
                else if (i % 3 === 1) { tp = IA_ATTACK; v = 7; }
                else { tp = IA_ATTACK; v = 6; v2 = 2; }
                break;
            case 8: {
                var r8 = e.hp / e.maxHp;
                if (r8 > 0.50) {
                    if (i % 3 === 0) { tp = IA_ATTACK; v = 7; }
                    else if (i % 3 === 1) { tp = IA_STRESS; v = 6; }
                    else { tp = IA_SHIELD; v = 8; }
                } else {
                    tp = IA_ATTACK; v = 9;
                    if (i % 2 === 0) v += 2;
                }
                break;
            }
            case 9: {
                var r9 = e.hp / e.maxHp;
                if (r9 > 0.66) {
                    if (i % 3 === 0) { tp = IA_ATTACK; v = 9; }
                    else if (i % 3 === 1) { tp = IA_SHIELD; v = 10; }
                    else { tp = IA_STRESS; v = 6; }
                } else if (r9 > 0.33) {
                    if (i % 2 === 0) { tp = IA_ATTACK; v = 12; }
                    else { tp = IA_ATTACK; v = 8; v2 = 5; }
                } else {
                    tp = IA_ATTACK; v = 14;
                    if (i % 2 === 0) v += 4;
                }
                break;
            }
        }
        e.intentT = tp; e.intentV = v; e.intentV2 = v2;
    }

    // ================= 回合开始 =================
    function turnStart(p, log) {
        p.econFree = true;
        p.knowPlayed = false;
        p.monopoly = false;
        p.artInspire = 1;
        p.combo = 0;
        p.costDownActive = p.nextCostDown;
        p.nextCostDown = 0;

        var z = zoneIdx(p);
        if (z === 1) { p.morale -= 1; log.push('【疲惫】心态-1'); }
        else if (z === 2) { p.morale -= 2; log.push('【焦虑】心态-2, 少抽1张'); }
        else if (z === 3) { p.morale -= 4; log.push('【崩溃边缘】心态-4, 少抽2张, 精力-1'); }
        else if (z === 4) { p.morale -= 8; log.push('【心态爆炸】心态-8, 无法获得护盾'); }

        var drawN = BASE_DRAW;
        if (z === 2) drawN -= 1;
        if (z >= 3) drawN -= 2;
        if (Difficulty >= 9) drawN -= 1;
        if (p.learnTurns > 0) { drawN += p.learnVal; p.learnTurns--; }
        if (p.courses & C_ENG) drawN += 1;
        if (drawN < 0) drawN = 0;
        drawCards(p, drawN);

        p.energy = BASE_ENERGY;
        if (M.qe > 0) p.energy += M.qe;
        if (hasItem(p, 0)) { p.energy++; p.stress += 2; }
        if (hasItem(p, 1)) { p.stress -= 2; if (p.stress < 0) p.stress = 0; }
        if (z >= 3) p.energy--;
        if (p.energy < 0) p.energy = 0;

        if ((p.courses & C_PE) && z < 4) p.shield += 2;
        if (p.morale < 0) p.morale = 0;
    }

    // ================= 伤害结算 =================
    function dealDamageTo(e, dmg) {
        if (dmg <= 0) return;
        if (e.shield > 0) {
            var g = (dmg < e.shield) ? dmg : e.shield;
            e.shield -= g; dmg -= g;
        }
        if (dmg > 0) e.hp -= dmg;
    }

    // ================= 打出卡牌 =================
    function cardCost(p, c) {
        var cost = c.cost;
        if (p.costDownActive > 0) cost--;
        if (p.monopoly) cost -= 2;
        if (hasItem(p, 8) && p.stress > 50) cost--;
        if ((p.courses & C_ART) && p.artInspire) cost--;
        if (cost < 0) cost = 0;
        return cost;
    }

    function useCard(p, es, handIdx, target, log) {
        if (handIdx < 0 || handIdx >= p.hand.length) return false;
        var c = p.hand[handIdx];

        var cost = cardCost(p, c);
        if ((p.courses & C_ART) && p.artInspire) p.artInspire = 0;
        if (p.econFree && cost === 0) { p.econFree = false; cost = 0; }
        if (p.energy < cost) { log.push('精力不足!'); return false; }
        p.energy -= cost;

        var isKnow = (c.type === CT_KNOW);
        var hasKnowledgeBefore = p.knowPlayed;
        if (isKnow) p.knowPlayed = true;

        if (!c.aoe && es.length > 0) {
            if (target < 0 || target >= es.length || es[target].hp <= 0) {
                for (target = 0; target < es.length; target++)
                    if (es[target].hp > 0) break;
            }
        }

        var dmg = c.dmg;
        if (c.special === SP_ENERGY_DMG) dmg = p.energy * 5;
        if (c.special === SP_LOWHP_PLUS && target >= 0 && target < es.length &&
            es[target].maxHp > 0 && es[target].hp * 2 < es[target].maxHp) dmg += 4;
        if (c.special === SP_CHAIN && hasKnowledgeBefore) dmg += 4;
        if (c.special === SP_STRESS_X2 && p.stress > 50) dmg *= 2;
        if (c.special === SP_DEAD_DASH) dmg = p.stress * 2;
        if (c.special === SP_DEBUFF_BONUS && target >= 0 && target < es.length &&
            (es[target].confuse > 0 || es[target].tired > 0 || es[target].poison > 0)) dmg += 3;
        if (c.special === SP_STRESS_LOW && p.stress < 50) dmg += 5;
        if (c.special === SP_COMBO && p.combo >= 3) dmg += 6;
        if (hasItem(p, 3) && isKnow) dmg = Math.floor(dmg * 6 / 5);
        if ((p.courses & C_SCI) && isKnow && !hasKnowledgeBefore) dmg += 3;
        if (p.fatigue > 0) { dmg -= p.fatigue * 2; if (dmg < 0) dmg = 0; }

        var critCh = 5;
        if (hasItem(p, 9)) critCh += 10;
        var critted = false;
        if (dmg > 0 && rnd(1, 100) <= critCh) { dmg = Math.floor(dmg * 3 / 2); critted = true; }

        if (dmg > 0) {
            if (c.aoe) {
                for (var k = 0; k < es.length; k++) {
                    if (es[k].hp <= 0) continue;
                    var d = dmg;
                    if (c.pierce === 1) es[k].shield -= Math.floor(es[k].shield / 2);
                    dealDamageTo(es[k], d);
                }
            } else if (target >= 0 && target < es.length) {
                var dt = dmg;
                if (c.pierce === 1) es[target].shield -= Math.floor(es[target].shield / 2);
                dealDamageTo(es[target], dt);
            }
            p.combo++;
        }

        var z = zoneIdx(p);
        if (c.shield > 0 && z < 4) p.shield += c.shield;
        if (c.heal > 0) { p.morale += c.heal; if (p.morale > 100) p.morale = 100; }
        if (c.stUp > 0) { p.stress += c.stUp; if (p.stress > StressCap) p.stress = StressCap; }
        if (c.stDown > 0) { p.stress -= c.stDown; if (p.stress < 0) p.stress = 0; }
        if (c.special === SP_DEAD_DASH) p.stress = 0;
        if (c.draw > 0) drawCards(p, c.draw);
        if (c.energy > 0) p.energy += c.energy;

        if (c.debuff === 1 || c.debuff === 2) {
            var bonus = 0;
            if (p.courses & C_LIT) bonus = 1;
            if (c.aoe) {
                for (var k2 = 0; k2 < es.length; k2++) {
                    if (es[k2].hp <= 0) continue;
                    if (c.debuff === 1) es[k2].confuse += c.debVal + bonus;
                    else es[k2].tired += c.debVal + bonus;
                }
            } else if (target >= 0 && target < es.length) {
                if (c.debuff === 1) es[target].confuse += c.debVal + bonus;
                else es[target].tired += c.debVal + bonus;
            }
        }
        if (c.special === SP_POISON && target >= 0 && target < es.length)
            es[target].poison += c.debVal;
        if (c.special === SP_SLEEP && target >= 0 && target < es.length)
            es[target].sleep = 1;

        if (c.special === SP_NEXT_COST) p.nextCostDown = 1;
        if (c.special === SP_LEARN) { p.learnVal = 2; p.learnTurns = 3; }
        if (c.special === SP_STRESS_ENG) {
            var kk = Math.floor(p.stress / 5);
            p.energy += kk;
            p.stress -= kk * 5;
            log.push('压力转化为' + kk + '点精力!');
        }
        if (c.special === SP_MONOPOLY) p.monopoly = true;
        if (c.special === SP_STRESS_DR) {
            if (p.stress >= 10) { p.stress -= 10; drawCards(p, 3); log.push('消耗10压力,抽3张!'); }
            else log.push('压力不足10,转化失败');
        }
        if (c.special === SP_SLOUGH && z < 4) p.shield += Math.floor(p.stress / 2);
        if (p.monopoly) p.energy++;

        var played = cardName(c);
        var logMsg = '你打出【' + played + '】';
        if (dmg > 0) {
            logMsg += ' 造成' + (c.aoe ? '全体' : '') + dmg + '点伤害';
            if (critted) logMsg += ' ★暴击!';
        }
        log.push(logMsg);

        p.hand.splice(handIdx, 1);
        p.discard.push(c);
        return true;
    }

    function aliveCount(es) {
        var n = 0;
        for (var i = 0; i < es.length; i++) if (es[i].hp > 0) n++;
        return n;
    }
    function allDead(es) { return aliveCount(es) === 0; }

    // ================= 全局游戏状态 =================
    var G = {
        phase: 'title',          // title/char/diff/bonus/map/battle/reward/course/event/rest/shop/chest/bossintro/stageend/win/lose/status/meta/creditshop/help
        meta: M,
        run: null,               // 局内状态
        battle: null,            // 战斗状态
        reward: null,            // 卡牌奖励候选
        courseAvail: null,       // 课程奖励候选
        shopStock: null,
        unlockMsgs: [],
        pendingGold: 0,
        lastRoomType: -1
    };

    function startRun(charSel, diff, bonus) {
        CharSel = charSel;
        Difficulty = diff;
        var P = newPlayer();
        P.morale = BASE_MORALE;
        if (Difficulty >= 4) P.morale -= 10;
        if (CharSel === 0) P.gold += 15;
        if (M.qg > 0) P.gold += 20 * M.qg;
        if (M.qh > 0) P.morale += 5 * M.qh;
        if (bonus === 0) P.gold += 50;
        else if (bonus === 2) { P.morale += 20; StressCap = 110; }
        else if (bonus === 3) addItem(P, rnd(0, 10));
        if (P.morale > 100) P.morale = 100;

        P.deck = [];
        for (var i = 0; i < STARTER_DECK.length; i++) P.deck.push(cloneCard(STARTER_DECK[i]));
        if (Difficulty >= 5) { P.deck.push(cloneCard(6)); P.deck.push(cloneCard(6)); }
        if (bonus === 1) { giveRandomCard(P, -1, 0); giveRandomCard(P, -1, 0); }

        G.run = { P: P, stage: 0, rooms: [], cur: -1, maxZone: 0, wonHidden: 0, bonus: bonus };
        G.unlockMsgs = [];
        genStageMap(0, G.run.rooms);
        G.run.cur = findRoomIdx(G.run.rooms, G.run.rooms[0].row, 0);
        G.run.rooms[G.run.cur].cleared = true;
        G.phase = 'map';
    }

    // ================= 地图 =================
    function findRoomIdx(rooms, row, col) {
        for (var i = 0; i < rooms.length; i++)
            if (rooms[i].row === row && rooms[i].col === col) return i;
        return -1;
    }
    function roomTile(t) {
        if (t === RS_BATTLE) return '战';
        if (t === RS_ELITE) return '精';
        if (t === RS_BOSS) return 'Boss';
        if (t === RS_EVENT) return '事';
        if (t === RS_REST) return '休';
        if (t === RS_SHOP) return '商';
        return '宝';
    }
    function roomTypeName(t) {
        if (t === RS_BATTLE) return '战斗';
        if (t === RS_ELITE) return '精英';
        if (t === RS_BOSS) return '首领';
        if (t === RS_EVENT) return '事件';
        if (t === RS_REST) return '休息';
        if (t === RS_SHOP) return '商店';
        return '宝箱';
    }

    function genStageMap(stage, rooms) {
        rooms.length = 0;
        var C = (stage <= 1) ? 6 : 7;
        var startRow = rnd(0, 2);
        var rowsAt = [];
        for (var c = 0; c < C; c++) rowsAt.push([]);
        rowsAt[0].push(startRow);
        for (var cc = 1; cc < C - 1; cc++) {
            var n = 1;
            if (stage >= 2 && rnd(0, 1) === 0) n = 2;
            else if (rnd(0, 2) === 0) n = 2;
            while (rowsAt[cc].length < n) {
                var r = rnd(0, 2);
                if (rowsAt[cc].indexOf(r) < 0) rowsAt[cc].push(r);
            }
        }
        var bossRow = rowsAt[C - 2][rnd(0, rowsAt[C - 2].length - 1)];
        rowsAt[C - 1].push(bossRow);

        for (var c2 = 0; c2 < C; c2++)
            for (var k = 0; k < rowsAt[c2].length; k++) {
                rooms.push({ row: rowsAt[c2][k], col: c2, type: RS_BATTLE, cleared: false, next: [] });
            }

        for (var c3 = 0; c3 < C - 1; c3++) {
            for (var i = 0; i < rooms.length; i++) {
                if (rooms[i].col !== c3 + 1) continue;
                var cand = [];
                for (var j = 0; j < rooms.length; j++)
                    if (rooms[j].col === c3 && Math.abs(rooms[j].row - rooms[i].row) <= 1)
                        cand.push(j);
                if (cand.length === 0) {
                    for (var j2 = 0; j2 < rooms.length; j2++)
                        if (rooms[j2].col === c3) cand.push(j2);
                }
                var pp = cand[rnd(0, cand.length - 1)];
                rooms[i].next.push(pp);
                rooms[pp].next.push(i);
            }
        }

        // 连通性修复: 保证每个非首领房间都有向前的出口, 避免死路
        for (var c4 = 0; c4 < C - 1; c4++) {
            for (var i6 = 0; i6 < rooms.length; i6++) {
                if (rooms[i6].col !== c4) continue;
                if (rooms[i6].type === RS_BOSS) continue;
                var hasFwd = false;
                for (var k6 = 0; k6 < rooms[i6].next.length; k6++) {
                    if (rooms[rooms[i6].next[k6]].col === c4 + 1) { hasFwd = true; break; }
                }
                if (hasFwd) continue;
                var cand2 = [];
                for (var j6 = 0; j6 < rooms.length; j6++)
                    if (rooms[j6].col === c4 + 1) cand2.push(j6);
                if (cand2.length === 0) continue;
                var q = cand2[rnd(0, cand2.length - 1)];
                if (rooms[i6].next.indexOf(q) < 0) rooms[i6].next.push(q);
                if (rooms[q].next.indexOf(i6) < 0) rooms[q].next.push(i6);
            }
        }

        for (var i2 = 0; i2 < rooms.length; i2++) {
            var rr = rooms[i2];
            if (rr.col === 0) { rr.type = RS_BATTLE; continue; }
            if (rr.col === C - 1) { rr.type = RS_BOSS; continue; }
            var roll = rnd(0, 99);
            if (roll < (stage === 3 ? 50 : 56)) rr.type = RS_BATTLE;
            else if (roll < (stage === 3 ? 65 : 68)) rr.type = RS_EVENT;
            else if (roll < (stage === 3 ? 75 : 78)) rr.type = RS_REST;
            else if (roll < (stage === 3 ? 85 : 88)) rr.type = RS_SHOP;
            else if (roll < (stage === 3 ? 92 : 95)) rr.type = RS_CHEST;
            else rr.type = RS_ELITE;
            if (rr.col <= 1 && rr.type === RS_ELITE) rr.type = RS_BATTLE;
        }

        var eliteN = 0;
        for (var i3 = 0; i3 < rooms.length; i3++) if (rooms[i3].type === RS_ELITE) eliteN++;
        if (eliteN === 0) {
            for (var i4 = 0; i4 < rooms.length; i4++) {
                if (rooms[i4].col > 1 && rooms[i4].col < C - 1 && rooms[i4].type === RS_BATTLE) {
                    rooms[i4].type = RS_ELITE; break;
                }
            }
        }
        if (eliteN > 2) {
            var extra = eliteN - 2;
            for (var i5 = 0; i5 < rooms.length && extra > 0; i5++) {
                if (rooms[i5].type === RS_ELITE) { rooms[i5].type = RS_BATTLE; extra--; }
            }
        }
    }

    function mapAdjs() {
        var adjs = [];
        var cur = G.run.rooms[G.run.cur];
        for (var i = 0; i < cur.next.length; i++) {
            var t = cur.next[i];
            if (adjs.indexOf(t) < 0 && !G.run.rooms[t].cleared &&
                G.run.rooms[t].col > cur.col) adjs.push(t);
        }
        return adjs;
    }

    // ================= 战斗 =================
    function battleSetup(es, showBg) {
        var P = G.run.P;
        P.shield = 0;
        var shieldBonus = P.nextShieldBonus;
        P.nextShieldBonus = 0;
        P.nextCostDown = 0;
        P.fatigue = 0;
        P.learnVal = 0;
        P.learnTurns = 0;
        P.draw = [];
        P.hand = [];
        P.discard = [];
        P.draw = P.deck.slice();
        myShuffle(P.draw);
        if (hasItem(P, 2)) drawCards(P, 2);
        if (hasItem(P, 5)) { P.morale += 5; if (P.morale > 100) P.morale = 100; }
        if (CharSel === 1) drawCards(P, 2);
        if (CharSel === 3) { P.gold += 10; drawCards(P, 1); }
        if (shieldBonus > 0) P.shield = shieldBonus;
        for (var i = 0; i < es.length; i++) enemyIntent(es[i]);

        G.battle = { es: es, showBg: showBg, firstTurn: true, log: [], ei: 0, prompt: null, over: false };
        var log = G.battle.log;
        turnStart(P, log);
        if (P.morale <= 0) { battleDefeat(); return; }
        G.battle.over = false; G.battle.defeat = false;
    }

    function battleNeedsTarget(handIdx) {
        var P = G.run.P, c = P.hand[handIdx];
        if (!c) return false;
        return !c.aoe && aliveCount(G.battle.es) > 1 &&
            (c.dmg > 0 || c.debuff > 0 || c.special === SP_POISON || c.special === SP_SLEEP);
    }

    function canPlayCard(handIdx) {
        var P = G.run.P, c = P.hand[handIdx];
        if (!c) return false;
        return P.energy >= cardCost(P, c);
    }

    function battlePlayCard(handIdx, target) {
        var B = G.battle;
        if (B.over || B.prompt) return;
        var P = G.run.P;
        var ok = useCard(P, B.es, handIdx, target === undefined ? 0 : target, B.log);
        if (!ok) return { ok: false };
        if (allDead(B.es)) {
            battleCheckEnd();
        }
        return { ok: true, dead: allDead(B.es) };
    }

    // Boss 复活 / 胜利判定 (玩家回合结束时)
    function battleCheckEnd() {
        var B = G.battle, P = G.run.P;
        if (B.es.length === 1 && B.es[0].id === 5 && B.es[0].hp <= 0 &&
            Difficulty >= 10 && !B.es[0].revived) {
            B.es[0].revived = true;
            B.es[0].hp = 50;
            B.es[0].shield = 0;
            B.es[0].phaseTurn = 0;
            B.log.push('!!! 期末考试竟然还有第四阶段「补考」! 试卷重新发到你手里 !!!');
            battleEndTurn();
        } else if (allDead(B.es)) {
            battleVictory();
        }
    }

    // 结束回合 → 敌人阶段开始 (逐步执行)
    function battleEndTurn() {
        var B = G.battle, P = G.run.P;
        if (B.over || B.prompt) return;
        while (P.hand.length > 0) { P.discard.push(P.hand.pop()); }
        B.ei = 0;
        enemyPhaseStep();
    }

    // 执行一个敌人的行动; 返回 {done:true} 或 {prompt:...}
    function enemyPhaseStep() {
        var B = G.battle, P = G.run.P;
        var es = B.es;
        while (B.ei < es.length) {
            var e = es[B.ei];
            B.ei++;
            if (e.hp <= 0) continue;
            e.idx++;
            if (e.id === 5) {
                var r = e.hp / e.maxHp;
                if (e.revived) e.phaseTurn++;
                else {
                    var np = (r > 0.70) ? 0 : ((r > 0.40) ? 1 : 2);
                    if (np !== e.phase) { e.phase = np; e.phaseTurn = 1; }
                    else e.phaseTurn++;
                }
            }
            var msg = '>>> ' + e.name + ' 行动: ';

            if (e.sleep > 0) {
                e.sleep--;
                B.log.push(msg + '昏睡中, 打呼噜错过行动!');
                continue;
            }
            if (e.confuse > 0) {
                e.hp -= e.confuse;
                B.log.push(msg + '困惑造成' + e.confuse + '点伤害!');
                if (e.hp <= 0) { B.log.push(e.name + '倒下!!'); continue; }
            }
            if (e.poison > 0) {
                e.hp -= e.poison;
                B.log.push(msg + '中毒造成' + e.poison + '点伤害!');
                e.poison--;
                if (e.poison < 0) e.poison = 0;
                if (e.hp <= 0) { B.log.push(e.name + '倒下!!'); continue; }
            }

            var atk = e.intentV;
            if (e.tired > 0) { atk -= e.tired * 2; if (atk < 0) atk = 0; }

            if (e.intentT === IA_ATTACK) {
                if (e.id === 2 && e.doubleAtk) { atk *= 2; e.doubleAtk = false; }
                atk += e.atkBuff;
                var skipAtk = false;
                if (es.length === 1 && e.id === 5 && e.phase === 1 && e.intentV === 15) {
                    B.prompt = { kind: 'report', enemy: es.indexOf(e), atk: atk };
                    B.log.push(msg + '[Boss] 翻书作弊! 要举报吗?');
                    return { prompt: 'report' };
                }
                if (es.length === 1 && e.id === 5 && e.phase === 2 && e.idx % 3 === 0 && atk > 0) {
                    B.prompt = { kind: 'blank', enemy: es.indexOf(e), atk: atk };
                    B.log.push(msg + '[Boss] 交白卷吗? 交了立即失败');
                    return { prompt: 'blank' };
                }
                applyEnemyAttack(e, atk, skipAtk, B, msg);
            } else if (e.intentT === IA_STRESS) {
                P.stress += e.intentV;
                if (P.stress > StressCap) P.stress = StressCap;
                B.log.push(msg + '施压+' + e.intentV + '压力');
            } else if (e.intentT === IA_SHIELD) {
                e.shield += e.intentV;
                B.log.push(msg + '获得' + e.intentV + '点护盾');
            } else if (e.intentT === IA_DEBUFF) {
                P.fatigue += e.intentV;
                B.log.push(msg + '给你' + e.intentV + '层疲劳(攻击-2/层)');
            } else if (e.intentT === IA_BUFF) {
                if (e.id === 2) { e.doubleAtk = true; B.log.push(msg + '划水! 下回合攻击翻倍'); }
                else { e.atkBuff += 1; B.log.push(msg + '强化+1攻击'); }
            }
            if (P.morale <= 0) {
                B.log.push('你的心态跌入谷底, 学期失败...');
                battleDefeat();
                return { done: true, defeat: true };
            }
        }
        // 全部敌人行动完
        P.shield = 0;
        if (allDead(es)) { battleVictory(); return { done: true, victory: true }; }
        // 新回合
        B.firstTurn = false;
        turnStart(P, B.log);
        if (P.morale <= 0) {
            B.log.push('你心态崩了,学期失败!');
            battleDefeat();
            return { done: true, defeat: true };
        }
        B.log.push('-------- 你的回合 --------');
        return { done: true, turn: true };
    }

    function applyEnemyAttack(e, atk, skipAtk, B, msg) {
        var P = G.run.P;
        if (skipAtk) return;
        var dmg = atk;
        if (P.shield > 0) {
            var g = (dmg < P.shield) ? dmg : P.shield;
            P.shield -= g;
            dmg -= g;
        }
        P.morale -= dmg;
        var s = msg + '造成' + atk + '点伤害';
        if (e.intentV2 > 0) {
            P.stress += e.intentV2;
            if (P.stress > StressCap) P.stress = StressCap;
            s += ' 并施加' + e.intentV2 + '点压力';
        }
        B.log.push(s);
    }

    // Boss 提问回答 (举报/交白卷)
    function bossAnswer(yes) {
        var B = G.battle, P = G.run.P;
        if (!B || !B.prompt) return;
        var pr = B.prompt;
        B.prompt = null;
        var e = B.es[pr.enemy];
        var atk = pr.atk;
        if (pr.kind === 'report') {
            if (yes) {
                e.phase = 2;
                e.phaseTurn = 1;
                P.stress += 15;
                if (P.stress > StressCap) P.stress = StressCap;
                B.log.push('你举报成功! 直接进入第三阶段, 压力+15');
            } else {
                B.log.push('你选择沉默, 硬吃这一击!');
                applyEnemyAttack(e, atk, false, B, '>>> ' + e.name + ' 行动: ');
            }
        } else if (pr.kind === 'blank') {
            if (yes) {
                B.log.push('你交了白卷... 学期失败!');
                battleDefeat();
                return;
            } else {
                B.log.push('你拒绝交白卷!');
                applyEnemyAttack(e, atk, false, B, '>>> ' + e.name + ' 行动: ');
            }
        }
        if (P.morale <= 0) {
            B.log.push('你的心态跌入谷底, 学期失败...');
            battleDefeat();
            return;
        }
        enemyPhaseStep();
    }

    function battleVictory() {
        var B = G.battle;
        if (B.over) return;
        B.over = true;
        B.log.push('★★★ 战斗胜利! ★★★');
        var P = G.run.P;
        var roomType = G.lastRoomType;
        var gold = 0;
        if (roomType === RS_BATTLE) {
            gold = rnd(10, 20) + B.es.length * 5;
            if (hasItem(P, 10)) gold = Math.floor(gold * 3 / 2);
            gold = Math.floor(gold * (10 + M.qb) / 10);
            P.gold += gold;
            B.log.push('战斗奖励: 金币+' + gold);
            G.pendingGold = gold;
            startCardReward();
        } else if (roomType === RS_ELITE) {
            gold = rnd(20, 30);
            if (hasItem(P, 10)) gold = Math.floor(gold * 3 / 2);
            gold = Math.floor(gold * (10 + M.qb) / 10);
            P.gold += gold;
            B.log.push('精英战奖励: 金币+' + gold);
            G.pendingGold = gold;
            startCourseReward();
        } else if (roomType === RS_BOSS) {
            gold = rnd(30, 40) + (hasItem(P, 10) ? 15 : 0);
            gold = Math.floor(gold * (10 + M.qb) / 10);
            P.gold += gold;
            B.log.push('击败首领! 金币+' + gold);
            G.pendingGold = gold;
            startCardReward();
            G.run.afterBoss = true; // 首领胜利后: 进入阶段结算/通关
        }
    }

    function battleDefeat() {
        var B = G.battle;
        if (B.over) return;
        B.over = true;
        G.phase = 'lose';
        onRunEnd(false);
    }

    // ================= 卡牌奖励 =================
    function giveRandomCard(p, typeFilter, debuffFilter) {
        var cand = [];
        for (var i = 0; i < GEN_POOL.length; i++) {
            var c = CARDS[GEN_POOL[i]];
            if (typeFilter >= 0 && c.type !== typeFilter) continue;
            if (debuffFilter > 0 && c.debuff !== debuffFilter) continue;
            cand.push(GEN_POOL[i]);
        }
        if (cand.length === 0) cand.push(GEN_POOL[rnd(0, GEN_POOL.length - 1)]);
        var id = cand[rnd(0, cand.length - 1)];
        p.deck.push(cloneCard(id));
        return CARDS[id].name;
    }

    function startCardReward() {
        var P = G.run.P;
        var choices = 3;
        if (hasItem(P, 7)) choices = 4;
        var cand = [];
        var guard = 0;
        while (cand.length < choices && guard < 200) {
            var id = GEN_POOL[rnd(0, GEN_POOL.length - 1)];
            if (cand.indexOf(id) < 0) cand.push(id);
            guard++;
        }
        G.reward = { cand: cand };
        G.phase = 'reward';
    }

    function rewardPick(i) {
        if (!G.reward) return;
        var cand = G.reward.cand;
        var idx = (i >= 0 && i < cand.length) ? cand[i] : cand[rnd(0, cand.length - 1)];
        G.run.P.deck.push(cloneCard(idx));
        var afterBoss = G.run.afterBoss || false;
        G.run.afterBoss = false;
        G.reward = null;
        if (afterBoss) {
            afterBossDone();
        } else {
            roomDone();
            G.phase = 'map';
        }
    }

    // ================= 课程奖励 =================
    var COURSE_INFO = [
        null,
        { n: '高等数学', pn: '逻辑思维: 每回合第一张知识卡+3', flag: C_SCI, set: 'gMath' },
        { n: '大学语文', pn: '文采斐然: debuff施加+1层', flag: C_LIT, set: 'gLit' },
        { n: '微观经济学', pn: '成本控制: 首张0费牌免费', flag: C_BIZ, set: 'gBiz' },
        { n: '艺术鉴赏', pn: '灵感迸发: 每回合第一张牌-1费', flag: C_ART, set: 'gArt' },
        { n: '大学英语', pn: '双语思维: 每回合多抽1张', flag: C_ENG, set: 'gEng' },
        { n: '体育课', pn: '强健体魄: 每回合开始+2护盾', flag: C_PE, set: 'gPe' }
    ];

    function startCourseReward() {
        var P = G.run.P;
        var av = [];
        if (!(P.courses & C_SCI)) av.push(1);
        if (!(P.courses & C_LIT) && M.lit) av.push(2);
        if (!(P.courses & C_BIZ) && M.biz) av.push(3);
        if (!(P.courses & C_ART) && M.artc) av.push(4);
        if (!(P.courses & C_ENG) && M.eng) av.push(5);
        if (!(P.courses & C_PE) && M.pe) av.push(6);
        if (av.length === 0) {
            P.gold += 100;
            var cn = giveRandomCard(P, -1, 0);
            G.courseAvail = null;
            G.pendingGold += 100;
            G.unlockMsgs.push('所有课程都已选修! 改为100金币+一张随机卡(' + cn + ')');
            roomDone();
            G.phase = 'map';
            return;
        }
        G.courseAvail = av;
        G.phase = 'course';
    }

    function coursePick(i) {
        var av = G.courseAvail;
        if (!av) return;
        var idx = (i >= 0 && i < av.length) ? i : 0;
        var cur = av[idx];
        var info = COURSE_INFO[cur];
        var P = G.run.P;
        P.courses |= info.flag;
        var set = info.set === 'gMath' ? gMath : info.set === 'gLit' ? gLit :
            info.set === 'gBiz' ? gBiz : info.set === 'gArt' ? gArt :
            info.set === 'gEng' ? gEng : gPe;
        var got = [];
        for (var k = 0; k < 5; k++) { P.deck.push(cloneCard(set[k])); got.push(CARDS[set[k]].name); }
        G.courseAvail = null;
        G.unlockMsgs.push('你选修了《' + info.n + '》, 获得5张课程卡: ' + got.join('、'));
        roomDone();
        G.phase = 'map';
    }

    function courseCount(p) {
        var n = 0;
        if (p.courses & C_SCI) n++;
        if (p.courses & C_LIT) n++;
        if (p.courses & C_BIZ) n++;
        if (p.courses & C_ART) n++;
        if (p.courses & C_ENG) n++;
        if (p.courses & C_PE) n++;
        return n;
    }

    // ================= 事件 =================
    function runEvent(p, ev) {
        G.event = { id: ev };
        G.phase = 'event';
    }

    function eventPick(i) {
        var P = G.run.P;
        var ev = G.event ? G.event.id : 0;
        var msgs = [];
        var apply = function (m) { msgs.push(m); };
        if (ev === 0) {
            if (i === 0) { P.stress += 10; if (P.stress > StressCap) P.stress = StressCap; var cn = giveRandomCard(P, CT_KNOW, 0); apply('硬刚占座! +10压力, 获得卡牌: ' + cn); }
            else if (i === 1) { P.morale += 15; if (P.morale > 100) P.morale = 100; P.stress -= 5; if (P.stress < 0) P.stress = 0; apply('让出座位, 心态+15, 压力-5'); }
            else { P.gold += 20; apply('换个位置, +20金币'); }
        } else if (ev === 1) {
            if (i === 0) { var c1 = giveRandomCard(P, CT_KNOW, 0); var c2 = giveRandomCard(P, CT_MORAL, 0); apply('加入学术社团! 获得: ' + c1 + '、' + c2); }
            else if (i === 1) { var c3 = giveRandomCard(P, CT_SOCIAL, 0); var it = rnd(0, 10); addItem(P, it); apply('加入社交社团! 获得: ' + c3 + '、物品[' + itemDB[it].name + ']'); }
            else { P.morale += 10; if (P.morale > 100) P.morale = 100; P.stress -= 10; if (P.stress < 0) P.stress = 0; apply('都不加入, 心态+10, 压力-10'); }
        } else if (ev === 2) {
            if (i === 0) {
                P.stress += 15; if (P.stress > StressCap) P.stress = StressCap;
                for (var s = 0; s < GEN_POOL.length; s++)
                    if (CARDS[GEN_POOL[s]].special === SP_SLOUGH) { P.deck.push(cloneCard(GEN_POOL[s])); break; }
                apply('一起打游戏! +15压力, 获得「摆烂」卡');
            } else if (i === 1) { P.stress += 5; if (P.stress > StressCap) P.stress = StressCap; P.morale += 5; if (P.morale > 100) P.morale = 100; apply('委婉提醒, 压力+5, 心态+5'); }
            else { P.stress += 8; if (P.stress > StressCap) P.stress = StressCap; P.nextShieldBonus = 10; apply('戴耳塞忍着, 压力+8, 下场战斗开场+10护盾'); }
        } else if (ev === 3) {
            if (i === 0) { P.stress += 8; if (P.stress > StressCap) P.stress = StressCap; P.deck.push(cloneCard(gLit[0])); apply('理论一番! +8压力, 获得「议论文」'); }
            else if (i === 1) { P.stress += 3; if (P.stress > StressCap) P.stress = StressCap; apply('默默忍受, +3压力'); }
            else { apply('换个窗口, 什么都没发生'); }
        } else if (ev === 4) {
            if (i === 0) {
                if (P.morale > 50) {
                    if (rnd(0, 1) === 0) {
                        P.gold += 50;
                        var id2 = GEN_POOL[rnd(0, GEN_POOL.length - 1)];
                        P.deck.push(cloneCard(id2));
                        apply('申请成功! +50金币, 获得卡牌: ' + CARDS[id2].name);
                    } else { P.stress += 15; if (P.stress > StressCap) P.stress = StressCap; apply('申请失败... +15压力'); }
                } else { P.stress += 15; if (P.stress > StressCap) P.stress = StressCap; apply('心态不足50, 被评委抬出去, +15压力'); }
            } else { P.stress -= 5; if (P.stress < 0) P.stress = 0; apply('不申请了, 压力-5'); }
        } else if (ev === 5) {
            if (i === 0) {
                if (P.gold >= 20) {
                    P.gold -= 20; P.morale += 20; if (P.morale > 100) P.morale = 100;
                    P.stress -= 5; if (P.stress < 0) P.stress = 0;
                    apply('吃得超开心! 心态+20, 压力-5');
                } else { P.morale -= 5; apply('钱不够, 只能看着... 心态-5'); }
            } else if (i === 1) { P.morale += 10; if (P.morale > 100) P.morale = 100; P.stress += 10; if (P.stress > StressCap) P.stress = StressCap; apply('蹭同学的烤串, 心态+10, 压力+10'); }
            else { P.stress -= 8; if (P.stress < 0) P.stress = 0; apply('忍痛减肥, 压力-8'); }
        } else if (ev === 6) {
            if (i === 0) { P.stress += 5; if (P.stress > StressCap) P.stress = StressCap; var c4 = giveRandomCard(P, -1, 0); apply('上前请教, +5压力, 获得卡牌: ' + c4); }
            else if (i === 1) { var it2 = rnd(0, 10); addItem(P, it2); apply('捡到旧笔记本! 获得物品: ' + itemDB[it2].name); }
            else { P.morale += 12; if (P.morale > 100) P.morale = 100; apply('眯了一会, 心态+12'); }
        } else if (ev === 7) {
            if (i === 0) { P.morale += 10; if (P.morale > 100) P.morale = 100; P.stress -= 8; if (P.stress < 0) P.stress = 0; apply('跑5圈! 心态+10, 压力-8'); }
            else if (i === 1) { P.morale += 5; if (P.morale > 100) P.morale = 100; apply('慢跑1圈, 心态+5'); }
            else { P.gold += 10; P.stress += 5; if (P.stress > StressCap) P.stress = StressCap; apply('躺平看星星, +10金币, +5压力'); }
        } else {
            if (i === 0) {
                if (rnd(0, 99) < 60) {
                    P.stress -= 15; if (P.stress < 0) P.stress = 0;
                    P.morale += 15; if (P.morale > 100) P.morale = 100;
                    apply('对方居然回复了!! 心态+15, 压力-15');
                } else { P.stress += 10; if (P.stress > StressCap) P.stress = StressCap; apply('石沉大海... +10压力'); }
            } else if (i === 1) { P.morale += 6; if (P.morale > 100) P.morale = 100; P.stress -= 5; if (P.stress < 0) P.stress = 0; apply('吃瓜围观, 心态+6, 压力-5'); }
            else { P.gold += 5; apply('默默路过, +5金币'); }
        }
        G.event = null;
        G.unlockMsgs = G.unlockMsgs.concat(msgs);
        G.phase = 'map';
    }

    // ================= 休息 =================
    var REST_MSGS = [];
    function runRest(p) { G.phase = 'rest'; }

    function restPick(i) {
        var P = G.run.P;
        var mul = 1.0;
        if (hasItem(P, 6)) mul = 2.0;
        if (Difficulty >= 7) mul *= 0.70;
        if (i === 0) {
            var h = Math.floor(25 * mul);
            P.morale += h;
            if (P.morale > 100) P.morale = 100;
            G.unlockMsgs.push('睡了一觉, 恢复' + h + '点心态!');
        } else if (i === 1) {
            var h2 = Math.floor(15 * mul);
            P.morale += h2;
            if (P.morale > 100) P.morale = 100;
            var removed = false;
            for (var k = 0; k < P.deck.length; k++) {
                if (P.deck[k].name === '认真听讲' || P.deck[k].name === '做笔记' ||
                    P.deck[k].name === '摸鱼' || P.deck[k].name === '课间休息') {
                    P.deck.splice(k, 1);
                    removed = true;
                    break;
                }
            }
            G.unlockMsgs.push('恢复' + h2 + '点心态' + (removed ? ', 移除了一张基础卡' : ''));
        } else if (i === 2) {
            P.stress += 15;
            if (P.stress > StressCap) P.stress = StressCap;
            var id = GEN_POOL[rnd(0, GEN_POOL.length - 1)];
            P.deck.push(cloneCard(id));
            G.unlockMsgs.push('泡了一晚图书馆, 压力+15, 获得卡牌: ' + CARDS[id].name);
        } else if (i === 3) {
            G.restUpgrading = true;
            G.phase = 'upgrade';
            return;
        }
        G.phase = 'map';
    }

    // ================= 升级卡牌 =================
    function upgradeList() {
        var P = G.run.P;
        var list = [];
        for (var i = 0; i < P.deck.length; i++)
            if (canUpgrade(P.deck[i])) list.push(i);
        return list;
    }

    function upgradePick(i, fromShop) {
        var P = G.run.P;
        var list = upgradeList();
        if (i >= 0 && i < list.length) {
            upgradeCard(P.deck[list[i]]);
            G.unlockMsgs.push('升级成功! 【' + cardName(P.deck[list[i]]) + '】数值增强');
        } else {
            G.unlockMsgs.push('未选择升级');
        }
        if (fromShop) { G.phase = 'shop'; return; }
        G.phase = 'map';
    }

    // ================= 商店 =================
    function runShop(p) {
        var cardSlots = [];
        var itemSlots = [];
        var guard = 0;
        while (cardSlots.length < 4 && guard < 200) {
            var id = GEN_POOL[rnd(0, GEN_POOL.length - 1)];
            if (cardSlots.indexOf(id) < 0) cardSlots.push(id);
            guard++;
        }
        guard = 0;
        while (itemSlots.length < 2 && guard < 200) {
            var it = rnd(0, 10);
            if (itemSlots.indexOf(it) < 0 && !hasItem(p, it)) itemSlots.push(it);
            guard++;
        }
        G.shopStock = { cards: cardSlots, items: itemSlots, removing: false, upgrading: false };
        G.phase = 'shop';
    }

    function shopPrice(base) {
        var price = base;
        if (Difficulty >= 6) price = Math.floor(price * 1.25);
        if (M.qs > 0) price = Math.floor(price * (10 - M.qs) / 10.0);
        return price;
    }

    function shopCardPrice(id) {
        var c = CARDS[id];
        var base = (c.cost <= 1) ? 30 : ((c.cost === 2) ? 45 : 60);
        return shopPrice(base);
    }

    function shopBuy(kind, i) {
        var S = G.shopStock, P = G.run.P;
        if (!S) return;
        if (kind === 'card') {
            if (i < 0 || i >= S.cards.length) return;
            var price = shopCardPrice(S.cards[i]);
            if (P.gold < price) { G.unlockMsgs.push('金币不足!'); return; }
            P.gold -= price;
            P.deck.push(cloneCard(S.cards[i]));
            G.unlockMsgs.push('购买成功: ' + CARDS[S.cards[i]].name);
            S.cards.splice(i, 1);
        } else if (kind === 'item') {
            if (i < 0 || i >= S.items.length) return;
            var price2 = shopPrice(80);
            if (P.gold < price2) { G.unlockMsgs.push('金币不足!'); return; }
            P.gold -= price2;
            addItem(P, S.items[i]);
            G.unlockMsgs.push('购买成功: ' + itemDB[S.items[i]].name);
            S.items.splice(i, 1);
        }
    }

    function shopRemoveMode() { G.shopStock.removing = true; }
    function shopUpgradeMode() { G.shopStock.upgrading = true; }
    function shopRemovePick(i) {
        var S = G.shopStock, P = G.run.P;
        var price = shopPrice(50);
        if (P.gold < price) { G.unlockMsgs.push('金币不足!'); S.removing = false; return; }
        if (i >= 0 && i < P.deck.length) {
            P.gold -= price;
            G.unlockMsgs.push('已移除: ' + cardName(P.deck[i]));
            P.deck.splice(i, 1);
        } else { G.unlockMsgs.push('移除取消'); }
        S.removing = false;
    }
    function shopUpgradePick(i) {
        var S = G.shopStock, P = G.run.P;
        var price = shopPrice(60);
        if (P.gold < price) { G.unlockMsgs.push('金币不足!'); S.upgrading = false; return; }
        var list = upgradeList();
        if (i >= 0 && i < list.length) {
            P.gold -= price;
            upgradeCard(P.deck[list[i]]);
            G.unlockMsgs.push('升级成功! 【' + cardName(P.deck[list[i]]) + '】');
        } else { G.unlockMsgs.push('升级取消'); }
        S.upgrading = false;
    }
    function shopLeave() { G.shopStock = null; G.phase = 'map'; }

    // ================= 宝箱 =================
    function runChest(p) {
        var it = rnd(0, 10);
        if (!hasItem(p, it)) {
            addItem(p, it);
            G.chestMsg = '获得物品: ' + itemDB[it].name + '!  ' + itemDB[it].desc;
        } else {
            p.gold += 30;
            G.chestMsg = '箱子里是30金币!';
        }
        G.phase = 'chest';
    }
    function chestNext() { G.phase = 'map'; }

    // ================= 战斗节点 =================
    function makeStageEnemies(stage, elite) {
        var es = [];
        if (elite) {
            if (stage === 1) es.push(makeEnemy(3, 1.0));
            else if (stage === 2) es.push(makeEnemy(4, 1.0));
            else es.push(makeEnemy(8, 1.0));
        } else if (stage === 0) {
            var fac = 0.85;
            es.push(makeEnemy(0, fac));
            if (rnd(0, 1) === 0) es.push(makeEnemy(0, fac));
            else es.push(makeEnemy(6, fac));
        } else if (stage === 1) {
            var fac1 = 0.8, r1 = rnd(0, 2);
            es.push(makeEnemy(1, fac1));
            if (r1 === 0) es.push(makeEnemy(0, fac1));
            else if (r1 === 1) es.push(makeEnemy(6, fac1));
            else es.push(makeEnemy(7, fac1));
        } else if (stage === 2) {
            var fac2 = 0.8, r2 = rnd(0, 2);
            es.push(makeEnemy(2, fac2));
            if (r2 === 0) es.push(makeEnemy(1, fac2));
            else if (r2 === 1) es.push(makeEnemy(2, fac2));
            else es.push(makeEnemy(7, fac2));
        } else {
            var fac3 = 0.65;
            es.push(makeEnemy(2, fac3));
            es.push(makeEnemy(1, fac3));
            es.push(makeEnemy(7, fac3));
        }
        return es;
    }

    // ================= 地图移动 =================
    function mapGo(opt) {
        var adjs = mapAdjs();
        if (opt < 0 || opt >= adjs.length) return;
        var run = G.run;
        var target = adjs[opt];
        var z = zoneIdx(run.P);
        if (z > run.maxZone) run.maxZone = z;
        var tr = run.rooms[target];
        G.lastRoomType = tr.type;
        G.unlockMsgs = [];
        run.pendingRoom = target;

        if (tr.type === RS_BATTLE) {
            battleSetup(makeStageEnemies(run.stage, false), true);
            if (run.P.morale <= 0) return;
            G.phase = 'battle';
        } else if (tr.type === RS_ELITE) {
            battleSetup(makeStageEnemies(run.stage, true), true);
            if (run.P.morale <= 0) return;
            G.phase = 'battle';
        } else if (tr.type === RS_BOSS) {
            G.phase = 'bossintro';
            G.bossIntro = { stage: run.stage };
        } else if (tr.type === RS_EVENT) {
            runEvent(run.P, rnd(0, 8));
        } else if (tr.type === RS_REST) {
            runRest(run.P);
        } else if (tr.type === RS_SHOP) {
            runShop(run.P);
        } else {
            runChest(run.P);
        }
        // 非战斗房间进入后即标记完成
        if (tr.type !== RS_BATTLE && tr.type !== RS_ELITE && tr.type !== RS_BOSS) {
            roomDone();
        }
    }

    // 房间完成: 标记清除、移动当前格、心态归零判负
    function roomDone() {
        var run = G.run;
        var t = run.pendingRoom;
        if (t !== undefined && t >= 0 && run.rooms[t]) {
            run.rooms[t].cleared = true;
            run.cur = t;
        }
        run.pendingRoom = -1;
        if (run.P.morale <= 0) {
            G.unlockMsgs.push('你的心态归零, 在图书馆里崩溃大哭...');
            onRunEnd(false);
        }
    }

    // Boss房: 开始战斗
    function bossStartBattle(hiddenBoss) {
        var run = G.run;
        var es = [];
        if (run.stage < 3) {
            var kid = (run.stage === 0) ? 3 : ((run.stage === 1) ? 4 : 8);
            es.push(makeEnemy(kid, 1.2));
        } else {
            if (hiddenBoss) {
                es.push(makeEnemy(9, 1.0));
                run.wonHidden = 1;
            }
            if (es.length === 0) es.push(makeEnemy(5, 1.0));
        }
        G.bossIntro = null;
        battleSetup(es, run.stage === 3);
        if (run.P.morale <= 0) return;
        G.phase = 'battle';
    }

    // 首领战后
    function afterBossDone() {
        var run = G.run;
        if (run.stage < 3) {
            G.phase = 'stageend';
        } else {
            onRunEnd(true);
        }
    }

    function stageNext() {
        var run = G.run;
        run.stage++;
        genStageMap(run.stage, run.rooms);
        run.cur = findRoomIdx(run.rooms, run.rooms[0].row, 0);
        run.rooms[run.cur].cleared = true;
        G.phase = 'map';
    }

    // ================= 局终结算 =================
    function onRunEnd(win) {
        var run = G.run;
        if (win) {
            M.wins++;
            M.credit += 100;
            if (run.wonHidden) {
                M.credit += 50;
                M.hiddenBoss = 1;
                G.unlockMsgs.push('击败隐藏Boss「毕业答辩」! 额外+50学分!');
            }
            if (Difficulty > M.maxDiffWon) M.maxDiffWon = Difficulty;
            if (M.wins === 1 && !M.lit) { M.lit = 1; G.unlockMsgs.push('解锁新课程包: 大学语文(文科)!'); }
            if ((run.P.courses & C_SCI) && !M.biz) { M.biz = 1; G.unlockMsgs.push('解锁新课程包: 微观经济学(商科)!'); }
            if (run.P.stress > 80 && !M.artc) { M.artc = 1; G.unlockMsgs.push('高压通关! 解锁新课程包: 艺术鉴赏(艺术课)!'); }
            if (M.wins >= 3 && !M.eng) { M.eng = 1; G.unlockMsgs.push('解锁新课程包: 大学英语(外语课)!'); }
            if (run.maxZone <= 1 && !M.pe) { M.pe = 1; G.unlockMsgs.push('全程保持低压力! 解锁新课程包: 体育课!'); }
            if (M.wins >= 2 && !M.trans) { M.trans = 1; G.unlockMsgs.push('解锁新角色: 转学生!'); }
            if (M.maxDiffWon >= 5 && !M.exch) { M.exch = 1; G.unlockMsgs.push('高难度通关! 解锁新角色: 交换生!'); }
            saveMeta();
            G.phase = 'win';
        } else {
            M.losses++;
            M.credit += 30;
            if (M.losses >= 3 && !M.rep) {
                M.rep = 1;
                G.unlockMsgs.push('解锁新角色: 复读生!');
            }
            saveMeta();
            G.phase = 'lose';
        }
    }

    function backToTitle() {
        G.run = null;
        G.battle = null;
        G.phase = 'title';
    }

    // ================= 学分商店 =================
    var CREDIT_ITEMS = [
        { key: 'qg', name: '开局金币+20', cost: 10, maxLv: 5 },
        { key: 'qh', name: '初始心态+5', cost: 12, maxLv: 4 },
        { key: 'qb', name: '战斗金币+10%', cost: 15, maxLv: 5 },
        { key: 'qe', name: '每回合精力+1', cost: 25, maxLv: 3 },
        { key: 'qs', name: '商店折扣-10%', cost: 20, maxLv: 2 }
    ];

    function creditBuy(i) {
        if (i < 0 || i >= CREDIT_ITEMS.length) return;
        var it = CREDIT_ITEMS[i];
        if (M[it.key] >= it.maxLv) return;
        if (M.credit < it.cost) return;
        M.credit -= it.cost;
        M[it.key]++;
        saveMeta();
        G.unlockMsgs.push('升级成功! (剩余学分: ' + M.credit + ')');
    }

    // ================= 成就 =================
    function achievements() {
        var courseGot = 1 + M.lit + M.biz + M.artc + M.eng + M.pe;
        var charGot = 1 + M.trans + M.rep + M.exch;
        var list = [
            { name: '初入校园', desc: '通关1次学期', got: M.wins >= 1 },
            { name: '老油条', desc: '通关3次学期', got: M.wins >= 3 },
            { name: '学霸', desc: '通关5次学期', got: M.wins >= 5 },
            { name: '学神', desc: '通关10次学期', got: M.wins >= 10 },
            { name: '跌倒了爬起来', desc: '失败3次', got: M.losses >= 3 },
            { name: '打不死的小强', desc: '失败10次', got: M.losses >= 10 },
            { name: '课程达人', desc: '解锁4门课程', got: courseGot >= 4 },
            { name: '课程专家', desc: '解锁全部6门课程', got: courseGot >= 6 },
            { name: '角色收集家', desc: '解锁全部4个角色', got: charGot >= 4 },
            { name: '高难度挑战者', desc: '难度5以上通关', got: M.maxDiffWon >= 5 },
            { name: '隐藏Boss猎人', desc: '击败毕业答辩', got: M.hiddenBoss === 1 },
            { name: '学分富翁', desc: '累计获得500学分', got: M.credit >= 500 }
        ];
        return list;
    }

    // ================= 状态数据 =================
    function statusData() {
        var P = G.run.P;
        var deckGroups = [];
        var seen = {};
        for (var i = 0; i < P.deck.length; i++) {
            var k = cardName(P.deck[i]);
            if (seen[k]) continue;
            seen[k] = true;
            var cnt = 0;
            for (var j = 0; j < P.deck.length; j++)
                if (cardName(P.deck[j]) === k) cnt++;
            deckGroups.push({ name: k, cnt: cnt, card: P.deck[i] });
        }
        return { morale: P.morale, stress: P.stress, gold: P.gold, courses: P.courses,
            items: P.items, deck: deckGroups, deckTotal: P.deck.length };
    }

    // ================= 导出 =================
    return {
        // 常量
        CT_KNOW: CT_KNOW, CT_MORAL: CT_MORAL, CT_SOCIAL: CT_SOCIAL, CT_STRESS: CT_STRESS,
        RS_BATTLE: RS_BATTLE, RS_ELITE: RS_ELITE, RS_BOSS: RS_BOSS, RS_EVENT: RS_EVENT,
        RS_REST: RS_REST, RS_SHOP: RS_SHOP, RS_CHEST: RS_CHEST,
        SP_DEAD_DASH: SP_DEAD_DASH, SP_SLOUGH: SP_SLOUGH,
        IA_ATTACK: IA_ATTACK, IA_STRESS: IA_STRESS, IA_SHIELD: IA_SHIELD, IA_BUFF: IA_BUFF, IA_DEBUFF: IA_DEBUFF,
        // 数据
        G: G, M: M, CARDS: CARDS, GEN_POOL: GEN_POOL, itemDB: itemDB, COURSE_INFO: COURSE_INFO,
        CREDIT_ITEMS: CREDIT_ITEMS, achievements: achievements,
        // RNG
        setSeed: setSeed,
        // 卡牌
        initCards: initCards, cardName: cardName, cloneCard: cloneCard,
        upgradeCard: upgradeCard, canUpgrade: canUpgrade,
        // 流程
        loadMeta: loadMeta, saveMeta: saveMeta,
        startRun: startRun, backToTitle: backToTitle,
        pickChar: function (i) { G.phase = 'diff'; G.charSel = i; },
        pickDiff: function (d) { G.phase = 'bonus'; G.diffSel = d; },
        pickBonus: function (b) { startRun(G.charSel, G.diffSel, b); },
        mapGo: mapGo, mapAdjs: mapAdjs, stageNext: stageNext,
        bossStartBattle: bossStartBattle,
        // 战斗
        battlePlayCard: battlePlayCard, battleEndTurn: battleEndTurn,
        bossAnswer: bossAnswer, battleNeedsTarget: battleNeedsTarget,
        canPlayCard: canPlayCard, enemyPhaseStep: enemyPhaseStep,
        // 奖励
        rewardPick: rewardPick, coursePick: coursePick,
        // 房间
        eventPick: eventPick, restPick: restPick, chestNext: chestNext,
        upgradePick: upgradePick, upgradeList: upgradeList,
        shopBuy: shopBuy, shopRemoveMode: shopRemoveMode, shopUpgradeMode: shopUpgradeMode,
        shopRemovePick: shopRemovePick, shopUpgradePick: shopUpgradePick,
        shopLeave: shopLeave, shopCardPrice: shopCardPrice,
        // 元进度
        creditBuy: creditBuy, statusData: statusData,
        // 局内辅助 (供UI使用)
        zoneIdx: zoneIdx, zoneName: zoneName, hasItem: hasItem,
        shopPrice: shopPrice, courseCount: courseCount,
        stressCap: function () { return StressCap; },
        diff: function () { return Difficulty; },
        charSel: function () { return CharSel; },
        // 状态
        phase: function () { return G.phase; },
        state: G
    };
});
