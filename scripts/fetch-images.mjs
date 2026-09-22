/**
 * Refresh curated destination photographs from Wikipedia / Wikimedia Commons.
 * Node >= 20, no keys/dependencies. Run: node scripts/fetch-images.mjs
 * --force refreshes even recent records; --only=tokyo,sensoji limits the run.
 * Only Commons files with explicit CC BY, CC BY-SA, CC0 or public-domain
 * metadata are accepted. Existing successful files survive failed refreshes.
 */
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'data', 'media.json');
const IMAGE_DIR = path.join(ROOT, 'public', 'images');
const USER_AGENT = 'RoamlyTravelPlanner/1.0 (local destination image cache; Wikimedia Commons attribution retained)';
const MAX_BYTES = 600 * 1024;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const force = process.argv.includes('--force');
const pythonHttp = process.argv.includes('--python-network');
const runFile = promisify(execFile);
const selected = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');
const articleFileCache = new Map();
const articleErrorCache = new Map();
const metadataCache = new Map();
const LOOKUP_CACHE = path.join(ROOT, 'data', 'image-lookup-cache.json');
let lookupCacheSince=new Date().toISOString();
try {
  const saved=JSON.parse(await readFile(LOOKUP_CACHE,'utf8'));
  if(!force && Date.now()-Date.parse(saved.savedAt)<7*86400000){
    lookupCacheSince=saved.savedAt;
    for(const [key,value] of Object.entries(saved.articles||{})) articleFileCache.set(key,value);
    for(const [key,value] of Object.entries(saved.metadata||{})) metadataCache.set(key,value);
  }
} catch(error){if(error.code!=='ENOENT') console.warn('Image lookup cache unavailable; resolving sources again.');}
async function saveLookups(){
  const temp=LOOKUP_CACHE+'.'+process.pid+'.tmp';
  await writeFile(temp,JSON.stringify({savedAt:lookupCacheSince,modifiedAt:new Date().toISOString(),articles:Object.fromEntries(articleFileCache),metadata:Object.fromEntries(metadataCache)}));
  await rename(temp,LOOKUP_CACHE);
}
const canonicalFile = file => file.replaceAll('_', ' ');

// Titles are curated for the exact place. These are not generic stock images.
const citySources = {
  shanghai: { article: 'Shanghai' },
  beijing: { article: 'Beijing' },
  tokyo: { article: 'Tokyo', file: 'Minato City, Tokyo, Japan.jpg' },
  kyoto: { article: 'Kyoto' },
  osaka: { article: 'Osaka', file: 'Osaka_Castle_03bs3200.jpg' },
  seoul: { article: 'Seoul' },
  bangkok: { article: 'Bangkok' },
  singapore: { article: 'Singapore', file: 'Singapore Marina-Bay-Panorama-01.jpg', credit: 'Photo by CEphoto, Uwe Aranas' },
  bali: { article: 'Bali', file: 'Pura Ulun Beratan, Bali.jpg' },
  paris: { article: 'Paris', file: 'La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques,_Paris_août_2014_(2).jpg' },
  london: { article: 'London', file: 'London_Skyline_(125508655).jpeg' },
  rome: { article: 'Rome' },
  barcelona: { article: 'Barcelona', file: 'Evening_light_over_Barcelona.jpg' },
  'new-york': { article: 'New York City', file: 'View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_(cropped).jpg' },
  sydney: { article: 'Sydney', file: 'Sydney_Opera_House_and_Harbour_Bridge_Dusk_(2)_2019-06-21.jpg' },
  dubai: { article: 'Dubai Marina', file: 'Dubai Marina Skyline.jpg' },
  istanbul: { article: 'Istanbul', file: 'Historical_peninsula_and_modern_skyline_of_Istanbul.jpg' },
  'hong-kong': { article: 'Hong Kong', file: 'Victoria Harbour (Hong Kong).jpg' },
  chengdu: { article: 'Chengdu' },
  xian: { article: "Xi'an" },
  hangzhou: { article: 'Hangzhou' },
  guangzhou: { article: 'Guangzhou' },
  lisbon: { article: 'Lisbon' },
  amsterdam: { article: 'Amsterdam', file: 'Water reflection of canal houses at blue hour in Damrak Amsterdam the Netherlands.jpg' },
  berlin: { article: 'Berlin' },
  venice: { article: 'Venice' },
  florence: { article: 'Florence' },
  'los-angeles': { article: 'Los Angeles' },
  melbourne: { article: 'Melbourne' },
  'chiang-mai': { article: 'Chiang Mai' },
};

