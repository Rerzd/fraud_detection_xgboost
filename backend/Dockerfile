FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY fraud_model.pkl .

# SQLite history lives in /app/data (mounted as a volume by docker-compose).
RUN useradd --create-home --uid 1000 app && mkdir data && chown app data
USER app

EXPOSE 8000

# Healthy only when the API answers and the model is loaded.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import json, sys, urllib.request; r = urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4); sys.exit(0 if json.load(r)['model_loaded'] else 1)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
