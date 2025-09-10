# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install test requirements
pip install -r test-requirements.txt

# Run tests
python -m pytest modules/__tests__/face_detection_test.py -v
