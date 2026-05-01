# syntax=docker/dockerfile:1
FROM python:3.12-slim-bookworm AS deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

FROM deps AS runtime
COPY . .
ENV PYTHONUNBUFFERED=1 FLASK_ENV=production
EXPOSE 5004
CMD ["python", "run.py"]
