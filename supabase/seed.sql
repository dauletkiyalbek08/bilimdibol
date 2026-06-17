-- =============================================================
-- bilimdibol — seed data (run AFTER schema.sql)
-- Inserts the 12 demo employees + a few sample leads/deals so the
-- app shows real rows once Supabase is connected.
-- Idempotent: safe to run multiple times.
--
-- NOTE: this seeds the public.users TABLE (app profiles).
-- Auth accounts (login/password) are created separately:
--   node scripts/seed-auth.mjs
-- Emails here must match the auth accounts.
-- =============================================================

insert into users (id, name, login, role, email, phone, avatar_color) values
  ('00000000-0000-0000-0000-000000000001', 'Айжан К.',    'admin',      'admin',      'aizhan@bilimdibol.kz',   '+7 701 111 22 33', '#16A34A'),
  ('00000000-0000-0000-0000-000000000002', 'Тимур Р.',    'rop',        'rop',        'timur@bilimdibol.kz',    '+7 701 222 33 44', '#FB923C'),
  ('00000000-0000-0000-0000-000000000003', 'Мадина Т.',   'hunter1',    'hunter',     'madina@bilimdibol.kz',   '+7 701 333 44 55', '#0EA5E9'),
  ('00000000-0000-0000-0000-000000000004', 'Аружан Ж.',   'hunter2',    'hunter',     'aruzhan@bilimdibol.kz',  '+7 701 444 55 66', '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000005', 'Нурлан К.',   'hunter3',    'hunter',     'nurlan@bilimdibol.kz',   '+7 701 555 66 77', '#EC4899'),
  ('00000000-0000-0000-0000-000000000006', 'Салтанат Ж.', 'manager1',   'manager',    'saltanat@bilimdibol.kz', '+7 701 666 77 88', '#F59E0B'),
  ('00000000-0000-0000-0000-000000000007', 'Айна Б.',     'manager2',   'manager',    'aina@bilimdibol.kz',     '+7 701 777 88 99', '#14B8A6'),
  ('00000000-0000-0000-0000-000000000008', 'Диас А.',     'target',     'target',     'dias@bilimdibol.kz',     '+7 701 888 99 00', '#EF4444'),
  ('00000000-0000-0000-0000-000000000009', 'Гульмира С.', 'accountant', 'accountant', 'gulmira@bilimdibol.kz',  '+7 701 999 00 11', '#6366F1'),
  ('00000000-0000-0000-0000-000000000010', 'Еркежан М.',  'content',    'content',    'yerkezhan@bilimdibol.kz','+7 701 000 11 22', '#84CC16'),
  ('00000000-0000-0000-0000-000000000011', 'Жанар О.',    'marketer',   'marketer',   'zhanar@bilimdibol.kz',   '+7 701 121 34 55', '#D946EF'),
  ('00000000-0000-0000-0000-000000000012', 'Камиля Д.',   'smm',        'smm',        'kamilya@bilimdibol.kz',  '+7 701 232 45 66', '#0891B2')
on conflict (login) do nothing;

-- Sample leads (hunter referenced by login)
insert into leads (name, phone, source, hunter_id, status, comment)
select v.name, v.phone, v.source, u.id, v.status, v.comment
from (values
  ('Алишер А.', '+7 701 700 10 11', 'Instagram',    'hunter1', 'new',                'Интересуется IELTS до конца года'),
  ('Дана Б.',   '+7 701 701 12 13', 'Meta Ads',     'hunter1', 'in_progress',        'Просила перезвонить вечером'),
  ('Ержан Е.',  '+7 701 702 14 15', 'TikTok',       'hunter2', 'bought_trial',       'Готов на пробный урок'),
  ('Камила К.', '+7 701 703 16 17', 'WhatsApp',     'hunter2', 'passed_to_manager',  'Английский для работы'),
  ('Бекзат М.', '+7 701 704 18 19', 'Quiz',         'hunter3', 'no_answer',          'Оставил заявку через квиз'),
  ('Айгерим Н.','+7 701 705 20 21', 'Landing Page', 'hunter3', 'in_progress',        'Уточняет цену и рассрочку')
) as v(name, phone, source, login, status, comment)
join users u on u.login = v.login;

