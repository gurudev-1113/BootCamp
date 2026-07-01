# Bootcamp - Python and ML Projects

A structured bootcamp workspace with Python and machine learning exercises, organized by day.

---

## Project Structure

`
Bootcamp/
|
|-- day2_and_3/              <- Day 2 and 3: ML Preprocessing + Flask Apps
|   |-- app.py               <- Flask web application
|   |-- bussbooking.py       <- Bus booking system
|   |-- EDA.py               <- Exploratory Data Analysis
|   |-- ml_project.py        <- ML pipeline (Linear Regression)
|   |-- d1.ipynb             <- Jupyter notebook
|   |-- sales.csv            <- Sales dataset
|   |-- train.csv            <- Training dataset
|   |-- requirements.txt     <- Python dependencies
|   +-- README.md            <- Day 2 and 3 notes
|
|-- day4/                    <- Day 4: Disease Prediction ML
|   |-- disease.py           <- Disease prediction pipeline
|   |-- disease_prediction.csv <- Disease dataset
|   +-- requirements.txt     <- Python dependencies
|
|-- static/                  <- Frontend static files
|   |-- index.html
|   |-- styles.css
|   +-- app.js
|
|-- venv/                    <- Shared Python virtual environment (DO NOT EDIT)
|-- .gitignore               <- Git ignore rules
+-- README.md                <- This file
`

---

## Setup (First Time Only)

### Step 1: Activate the Virtual Environment

PowerShell:
`
.\venv\Scripts\Activate.ps1
`

Command Prompt:
`
venv\Scripts\activate.bat
`

You will see (venv) at the start of your terminal prompt when active.

### Step 2: Install Dependencies

For Day 2 and 3:
`
pip install -r day2_and_3\requirements.txt
`

For Day 4:
`
pip install -r day4\requirements.txt
`

---

## Running the Projects

Day 2 and 3 - ML Pipeline:
`
python day2_and_3\ml_project.py
`

Day 2 and 3 - Flask App:
`
python day2_and_3\app.py
`

Day 4 - Disease Prediction:
`
python day4\disease.py
`

---

## Environment Variables

Copy .env.example to .env and fill in required values:
`
copy .env.example .env
`

IMPORTANT: Never commit your .env file. It is already listed in .gitignore.

---

## Common Mistakes to Avoid

- Wrong: Creating venv inside a project folder
  Correct: One shared venv at the root level

- Wrong: Putting project files inside venv/
  Correct: Project files go in day2_and_3/, day4/, etc.

- Wrong: Committing venv/ to Git
  Correct: venv/ is already listed in .gitignore

- Wrong: Folder names with spaces (day2 and 3)
  Correct: Use underscores (day2_and_3)

---

## Author

Gurudev
