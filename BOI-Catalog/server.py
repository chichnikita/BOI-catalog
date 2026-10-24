"""BOI local catalog. Listens on loopback and never connects to the game server."""
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from threading import Lock
import argparse, json, mimetypes, math, re, io, hashlib, os
from PIL import Image, UnidentifiedImageError
from gm_actions import GMActions, COMMAND_GUIDE_UPDATES
from class_filters import CLASSES, CLASS_BY_ID, ALL_CLASS_IDS, attach_requirements

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
DATA = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
CATEGORIES = {c['key']: c for c in DATA['categories']}
ENTRIES = DATA['entries']
BY_UID = {e['uid']: e for e in ENTRIES}
DESCRIPTION_PATH = ROOT / 'item-descriptions.json'
DESCRIPTIONS = json.loads(DESCRIPTION_PATH.read_text(encoding='utf-8')) if DESCRIPTION_PATH.exists() else {}
ITEM_CATEGORIES = {c['key'] for c in DATA['categories'] if c['namespace'].startswith('ItemID')}
CLASS_REQUIREMENTS_PATH = ROOT / 'class-requirements.json'
CLASS_REQUIREMENTS = json.loads(CLASS_REQUIREMENTS_PATH.read_text(encoding='utf-8')) if CLASS_REQUIREMENTS_PATH.exists() else {}
CLASS_FILTER_CATEGORIES = attach_requirements(ENTRIES, CLASS_REQUIREMENTS)
for entry in ENTRIES:
    if entry['category'] == 'commands' and entry['id'] in COMMAND_GUIDE_UPDATES:
        entry['fields'] = {**entry['fields'], **COMMAND_GUIDE_UPDATES[entry['id']]}
        entry['name'] = entry['fields']['Описание']
GM_LINKS_PATH = ROOT / 'gm-item-links.json'
GM_ACTIONS = GMActions(ENTRIES, CATEGORIES, json.loads(GM_LINKS_PATH.read_text(encoding='utf-8')) if GM_LINKS_PATH.exists() else {})
for entry in ENTRIES:
    descriptions = DESCRIPTIONS.get(entry['id'], {}) if entry['category'] in ITEM_CATEGORIES else {}
    entry['_search'] = ' '.join([entry['id'], entry['name'], CATEGORIES[entry['category']]['title'], *map(str, entry['fields'].values()),
                                *(CLASS_BY_ID[value]['name'] for value in entry.get('classIds', [])),
                                *(d['name'] + ' ' + d['text'] for d in descriptions.values())]).casefold()
OVERRIDES_PATH = ROOT / 'user-images/overrides.json'
OVERRIDES_PATH.parent.mkdir(exist_ok=True)
OVERRIDES = json.loads(OVERRIDES_PATH.read_text(encoding='utf-8')) if OVERRIDES_PATH.exists() else {}
LOCK = Lock()


def public(entry, detailed=False):
    result = {key: value for key, value in entry.items() if not key.startswith('_')}
    if detailed:
        result['gm'] = GM_ACTIONS.for_entry(entry)
    if entry['category'] in ITEM_CATEGORIES:
        descriptions = DESCRIPTIONS.get(entry['id'], {})
        default = descriptions.get('ru') or descriptions.get('en')
        if default:
            lines = [line for line in default['text'].splitlines() if line.strip()]
            if len(lines) > 1 and lines[0].casefold().rstrip('.') == default['name'].casefold().rstrip('.'):
                lines.pop(0)
            result['descriptionPreview'] = ' '.join(lines)[:180]
        if detailed:
            result['descriptions'] = descriptions
    if entry['uid'] in OVERRIDES:
        result.update(image='/user-images/' + OVERRIDES[entry['uid']], customImage=True,
                      imageInfo={'kind': 'Добавлено пользователем', 'client': 'Локальный каталог'})
    return result


