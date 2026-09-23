import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Copy,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Check,
  X,
} from "lucide-react";
import { Modal, Photo, money } from "./ui.jsx";
import { calculatePlan, mergeCustomAttractions } from "../shared/planner.mjs";
import { getTripDuration, recommendedDays } from "../shared/trip-duration.mjs";
import "./projects.css";
import CountryTripPlanner from "./CountryTripPlanner.jsx";
import DestinationSelect from './DestinationSelect.jsx';

export function ProjectBar({ project, projects, onSwitch, onManage, onNew }) {
  return (
    <section className="project-bar" aria-label="当前旅行项目">
      <span className="project-icon">
        <FolderOpen size={21} />
      </span>
      <label>
        <small>当前项目 · 独立保存行程与预算</small>
        <select
          aria-label="切换旅行项目"
          value={project?.id || ""}
          onChange={(e) => onSwitch(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <span className="project-autosave">
        <i />
        自动保存
      </span>
      <button className="text-button" onClick={onManage}>
        管理项目
      </button>
      <button className="secondary-button" onClick={onNew}>
        <Plus size={15} />
        新建项目
      </button>
    </section>
  );
}

export function ProjectForm({ cities, originId, departureDate, returnTrip = true, onClose, onCreate }) {
  const [unit, setUnit] = useState('city');
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("beijing");
  const [days, setDays] = useState(() => recommendedDays('beijing'));
  const [daysSource, setDaysSource] = useState('recommendation');
  const selectedCity = cities.find(c => c.id === cityId);
  return (
    <Modal title="给下一段旅程，留一个位置" onClose={onClose} wide={unit === 'country'}>
      <div className="planning-unit-switch" role="group" aria-label="按城市或国家规划">
        <button type="button" aria-pressed={unit === 'city'} onClick={() => setUnit('city')}>选择城市</button>
        <button type="button" aria-pressed={unit === 'country'} onClick={() => setUnit('country')}>探索一个国家</button>
      </div>
      {unit === 'country' ? <>
        <label className="country-project-name">项目名称<input aria-label="国家旅行项目名称" maxLength={60} placeholder="例如：日本七日慢游" value={name} onChange={event => setName(event.target.value)} /></label>
        <CountryTripPlanner cities={cities} originId={originId} departureDate={departureDate} returnToOrigin={returnTrip} initialDays={7} onApply={countryDraft => onCreate({ name, countryDraft })} applyLabel="创建国家旅行项目" />
      </> : <form
        className="project-form"
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({ name, cityId, days: Number(days), daysSource });
        }}
      >
        <p className="muted">
          每个项目独立保存目的地、景点安排、消费偏好和已核对费用。
        </p>
        <label>
          项目名称
          <input
            autoFocus
            maxLength={60}
            placeholder="例如：秋天的北京 · 一个人慢慢逛"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="project-form-pair">
          <DestinationSelect label="第一站" cities={cities} value={cityId} onChange={id => { setCityId(id); setDays(recommendedDays(cities.find(c => c.id === id))); setDaysSource('recommendation'); }} />
          <label>
            停留天数
            <input
              aria-label="新项目天数"
              type="number"
              min={1}
              max={365}
              step={1}
              required
              value={days}
              onChange={(e) => { setDays(e.target.value); setDaysSource('user'); }}
            />
          </label>
        </div>
        <div className="project-duration-hint"><span>{getTripDuration(selectedCity).type === 'provisional' ? '资料有限 · ' : '初次到访建议 '}{getTripDuration(selectedCity).label}</span><button type="button" className="text-button" onClick={() => { setDays(recommendedDays(selectedCity)); setDaysSource('recommendation'); }}>采用 {recommendedDays(selectedCity)} 天</button><p>{getTripDuration(selectedCity).reason} 长途往返会占用游览时间，可酌情加天。</p></div>
        <p className="project-form-note">
          {selectedCity?.coverage === 'airport-only' ? '这一站的景点和食宿预算待补充，创建后可以自行录入。' : '先按可用时间安排精选景点，其他想去的地方可以随时加入。'}
        </p>
        <div className="modal-actions">
          <button className="primary-button" type="submit">
            <Plus size={16} />
            创建旅行项目
          </button>
        </div>
      </form>}
    </Modal>
  );
}