-- Sample deals (CRM pipeline)
insert into deals (client_name, phone, source, amount, hunter_id, manager_id, stage, next_step, quality, probability, comment)
select v.client_name, v.phone, v.source, v.amount, h.id, m.id, v.stage, v.next_step, v.quality, v.probability, v.comment
from (values
  ('Санжар С.',  '+7 701 706 22 23', 'Meta Ads',  159000, 'hunter1', 'manager1', 'trial_scheduled', 'Напомнить о пробном',     'hot',  45, 'Назначен пробный на четверг'),
  ('Динара Д.',  '+7 701 707 24 25', 'Instagram', 249000, 'hunter2', 'manager2', 'contract',         'Выставить договор',        'hot',  75, 'Готова к оплате, нужен договор'),
  ('Арман А.',   '+7 701 708 26 27', 'Google Ads',129000, 'hunter3', 'manager1', 'won',              'Сделка закрыта',           'warm', 100,'Купил General English B1'),
  ('Жанель Ж.',  '+7 701 709 28 29', 'Referral',  189000, 'hunter1', 'manager2', 'payment',          'Проконтролировать оплату', 'hot',  90, 'Оплата по Kaspi')
) as v(client_name, phone, source, amount, login_h, login_m, stage, next_step, quality, probability, comment)
join users h on h.login = v.login_h
join users m on m.login = v.login_m;

-- Sample clients
insert into clients (name, phone, course, manager_id, total_paid, status, progress)
select v.name, v.phone, v.course, m.id, v.total_paid, v.status, v.progress
from (values
  ('Алия А.',     '+7 701 710 30 31', 'General English B1', 'manager1', 159000, 'Активный',  62),
  ('Мирас М.',    '+7 701 711 32 33', 'IELTS Pro',          'manager2', 249000, 'Активный',  38),
  ('Сабина С.',   '+7 701 712 34 35', 'Speaking Club',      'manager1', 129000, 'Завершил',  100),
  ('Олжас О.',    '+7 701 713 36 37', 'English for Work',   'manager2', 189000, 'Пауза',     45),
  ('Гаухар Г.',   '+7 701 714 38 39', 'General English A2', 'manager1', 129000, 'Активный',  74)
) as v(name, phone, course, login_m, total_paid, status, progress)
join users m on m.login = v.login_m;

-- Sample sales
insert into sales (client_name, course, amount, method, manager_id, hunter_id, receipt_status, contract_status, capi_sent, installment)
select v.client_name, v.course, v.amount, v.method, m.id, h.id, v.receipt, v.contract, v.capi, v.installment
from (values
  ('Алия А.',   'General English B1', 159000, 'Kaspi',     'manager1', 'hunter1', 'confirmed', 'Подписан',  true,  false),
  ('Мирас М.',  'IELTS Pro',          249000, 'Рассрочка', 'manager2', 'hunter2', 'pending',   'Отправлен', false, true),
  ('Сабина С.', 'Speaking Club',      129000, 'Halyk',     'manager1', 'hunter3', 'confirmed', 'Подписан',  true,  false),
  ('Олжас О.',  'English for Work',   189000, 'Банк',      'manager2', 'hunter1', 'rejected',  'Черновик',  false, false)
) as v(client_name, course, amount, method, login_m, login_h, receipt, contract, capi, installment)
join users m on m.login = v.login_m
join users h on h.login = v.login_h;

-- Sample creative analytics
insert into creative_analytics
  (name, platform, campaign, views, clicks, ctr, leads, cpl, trials, sales, conversion, revenue, roas, lead_quality, recommendation)