const attractionArticles = {
  'shanghai-bund': 'The Bund', 'yu-garden': 'Yu Garden', 'shanghai-museum': 'Shanghai Museum',
  'forbidden-city': 'Forbidden City', 'temple-of-heaven': 'Temple of Heaven', 'summer-palace': 'Summer Palace',
  sensoji: 'Sensō-ji', 'meiji-jingu': 'Meiji Shrine', 'tokyo-tower': 'Tokyo Tower',
  'kiyomizu-dera': 'Kiyomizu-dera', 'fushimi-inari': 'Fushimi Inari-taisha', arashiyama: 'Arashiyama',
  'osaka-castle': 'Osaka Castle', dotonbori: 'Dōtonbori', 'umeda-sky': 'Umeda Sky Building',
  gyeongbokgung: 'Gyeongbokgung', bukchon: 'Bukchon Hanok Village', namsan: 'N Seoul Tower',
  'grand-palace': 'Grand Palace', 'wat-pho': 'Wat Pho', chatuchak: 'Chatuchak Weekend Market',
  'supertree-grove': 'Gardens by the Bay', merlion: 'Merlion Park', 'botanic-gardens': 'Singapore Botanic Gardens',
  'ubud-monkey-forest': 'Ubud Monkey Forest', uluwatu: 'Uluwatu Temple', 'tanah-lot': 'Tanah Lot',
  'eiffel-tower': 'Eiffel Tower', louvre: 'Louvre', montmartre: 'Montmartre',
  'british-museum': 'British Museum', 'national-gallery': 'National Gallery', 'hyde-park': 'Hyde Park, London',
  colosseum: 'Colosseum', pantheon: 'Pantheon, Rome', 'spanish-steps': 'Spanish Steps',
  'sagrada-familia': 'Sagrada Família', 'park-guell': 'Park Güell', barceloneta: 'La Barceloneta, Barcelona',
  met: 'Metropolitan Museum of Art', 'central-park': 'Central Park', 'high-line': 'High Line',
  'sydney-opera-house': 'Sydney Opera House', 'royal-botanic-garden': 'Royal Botanic Garden, Sydney', 'bondi-beach': 'Bondi Beach',
  'burj-khalifa': 'Burj Khalifa', 'al-fahidi': 'Al Fahidi Historical Neighbourhood', 'dubai-marina': 'Dubai Marina',
  'hagia-sophia': 'Hagia Sophia', 'blue-mosque': 'Blue Mosque, Istanbul', 'grand-bazaar': 'Grand Bazaar, Istanbul',
  'victoria-peak': 'Victoria Peak', 'avenue-of-stars': 'Avenue of Stars, Hong Kong', 'hong-kong-park': 'Hong Kong Park',
  // Extra photographs ready for future itinerary alternatives.
  'shibuya-crossing': 'Shibuya Crossing', 'tokyo-skytree': 'Tokyo Skytree', gion: 'Gion',
  'shanghai-tower': 'Shanghai Tower', tianzifang: 'Tianzifang', zhujiajiao: 'Zhujiajiao',
  mutianyu: 'Mutianyu', 'jingshan-park': 'Jingshan Park', 'lama-temple': 'Yonghe Temple',
  'ueno-park': 'Ueno Park', 'shinjuku-gyoen': 'Shinjuku Gyo-en',
  kinkakuji: 'Kinkaku-ji', 'nijo-castle': 'Nijō Castle',
  'kuromon-market': 'Kuromon Ichiba Market', shitennoji: 'Shitennō-ji', 'sumiyoshi-taisha': 'Sumiyoshi-taisha',
  changdeokgung: 'Changdeokgung', cheonggyecheon: 'Cheonggyecheon', 'dongdaemun-design-plaza': 'Dongdaemun Design Plaza',
  'wat-arun': 'Wat Arun', 'jim-thompson-house': 'Jim Thompson House', 'lumpini-park': 'Lumphini Park',
  'national-gallery-singapore': 'National Gallery Singapore', 'siloso-beach': 'Siloso Beach', 'chinatown-singapore': 'Chinatown, Singapore',
  tegallalang: 'Tegallalang', jatiluwih: 'Jatiluwih', 'tirta-empul': 'Tirta Empul',
  'musee-orsay': "Musée d'Orsay", 'arc-de-triomphe': 'Arc de Triomphe', 'luxembourg-gardens': 'Jardin du Luxembourg',
  'tower-of-london': 'Tower of London', 'tate-modern': 'Tate Modern', 'borough-market': 'Borough Market',
  'piazza-navona': 'Piazza Navona', 'castel-santangelo': "Castel Sant'Angelo", 'villa-borghese': 'Villa Borghese gardens',
  'casa-batllo': 'Casa Batlló', 'gothic-quarter': 'Gothic Quarter, Barcelona', montjuic: 'Montjuïc',
  'statue-of-liberty': 'Statue of Liberty', 'brooklyn-bridge': 'Brooklyn Bridge', moma: 'Museum of Modern Art',
  'manly-beach': 'Manly Beach', 'art-gallery-nsw': 'Art Gallery of New South Wales', 'taronga-zoo': 'Taronga Zoo',
  'museum-of-future': 'Museum of the Future', 'dubai-frame': 'Dubai Frame', 'jumeirah-beach': 'Jumeirah Beach',
  'topkapi-palace': 'Topkapı Palace', 'basilica-cistern': 'Basilica Cistern', 'galata-tower': 'Galata Tower',
  'tian-tan-buddha': 'Tian Tan Buddha', 'ngong-ping-360': 'Ngong Ping 360', 'temple-street': 'Temple Street, Hong Kong',
  'chengdu-panda-base': 'Chengdu Research Base of Giant Panda Breeding', 'wuhou-shrine': 'Wuhou Shrine', jinli: 'Jinli', 'dufu-cottage': 'Du Fu Thatched Cottage', 'kuanzhai-alley': 'Kuanzhai Alley',
  'terracotta-army': 'Terracotta Army', 'xian-city-wall': "Fortifications of Xi'an", 'giant-wild-goose-pagoda': 'Giant Wild Goose Pagoda', 'shaanxi-history-museum': 'Shaanxi History Museum', 'xian-muslim-quarter': "Muslim Quarter of Xi'an",
  'west-lake': 'West Lake', 'lingyin-temple': 'Lingyin Temple', 'xixi-wetland': 'Xixi National Wetland Park', 'longjing-village': 'Longjing, Hangzhou', 'hefang-street': 'Hefang Street',
  'canton-tower': 'Canton Tower', 'chen-clan-academy': 'Chen Clan Ancestral Hall', 'shamian-island': 'Shamian', 'yuexiu-park': 'Yuexiu Park', 'baiyun-mountain': 'Baiyun Mountain',
  'belem-tower': 'Belém Tower', 'jeronimos-monastery': 'Jerónimos Monastery', alfama: 'Alfama', 'sao-jorge-castle': 'São Jorge Castle', 'lisbon-oceanarium': 'Lisbon Oceanarium',
  rijksmuseum: 'Rijksmuseum', 'van-gogh-museum': 'Van Gogh Museum', 'anne-frank-house': 'Anne Frank House', vondelpark: 'Vondelpark', 'amsterdam-canals': 'Canals of Amsterdam',
  'brandenburg-gate': 'Brandenburg Gate', 'reichstag-building': 'Reichstag building', 'east-side-gallery': 'East Side Gallery', 'museum-island': 'Museum Island', 'berlin-cathedral': 'Berlin Cathedral',
  'st-marks-basilica': "St Mark's Basilica", 'doges-palace': "Doge's Palace", 'rialto-bridge': 'Rialto Bridge', 'grand-canal': 'Grand Canal (Venice)', burano: 'Burano',
  uffizi: 'Uffizi', 'accademia-florence': "Galleria dell'Accademia", 'florence-duomo': 'Florence Cathedral', 'ponte-vecchio': 'Ponte Vecchio', 'piazzale-michelangelo': 'Piazzale Michelangelo',
  'griffith-observatory': 'Griffith Observatory', 'getty-center': 'Getty Center', 'santa-monica-pier': 'Santa Monica Pier', 'hollywood-walk': 'Hollywood Walk of Fame', 'universal-hollywood': 'Universal Studios Hollywood',
  ngv: 'National Gallery of Victoria', 'melbourne-botanic-gardens': 'Royal Botanic Gardens Victoria', 'federation-square': 'Federation Square', 'queen-victoria-market': 'Queen Victoria Market', 'st-kilda-beach': 'St Kilda Beach, Victoria',
  'doi-suthep': 'Wat Phra That Doi Suthep', 'wat-chedi-luang': 'Wat Chedi Luang', 'wat-phra-singh': 'Wat Phra Singh', 'doi-inthanon': 'Doi Inthanon National Park', 'tha-phae-gate': 'Tha Phae Gate',
};

