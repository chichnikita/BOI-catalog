"""GM help for catalog objects, respecting the ID namespace of each table."""
import collections

TIPS = 'GM Command Tips.txt'
COMMAND_GUIDE_UPDATES = {
    '/addrider': {
        'Описание': 'Добавление маунта в список персонажа по Rider.ID.',
        'Проверка': 'Название есть в Line.exe. Формат уточнён по присланному руководству; выполнение в игре не проверено.',
        'Параметры': '/addrider <ID_МАУНТА>', 'Пример': '/addrider 1206',
        'Примечание': 'Уточнено по GM_Mount_Commands_RU.txt: в присланном руководстве используется один ID. Команда в игре не проверялась.'},
    '/addpet': {
        'Описание': 'Создание питомца по ID вида из Pet.slk.',
        'Проверка': 'Название есть в Line.exe. Формат уточнён по присланному руководству; выполнение в игре не проверено.',
        'Параметры': '/addpet <ID_ПИТОМЦА> 1 <ПОКОЛЕНИЕ>', 'Пример': '/addpet 3093 1 1',
        'Примечание': 'Уточнено по GM_Pet_Commands_RU.txt. Средний параметр 1 оставлен как в руководстве; его назначение отдельно не объяснено. Нужен свободный слот питомца.'},
    '/setpetskill': {
        'Описание': 'Замена навыка призванного питомца в указанной ячейке.',
        'Проверка': 'Название есть в Line.exe. Формат уточнён по присланному руководству; выполнение в игре не проверено.',
        'Параметры': '/setpetskill <ЯЧЕЙКА> <ID_НАВЫКА>',
        'Примечание': 'Уточнено по GM_Pet_Commands_RU.txt. Сначала призови питомца. Существующий навык ячейки будет заменён. Диапазон 0–8 указан в руководстве другой версии и отдельно не проверен.'},
}
UNRESOLVED = {
    'skills': ('addskill', 'Памятка указывает ID навыка и уровень, но полный набор аргументов не установлен.'),
    'statuses': ('addstatus', 'Порядок аргументов, уровень эффекта и выбор цели пока не установлены.'),
    'prefixes': ('addprename', 'Команда есть в Line.exe; формат выдачи префикса пока не установлен.'),
    'factions': ('changefaction', 'Команда есть в Line.exe; формат смены фракции пока не установлен.'),
    'relics': ('addtrump', 'Команда есть в Line.exe; формат прямой выдачи артефакта пока не установлен.'),
    'vehicles': ('createvehicle', 'Команда есть в Line.exe; порядок ID, координат и других аргументов пока не установлен.'),
    'emotes': ('addemote', 'Команда есть в Line.exe; формат открытия эмоции пока не установлен.'),
    'tarotcards': (None, 'Готовая GM-команда для этой карты Таро в локальных руководствах не найдена.'),
    'treasures': (None, 'Для этого внутреннего ID не найден связанный предмет выдачи.'),
    'petskills': ('addpetskill', 'Формат добавления навыка пока не установлен. В руководстве описана замена навыка через /setpetskill.'),
}


