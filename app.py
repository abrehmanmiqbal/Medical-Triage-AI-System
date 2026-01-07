# app.py
import numpy as np
import pandas as pd
import joblib
import shap
import matplotlib.pyplot as plt
import seaborn as sns
import json
import plotly
import plotly.express as px
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import base64
from io import BytesIO
import warnings
warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.secret_key = 'heart-triage-secret-2024'

# Load trained model and preprocessor
try:
    model = joblib.load('triage_model.pkl')
    preprocessor = joblib.load('preprocessor.pkl')
    print("✅ Model and preprocessor loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model/preprocessor: {e}")
    model = None
    preprocessor = None

# Risk labels and colors
RISK_LABELS = {0: 'Low Risk', 1: 'Medium Risk', 2: 'High Risk'}
RISK_COLORS = {0: '#2ecc71', 1: '#f39c12', 2: '#e74c3c'}
RISK_DESCRIPTIONS = {
    0: 'Patient shows minimal risk factors. Regular monitoring recommended.',
    1: 'Patient exhibits moderate risk factors. Further evaluation suggested.',
    2: 'Patient shows high risk factors. Immediate clinical attention required.'
}

# Feature descriptions for explanation
FEATURE_DESCRIPTIONS = {
    'age': 'Age in years',
    'sex': 'Sex (1=male, 0=female)',
    'cp': 'Chest pain type (0-3)',
    'trestbps': 'Resting blood pressure (mm Hg)',
    'chol': 'Serum cholesterol (mg/dl)',
    'fbs': 'Fasting blood sugar > 120 mg/dl (1=true, 0=false)',
    'restecg': 'Resting electrocardiographic results (0-2)',
    'thalach': 'Maximum heart rate achieved',
    'exang': 'Exercise induced angina (1=yes, 0=no)',
    'oldpeak': 'ST depression induced by exercise relative to rest',
    'slope': 'Slope of the peak exercise ST segment',
    'ca': 'Number of major vessels colored by fluoroscopy (0-3)',
    'thal': 'Thalassemia (1-3)'
}