const attractionFiles = {
  gyeongbokgung: 'Gyeongbokgung(palace) Geunjeongjeon(hall).jpg',
  barceloneta: 'Barceloneta.jpg',
  'grand-bazaar': 'Grand Bazaar Istanbul.jpg',
  namsan: 'East View from N-Seoul Tower.jpg',
  'eiffel-tower': 'Tour Eiffel sunset.jpg',
  'burj-khalifa': 'View from the Burj Khalifa.jpg',
  'al-fahidi': 'Al Fahidi Historical Neighbourhood (Bastakiya).jpg',
  'wuhou-shrine': 'Temple of Marquis Wu, Chengdu (53683926299).jpg',
  'kuanzhai-alley': 'Street scene - Kuanzhai Alleys - Chengdu, China - DSC05311.jpg',
  'longjing-village': '20260424 Longjing Village.jpg',
  'hefang-street': 'Hefang Street (25857144167).jpg',
  tegallalang: 'Tegallalang rice terraces SF0001.jpg',
  'universal-hollywood': 'Universal Studios Hollywood main entrance courtyard.JPG',
  'tha-phae-gate': '20171105 Tha Phae Gate Chiang Mai 9784 DxO.jpg',
  changdeokgung: 'Changdeokgung Palace.jpg',
  'musee-orsay': "Exterior of the Musée d'Orsay (15).jpg",
  'kuromon-market': '黒門市場 2024(1).jpg',
  'museum-of-future': 'Museum of the Future (98156).jpg',
  'dubai-frame': '190410 Dubai Frame.jpg',
  'xian-muslim-quarter': "Muslim Quarter in Xi'an (48785759581).jpg",
  'van-gogh-museum': 'Van-Gogh-Museum-facade Amsterdam.jpg',
  'reichstag-building': 'Reichstag Berlin.jpg',
  'piazzale-michelangelo': 'Florence panorama as seen from The Piazza Michelangelo.jpg',
  'st-kilda-beach': 'St Kilda Beach, Melbourne, Australia 05.jpg',
  'baiyun-mountain': 'Baiyun mountain.jpg',
  jinli: 'Jinli Street - Chengdu, China - DSC05394.jpg',
  'gothic-quarter': 'Barcelona (Gothic Quarter). Neo-gothic footbridge over Bisbe street. 1928. Joan Rubió, architect. (31113978563).jpg',
  'amsterdam-canals': 'Amsterdam Canal view 01.jpg',
  'jeronimos-monastery': 'Jerónimos Monastery (Mosteiro dos Jerónimos), Belem, Portugal (49599404477).jpg',
  'tsinghua-university': 'TsinghuaUniversityGate.JPG',
  'shanghai-french-concession': 'French Concession, Shanghai, China (9740731686).jpg',
  'tsukiji-outer-market': 'Tsukiji Outer Market.jpg',
  'peking-university': 'Weiming Lake of Peking University in spring 02.jpg',
  'qianmen-dashilar': 'Qianmen Street 1.jpg',
  'natural-history-museum-london': 'Natural History Museum London South Facade 2020 01.jpg',
  'victoria-albert-museum': 'Victoria and Albert Museum entrance.jpg',
  'beijing-grand-canal-museum': 'The Grand Canal Museum of Beijing.jpg',
  shichahai: 'Beijing Shichahai.jpg',
  'china-national-botanical-garden': 'Beijing Botanical Garden Greenhouse.jpg',
  'gubei-water-town': 'Gubei Water Town 20.jpg',
  'wenshu-monastery': 'Hall - Wenshu Monastery - Chengdu, China - DSC05060.jpg',
  'gushan-hangzhou': 'Pier on Solitary Island - Hangzhou.jpg',
  'beijing-road-guangzhou': 'Beijing Road 02910-Guangzhou (32925078735).jpg',
  'yongqing-fang': 'Yongqingfang.jpg',
  'chimelong-safari-park': 'Chimelong Safari Park 9392-Chimelong (48754469408).jpg',
};

