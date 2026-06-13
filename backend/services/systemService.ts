import os from 'os';
import fs from 'fs/promises';
import path from 'path';

let lastCpuInfo = { idle: 0, total: 0 };

function getDataDir(): string {
  const { app } = require('electron') as typeof import('electron');
  const root = app.isPackaged ? app.getAppPath() : process.cwd();
  return path.join(root, 'data');
}

function getCpuUsage(): number {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type of Object.values(cpu.times)) {
      total += type;
    }
    idle += cpu.times.idle;
  }

  const idleDiff = idle - lastCpuInfo.idle;
  const totalDiff = total - lastCpuInfo.total;
  lastCpuInfo = { idle, total };

  if (totalDiff === 0) return 0;
  return Math.round((1 - idleDiff / totalDiff) * 100);
}

async function getStorageStats() {
  try {
    const dataDir = getDataDir();
    const stat = await fs.statfs(dataDir);
    const total = stat.blocks * stat.bsize;
    const free = stat.bfree * stat.bsize;
    const used = total - free;
    return {
      used,
      total,
      percent: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  } catch {
    return { used: 0, total: 0, percent: 0 };
  }
}

export async function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: getCpuUsage(),
    ram: {
      used: usedMem,
      total: totalMem,
      percent: Math.round((usedMem / totalMem) * 100),
    },
    storage: await getStorageStats(),
    network: {
      online: true,
      type: 'ethernet',
    },
    platform: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
  };
}
