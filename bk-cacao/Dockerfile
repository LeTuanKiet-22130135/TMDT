FROM python:3.13-slim

# ARM-slim cần libpq-dev + gcc để build psycopg2-binary
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY pyproject.toml uv.lock ./

# --no-dev: loại pytest; --frozen: dùng exact lock
RUN uv sync --frozen --no-dev

COPY . .

ARG TEST=true
ENV TEST=$TEST

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
