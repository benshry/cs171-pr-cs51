# Opens and combines results from the welcome survey, grades, and piazza data

import csv
import json

WELCOME_PATH = "../data/Welcome-2015.csv"
GRADES_PATH = "../data/Grades-2015.csv"
PIAZZA_PATH = "../data/Piazza-2015-4-2.csv"
OUT_PATH = "../output/parsed.json"

col = {
    'timestamp':0,
    'last':1,
    'first':2,
    'preferred':3, # Optional
    'email':4,
    'fas':5,
    'class':6,
    'concentration':7,
    'comfort':8,
    'os':9,
    'os_other':10, # Optional
    'cs50':11,
    'hopes':12
}

grades_col = {
    'email':0,
    'seas':1,
    'ext':2,
    'ps1':5,
    'ps2':9,
    'ps3':13,
    'ps4':17,
    'midterm': 21,
    'ps5':23,
    'ps6':27,
}

piazza_col = {
    'name':0,
    'email':1,
    'role':2,
    'days':3,
    'views':4,
    'contributions':5,
    'questions':6,
    'notes':7,
    'answers':8
}

if __name__ == "__main__":

    data = {}

    # Read data from welcome survey
    reader = csv.reader(open(WELCOME_PATH,'rU'))
    for row in reader:
        data_object = {
            # 'email': row[col['email']], # SENSITIVE
            # 'fas': row[col['fas']], # SENSITIVE
            'class': row[col['class']],
            'concentration': row[col['concentration']],
            'comfort': row[col['comfort']],
            'os': row[col['os']],
            'os_other': row[col['os_other']],
            'cs50': row[col['cs50']]
        }
        data[row[col['email']]] = data_object

    # Read data from grades spreadsheet
    reader = csv.reader(open(GRADES_PATH,'rU'))
    for row in reader:

        data_object = {
            # 'email': row[grades_col['email']], # SENSITIVE
            # 'seas': row[grades_col['seas']], # SENSITIVE
            # 'ext': row[grades_col['ext']],
            'ps1': row[grades_col['ps1']],
            'ps2': row[grades_col['ps2']],
            'ps3': row[grades_col['ps3']],
            'ps4': row[grades_col['ps4']],
            'ps5': row[grades_col['ps5']],
            'ps6': row[grades_col['ps6']],
            'midterm': row[grades_col['midterm']],
        }

        # Add grades data to welcome data
        if row[grades_col['email']] in data:
            data[row[grades_col['email']]]['grades'] = data_object


    reader = csv.reader(open(PIAZZA_PATH,'rU'))
    for row in reader:
        data_object = {
            'days': row[piazza_col['days']],
            'views': row[piazza_col['views']],
            'contributions': row[piazza_col['contributions']],
            'questions': row[piazza_col['questions']],
            'notes': row[piazza_col['notes']],
            'answers': row[piazza_col['answers']],
        }

        if row[piazza_col['email']] in data:
            data[row[piazza_col['email']]]['piazza'] = data_object

    # Remove any entries that don't have Piazza and grades data
    # Also remove email key
    filtered_data = []
    for d in data:
        if "piazza" in data[d] and "grades" in data[d]:
            filtered_data.append(data[d])

    with open(OUT_PATH, 'w') as out_file:
        json.dump(data, out_file)
