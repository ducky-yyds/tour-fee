/** Browser workspace records. Plans are independent JSON documents. */
export const PROJECT_STORAGE_KEY = 'tusuan-projects';
export function createProjectRecord(name, plan, now = new Date().toISOString()) {
  return {
    id: globalThis.crypto.randomUUID(),
    name: String(name || '未命名旅行').trim().slice(0, 60) || '未命名旅行',
    createdAt: now,
    updatedAt: now,
    plan: structuredClone(plan),
  };
}
export function hydrateProjects(workspace, currentPlan, legacySaved, normalize, defaultName) {
  const projects = [];
  const seen = new Set();
  if (workspace?.version === 1 && Array.isArray(workspace.projects)) {
    for (const record of workspace.projects.slice(0, 50)) {
      if (!record || typeof record.id !== 'string' || seen.has(record.id) || !record.plan?.stops?.length) continue;
      try {
        projects.push({ ...createProjectRecord(record.name, normalize(record.plan)), id: record.id, createdAt: record.createdAt || new Date().toISOString(), updatedAt: record.updatedAt || new Date().toISOString() });
        seen.add(record.id);
      } catch { /* A damaged record must not hide other projects. */ }
    }
  }
  if (!projects.length) {
    let plan;
    try { plan = normalize(currentPlan); } catch { plan = normalize(null); }
    projects.push(createProjectRecord(defaultName(plan), plan));
    for (const record of (Array.isArray(legacySaved) ? legacySaved : []).slice(0, 49)) {
      if (!record?.plan?.stops?.length) continue;
      try { projects.push(createProjectRecord(record.name, normalize(record.plan))); } catch { /* Keep valid backups. */ }
    }
  }
  return { projects, activeId: projects.some(p => p.id === workspace?.activeId) ? workspace.activeId : projects[0].id };
}