# In-memory patient database (in production, use SQL database)
patients_db = []

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Prediction page"""
    if request.method == 'POST':
        try:
            # Get form data
            form_data = {
                'age': float(request.form.get('age', 50)),
                'sex': int(request.form.get('sex', 1)),
                'cp': int(request.form.get('cp', 0)),
                'trestbps': float(request.form.get('trestbps', 120)),
                'chol': float(request.form.get('chol', 200)),
                'fbs': int(request.form.get('fbs', 0)),
                'restecg': int(request.form.get('restecg', 0)),
                'thalach': float(request.form.get('thalach', 150)),
                'exang': int(request.form.get('exang', 0)),
                'oldpeak': float(request.form.get('oldpeak', 1.0)),
                'slope': int(request.form.get('slope', 1)),
                'ca': int(request.form.get('ca', 0)),
                'thal': int(request.form.get('thal', 2))
            }
            
            # Create patient ID
            patient_id = f"PAT{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Make prediction
            risk_level, probability, explanation = make_prediction(form_data)
            
            # Create patient record
            patient_record = {
                'id': patient_id,
                'timestamp': datetime.now().isoformat(),
                'data': form_data,
                'prediction': {
                    'risk_level': risk_level,
                    'risk_label': RISK_LABELS[risk_level],
                    'probability': probability,
                    'color': RISK_COLORS[risk_level],
                    'description': RISK_DESCRIPTIONS[risk_level]
                },
                'explanation': explanation
            }
            
            # Add to database
            patients_db.append(patient_record)
            
            # Generate visualization
            viz_html = generate_visualization(patient_record)
            
            return render_template('predict.html', 
                                 prediction=patient_record['prediction'],
                                 explanation=explanation,
                                 visualization=viz_html,
                                 form_data=form_data,
                                 show_result=True)
            
        except Exception as e:
            return render_template('predict.html', 
                                 error=f"Prediction error: {str(e)}",
                                 show_result=False)
    
    return render_template('predict.html', show_result=False)

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """API endpoint for predictions"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 
                          'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Make prediction
        risk_level, probability, explanation = make_prediction(data)
        
        return jsonify({
            'success': True,
            'prediction': {
                'risk_level': int(risk_level),
                'risk_label': RISK_LABELS[risk_level],
                'probability': probability,
                'description': RISK_DESCRIPTIONS[risk_level],
                'color': RISK_COLORS[risk_level]
            },
            'explanation': explanation,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/patients')
def patients():
    """Patient management page"""
    return render_template('patients.html', patients=patients_db)

@app.route('/api/patients')
def api_patients():
    """API endpoint for patient data"""
    return jsonify(patients_db)

@app.route('/insights')
def insights():
    """Model insights page"""
    if not patients_db:
        return render_template('insights.html', 
                             has_data=False,
                             message="No patient data available for insights.")
    
    # Generate insights from patient data
    insights_data = generate_insights()
    
    return render_template('insights.html', 
                         has_data=True,
                         insights=insights_data)

@app.route('/api/insights')
def api_insights():
    """API endpoint for insights"""
    insights_data = generate_insights()
    return jsonify(insights_data)

def make_prediction(data):
    """Make prediction using the trained model"""
    if model is None or preprocessor is None:
        raise Exception("Model not loaded properly")
    
    # Convert to DataFrame
    df = pd.DataFrame([data])
    
    # Preprocess
    processed = preprocessor.transform(df)
    
    # Predict
    prediction = model.predict(processed)[0]
    probabilities = model.predict_proba(processed)[0]
    
    # Get explanation
    explanation = explain_prediction(df, prediction, probabilities)
    
    return prediction, probabilities.tolist(), explanation

def explain_prediction(data, prediction, probabilities):
    """Generate explanation for the prediction"""
    explanation = {
        'top_features': [],
        'risk_factors': [],
        'recommendations': []
    }
    
    # Simple rule-based explanation
    patient_data = data.iloc[0]
    
    # Check risk factors
    if patient_data['age'] > 55:
        explanation['risk_factors'].append(f"Age ({patient_data['age']} years) is above 55")
    
    if patient_data['chol'] > 240:
        explanation['risk_factors'].append(f"Cholesterol ({patient_data['chol']} mg/dL) is high (>240)")
    
    if patient_data['trestbps'] > 140:
        explanation['risk_factors'].append(f"Blood pressure ({patient_data['trestbps']} mmHg) is elevated (>140)")
    
    if patient_data['oldpeak'] > 2:
        explanation['risk_factors'].append(f"ST depression ({patient_data['oldpeak']}) indicates possible ischemia")
    
    # Recommendations based on risk level
    if prediction == 0:
        explanation['recommendations'] = [
            "Continue regular exercise",
            "Maintain healthy diet",
            "Annual checkup recommended"
        ]
    elif prediction == 1:
        explanation['recommendations'] = [
            "Consult cardiologist",
            "Regular blood pressure monitoring",
            "Consider stress test",
            "Dietary modifications"
        ]
    else:
        explanation['recommendations'] = [
            "Immediate cardiology consultation",
            "Emergency evaluation recommended",
            "Continuous monitoring required",
            "Possible hospitalization"
        ]
    
    return explanation

def generate_visualization(patient_record):
    """Generate visualization for prediction result"""
    try:
        # Create risk probability chart
        labels = [RISK_LABELS[i] for i in range(3)]
        probs = patient_record['prediction']['probability']
        colors = [RISK_COLORS[i] for i in range(3)]
        
        fig = px.bar(
            x=labels,
            y=probs,
            color=labels,
            color_discrete_sequence=colors,
            title='Risk Probability Distribution',
            labels={'x': 'Risk Level', 'y': 'Probability'},
            text=[f'{p:.1%}' for p in probs]
        )
        
        fig.update_layout(
            showlegend=False,
            yaxis=dict(range=[0, 1]),
            template='plotly_white'
        )
        
        return plotly.offline.plot(fig, include_plotlyjs=False, output_type='div')
        
    except Exception as e:
        return f"<p>Visualization error: {str(e)}</p>"

def generate_insights():
    """Generate insights from patient data"""
    if not patients_db:
        return {}
    
    # Convert to DataFrame
    records = []
    for patient in patients_db:
        record = patient['data'].copy()
        record['risk_level'] = patient['prediction']['risk_level']
        record['risk_label'] = patient['prediction']['risk_label']
        records.append(record)
    
    df = pd.DataFrame(records)
    
    insights = {
        'total_patients': len(df),
        'risk_distribution': df['risk_label'].value_counts().to_dict(),
        'average_age': df['age'].mean(),
        'high_risk_patients': len(df[df['risk_level'] == 2]),
        'common_factors': {}
    }
    
    # Find common factors for high risk patients
    high_risk_df = df[df['risk_level'] == 2]
    if len(high_risk_df) > 0:
        insights['common_factors'] = {
            'avg_cholesterol': high_risk_df['chol'].mean(),
            'avg_bp': high_risk_df['trestbps'].mean(),
            'avg_age': high_risk_df['age'].mean()
        }
    
    return insights

if __name__ == '__main__':
    print("🚀 Starting Heart Disease Triage System...")
    print(f"📊 Risk Labels: {RISK_LABELS}")
    print(f"🎨 Risk Colors: {RISK_COLORS}")
    print("🌐 Server starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)