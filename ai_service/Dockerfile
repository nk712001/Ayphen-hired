FROM python:3.10-slim

# Install system dependencies required for OpenCV and Dlib
# cmake and g++ are needed to compile dlib
# libgl1-mesa-glx and libglib2.0-0 are for opencv
# bzip2 is for unzipping the model file
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    make \
    libgl1 \
    libglib2.0-0 \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first to leverage caching
COPY requirements.txt .

# Install Python dependencies
# Warning: dlib compilation can take a few minutes
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Unzip the landmark predictor if it's zipped
RUN if [ -f "shape_predictor_68_face_landmarks.dat.bz2" ]; then bzip2 -d shape_predictor_68_face_landmarks.dat.bz2; fi

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
