"""
Trains the category and severity classifiers on data/synthetic_complaints.csv
and saves them to app/model_artifacts/. Run this once (or whenever the
training data changes); the FastAPI service loads the saved artifacts at
startup, it does not train on request.
"""
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

df = pd.read_csv("data/synthetic_complaints.csv")

train_df, test_df = train_test_split(
    df, test_size=0.2, random_state=42, stratify=df["category"]
)


def train_and_eval(label_col):
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000)),
    ])
    pipeline.fit(train_df["text"], train_df[label_col])
    preds = pipeline.predict(test_df["text"])
    acc = accuracy_score(test_df[label_col], preds)
    print(f"\n=== {label_col} classifier ===")
    print(f"Held-out accuracy: {acc:.3f}")
    print(classification_report(test_df[label_col], preds, zero_division=0))
    return pipeline


category_model = train_and_eval("category")
severity_model = train_and_eval("severity")

joblib.dump(category_model, "app/model_artifacts/category_model.joblib")
joblib.dump(severity_model, "app/model_artifacts/severity_model.joblib")
print("\nSaved category_model.joblib and severity_model.joblib to app/model_artifacts/")
