FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
ARG SUPABASE_URL=""

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev chromium fonts-liberation xvfb xauth \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/radar ./radar
COPY supabase ./supabase

RUN if [ -n "$SUPABASE_URL" ]; then \
      python -c "import json, os, urllib.request; url=os.environ['SUPABASE_URL'].rstrip('/') + '/auth/v1/.well-known/jwks.json'; data=json.loads(urllib.request.urlopen(url, timeout=20).read().decode('utf-8')); open('/app/supabase-jwks.json','w',encoding='utf-8').write(json.dumps(data))"; \
    fi

ENV SUPABASE_JWKS_FILE=/app/supabase-jwks.json
ENV RADAR_CHROMIUM_PATH=/usr/bin/chromium
ENV RADAR_BROWSER_HEADLESS=0
ENV RADAR_CHROME_USER_DATA_DIR=/tmp/pavageau-radar-profile
ENV RADAR_CHROME_PROFILE_DIRECTORY=Default

EXPOSE 8000

CMD ["sh", "-c", "xvfb-run -a -s '-screen 0 1366x900x24' uvicorn app.api.main:app --host 0.0.0.0 --port 8000"]