export function ProjectsModal({
  projects,
  activeId,
  cities,
  rates,
  onClose,
  onSwitch,
  onNew,
  onRename,
  onDuplicate,
  onDelete,
  onImport,
  onExport,
}) {
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState(null);
  const projectBudgets = useMemo(() => {
    const cityMap = new Map(cities.map(city => [city.id, city]));
    return new Map(projects.map(project => {
      try {
        const ids = new Set([project.plan.originId, ...project.plan.stops.map(stop => stop.cityId)]);
        const involved = [...ids].map(id => cityMap.get(id)).filter(Boolean);
        return [project.id, calculatePlan(project.plan, mergeCustomAttractions(involved, project.plan.customAttractions), rates)];
      } catch { return [project.id, null]; }
    }));
  }, [projects, cities, rates]);
  return (
    <Modal title="我的旅行项目" onClose={onClose} wide>
      <div className="projects-intro">
        <div>
          <span className="eyebrow">ONE TRIP, ONE CHAPTER</span>
          <p>去不同的地方，做不同的打算。每一份计划都独立保存。</p>
          <small className="muted">
            保存在此浏览器；导出文件可备份，也可在其他设备导入。
          </small>
        </div>
        <button className="primary-button" onClick={onNew}>
          <Plus size={16} />
          新建项目
        </button>
      </div>
      <div className="projects-grid">
        {projects.map((project) => {
          const city = cities.find(
            (c) => c.id === project.plan.stops[0]?.cityId,
          );
          const days = project.plan.stops.reduce((n, s) => n + s.days, 0);
          const calculation = projectBudgets.get(project.id);
          const total = calculation?.total ?? null, incomplete = calculation?.incomplete;
          return (
            <article
              className={
                "project-card " + (project.id === activeId ? "is-active" : "")
              }
              key={project.id}
            >
              <div className="project-cover">
                <Photo image={city?.image} alt={city?.name || "旅行项目"} />
                <span>
                  {project.id === activeId ? "正在规划" : `${days} 天的期待`}
                </span>
              </div>
              <div className="project-card-content">
                {editing === project.id ? (
                  <form
                    className="project-rename"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onRename(project.id, name);
                      setEditing(null);
                    }}
                  >
                    <input
                      aria-label="修改项目名称"
                      value={name}
                      maxLength={60}
                      required
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button className="icon-button" aria-label="保存项目名称">
                      <Check size={17} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="取消重命名"
                      onClick={() => setEditing(null)}
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <h3>{project.name}</h3>
                )}
                <p>
                  {project.plan.stops
                    .map((s) => cities.find((c) => c.id === s.cityId)?.name)
                    .join(" → ")}
                </p>
                <div className="project-card-stats">
                  <span>
                    {days} 天 · {project.plan.travelers} 人
                  </span>
                  <strong>
                    {total === null
                      ? "预算待计算"
                      : money(total, project.plan.currency)}
                    <small>{incomplete ? '已知费用 · 仍待补充' : '全程预算'}</small>
                  </strong>
                </div>
                <small className="project-updated">
                  {project.plan.departureDate} 出发 ·{" "}
                  {new Date(project.updatedAt).toLocaleDateString("zh-CN")} 更新
                </small>
                {deleting === project.id ? (
                  <div className="project-delete">
                    <p>删除“{project.name}”？</p>
                    <button
                      onClick={() => {
                        onDelete(project.id);
                        setDeleting(null);
                      }}
                    >
                      确认删除
                    </button>
                    <button onClick={() => setDeleting(null)}>保留</button>
                  </div>
                ) : (
                  <div className="project-card-actions">
                    <button
                      className="text-button"
                      onClick={() => onSwitch(project.id)}
                    >
                      打开项目
                      <ArrowRight size={15} />
                    </button>
                    <div>
                      <button
                        className="icon-button"
                        title="重命名"
                        aria-label={`重命名${project.name}`}
                        onClick={() => {
                          setName(project.name);
                          setEditing(project.id);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button"
                        title="复制项目"
                        aria-label={`复制${project.name}`}
                        onClick={() => onDuplicate(project.id)}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="icon-button"
                        title="删除项目"
                        aria-label={`删除项目${project.name}`}
                        disabled={projects.length <= 1}
                        onClick={() => setDeleting(project.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onImport}>
          <Upload size={15} />
          导入为新项目
        </button>
        <button className="secondary-button" onClick={onExport}>
          <Download size={15} />
          导出当前项目
        </button>
      </div>
    </Modal>
  );
}