def persist_overrides():
    temporary = OVERRIDES_PATH.with_suffix('.tmp')
    temporary.write_text(json.dumps(OVERRIDES, ensure_ascii=False), encoding='utf-8')
    os.replace(temporary, OVERRIDES_PATH)


class Handler(BaseHTTPRequestHandler):
    server_version = 'BOICatalog/1.0'

    def json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        route = unquote(url.path)
        query = {key: values[0] for key, values in parse_qs(url.query).items()}
        if route == '/api/health':
            return self.json({'app': 'boi-catalog', 'ready': True, 'version': DATA['version']})
        if route == '/api/meta':
            return self.json({'version': DATA['version'], 'categories': DATA['categories'], 'total': len(ENTRIES),
                              'imageCount': DATA['imageCount'], 'assetCount': DATA['assetCount'], 'hero': DATA['hero'],
                              'descriptionCount': len(DESCRIPTIONS), 'classes': CLASSES,
                              'classFilterCategories': CLASS_FILTER_CATEGORIES})
        if route == '/api/entries':
            return self.search(query)
        if route.startswith('/api/entry/'):
            entry = BY_UID.get(route[len('/api/entry/'):])
            return self.json({'entry': public(entry, detailed=True), 'category': CATEGORIES[entry['category']]}) if entry else self.json({'error': 'Объект не найден'}, 404)
        if route.startswith('/download/'):
            filename = route[len('/download/'):]
            allowed = {c['file'] for c in DATA['categories']}
            if filename not in allowed:
                return self.json({'error': 'Файл не найден'}, 404)
            target = PROJECT / filename if filename == 'GM_Commands_RU.txt' else PROJECT / 'ID_References' / filename
            return self.file(target, download=True)
        if route == '/':
            return self.file(ROOT / 'index.html')
        if route in ['/app.js', '/style.css']:
            return self.file(ROOT / route[1:])
        if route.startswith(('/assets/', '/user-images/')):
            target = (ROOT / route.lstrip('/')).resolve()
            if not target.is_relative_to(ROOT / 'assets') and not (target.parent == ROOT / 'user-images' and re.fullmatch(r'[a-f0-9]{24}\.webp', target.name)):
                return self.json({'error': 'Файл не найден'}, 404)
            return self.file(target)
        return self.json({'error': 'Страница не найдена'}, 404)

    def search(self, query):
        category = query.get('category', 'home')
        text = query.get('q', '').strip().casefold()[:200]
        tokens = text.split()
        favorite_ids = set(query.get('favorites', '').split(',')) if 'favorites' in query else None
        items = ENTRIES
        if category == 'home' and not text:
            items = [BY_UID[uid] for uid in DATA['featured']]
        elif category in CATEGORIES:
            items = [e for e in items if e['category'] == category]
        elif category not in ['all', 'home', 'favorites']:
            return self.json({'error': 'Категория не найдена'}, 400)
        if category == 'favorites' or favorite_ids is not None:
            items = [e for e in items if e['uid'] in (favorite_ids or set())]
        class_id = query.get('class', '')
        if class_id:
            if class_id not in CLASS_BY_ID and class_id != 'shared':
                return self.json({'error': 'Неизвестный класс персонажа'}, 400)
            if query.get('shared', '1') not in ['0', '1']:
                return self.json({'error': 'Проверь параметр общей экипировки'}, 400)
            if class_id == 'shared':
                items = [e for e in items if set(e.get('classIds', [])) == ALL_CLASS_IDS]
            else:
                items = [e for e in items if class_id in e.get('classIds', [])
                         and (query.get('shared', '1') == '1' or set(e['classIds']) != ALL_CLASS_IDS)]
        if tokens:
            items = [e for e in items if all(token in e['_search'] for token in tokens)]
        if query.get('images') == '1':
            items = [e for e in items if e['image'] or e['uid'] in OVERRIDES]
        if query.get('boss') == '1':
            items = [e for e in items if e['boss']]
        try:
            for key, predicate in [('min', lambda level, value: level >= value), ('max', lambda level, value: level <= value)]:
                if query.get(key):
                    value = int(query[key])
                    items = [e for e in items if e['level'] is not None and predicate(e['level'], value)]
            limit = max(1, min(100, int(query.get('limit', 36))))
            page = max(1, int(query.get('page', 1)))
        except ValueError:
            return self.json({'error': 'Проверь числовые параметры фильтра'}, 400)
        order = query.get('sort', 'default')
        if order == 'name':
            items = sorted(items, key=lambda e: (e['name'].casefold(), e['id']))
        elif order == 'level':
            items = sorted(items, key=lambda e: (e['level'] is None, e['level'] or 0, e['name']))
        elif order == 'id':
            items = sorted(items, key=lambda e: (not e['id'].isdigit(), int(e['id']) if e['id'].isdigit() else 0, e['id']))
        elif text:
            items = sorted(items, key=lambda e: (e['id'].casefold() != text, not e['name'].casefold().startswith(text), not bool(e['image'])))
        total = len(items)
        pages = max(1, math.ceil(total / limit))
        page = min(page, pages)
        return self.json({'items': [public(e) for e in items[(page - 1) * limit:page * limit]], 'total': total, 'page': page, 'pages': pages})

    def file(self, target, download=False):
        if not target.is_file():
            return self.json({'error': 'Файл не найден'}, 404)
        data = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
        if target.suffix in ['.html', '.js', '.css', '.txt', '.csv']:
            content_type += '; charset=utf-8'
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'public, max-age=86400' if target.suffix in ['.webp', '.svg'] else 'no-cache')
        if download:
            self.send_header('Content-Disposition', 'attachment; filename="' + target.name + '"')
        self.end_headers()
        self.wfile.write(data)

    def mutation_uid(self):
        if self.headers.get('X-BOI-Local') != '1':
            self.json({'error': 'Запрос должен быть отправлен из локального каталога'}, 403)
            return None
        origin = self.headers.get('Origin')
        if origin and origin not in [f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}']:
            self.json({'error': 'Недопустимый источник запроса'}, 403)
            return None
        route = unquote(urlparse(self.path).path)
        uid = route[len('/api/image/'):] if route.startswith('/api/image/') else ''
        if uid not in BY_UID:
            self.json({'error': 'Объект не найден'}, 404)
            return None
        return uid

    def do_POST(self):
        uid = self.mutation_uid()
        if uid is None:
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 8 * 1024 * 1024:
                return self.json({'error': 'Выбери изображение размером до 8 МБ'}, 413)
            content = self.rfile.read(length)
            picture = Image.open(io.BytesIO(content))
            if picture.format not in ['PNG', 'JPEG', 'WEBP'] or picture.width * picture.height > 30_000_000:
                return self.json({'error': 'Поддерживаются PNG, JPG и WebP до 30 мегапикселей'}, 400)
            picture.load()
            picture = picture.convert('RGBA')
            picture.thumbnail((1400, 1400))
            filename = hashlib.sha256(content).hexdigest()[:24] + '.webp'
            with LOCK:
                picture.save(ROOT / 'user-images' / filename, 'WEBP', quality=90)
                OVERRIDES[uid] = filename
                persist_overrides()
            return self.json({'entry': public(BY_UID[uid])})
        except (ValueError, OSError, UnidentifiedImageError, Image.DecompressionBombError):
            return self.json({'error': 'Не удалось открыть изображение. Выбери PNG, JPG или WebP.'}, 400)

    def do_DELETE(self):
        uid = self.mutation_uid()
        if uid is None:
            return
        with LOCK:
            OVERRIDES.pop(uid, None)
            persist_overrides()
        return self.json({'entry': public(BY_UID[uid])})

    def log_message(self, fmt, *args):
        print(self.log_date_time_string(), fmt % args, flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'BOI Catalog ready: http://127.0.0.1:{args.port}/ ({len(ENTRIES)} entries)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