values
  ('Reels «3 ошибки в английском»', 'Meta',   'IELTS — холодная',  84000, 2520, 3.0,  118, 1100, 34, 9,  7.6, 1431000, 4.9, 82, 'scale'),
  ('UGC отзыв ученицы IELTS',       'TikTok', 'Speaking — ретаргет',62000, 1860, 3.0,  74,  1600, 19, 5,  6.8, 795000,  2.6, 64, 'keep'),
  ('Хук «Заговори за 2 месяца»',    'YouTube','A1-A2 lookalike',   45000, 900,  2.0,  41,  2900, 8,  2,  4.9, 258000,  1.1, 41, 'change_audience'),
  ('Карусель «Уровни A1-C1»',       'Google', 'Search Алматы',     30000, 1500, 5.0,  96,  900,  31, 11, 11.4,1749000, 5.8, 88, 'scale'),
  ('TikTok тренд + субтитры',       'TikTok', 'TikTok трафик',     120000,3600, 3.0,  60,  2400, 12, 3,  5.0, 387000,  1.3, 38, 'stop');

-- Sample marketing attribution
insert into marketing_attribution
  (client_name, first_touch_source, last_touch_source, assisted_source, utm_campaign, creative_id, confidence_score, converted)
values
  ('Алишер А.',  'Meta Ads',   'WhatsApp',     'Instagram',   'ielts_cold',       'cr-1', 62, true),
  ('Дана Б.',    'TikTok',     'WhatsApp',     'Instagram',   'tiktok_trends',    'cr-5', 48, false),
  ('Ержан Е.',   'Meta Ads',   'Instagram',    'Instagram',   'speaking_retarget','cr-2', 78, true),
  ('Камила К.',  'Google Ads', 'Quiz',         'Landing Page','search_almaty',    'cr-4', 84, true),
  ('Бекзат М.',  'Referral',   'WhatsApp',     'WhatsApp',    'bio_link_promo',   'cr-1', 90, true),
  ('Айгерим Н.', 'Instagram',  'WhatsApp',     'Instagram',   'a1a2_lookalike',   'cr-3', 55, false);

-- Sample calls (transcript as jsonb; agent referenced by login)
insert into calls (employee_id, client_name, duration_sec, language, status, score, result, transcript)
select u.id, v.client_name, v.duration_sec, v.language, v.status, v.score, v.result, v.transcript::jsonb
from (values
  ('hunter1', 'Санжар С.', 245, 'ru',    'done',    78, 'Назначен пробный урок',
    '[{"speaker":"agent","text":"Здравствуйте! Школа bilimdibol. Удобно говорить?"},{"speaker":"client","text":"Да, оставлял заявку на английский"},{"speaker":"agent","text":"Для каких целей хотите учить?"},{"speaker":"client","text":"Для работы"},{"speaker":"agent","text":"Запишу на бесплатный пробный урок?"},{"speaker":"client","text":"Давайте"}]'),
  ('hunter2', 'Динара Д.', 410, 'kz',    'pending', null, 'Клиент думает',
    '[{"speaker":"agent","text":"Сәлеметсіз бе! Bilimdibol мектебінен Аружан."},{"speaker":"client","text":"Иә, IELTS курсына қызығамын"},{"speaker":"agent","text":"Тегін сынақ сабаққа жазайын ба?"},{"speaker":"client","text":"Ойланайын"}]'),
  ('manager1','Арман А.',  180, 'mixed', 'done',    61, 'Перезвонить позже',
    '[{"speaker":"agent","text":"Добрый день! Это bilimdibol"},{"speaker":"client","text":"Қазір қолым бос емес"},{"speaker":"agent","text":"Хорошо, когда удобно перезвонить?"},{"speaker":"client","text":"Кешке"}]')
) as v(login, client_name, duration_sec, language, status, score, result, transcript)
join users u on u.login = v.login;

