FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

# Data directory for document storage
RUN mkdir -p /app/data/documents

ENV PORT=8080
ENV DATA_DIR=/app/data

EXPOSE 8080

# Persistent storage for documents
VOLUME ["/app/data"]

CMD ["python", "server.py"]