// Optional standard-library transport for machines whose OS proxy is ignored by
// Node fetch. Python urllib reads the Windows system proxy; no credentials stored.
const pythonTransport = `import sys,json,urllib.request,urllib.error,base64
url,agent,limit=sys.argv[1],sys.argv[2],int(sys.argv[3])
req=urllib.request.Request(url,headers={'User-Agent':agent})
try:
    response=urllib.request.urlopen(req,timeout=20)
except urllib.error.HTTPError as error:
    response=error
with response:
    data=response.read(limit+1)
    if len(data)>limit:
        print(json.dumps({'status':413,'headers':{},'body':''}))
    else:
        print(json.dumps({'status':response.status,'headers':dict(response.headers),'body':base64.b64encode(data).decode('ascii')}))
`;

function imageFromBuffer(buffer, mime) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error(`Unusable image type ${mime}`);
  if (buffer.length < 1000) throw new Error('Image body unexpectedly small');
  if (buffer.length > MAX_BYTES) throw new Error('Image exceeds 600 KB');
  const jpg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!(jpg || png || webp)) throw new Error('Invalid image signature');
  let width, height;
  if (png && buffer.length >= 24) {
    width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20);
  } else if (webp && buffer.length >= 30) {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      width = buffer.readUIntLE(24, 3) + 1; height = buffer.readUIntLE(27, 3) + 1;
    } else if (chunk === 'VP8 ') {
      width = buffer.readUInt16LE(26) & 0x3fff; height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (chunk === 'VP8L') {
      const packed = buffer.readUInt32LE(21);
      width = (packed & 0x3fff) + 1; height = ((packed >>> 14) & 0x3fff) + 1;
    }
  } else if (jpg) {
    // Commons sometimes reports the requested size for an unscaled original.
    // Read JPEG's start-of-frame dimensions to retain the actual pixel size.
    let offset = 2;
    while (offset + 8 < buffer.length) {
      if (buffer[offset++] !== 0xff) break;
      while (buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 8) {
        height = buffer.readUInt16BE(offset + 3); width = buffer.readUInt16BE(offset + 5); break;
      }
      offset += length;
    }
  }
  return { buffer, extension: jpg ? 'jpg' : png ? 'png' : 'webp', width, height };
}