-- Sample trial lessons
insert into trials (client_name, datetime, hunter_id, manager_id, status, result, offered_course, price)
select v.client_name, now() + (v.day_offset || ' days')::interval, h.id, m.id, v.status, v.result, v.course, v.price
from (values
  ('Алишер А.', 1,  'hunter1', 'manager1', 'scheduled', 'Ожидается',                      'IELTS Pro',          249000),
  ('Дана Б.',  -1,  'hunter1', 'manager2', 'completed', 'Урок проведён, думает',          'General English B1', 159000),
  ('Ержан Е.', -2,  'hunter2', 'manager1', 'bought',    'Купил курс после пробного',      'English for Work',   189000),
  ('Камила К.',-3,  'hunter2', 'manager2', 'no_show',   'Не явился на урок',              'Speaking Club',      129000),
  ('Бекзат М.', 2,  'hunter3', 'manager1', 'scheduled', 'Ожидается',                      'General English A2', 129000)
) as v(client_name, day_offset, login_h, login_m, status, result, course, price)
join users h on h.login = v.login_h
join users m on m.login = v.login_m;

-- Sample attendance (last days for a few employees)
insert into attendance (employee_id, date, check_in, check_out, status, comment)
select u.id, now() - (v.day_offset || ' days')::interval, v.check_in, v.check_out, v.status, v.comment
from (values
  ('hunter1',   0, '09:02', '18:10', 'on_time', ''),
  ('hunter2',   0, '09:35', '18:05', 'late',    'Опоздание 35 мин'),
  ('manager1',  0, null,    null,    'remote',  'Удалённый день'),
  ('hunter3',   1, '08:58', '18:00', 'on_time', ''),
  ('manager2',  1, null,    null,    'absent',  'Отсутствовал')
) as v(login, day_offset, check_in, check_out, status, comment)
join users u on u.login = v.login;

-- Sample contracts
insert into contracts (type, party, status, signed_at) values
  ('Договор с учеником',         'Алия А.',    'signed',   now() - interval '5 days'),
  ('Договор рассрочки',          'Мирас М.',   'sent',     null),
  ('Оферта',                     'Сабина С.',  'signed',   now() - interval '12 days'),
  ('Согласие на обработку ПД',   'Олжас О.',   'draft',    null),
  ('Договор с сотрудником',      'Жанар О.',   'signed',   now() - interval '30 days'),
  ('NDA',                        'Камиля Д.',  'sent',     null),
  ('Акт оказанных услуг',        'Гаухар Г.',  'rejected', null);

-- Sample funnels
insert into funnels (name, url, source, type, visitors, leads, conversion, cpl, sales, revenue) values
  ('Quiz «Узнай свой уровень»',  'quiz.bilimdibol.kz/level',  'Meta Ads',   'Quiz',      7400, 520, 7.0, 1350, 48, 7152000),
  ('Landing — IELTS Pro',        'bilimdibol.kz/ielts',       'Google Ads', 'Landing',   5200, 360, 6.9, 1700, 41, 9000000),
  ('Landing — General English',  'bilimdibol.kz/start',       'Google Ads', 'Landing',   6100, 410, 6.7, 1450, 33, 4257000),
  ('Instagram воронка',          'instagram.com/bilimdibol',  'Instagram',  'Instagram', 9800, 590, 6.0, 980,  52, 6708000),
  ('TikTok воронка',             'tiktok.com/@bilimdibol',    'TikTok',     'TikTok',    8300, 440, 5.3, 1120, 29, 3741000),
  ('YouTube воронка',            'youtube.com/@bilimdibol',   'YouTube',    'YouTube',   3600, 210, 5.8, 1600, 18, 2862000),
  ('WhatsApp воронка',           'wa.me/bilimdibol',          'WhatsApp',   'WhatsApp',  2100, 180, 8.6, 760,  22, 2838000);

