"""Snapshot class restrictions from server SLK files; game files are read only."""
from pathlib import Path
import argparse
import collections
import json
import re

SITE = Path(__file__).resolve().parents[1]
CLASS_FIELDS = ['WarriorUse', 'KnightUse', 'AssassinUse', 'MageUse', 'PriestUse', 'SummonerUse']


def split_record(line):
    parts, part, quoted, index = [], [], False, 0
    while index < len(line):
        char = line[index]
        if char == '"':
            if quoted and index + 1 < len(line) and line[index + 1] == '"':
                part.extend(['"', '"'])
                index += 2
                continue
            quoted = not quoted
        if char == ';' and not quoted:
            if index + 1 < len(line) and line[index + 1] == ';':
                part.extend([';', ';'])
                index += 2
                continue
            parts.append(''.join(part))
            part = []
        else:
            part.append(char)
        index += 1
    return parts + [''.join(part)]


def read_slk(path):
    # Class flags and identifiers are ASCII; the remaining cells can use any of
    # the encodings found in this server. F records also move the cell cursor.
    raw = path.read_bytes()
    for encoding in ['utf-8-sig', 'gb18030', 'cp1252']:
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            pass
    else:
        raise ValueError(f'Cannot decode {path}')
    rows, x, y = {}, 1, 1
    for physical in text.split('\n'):
        line = physical.rstrip('\r')
        if not line.startswith(('C;', 'F;')):
            continue
        parts = split_record(line)
        for part in parts[1:]:
            if re.fullmatch(r'X\d+', part):
                x = int(part[1:])
            elif re.fullmatch(r'Y\d+', part):
                y = int(part[1:])
        if parts[0] == 'C':
            for part in parts[1:]:
                if part.startswith('K'):
                    value = part[1:]
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1].replace('""', '"')
                    rows.setdefault(y, {})[x] = value.replace(';;', ';')
    return rows


def build(slk_directory, catalog_path=SITE / 'catalog.json', output=SITE / 'class-requirements.json'):
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    restrictions, sources = {}, {}
    by_item = collections.defaultdict(set)
    for category, filename in [('weapons', 'weapon.slk'), ('armour', 'armour.slk')]:
        rows = read_slk(slk_directory / filename)
        columns = {value: column for column, value in rows[2].items()}
        sources[category] = {'source': filename, 'fields': CLASS_FIELDS}
        for entry in catalog['entries']:
            if entry['category'] != category:
                continue
            row = rows.get(entry['sourceRow'], {})
            if row.get(columns['ItemID']) != entry['id']:
                raise ValueError(f"Source row/ID mismatch: {entry['uid']}")
            flags = [row.get(columns[field], '') for field in CLASS_FIELDS]
            if not all(flag in ['0', '1'] for flag in flags):
                raise ValueError(f"Unknown class flags: {entry['uid']} {flags}")
            ids = tuple(str(index + 1) for index, flag in enumerate(flags) if flag == '1')
            restrictions[entry['uid']] = list(ids)
            by_item[entry['id']].add(ids)
    # Only propagate an unambiguous restriction on exactly the same physical ItemID.
    for entry in catalog['entries']:
        if entry['category'] in ['items', 'spiritequipment']:
            candidates = by_item.get(entry['id'], set())
            if len(candidates) == 1:
                restrictions[entry['uid']] = list(next(iter(candidates)))
                sources[entry['category']] = {'source': 'weapon.slk / armour.slk', 'join': 'ItemID', 'fields': CLASS_FIELDS}
    # ProfReq is an explicit list of allowed player classes, unlike TarotCard.Class.
    rows = read_slk(slk_directory / 'TarotCard.slk')
    columns = {value: column for column, value in rows[2].items()}
    for entry in catalog['entries']:
        if entry['category'] != 'tarotcards':
            continue
        row = rows.get(entry['sourceRow'], {})
        if row.get(columns['CardID']) != entry['id']:
            raise ValueError(f"Source row/ID mismatch: {entry['uid']}")
        ids = [value.strip() for value in row.get(columns['ProfReq'], '').split(';') if value.strip()]
        if ids and set(ids) <= set('123456'):
            restrictions[entry['uid']] = sorted(set(ids))
    if any(uid.startswith('tarotcards:') for uid in restrictions):
        sources['tarotcards'] = {'source': 'TarotCard.slk', 'fields': ['ProfReq']}
    result = {'sources': sources, 'entries': restrictions}
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'classRestrictions': dict(collections.Counter(uid.split(':')[0] for uid in restrictions))}))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--slk-directory', type=Path, default=SITE.parent / 'BOI_Odin_4th_Anniversary_Win/GameServer/Slk')
    args = parser.parse_args()
    build(args.slk_directory)
