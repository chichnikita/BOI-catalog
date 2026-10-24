from pathlib import Path
import os, json, urllib.request, urllib.error

SITE = Path(__file__).resolve().parents[1]
BASE = os.environ.get('BOI_CATALOG_URL', 'http://127.0.0.1:8765').rstrip('/')


def request(route, data=None, method='GET', headers=None):
    req = urllib.request.Request(BASE + route, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())


meta = request('/api/meta')
assert meta['total'] == 49213 + 169
assert meta['imageCount'] == 31895
assert request('/api/entries?category=monsters&boss=1')['total'] == 549
entry = request('/api/entries?category=items&q=63051')['items'][0]
assert entry['name'] == 'LV1 Nova Deity Chest' and entry['image']
assert request('/api/entries?category=skills&q=1000')['total'] >= 10
for category in meta['categories']:
    result = request('/api/entries?category=' + category['key'])
    assert result['total'] == category['count'], category['key']

# Exercise actual local file persistence, then restore the object to its original state.
target = next(e for e in request('/api/entries?category=npc')['items'] if not e.get('customImage'))
uid = target['uid']
route = '/api/image/' + urllib.parse.quote(uid)
try:
    try:
        request(route, b'invalid', 'POST')
        raise AssertionError('Mutation accepted without local header')
    except urllib.error.HTTPError as exc:
        assert exc.code == 403
    try:
        request(route, b'not an image', 'POST', {'X-BOI-Local':'1'})
        raise AssertionError('Invalid image accepted')
    except urllib.error.HTTPError as exc:
        assert exc.code == 400
    image = SITE / entry['image'].lstrip('/')
    saved = request(route, image.read_bytes(), 'POST', {'X-BOI-Local':'1', 'Content-Type':'application/octet-stream'})['entry']
    assert saved['customImage']
    persisted = json.loads((SITE / 'user-images/overrides.json').read_text(encoding='utf-8'))
    assert uid in persisted
    assert (SITE / 'user-images' / persisted[uid]).is_file()
    assert request('/api/entry/' + urllib.parse.quote(uid))['entry']['customImage']
finally:
    restored = request(route, method='DELETE', headers={'X-BOI-Local':'1'})['entry']
    assert not restored.get('customImage') and restored['image'] == target['image']
print('PASS: all category counts, exact ID search, boss filter, skill levels, image validation, upload persistence and restore.')
