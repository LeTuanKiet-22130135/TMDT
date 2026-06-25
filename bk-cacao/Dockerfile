FROM python:3.13-slim

WORKDIR /app

# Cài đặt uv
RUN pip install uv

COPY pyproject.toml uv.lock ./

# Cài đặt các dependencies
RUN uv sync --frozen --no-dev

COPY . .

ARG TEST=true
ENV TEST=$TEST

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
