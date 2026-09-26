# Подключение Sanity — пошагово

## 1. Данные проекта

1. Открой https://manage.sanity.io
2. Выбери **свой** проект (аккаунт должен совпадать с тем, которым создавал)
3. Скопируй **Project ID** (короткий код, один и тот же везде)
4. Dataset обычно `production`

## 2. Куда писать ключи

### Файл 1 — корень репозитория

Путь: `/Users/dburych/Downloads/web/.env`  
(скопируй из `.env.example`)

```env
PUBLIC_SANITY_PROJECT_ID=твой_project_id
PUBLIC_SANITY_DATASET=production

SANITY_STUDIO_PROJECT_ID=твой_project_id
SANITY_STUDIO_DATASET=production

# Опционально — токен из manage.sanity.io → API → Tokens
SANITY_API_TOKEN=
```

### Файл 2 — папка Studio

Путь: `/Users/dburych/Downloads/web/sanity/.env`  
(скопируй из `sanity/.env.example`)

```env
SANITY_STUDIO_PROJECT_ID=твой_project_id
SANITY_STUDIO_DATASET=production
```

**Важно:** в обоих файлах `PROJECT_ID` должен быть **одинаковым**.

## 3. CORS (обязательно для localhost)

1. manage.sanity.io → проект → **API** → **CORS origins**
2. Add: `http://localhost:3333`
3. Включи **Allow credentials**
4. Save

## 4. Запуск Studio

```bash
cd /Users/dburych/Downloads/web
git pull

cd sanity
npm install
npx sanity logout   # если «not a member»
npx sanity login    # тот же аккаунт, что на manage.sanity.io
npx sanity dev
```

Откроется http://localhost:3333

## 5. Если «You are not a member of this project»

- На manage.sanity.io проект **виден**? Если нет — другой аккаунт.
- Project ID в `.env` совпадает с ID на manage?
- После смены `.env` перезапусти `npx sanity dev`.

## 6. Безопасность

- Файлы `.env` в `.gitignore` — в git не попадают.
- Если токен когда-то попал в git — **удали его** в manage.sanity.io → API → Tokens и создай новый.