function plain(html = '') {
  return String(html).replace(/<[^>]*>/g, '').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

async function request(url, binary = false, attempt = 0) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (pythonHttp && ['en.wikipedia.org', 'commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(url).hostname)) {
    const interpreter = process.env.ROAMLY_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
    const args = process.platform === 'win32' && interpreter === 'py' ? ['-3'] : [];
    let stdout;
    try {
      ({stdout}=await runFile(interpreter, [...args, '-c', pythonTransport, String(url), USER_AGENT, String(binary ? MAX_BYTES : 2 * 1024 * 1024)], { timeout: 25000, maxBuffer: 3 * 1024 * 1024, windowsHide: true }));
    } catch(error) {
      if(attempt<1){
        console.warn(`Retrying ${new URL(url).hostname} after 3s (network timeout/failure)`);
        await new Promise(resolve=>setTimeout(resolve,3000));
        return request(url,binary,attempt+1);
      }
      const detail=String(error.stderr||error.message).trim().split(/\r?\n/).at(-1).slice(0,180);
      throw new Error(`Network request failed (${new URL(url).hostname}): ${detail}`);
    }
    const result = JSON.parse(stdout);
    if (result.status === 413 && binary) throw new Error('Image exceeds 600 KB');
    if ([429, 502, 503, 504].includes(result.status) && attempt < 3) {
      const retrySeconds = Math.min(45, Math.max(5 * 2 ** attempt, Number(result.headers['Retry-After']) || 0));
      console.warn(`Retrying ${new URL(url).hostname} after ${retrySeconds}s (HTTP ${result.status})`);
      await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
      return request(url, binary, attempt + 1);
    }
    if (result.status < 200 || result.status >= 300) throw new Error(`HTTP ${result.status}: ${new URL(url).hostname}`);
    const data = Buffer.from(result.body, 'base64');
    return binary ? imageFromBuffer(data, (result.headers['Content-Type'] || result.headers['content-type'] || '').split(';')[0]) : JSON.parse(data.toString('utf8'));
  }
  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: binary ? 'image/jpeg,image/png,image/webp' : 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (attempt >= 2) throw error;
    const retrySeconds = 3 * 2 ** attempt;
    console.warn(`Retrying ${new URL(url).hostname} after ${retrySeconds}s (${error.message})`);
    await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
    return request(url, binary, attempt + 1);
  }
  if ([429, 502, 503, 504].includes(response.status) && attempt < 3) {
    const retrySeconds = Math.min(45, Math.max(5 * 2 ** attempt, Number(response.headers.get('retry-after')) || 0));
    await response.body?.cancel();
    console.warn(`Retrying ${new URL(url).hostname} after ${retrySeconds}s (HTTP ${response.status})`);
    await new Promise(resolve => setTimeout(resolve, retrySeconds * 1000));
    return request(url, binary, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${new URL(url).hostname}`);
  if (!binary) return response.json();
  const mime = response.headers.get('content-type')?.split(';')[0];
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) throw new Error(`Unusable image type ${mime}`);
  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_BYTES) { await response.body.cancel(); throw new Error('Image exceeds 600 KB'); }
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error('Image exceeds 600 KB'); }
    chunks.push(value);
  }
  return imageFromBuffer(Buffer.concat(chunks), mime);
}

async function fileFromArticle(article) {
  if (articleErrorCache.has(article)) throw new Error(articleErrorCache.get(article));
  if (articleFileCache.has(article)) return photographFilename(articleFileCache.get(article));
  const data = await request(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`);
  const source = data.originalimage?.source || data.thumbnail?.source;
  if (!source) throw new Error(`No lead photograph: ${article}`);
  const parts = new URL(source).pathname.split('/');
  const position = parts.indexOf('commons');
  if (position < 0) throw new Error(`Image not on Wikimedia Commons: ${article}`);
  return photographFilename(decodeURIComponent(parts[position + (parts[position + 1] === 'thumb' ? 4 : 3)]));
}

function photographFilename(filename) {
  if (!/\.(jpe?g|png|webp)$/i.test(filename)) throw new Error(`Lead image is not a photograph: ${filename}`);
  if (/(?:^|_)(flag|map|logo)(?:_|\.)/i.test(filename)) throw new Error(`Lead image is a flag/map/logo: ${filename}`);
  return filename;
}

async function metadata(file, width) {
  const cacheKey = `${width}:${canonicalFile(file)}`;
  let record = metadataCache.get(cacheKey);
  if (!record) {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(width), titles: `File:${file}`, redirects: '1' });
    const data = await request(endpoint);
    record = Object.values(data.query?.pages || {}).find(page => page.imageinfo?.length)?.imageinfo[0];
    if (record) metadataCache.set(cacheKey, record);
  }
  if (!record) throw new Error(`Commons metadata missing: ${file}`);
  const license = plain(record.extmetadata?.LicenseShortName?.value);
  if (!/^(?:CC BY(?:-SA)? (?:1\.0|2\.[05]|3\.0|4\.0)(?: [a-z]{2}(?:-[a-z]+)?)?|CC0|Public domain)$/i.test(license)) throw new Error(`License requires manual review: ${license || 'missing'}`);
  return record;
}

