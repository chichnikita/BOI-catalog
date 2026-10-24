СПРАВОЧНИКИ ID — BOI ODIN

Сборка источника: BOI_Odin_4th_Anniversary_Win, GameServer/Slk.
Дата выгрузки UTC: 2026-10-24T08:55:07.277072+00:00
Названия сохранены из серверных таблиц, преимущественно на английском.
Русские названия в клиенте могут отличаться. Поиск по ID позволяет сопоставлять записи.

ФОРМАТЫ
TXT: открыть в Блокноте или Notepad++, искать через Ctrl+F.
CSV: UTF-8 с BOM, разделитель — точка с запятой. Все поля заключены в кавычки.
Если Excel не разделил CSV на столбцы: Данные → Из текста/CSV → UTF-8 → точка с запятой.
Excel со всеми категориями, вкладками и фильтрами: C:\Users\admin\Desktop\BOI-SERVER-MY\outputs\01a168e2-1b18-74f0-9880-552c1ee832f8\BOI_ID_Reference.xlsx

КАК ЧИТАТЬ ID
ID предмета, монстра, карты, питомца, маунта, статуса и навыка принадлежат разным областям.
Одинаковое число в разных областях не означает один объект.
Основной item.slk и специализированные таблицы могут описывать один и тот же предмет.
Не суммируй количество строк всех файлов как число уникальных объектов игры.
У навыков и статусов сохранены строки всех уровней. Другие повторные ID тоже не удалены.
Строка SLK — номер логической строки таблицы, не номер текстовой строки файла.
Пустое поле означает, что значение отсутствует в исходной ячейке.
Служебные и тестовые записи сохранены. Наличие ID в таблице не подтверждает его использование на работающем сервере.
Неразборчивые названия N/A, вопросительные знаки и технические имена сохранены как в источнике.
Старые управляющие символы в названиях отображены читаемыми кодами \x0B и \x0C во всех форматах; ID не изменены.
Текст #N/A в некоторых полях также присутствует в исходной таблице и не является результатом расчёта.
Для синтаксиса GM-команд используй GM_Commands_RU.txt в корне проекта.

БОССЫ
В Excel на вкладке «Монстры» отфильтруй столбец «Тип монстра» по значению monstertype_boss: 549 записей.

ПРОВЕРЕННЫЕ ПРИМЕРЫ
63051 — LV1 Nova Deity Chest, предмет из item.slk.
10001 — Giant Scorpion-LV3, монстр из monster.slk.
475 — Atlantis, карта из WorldMapCfg.slk.

СОСТАВ
01_Items.txt / .csv — Предметы: 16907 записей, 16905 разных ID; источник item.slk; строк без ID исключено: 749.
02_Weapons.txt / .csv — Оружие: 670 записей, 670 разных ID; источник weapon.slk; строк без ID исключено: 76.
03_Armour.txt / .csv — Броня: 6135 записей, 6120 разных ID; источник armour.slk; строк без ID исключено: 42.
04_Monsters.txt / .csv — Монстры: 5327 записей, 5327 разных ID; источник monster.slk; строк без ID исключено: 565.
05_NPC.txt / .csv — NPC: 1727 записей, 1727 разных ID; источник Npc.slk; строк без ID исключено: 0.
06_Maps.txt / .csv — Карты: 373 записей, 373 разных ID; источник WorldMapCfg.slk; строк без ID исключено: 0.
07_Skills.txt / .csv — Навыки: 3760 записей, 376 разных ID; источник skill.slk; строк без ID исключено: 0.
08_Pets.txt / .csv — Питомцы: 946 записей, 946 разных ID; источник Pet/Pet.slk; строк без ID исключено: 0.
09_Mounts.txt / .csv — Маунты: 383 записей, 383 разных ID; источник Rider.slk; строк без ID исключено: 0.
10_Gems.txt / .csv — Самоцветы: 885 записей, 885 разных ID; источник gem.slk; строк без ID исключено: 0.
11_Materials.txt / .csv — Материалы: 197 записей, 197 разных ID; источник material.slk; строк без ID исключено: 0.
12_Restore.txt / .csv — Зелья и восстановление: 680 записей, 680 разных ID; источник restore.slk; строк без ID исключено: 0.
13_Charms.txt / .csv — Чармы: 256 записей, 256 разных ID; источник charm.slk; строк без ID исключено: 0.
14_Stardust.txt / .csv — Звёздная пыль: 100 записей, 100 разных ID; источник stardust.slk; строк без ID исключено: 0.
15_Titles.txt / .csv — Титулы: 63 записей, 63 разных ID; источник Title.slk; строк без ID исключено: 0.
16_Prefixes.txt / .csv — Префиксы имени: 6 записей, 6 разных ID; источник PreName.slk; строк без ID исключено: 0.
17_Factions.txt / .csv — Фракции: 21 записей, 21 разных ID; источник Faction.slk; строк без ID исключено: 0.
18_Relics.txt / .csv — Реликвии: 28 записей, 28 разных ID; источник MagicWeapon.slk; строк без ID исключено: 0.
19_PetEquipment.txt / .csv — Экипировка питомцев: 68 записей, 68 разных ID; источник PetEquip.slk; строк без ID исключено: 0.
20_SpiritEquipment.txt / .csv — Духовная экипировка: 240 записей, 240 разных ID; источник SpiritEquip/SpiritEquip.slk; строк без ID исключено: 0.
21_Treasures.txt / .csv — Сокровища: 42 записей, 42 разных ID; источник Treasure/Treasure.slk; строк без ID исключено: 0.
22_TreasureItems.txt / .csv — Предметы сокровищ: 42 записей, 42 разных ID; источник Treasure/TreasureItem.slk; строк без ID исключено: 0.
23_PetSkills.txt / .csv — Навыки питомцев: 357 записей, 357 разных ID; источник Pet/PetSkill.slk; строк без ID исключено: 0.
24_Statuses.txt / .csv — Эффекты и статусы: 8775 записей, 3181 разных ID; источник Skill/sStatusList.slk; строк без ID исключено: 0.
25_Tools.txt / .csv — Инструменты: 7 записей, 7 разных ID; источник tool.slk; строк без ID исключено: 0.
26_TarotCards.txt / .csv — Карты Таро: 1170 записей, 1170 разных ID; источник TarotCard.slk; строк без ID исключено: 0.
27_Vehicles.txt / .csv — Транспорт: 8 записей, 8 разных ID; источник Vehicle.slk; строк без ID исключено: 0.
28_Emotes.txt / .csv — Эмоции и действия: 40 записей, 40 разных ID; источник emot.slk; строк без ID исключено: 0.