-- Sample SMM content plan
insert into smm_content_plan (topic, format, rubric, goal, offer, cta, hook, status, publish_date)
values
  ('3 ошибки, из-за которых ты не говоришь по-английски', 'Reels',          'Польза',         'Охват',         'Бесплатный пробный урок', 'Запишись на бесплатный пробный урок', 'Стоп! Ты говоришь это неправильно…',     'published',   now() - interval '3 days'),
  ('История ученицы: с нуля до B2 за полгода',            'Instagram post', 'Кейс ученика',   'Доверие',       'Бесплатный пробный урок', 'Переходи по ссылке в bio',            'Я учила английский 5 лет и не говорила', 'planned',     now() + interval '2 days'),
  ('Топ-5 сериалов для прокачки английского',             'Stories',        'Развлекательное','Вовлечённость', 'Бесплатный пробный урок', 'Сохрани, чтобы не потерять',          'POV: ты наконец заговорил',              'idea',        now() + interval '5 days'),
  ('Разбор: как сдать IELTS на 7.0',                      'YouTube Shorts', 'Прогрев',        'Заявки',        'Бесплатный пробный урок', 'Оставь заявку на сайте',              'Никто не расскажет про IELTS вот это',   'in_progress', now() + interval '1 days');

-- Sample chatbot flows
insert into bot_flows (id, name, channel, active, description, runs, replies, phones, trials, handoffs, conversion) values
  ('11111111-1111-1111-1111-111111111111', 'Instagram welcome',           'instagram', true, 'Приветствие новых подписчиков и сбор контакта', 3200, 1856, 704, 281, 256, 8.8),
  ('22222222-2222-2222-2222-222222222222', 'WhatsApp заявка',             'whatsapp',  true, 'Обработка входящих заявок в WhatsApp',          2100, 1218, 462, 184, 168, 8.7),
  ('33333333-3333-3333-3333-333333333333', 'Напоминание о пробном уроке', 'whatsapp',  true, 'Снижение неявок на пробные уроки',              1500, 870,  330, 132, 120, 8.8)
on conflict (id) do nothing;

-- Sample chatbot nodes
insert into bot_nodes (flow_id, type, title, text, options, position) values
  ('11111111-1111-1111-1111-111111111111', 'message',       'Приветствие',        'Привет! 👋 Это bilimdibol — школа английского. Помочь подобрать курс?', null, 1),
  ('11111111-1111-1111-1111-111111111111', 'buttons',       'Выбор цели',         'Что вам ближе?', '["Английский для работы","IELTS","Разговорный"]'::jsonb, 2),
  ('11111111-1111-1111-1111-111111111111', 'collect_phone', 'Сбор телефона',      'Оставьте номер — отправим программу и подарок 🎁', null, 3),
  ('11111111-1111-1111-1111-111111111111', 'book_trial',    'Пробный урок',       'Записать вас на бесплатный пробный урок?', null, 4),
  ('22222222-2222-2222-2222-222222222222', 'message',       'Приветствие',        'Здравствуйте! Вы оставили заявку на курс английского bilimdibol.', null, 1),
  ('22222222-2222-2222-2222-222222222222', 'question',      'Цель',               'Для чего планируете учить английский?', null, 2),
  ('22222222-2222-2222-2222-222222222222', 'book_trial',    'Пробный урок',       'Записать на бесплатный пробный урок?', null, 3),
  ('22222222-2222-2222-2222-222222222222', 'handoff',       'Передача менеджеру', 'Передаю менеджеру для подтверждения', null, 4),
  ('33333333-3333-3333-3333-333333333333', 'delay',         'Задержка',           'За 24 часа до урока', null, 1),
  ('33333333-3333-3333-3333-333333333333', 'message',       'Напоминание',        'Напоминаем: завтра в 18:00 ваш бесплатный пробный урок 🎓', null, 2),
  ('33333333-3333-3333-3333-333333333333', 'buttons',       'Подтверждение',      'Подтвердите участие', '["Буду","Перенести","Отменить"]'::jsonb, 3);