await mkdir(IMAGE_DIR, { recursive: true });
await mkdir(path.dirname(MANIFEST), { recursive: true });
let manifest;
try { manifest = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch { manifest = { version: 1, cities: {}, attractions: {} }; }
manifest.cities ||= {};
manifest.attractions ||= {};
// New catalog destinations become image jobs automatically. An exact Wikipedia
// source URL in the catalog is preferred over the English display name.
function catalogImageSource(entity) {
  try {
    const url = new URL(entity.image?.sourceUrl);
    if (url.hostname === 'en.wikipedia.org' && url.pathname.startsWith('/wiki/')) {
      return { article: decodeURIComponent(url.pathname.slice(6)).replaceAll('_', ' ') };
    }
    if (url.hostname === 'commons.wikimedia.org' && url.pathname.startsWith('/wiki/File:')) {
      return { article: entity.nameEn || entity.name, file: decodeURIComponent(url.pathname.slice(11)).replaceAll('_', ' ') };
    }
  } catch { /* the English name is a fallback candidate, still license-checked */ }
  return { article: entity.nameEn || entity.name };
}
let catalog = [];
try { catalog = JSON.parse(await readFile(path.join(ROOT, 'data', 'cities.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const city of catalog) {
  citySources[city.id] = { ...catalogImageSource(city), ...citySources[city.id] };
  for (const attraction of city.attractions || []) {
    const source = catalogImageSource(attraction);
    attractionArticles[attraction.id] ||= source.article;
    attractionFiles[attraction.id] ||= source.file;
  }
}
const excludedPhotos=new Set();
for (const file of ['expansion-photo-overrides.json','africa-photo-overrides.json','global-photo-overrides.json','europe-photo-overrides.json']) {
  try {
    const overrides=JSON.parse(await readFile(path.join(ROOT,'data',file),'utf8'));
    for (const [id,filename] of Object.entries(overrides)) {
      if(filename===null){excludedPhotos.add(id);continue;}
      if(typeof filename!=='string' || !filename.trim()) throw new Error(`Invalid photo override: ${id}`);
      if (citySources[id]) citySources[id].file=filename;
      else if (attractionArticles[id]) attractionFiles[id]=filename;
    }
  } catch(error) { if(error.code!=='ENOENT') throw error; }
}
const jobs = [
  ...Object.entries(citySources).map(([id, source]) => ({ group: 'cities', id, ...source })),
  ...Object.entries(attractionArticles).map(([id, article]) => ({ group: 'attractions', id, article, file: attractionFiles[id] })),
].filter(item => (!selected || selected.includes(item.id)) && !excludedPhotos.has(item.id));

async function isFresh(job) {
  const previous = manifest[job.group][job.id];
  if (force || !previous?.checkedAt || Date.now() - Date.parse(previous.checkedAt) >= MAX_AGE) return false;
  try { return (await stat(path.join(ROOT, 'public', previous.url))).size > 1000; } catch { return false; }
}

// MediaWiki supports multiple titles in one read-only request. Resolve exact
// catalog articles and image metadata in small batches, then download serially.
// This reduces API traffic significantly as the destination catalog grows.
async function prefetchCandidates(candidates) {
  const pending = [];
  for (const job of candidates) if (!(await isFresh(job))) pending.push(job);
  const articles = [...new Set(pending.filter(job => !job.file && !manifest[job.group][job.id]?.fileTitle && !articleFileCache.has(job.article)).map(job => job.article))];
  for (let index = 0; index < articles.length; index += 20) {
    const batch = articles.slice(index, index + 20);
    const endpoint = new URL('https://en.wikipedia.org/w/api.php');
    endpoint.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'pageimages', piprop: 'name', pilicense: 'free', redirects: '1', titles: batch.join('|') });
    try {
      const data = await request(endpoint);
      const aliases = new Map([...(data.query?.normalized || []), ...(data.query?.redirects || [])].map(item => [item.from, item.to]));
      const pages = Object.values(data.query?.pages || {});
      for (const article of batch) {
        let title = article;
        for (let hop = 0; aliases.has(title) && hop < 10; hop++) title = aliases.get(title);
        const page = pages.find(item => item.title === title);
        if (page?.pageimage) articleFileCache.set(article, page.pageimage);
        else if (page && 'missing' in page) articleErrorCache.set(article, `No Wikipedia article: ${article}`);
      }
      console.log(`Resolved photograph candidates: ${batch.length} catalog articles`);
      await saveLookups();
    } catch (error) { console.warn(`Article batch unavailable; individual lookup retained: ${error.message}`); }
  }
  for (const group of ['cities', 'attractions']) {
    const width = group === 'cities' ? 1280 : 960;
    const files = [...new Set(pending.filter(job => job.group === group).map(job => job.file || manifest[group][job.id]?.fileTitle || articleFileCache.get(job.article)).filter(Boolean).map(canonicalFile))].filter(file=>!metadataCache.has(`${width}:${file}`));
    for (let index = 0; index < files.length; index += 10) {
      const batch = files.slice(index, index + 10);
      const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
      endpoint.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(width), redirects: '1', titles: batch.map(file => `File:${file}`).join('|') });
      try {
        const data = await request(endpoint);
        for (const page of Object.values(data.query?.pages || {})) {
          if (page.imageinfo?.[0]) metadataCache.set(`${width}:${canonicalFile(page.title.replace(/^File:/, ''))}`, page.imageinfo[0]);
        }
        await saveLookups();
        console.log(`Resolved image licenses: ${batch.length} file candidates`);
      } catch (error) { console.warn(`Metadata batch unavailable; individual lookup retained: ${error.message}`); }
    }
  }
}

