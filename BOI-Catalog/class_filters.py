"""Player class restrictions for catalog entries, supplied as a portable snapshot."""
CLASSES = [
    {'id': '1', 'name': 'Berserker', 'label': 'Берсерк'},
    {'id': '2', 'name': 'Champion', 'label': 'Рыцарь'},
    {'id': '3', 'name': 'Slayer', 'label': 'Убийца'},
    {'id': '4', 'name': 'Magus', 'label': 'Маг'},
    {'id': '5', 'name': 'Heretic', 'label': 'Жрец'},
    {'id': '6', 'name': 'Summoner', 'label': 'Призыватель'},
]
CLASS_BY_ID = {value['id']: value for value in CLASSES}
ALL_CLASS_IDS = set(CLASS_BY_ID)


def attach_requirements(entries, snapshot):
    categories = set()
    for entry in entries:
        ids = snapshot.get('entries', {}).get(entry['uid'])
        if ids is None:
            continue
        if not set(ids) <= ALL_CLASS_IDS:
            raise ValueError(f"Unknown class ID in {entry['uid']}")
        entry['classIds'] = ids
        entry['classLabel'] = ('Все классы' if set(ids) == ALL_CLASS_IDS else
                               ', '.join(CLASS_BY_ID[value]['label'] for value in ids) if ids else 'Недоступно классам')
        # Free-text class comments can contain unrelated announcements. Display
        # the explicit restrictions in their place and retain all other fields.
        entry['fields'] = {('Классы' if key in ['Класс', 'Требуемые классы'] else key): value
                           for key, value in entry['fields'].items()}
        entry['fields']['Классы'] = entry['classLabel']
        categories.add(entry['category'])
    return sorted(categories)
