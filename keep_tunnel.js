'use strict';
// 隧道保活守护进程: 自动检测隧道失效并重连, 最新链接写入 当前链接.txt
const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WEB = 'D:\\opencode\\web';
const TMP = 'C:\\Users\\ASUS\\AppData\\Local\\Temp\\opencode';
const KH = path.join(TMP, 'kh_file');
const SSH_OUT = path.join(TMP, 'keep_ssh.out');

let sshChild = null;
let currentUrl = '';

function log(m) {
    console.log('[' + new Date().toTimeString().slice(0, 8) + '] ' + m);
}

function httpGet(url, timeout) {
    return new Promise(resolve => {
        const u = new URL(url);
        const req = http.get({ hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search, timeout: timeout || 8000 }, res => {
            res.resume();
            resolve(res.statusCode);
        });
        req.on('timeout', () => { req.destroy(); resolve(0); });
        req.on('error', () => resolve(0));
    });
}

// 确保本地服务器启动
async function ensureServer() {
    const up = await httpGet('http://localhost:8123/', 2000);
    if (up !== 200) {
        log('本地服务器未运行, 启动 server.js...');
        try {
            spawn('node', ['server.js'], { cwd: WEB, detached: true, stdio: 'ignore' }).unref();
            await new Promise(r => setTimeout(r, 2500));
        } catch (e) { log('启动失败: ' + e.message); }
    }
}

// 启动/重启 SSH 隧道
function startTunnel() {
    return new Promise(resolve => {
        if (fs.existsSync(KH)) { try { fs.unlinkSync(KH); } catch (e) {} }
        sshChild = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=' + KH,
            '-o', 'ServerAliveInterval=30',
            '-o', 'ServerAliveCountMax=3',
            '-R', '80:localhost:8123',
            'nokey@localhost.run'
        ], { stdio: ['ignore', 'pipe', 'pipe'] });
        let buf = '';
        const grab = c => {
            buf += c.toString();
            if (!currentUrl) {
                const m = buf.match(/https:\/\/([\w-]+\.lhr\.life)/);
                if (m) currentUrl = m[1];
            }
            if (buf.length > 8000) buf = buf.slice(-4000);
        };
        sshChild.stdout.on('data', grab);
        sshChild.stderr.on('data', grab);
        sshChild.on('exit', code => {
            log('ssh 进程退出 (code=' + code + ')');
            if (currentUrl) { currentUrl = ''; writeCurrent(''); }
            sshChild = null;
            resolve(false);
        });
        const t0 = Date.now();
        const iv = setInterval(() => {
            if (currentUrl) {
                clearInterval(iv);
                log('隧道建立: ' + currentUrl);
                writeCurrent('https://' + currentUrl);
                resolve(true);
            } else if (Date.now() - t0 > 60000) {
                clearInterval(iv);
                log('60秒未获得URL, 尝试重连');
                try { sshChild.kill(); } catch (e) {}
                resolve(false);
            }
        }, 800);
    });
}

function writeCurrent(u) {
    try { fs.writeFileSync(path.join(WEB, '当前链接.txt'), u + '\r\n', 'utf8'); } catch (e) {}
}

async function mainLoop() {
    while (true) {
        await ensureServer();
        if (!sshChild) {
            const ok = await startTunnel();
            if (!ok) { log('重连失败, 10秒后重试'); await sleep(10000); }
        }
        if (sshChild && currentUrl) {
            const code = await httpGet('https://' + currentUrl + '/', 10000);
            if (code !== 200) {
                log('隧道失效 (HTTP ' + code + '), 重启...');
                try { sshChild.kill(); } catch (e) {}
                sshChild = null;
                currentUrl = '';
                await sleep(3000);
            }
        }
        await sleep(15000);
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

log('学期攻略隧道保活守护启动');
log('最新链接: ' + path.join(WEB, '当前链接.txt'));
mainLoop();