class GMActions:
    def __init__(self, entries, categories, links):
        self.categories = categories
        self.item_categories = {key for key, value in categories.items() if value['namespace'].startswith('ItemID')}
        self.links = links
        self.by_category_id = collections.defaultdict(dict)
        self.items = {}
        self.treasure_items = collections.defaultdict(list)
        for entry in entries:
            self.by_category_id[entry['category']].setdefault(entry['id'], entry)
            if entry['category'] in self.item_categories:
                self.items.setdefault(entry['id'], entry)
            if entry['category'] == 'treasureitems':
                self.treasure_items[entry['fields'].get('Внутренний ID сокровища')].append(entry)

    @staticmethod
    def action(title, command, note, source, quantity=False, **extra):
        return dict(title=title, command=command, note=note, source=source, quantity=quantity, **extra)

    def for_entry(self, entry):
        category, identity = entry['category'], entry['id']
        actions, notes = [], []
        result = dict(title='Как получить / призвать', actions=actions, notes=notes,
                      activation='/setpower', status='documented')
        if category in self.item_categories:
            actions.append(self.action('Выдать в инвентарь', f'/additem {identity} 1',
                                       'Последнее число — количество предметов. Нужны свободные места в инвентаре.', TIPS, True))
        elif category == 'monsters':
            actions.append(self.action('Создать монстра', f'/addmonster {identity} 1',
                                       'Последнее число — количество. Появление зависит от текущей карты и правил сервера.', TIPS, True))
        elif category == 'mounts':
            actions.append(self.action('Добавить маунта', f'/addrider {identity}',
                                       'После команды открой список маунтов. Используется Rider.ID этой записи.', 'GM_Mount_Commands_RU.txt'))
        elif category == 'pets':
            actions.append(self.action('Создать питомца', f'/addpet {identity} 1 1',
                                       'Последнее число — поколение (здесь 1). Средний параметр оставлен равным 1 по руководству. Нужен свободный слот питомца.', 'GM_Pet_Commands_RU.txt'))
        elif category == 'titles':
            actions.append(self.action('Добавить титул', f'/addtitle {identity}',
                                       'Используется TitleID этой записи. Доступность титула зависит от правил сервера.', TIPS))
        elif category == 'maps':
            result['title'] = 'Как переместиться'
            actions.append(self.action('Перейти на карту', f'/flytopos {identity}',
                                       'В памятке описан переход по MapId. Координаты этой командой не задаются.', TIPS))
        elif category == 'npc':
            result['title'] = 'Как найти NPC'
            map_id = entry['fields'].get('ID карты', '')
            if map_id in self.by_category_id['maps']:
                x, y = entry['fields'].get('X', '—'), entry['fields'].get('Y', '—')
                actions.append(self.action('Перейти на карту NPC', f'/flytopos {map_id}',
                                           f'Затем найди NPC в точке X: {x}, Y: {y}. Команда переносит на карту; NPC она не создаёт.', TIPS))
            else:
                notes.append('Для этой записи не найдена карта перехода. Формат команды создания NPC не установлен.')
        elif category == 'treasures':
            for item in self.treasure_items.get(identity, []):
                actions.append(self.action('Получить предмет сокровища', f"/additem {item['id']} 1",
                                           f"{item['name']}. После выдачи используй предмет из инвентаря.",
                                           'Treasure/TreasureItem.slk', True, itemUid=item['uid'], itemId=item['id']))
        elif category == 'petskills':
            actions.append(self.action('Заменить навык в ячейке 0', f'/setpetskill 0 {identity}',
                                       'Сначала призови нужного питомца. Ячейка 0: существующий навык будет заменён. Нумерация ячеек взята из руководства другой версии.',
                                       'GM_Pet_Commands_RU.txt', caution=True))
            book = self.items.get(entry['fields'].get('ID книги при удалении'))
            if book:
                actions.append(self.action('Получить связанную книгу', f"/additem {book['id']} 1",
                                           f"{book['name']}. Это SkillBook из PetSkill.slk; применимость книги проверь в игре.",
                                           'Pet/PetSkill.slk', True, itemUid=book['uid'], itemId=book['id']))
        elif category == 'commands':
            result['title'] = 'Как использовать команду'
            example = entry['fields'].get('Пример', '')
            parameters = entry['fields'].get('Параметры', '')
            # New guides supersede older incomplete mount/pet notes in the reference.
            overrides = {'/addrider': '/addrider <ID_МАУНТА>', '/addpet': '/addpet <ID_ПИТОМЦА> 1 <ПОКОЛЕНИЕ>',
                         '/setpetskill': '/setpetskill <ЯЧЕЙКА> <ID_НАВЫКА>'}
            command = overrides.get(identity) or example or (parameters if parameters.startswith(identity + ' ') or parameters == identity else '')
            if command:
                template = '<' in command
                actions.append(self.action('Шаблон команды' if template else 'Пример из справочника', command,
                                           'Замени параметры в угловых скобках своими значениями.' if template else entry['fields'].get('Примечание', ''),
                                           'GM_Commands_RU.txt' if identity not in overrides else 'GM_Mount_Commands_RU.txt' if identity == '/addrider' else 'GM_Pet_Commands_RU.txt', template=template))
            else:
                notes.append('Синтаксис этой команды пока не установлен. Описание и степень проверки приведены ниже.')

        for linked in self.links.get(category, {}).get(identity, []):
            item_id = linked['itemId']
            if any(a['command'] == f'/additem {item_id} 1' for a in actions):
                continue
            actions.append(self.action('Получить через предмет', f'/additem {item_id} 1',
                                       f"{linked['name']}. Затем используй предмет. Его скрипт вызывает {linked['call']} для ID {identity}; условия применения остаются в силе.",
                                       f"Script/ItemScript.slk, строка {linked['sourceRow']} → {linked['script']}",
                                       True, itemUid=linked['uid'], itemId=item_id))
        if not actions:
            result['status'] = 'unknown'
            command, note = UNRESOLVED.get(category, (None, 'Готовая команда для этой записи пока не найдена.'))
            notes.append(note)
            if command:
                result['relatedCommand'] = {'name': '/' + command, 'uid': 'commands:' + command}
            if category != 'commands':
                result['namespaceNote'] = f"ID {identity} относится к {self.categories[category]['namespace']}. Его нельзя автоматически использовать как ID предмета для /additem."
        else:
            result['status'] = 'template' if all(a.get('template') for a in actions) else 'documented'
        return result