КОНТРОЛЬ ИСТОЧНИКОВ SHA-256
item.slk | bb504541fe627e3179cb3266a85c5a512424938699f6b97637b5a632cd17b6ec
weapon.slk | 5963435bba911b5d9a2b0ba7b64b797f7a1573279714da4c2167362da3cd25c5
armour.slk | 3c349bbc03f9441f83f089c108e2669acbdeed5251df2b5a4b7dc6e4e86ad8d8
monster.slk | 6e5096e45005f0b6fb617025a22b8316deb5e43e5b170b5d9430db9a40274f2b
Npc.slk | 420f46e1e4e671ab465a401ca59aed7f99f53c7edeb65c30bc243871da31b6a9
WorldMapCfg.slk | b6259cd8954464421778972b35ae8bedad0d40b44f7e8da5f87ebc890d00d285
skill.slk | 5874b1247751c09709456ebac5c5b158784ca77d44f9840464c838f86bf2d0ff
Pet/Pet.slk | a948b91acfc40d4084df1159c53d83dd2cf045eccefb33910bfa6f7827eefd6d
Rider.slk | 16e520bca4afcf6af7b453b4ecf1b9b98a5c9d3f80f83114e6f96ddf51e1cb5a
gem.slk | 35bd6d45d908aa00cae7408567aa3ba902f82c7a2042b1f14c54ddf57ad46d27
material.slk | 424aa9832d32747883e6a8cc51f1de3eb26e0293ac25f5dcf5a2dcfcd1f14766
restore.slk | 743e8afb595188d351c07891c84596c37d5cb563db311e7088b867e560ea841e
charm.slk | 3ce75ebbef80c81b85d1b519820b256875bd07e9163b17f473366a85c1de1409
stardust.slk | 12619ff995115471c47afb4f18bafd0bdfb6abf8035784a08400c4d2f7402c1b
Title.slk | de99ea25d34795563bc911a166e652bc1a06cfec729d48ee22bbac85d0f47786
PreName.slk | d3ab86ad0b0e0adb6056a03950cd2b14551e95a908392d26647e7a93b5ae1f12
Faction.slk | ed3124baea857e997380ef36fbd3b3671bdd65f014b0fcc2fa684811ee7f6bcc
MagicWeapon.slk | 7583e8f1601241cdeb7f8d9cc3bdb1660fcf1c80cd44b366a647dc2027f508d6
PetEquip.slk | c51bd12db0cabda9342d481bd407b4c459e777491ee6e9733dade71110b04eca
SpiritEquip/SpiritEquip.slk | dd3290b64bebe9b6ebec3d463683362e4482b63106e7c56f87810922a3791e38
Treasure/Treasure.slk | a32cd4fcd1e3ca6d8c53a6078f35cb63597de20071872b5eb1c60f0c7e464bdf
Treasure/TreasureItem.slk | e2a0f5ab2e106332104f0f3aec3abae33842a5db3985f597dac476d768ba23b5
Pet/PetSkill.slk | 989ddde04b0f80964b4cb62b06e862928e62ae0777655d00482ccf3ce5c84ff1
Skill/sStatusList.slk | f4fc9006f5ac231df76693ae64515958c498f765fac5f4ce0344eaf65705f334
tool.slk | 061213e3295b5ce68c051baf2ef9a41babcfeac3738e3fdc894d83303446539f
TarotCard.slk | 647b12606484095c714f9ec8a6191765f44e8bf644d0f8d605f3e7978ca1b2e6
Vehicle.slk | f525c5d039f218165721ba926b1a7279a45c67af73806503104338cfc3b22090
emot.slk | 6156b2d61c3cdcbaf93e90df848c7f80b0eae1677fb6fad8987ad340f7a372d2