let updated = 0, skipped = 0;
let networkFailureStreak=0, networkPaused=false;
const failures = [];
async function refresh(job) {
  const previous = manifest[job.group][job.id];
  if (!force && previous?.checkedAt && Date.now() - Date.parse(previous.checkedAt) < MAX_AGE) {
    const localPath = path.join(ROOT, 'public', previous.url);
    try { if ((await stat(localPath)).size > 1000) { skipped++; return; } } catch { /* missing cache is refetched */ }
  }
  try {
    const file = job.file || previous?.fileTitle || await fileFromArticle(job.article);
    let info, result, remoteUrl, lastError;
    const widths = job.group === 'cities' ? [1280, 960, 640, 330] : [960, 640, 330];
    for (const width of widths) {
      try {
        info = await metadata(file, width);
        remoteUrl = info.thumburl || info.url;
        result = await request(remoteUrl, true);
        break;
      } catch (error) {
        lastError = error;
        if (!error.message.includes('exceeds')) throw error;
      }
    }
    if (!result) throw lastError;
    const filename = `${job.group === 'cities' ? 'city' : 'place'}-${job.id}.${result.extension}`;
    const output = path.join(IMAGE_DIR, filename);
    const temp = `${output}.${process.pid}.tmp`;
    await writeFile(temp, result.buffer);
    await rename(temp, output);
    const extra = info.extmetadata;
    manifest[job.group][job.id] = {
      url: `/images/${filename}`,
      alt: job.article,
      credit: job.credit || plain(extra.Attribution?.value || extra.Artist?.value) || 'See Wikimedia Commons source page',
      sourceUrl: info.descriptionurl,
      license: plain(extra.LicenseShortName?.value),
      licenseUrl: extra.LicenseUrl?.value || 'https://commons.wikimedia.org/wiki/Commons:Copyright_tags',
      fileTitle: file,
      description: plain(extra.ImageDescription?.value),
      capturedAt: plain(extra.DateTimeOriginal?.value),
      checkedAt: new Date().toISOString(),
      remoteUrl,
      width: result.width || info.thumbwidth,
      height: result.height || info.thumbheight,
      bytes: result.buffer.length,
      modifications: 'Wikimedia thumbnail; interface may crop the image to fit.',
    };
    updated++;
    networkFailureStreak=0;
    console.log(`OK ${job.group}/${job.id}: ${Math.round(result.buffer.length / 1024)} KB / ${manifest[job.group][job.id].license}`);
  } catch (error) {
    failures.push({ group: job.group, id: job.id, error: error.message, previousImageRetained: Boolean(previous) });
    console.warn(`FAILED ${job.group}/${job.id}: ${error.message}${previous ? ' (existing image retained)' : ''}`);
    networkFailureStreak=/Network request failed|fetch failed|timed out/i.test(error.message)?networkFailureStreak+1:0;
    if(networkFailureStreak>=3){
      networkPaused=true;
      console.warn('Network unavailable for three consecutive images; saved progress. Run the same command later to resume missing images.');
    }
  }
}

async function saveManifest() {
  manifest.updatedAt = new Date().toISOString();
  const temp = `${MANIFEST}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await rename(temp, MANIFEST);
}

// One worker and a per-request delay respect Commons' public API rate limits.
for (const group of ['cities','attractions']) {
  if(networkPaused) break;
  const groupJobs=jobs.filter(job=>job.group===group);
  for(let offset=0;offset<groupJobs.length;offset+=40){
    if(networkPaused) break;
    const batch=groupJobs.slice(offset,offset+40);
    await prefetchCandidates(batch);
    for(const job of batch){
      const before=updated+failures.length;
      await refresh(job);
      if(before!==updated+failures.length) await saveManifest();
      if(networkPaused) break;
    }
  }
  await saveLookups();
}
manifest.lastRun = { at: new Date().toISOString(), updated, skipped, networkPaused, excludedPhotos:[...excludedPhotos], failures };
await saveManifest();
console.log(JSON.stringify(manifest.lastRun, null, 2));
if (failures.length) process.exitCode = 1;
