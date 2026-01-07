
# 🏥 End-to-End Medical Triage Assistant (with Explainability)

## 📌 LAB #14 – Complex Computing Activity

### Course Objective
Design and implement a complex, multi-faceted machine learning system demonstrating **end-to-end ML mastery**, including:
- Data preprocessing
- Model development and evaluation
- Uncertainty estimation
- Model explainability
- Ethical considerations

---

## 🎯 Project Overview

This project implements an **AI-powered Medical Triage Assistant** that classifies patients into:
- **Low Risk**
- **Medium Risk**
- **High Risk**

using structured Electronic Medical Record (EMR) data.

The system is designed to **support clinical decision-making**, not replace clinicians, by providing:
- Risk predictions
- Confidence & uncertainty estimates
- Model explainability for transparency

---

## 📂 Dataset

- **Source**: Heart Disease Dataset  
- **Type**: Tabular EMR-style data  
- **Features include**:
  - Age
  - Sex
  - Chest pain type
  - Blood pressure
  - Cholesterol
  - ECG results
  - Heart rate
  - Exercise-induced angina
  - Other clinical indicators

- **Target Variable**:
  - Patient risk level (Low / Medium / High)

---

## 🧠 Integrated ML Concepts (Lab 1–12)

This project integrates **more than three required lab concepts**:

### ✅ 1. Data Preprocessing
- Missing value imputation
- Feature scaling (StandardScaler)
- Categorical encoding
- Class imbalance handling (SMOTE)

### ✅ 2. Model Building
Multiple models trained and compared:
- Logistic Regression
- Support Vector Machine (SVM)
- Random Forest (selected as best model)
- Naive Bayes

### ✅ 3. Model Evaluation
- Accuracy
- Precision, Recall, F1-score
- ROC Curves
- Precision-Recall Curves
- Probability calibration

### ✅ 4. Uncertainty Estimation
- Ensemble-based uncertainty using Random Forest
- Mean probability & standard deviation
- Identification of low-confidence and high-uncertainty predictions

### ✅ 5. Model Interpretability
- Feature importance analysis
- Explainable outputs for clinicians
- Risk-based interpretation

---

## 📊 Key Visualizations

- ROC Curves
- Precision-Recall Curves
- Feature Importance Plot
- Confidence vs Uncertainty Scatter Plot
- Risk-wise Uncertainty Box Plots
- Probability distributions with error bars

---

## 🩺 Clinical Interpretation

The model provides:
- **Confidence score** for each prediction
- **Uncertainty measure** to flag borderline cases

### Clinical Guidelines:
- High uncertainty predictions → require human review
- Low confidence predictions → additional tests recommended
- AI output should always be combined with clinical judgment

---

## ⚠️ Ethical Considerations

- AI is **decision-support**, not decision-maker
- Risk of bias due to dataset limitations
- False negatives may delay treatment
- Transparency and explainability are mandatory in healthcare AI
- Patient data privacy must be preserved

---



