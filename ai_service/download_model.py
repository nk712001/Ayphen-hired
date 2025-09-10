import urllib.request
import bz2
import os

def download_and_extract_model():
    # Download the compressed model file
    url = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
    compressed_file = "shape_predictor_68_face_landmarks.dat.bz2"
    decompressed_file = "shape_predictor_68_face_landmarks.dat"
    
    print("Downloading model file...")
    urllib.request.urlretrieve(url, compressed_file)
    
    print("Decompressing model file...")
    with bz2.BZ2File(compressed_file) as fr, open(decompressed_file, 'wb') as fw:
        fw.write(fr.read())
    
    # Clean up compressed file
    os.remove(compressed_file)
    print("Model file ready!")