-- Sample ad campaigns
insert into ad_campaigns (platform, name, budget_usd, budget_kzt, leads, cpl_usd, cpl_kzt, sales, revenue_kzt, romi, recommendation)
values
  ('Meta',   'IELTS — холодная',       1200, 573600, 140, 8.57, 4097, 14, 3486000, 508, 'Масштабировать бюджет +30%'),
  ('Meta',   'Speaking Club — ретаргет',600, 286800, 90,  6.67, 3187, 9,  1431000, 399, 'Масштабировать бюджет +30%'),
  ('TikTok', 'Reels English Hacks',     800, 382400, 120, 6.67, 3187, 8,  1272000, 233, 'Тест новых креативов'),
  ('YouTube','Shorts — English for Work',500,239000, 50,  10.0, 4780, 4,  756000,  216, 'Тест новых креативов'),
  ('Google', 'Search — курсы английского',900,430200,80,  11.25,5377, 11, 1749000, 306, 'Масштабировать бюджет +30%'),
  ('Google', 'Search — IELTS Алматы',   700, 334600, 45,  15.56,7437, 3,  447000,  34,  'Снизить бюджет, слабый CPL');

-- Sample daily ad spend (last 6 days × platforms)
insert into ad_spend (date, platform, spend_usd, spend_kzt, leads)
select now() - (v.day_offset || ' days')::interval, v.platform, v.usd, v.usd * 478, v.leads
from (values
  (5, 'Meta',    70, 9), (5, 'TikTok', 55, 7), (5, 'Google', 60, 6),
  (3, 'Meta',    85, 11),(3, 'TikTok', 48, 6), (3, 'YouTube',40, 4),
  (1, 'Meta',    90, 12),(1, 'Google', 65, 7), (1, 'TikTok', 52, 6)
) as v(day_offset, platform, usd, leads);

-- Sample finance operations
insert into finance_operations (date, category, type, amount, responsible, comment)
values
  (now() - interval '1 days',  'Продажа курса',     'income',  159000, 'Салтанат Ж.', 'Оплата Kaspi'),
  (now() - interval '2 days',  'Продажа курса',     'income',  249000, 'Айна Б.',     'Перевод на счёт'),
  (now() - interval '3 days',  'Рассрочка — платёж','income',  43000,  'Салтанат Ж.', 'Платёж по рассрочке'),
  (now() - interval '4 days',  'Реклама',           'expense', 450000, 'Диас А.',     'Бюджет Meta'),
  (now() - interval '5 days',  'Зарплаты',          'expense', 3200000,'Гульмира С.', 'ФОТ отдела'),
  (now() - interval '6 days',  'Аренда офиса',      'expense', 320000, 'Айжан К.',    'Месячная аренда'),
  (now() - interval '7 days',  'Возврат клиенту',   'expense', 89000,  'Гульмира С.', 'Возврат по заявлению'),
  (now() - interval '8 days',  'Speaking Club',     'income',  129000, 'Айна Б.',     'Наличные в кассу');

-- Sample payroll (one row per employee)
insert into payroll (employee_id, role, base_salary, kpi_percent, sales_count, bonus, attendance_score, bonus_adjustment, total, status)
select u.id, u.role, v.base, v.kpi, v.sales_cnt, v.bonus, v.att, v.adj, v.base + v.bonus + v.adj, v.status
from (values
  ('admin',      900000, 95, 0,  315000, 98, 0,      'paid'),
  ('rop',        600000, 88, 0,  231000, 95, 0,      'paid'),
  ('hunter1',    250000, 82, 18, 195500, 92, 0,      'paid'),
  ('hunter2',    250000, 76, 14, 171000, 86, -13680, 'review'),
  ('hunter3',    250000, 90, 22, 219500, 96, 10975,  'accrued'),
  ('manager1',   320000, 84, 16, 191400, 94, 0,      'paid'),
  ('manager2',   320000, 79, 12, 167600, 88, -13408, 'review'),
  ('target',     450000, 86, 0,  189000, 93, 0,      'paid'),
  ('accountant', 380000, 91, 0,  159600, 97, 7980,   'accrued'),
  ('content',    300000, 80, 0,  126000, 90, 0,      'paid'),
  ('marketer',   420000, 85, 0,  176400, 92, 0,      'paid'),
  ('smm',        320000, 78, 0,  134400, 89, -10752, 'review')
) as v(login, base, kpi, sales_cnt, bonus, att, adj, status)
join users u on u.login = v.login;
