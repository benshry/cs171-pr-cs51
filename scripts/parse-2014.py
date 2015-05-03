# Opens and combines results from the welcome survey, grades, and piazza data

import csv
import json
import sys

WELCOME_PATH = "../data/Welcome-2014.csv"
GRADES_PATH = "../data/Grades-2014-College.csv"
PIAZZA_PATH = "../data/Piazza-2014-4-2.csv"
OUT_PATH = "../output/parsed-2014.json"

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
    'email':4,
    'midterm': 13,
    'ps1':16,
    'ps2':20,
    'ps3':26,
    'ps4':33,
    'ps5':38,
    'ps6':43,
    'ps7':55,
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

        ps2 = row[grades_col['ps2']]
        ps3 = row[grades_col['ps3']]
        try:
            ps2 = int(ps2) / 2
            ps3 = int(ps3) / 2
        except:
            continue

        data_object = {
            # 'email': row[grades_col['email']], # SENSITIVE
            # 'seas': row[grades_col['seas']], # SENSITIVE
            # 'ext': row[grades_col['ext']],
            'ps1': row[grades_col['ps1']],
            'ps2': ps2,
            'ps3': ps2,
            'ps4': row[grades_col['ps4']],
            'ps5': row[grades_col['ps5']],
            'ps6': row[grades_col['ps6']],
            'ps7': row[grades_col['ps7']],
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
        json.dump(filtered_data, out_file)
