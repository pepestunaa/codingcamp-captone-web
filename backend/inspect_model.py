import os
import pickle
from tensorflow.keras.models import load_model
from custom_layers import AttentionLayer

MODEL_PATH = os.path.join("model", "best_churn_model.keras")
FEATURE_COLS_PATH = os.path.join("preprocessor", "feature_cols.pkl")
SCALER_PATH = os.path.join("preprocessor", "scaler.pkl")

print("=== CEK FILE MODEL DAN PREPROCESSOR ===")

print("\n1. Cek keberadaan file:")
print("Model:", os.path.exists(MODEL_PATH), "-", MODEL_PATH)
print("Feature columns:", os.path.exists(FEATURE_COLS_PATH), "-", FEATURE_COLS_PATH)
print("Scaler:", os.path.exists(SCALER_PATH), "-", SCALER_PATH)

print("\n2. Load feature_cols.pkl")
with open(FEATURE_COLS_PATH, "rb") as file:
    feature_cols = pickle.load(file)

print("Tipe feature_cols:", type(feature_cols))
print("Jumlah feature:", len(feature_cols))
print("Isi feature_cols:")
print(feature_cols)

print("\n3. Load scaler.pkl")
with open(SCALER_PATH, "rb") as file:
    scaler = pickle.load(file)

print("Tipe scaler:", type(scaler))

print("\n4. Load model Keras")
model = load_model(
    MODEL_PATH,
    custom_objects={"AttentionLayer": AttentionLayer},
    compile=False
)

print("Model berhasil di-load")
print("Input shape:", model.input_shape)
print("Output shape:", model.output_shape)

print("\n=== SELESAI ===")