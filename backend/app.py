import json
import os
import pickle
from datetime import datetime

import numpy as np
import pandas as pd
from custom_layers import AttentionLayer
from flask import Flask, jsonify, request
from flask_cors import CORS
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

PREDICTION_FILE = "predictions.json"

MODEL_PATH = os.path.join("model", "best_churn_model.keras")
FEATURE_COLS_PATH = os.path.join("preprocessor", "feature_cols.pkl")
SCALER_PATH = os.path.join("preprocessor", "scaler.pkl")


with open(FEATURE_COLS_PATH, "rb") as file:
    FEATURE_COLS = pickle.load(file)

with open(SCALER_PATH, "rb") as file:
    SCALER = pickle.load(file)

MODEL = load_model(
    MODEL_PATH, custom_objects={"AttentionLayer": AttentionLayer}, compile=False
)


CATEGORY_MAPPINGS = {
    "gender": {"F": 0, "M": 1},
    "education_level": {
        "College": 0,
        "Doctorate": 1,
        "Graduate": 2,
        "High School": 3,
        "Post-Graduate": 4,
        "Uneducated": 5,
        "Unknown": 6,
    },
    "marital_status": {"Divorced": 0, "Married": 1, "Single": 2, "Unknown": 3},
    "income_category": {
        "$120K +": 0,
        "$40K - $60K": 1,
        "$60K - $80K": 2,
        "$80K - $120K": 3,
        "Less than $40K": 4,
        "Unknown": 5,
    },
    "card_category": {"Blue": 0, "Gold": 1, "Platinum": 2, "Silver": 3},
}


def load_predictions():
    if not os.path.exists(PREDICTION_FILE):
        return []

    with open(PREDICTION_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_prediction(data):
    predictions = load_predictions()
    predictions.insert(0, data)

    with open(PREDICTION_FILE, "w", encoding="utf-8") as file:
        json.dump(predictions[:50], file, indent=4, ensure_ascii=False)


def encode_input(data):
    processed_data = {}

    for column in FEATURE_COLS:
        value = data.get(column)

        if column in CATEGORY_MAPPINGS:
            if value not in CATEGORY_MAPPINGS[column]:
                raise ValueError(f"Nilai kategori tidak valid untuk {column}: {value}")

            processed_data[column] = CATEGORY_MAPPINGS[column][value]
        else:
            if value is None or value == "":
                raise ValueError(f"Field {column} wajib diisi")

            processed_data[column] = float(value)

    input_df = pd.DataFrame([processed_data], columns=FEATURE_COLS)
    scaled_input = SCALER.transform(input_df)

    return scaled_input


def get_recommendations(data, risk_level):
    recommendations = []

    months_inactive = float(data.get("months_inactive_12_mon", 0))
    total_relationship = float(data.get("total_relationship_count", 0))
    total_trans_amt = float(data.get("total_trans_amt", 0))
    avg_utilization_ratio = float(data.get("avg_utilization_ratio", 0))

    if months_inactive >= 3:
        recommendations.append(
            "Berikan loyalty reward agar nasabah kembali aktif bertransaksi."
        )

    if total_relationship <= 2:
        recommendations.append(
            "Tawarkan produk tambahan yang relevan melalui strategi cross-selling."
        )

    if total_trans_amt < 2000:
        recommendations.append(
            "Lakukan follow-up personal dari tim CRM karena aktivitas transaksi rendah."
        )

    if avg_utilization_ratio < 0.2:
        recommendations.append(
            "Berikan edukasi manfaat kartu dan promo transaksi untuk meningkatkan penggunaan layanan."
        )

    if len(recommendations) == 0:
        if risk_level == "Risiko Tinggi":
            recommendations.append(
                "Lakukan follow-up prioritas dari tim CRM untuk mempertahankan nasabah."
            )
        elif risk_level == "Risiko Sedang":
            recommendations.append(
                "Pantau aktivitas nasabah dan berikan penawaran yang relevan."
            )
        else:
            recommendations.append(
                "Pertahankan komunikasi rutin dan monitoring aktivitas nasabah."
            )

    return recommendations


@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "status": "success",
            "message": "Selamat datang di Backend API Bank Churn Analisis",
            "available_routes": [
                "GET /api/health",
                "POST /api/predict",
                "GET /api/predictions",
            ],
        }
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "success",
            "message": "Backend Bank Churn Analisis berjalan",
            "model_loaded": True,
            "total_features": len(FEATURE_COLS),
        }
    )


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify(
                {"status": "error", "message": "Data input tidak boleh kosong"}
            ), 400

        model_input = encode_input(data)

        prediction_result = MODEL.predict(model_input)
        probability = float(prediction_result[0][0])

        if probability >= 0.70:
            prediction = "Berpotensi Churn"
            risk_level = "Risiko Tinggi"
        elif probability >= 0.45:
            prediction = "Perlu Dipantau"
            risk_level = "Risiko Sedang"
        else:
            prediction = "Nasabah Bertahan"
            risk_level = "Risiko Rendah"

        recommendations = get_recommendations(data, risk_level)

        result = {
            "timestamp": datetime.now().isoformat(),
            "input": data,
            "prediction": prediction,
            "risk_level": risk_level,
            "probability": round(probability, 4),
            "recommendations": recommendations,
            "model_used": "best_churn_model.keras",
        }

        save_prediction(result)

        return jsonify({"status": "success", "result": result})

    except Exception as error:
        return jsonify({"status": "error", "message": str(error)}), 500


@app.route("/api/predictions", methods=["GET"])
def get_predictions():
    return jsonify({"status": "success", "data": load_predictions()})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
