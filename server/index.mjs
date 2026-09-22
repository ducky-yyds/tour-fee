import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { gzip } from 'node:zlib';
import { resolve, extname, sep } from 'node:path';
import { ROOT } from './db.mjs';
import { getCatalog, dataStatus, searchAirports } from './catalog.mjs';
import { mergeAirportCities } from '../shared/airport-catalog.mjs';
import { calculatePlan, generateItinerary, mergeCustomAttractions } from '../shared/planner.mjs';
import { startMaintenance } from './maintenance.mjs';

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const dist = resolve(ROOT, 'dist');
const publicRoot = resolve(ROOT, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
function json(response, status, data) {
  const body = Buffer.from(JSON.stringify(data));
  const accept = String(response.req?.headers['accept-encoding'] || '').split(',').some(entry => { const [name, ...options] = entry.trim().split(';'); return name === 'gzip' && !options.some(option => /^q\s*=\s*0(?:\.0*)?$/.test(option.trim())); });
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Accept-Encoding' };
  if (accept && body.length > 16384) {
    gzip(body, (error, compressed) => {
      const encoded = error ? body : compressed;
      response.writeHead(status, { ...headers, ...(!error ? { 'Content-Encoding': 'gzip' } : {}), 'Content-Length': encoded.length });
      response.end(encoded);
    });
  } else {
    response.writeHead(status, { ...headers, 'Content-Length': body.length });
    response.end(body);
  }
}
async function body(request) {
  let buffer = '';
  for await (const chunk of request) {
    buffer += chunk;
    if (buffer.length > 128000) throw new Error('行程数据过大');
  }
  return JSON.parse(buffer);
}
export const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/health') return json(response, 200, { ok: true, app: '途算', time: new Date().toISOString() });
    if (url.pathname === '/api/catalog' && request.method === 'GET') return json(response, 200, getCatalog());
    if (url.pathname === '/api/data-status' && request.method === 'GET') return json(response, 200, dataStatus());
    if (url.pathname === '/api/airports' && request.method === 'GET') {
      try { return json(response, 200, searchAirports({ q: url.searchParams.get('q') ?? '', cityId: url.searchParams.get('cityId') ?? '', offset: url.searchParams.get('offset') ?? 0, limit: url.searchParams.get('limit') ?? 40 })); }
      catch (error) { return json(response, 400, { error: error.message }); }
    }
    if (url.pathname === '/api/plan' && request.method === 'POST') {
      try {
        const plan = await body(request);
        const catalog = getCatalog();
        const cities = mergeCustomAttractions(mergeAirportCities(catalog.cities, catalog.airportCities), plan.customAttractions);
        return json(response, 200, { ...calculatePlan(plan, cities, catalog.rates), itinerary: generateItinerary(plan, cities, catalog.rates) });
      } catch (error) { return json(response, 400, { error: error.message }); }
    }
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: '接口不存在' });
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: '不支持此请求方法' });
    const decoded = decodeURIComponent(url.pathname);
    // Image maintenance can publish a new local file + manifest without rebuilding the UI bundle.
    const assetRoot = decoded.startsWith('/images/') ? publicRoot : dist;
    let target = resolve(assetRoot, '.' + decoded);
    if (target !== assetRoot && !target.startsWith(assetRoot + sep)) return json(response, 403, { error: '无效路径' });
    if (!existsSync(target) || statSync(target).isDirectory()) {
      // SPA navigation only; a missing asset should never receive HTML.
      if (extname(decoded)) return json(response, 404, { error: '文件不存在' });
      target = resolve(dist, 'index.html');
    }
    if (!existsSync(target)) return json(response, 503, { error: '前端尚未构建。开发请运行 npm run dev；生产请先运行 npm run build。' });
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': target.includes(`${sep}assets${sep}`) ? 'public,max-age=31536000,immutable' : 'no-cache' });
    if (request.method === 'HEAD') return response.end();
    createReadStream(target).pipe(response);
  } catch (error) {
    console.error(error.message);
    if (!response.headersSent) json(response, 500, { error: '服务暂时不可用，请稍后重试。' });
    else response.end();
  }
});
server.listen(port, host, () => console.log(`途算 API: http://${host}:${server.address().port}`));
const stopMaintenance = startMaintenance();
server.on('close', stopMaintenance);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
