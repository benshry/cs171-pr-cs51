###
# This file removes personally identifying information from the 2015
# CS51 welcome survey. It outputs the remaining information as JSON.
###

import csv
import json

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


if __name__ == "__main__":

    data = []

    reader = csv.reader(open('../files/welcome.csv','rU'))
    for row in reader:
        data_object = {
            'class': row[col['class']],
            'concentration': row[col['concentration']],
            'comfort': row[col['comfort']],
            'os': row[col['os']],
            'os_other': row[col['os_other']],
            'cs50': row[col['cs50']]
        }
        data.append(data_object)

    with open('../output/welcome.json', 'w') as out_file:
        json.dump(data, out_file)
