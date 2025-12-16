# Build stage
FROM python:3.10-slim-bookworm as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    make \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install wheels
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY requirements.txt .

# Install dependencies into a temporary directory
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final stage
FROM python:3.10-slim-bookworm

WORKDIR /app

# Install runtime dependencies for OpenCV and others
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Unzip landmark predictor
RUN if [ -f "shape_predictor_68_face_landmarks.dat.bz2" ]; then bzip2 -d shape_predictor_68_face_landmarks.dat.bz2; fi

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
