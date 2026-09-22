import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectRecord, hydrateProjects } from '../shared/projects.mjs';
const makePlan = () => ({ stops:[{cityId:'beijing',days:3,attractionIds:['forbidden-city'],visitDurations:{'forbidden-city':180},dailyPreferences:{food:100}}],overrides:{'stop-0-food':{amount:300,confirmed:true}} });
const normalize = p => structuredClone(p || makePlan());
test('independent project copies do not mutate source schedules, preferences or confirmations',()=>{
  const source=makePlan(),a=createProjectRecord('北京',source),b=createProjectRecord('另一种安排',a.plan);
  b.plan.stops[0].visitDurations['forbidden-city']=90;
  b.plan.stops[0].dailyPreferences.food=50;
  b.plan.overrides['stop-0-food'].confirmed=false;
  assert.deepEqual(a.plan,source);assert.notEqual(a.id,b.id);
});
test('first workspace migrates current plan and each legacy saved trip as separate projects',()=>{
  const saved=[{name:'老项目',plan:makePlan()}];
  const workspace=hydrateProjects(null,makePlan(),saved,normalize,()=> '正在规划');
  assert.equal(workspace.projects.length,2);
  assert.equal(workspace.projects[0].name,'正在规划');
  assert.equal(workspace.activeId,workspace.projects[0].id);
  assert.notEqual(workspace.projects[0].id,workspace.projects[1].id);
  assert.deepEqual(workspace.projects[1].plan.overrides,saved[0].plan.overrides);
});
test('workspace reload retains active project and ignores old current singleton or repeat migration',()=>{
  const a=createProjectRecord('A',makePlan()),b=createProjectRecord('B',makePlan());b.plan.stops[0].days=1;
  const reloaded=hydrateProjects({version:1,projects:[a,b],activeId:b.id},{wrong:true},[{plan:makePlan()}],normalize,()=> 'default');
  assert.equal(reloaded.activeId,b.id);assert.equal(reloaded.projects.length,2);
  assert.equal(reloaded.projects[1].plan.stops[0].days,1);
});
test('damaged workspace preserves valid records and has a safe default when old current is invalid',()=>{
  const good=createProjectRecord('完整计划',makePlan());
  const normalizeChecked=p=>{if(p?.bad)throw Error('invalid');return normalize(p);};
  const recovered=hydrateProjects({version:1,activeId:'bad',projects:[{id:'bad',plan:{stops:[{}],bad:true}},good,good]},null,[],normalizeChecked,()=> '默认');
  assert.equal(recovered.projects.length,1);assert.equal(recovered.activeId,good.id);
  const fallback=hydrateProjects(null,{bad:true},[],normalizeChecked,()=> '默认');
  assert.equal(fallback.projects.length,1);assert.equal(fallback.projects[0].name,'默认');
});
