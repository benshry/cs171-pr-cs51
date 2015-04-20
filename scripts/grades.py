import csv
import json

col = {
    'ext':2,
    'ps1':5,
    'ps2':9,
    'ps3':13,
    'ps4':17
}


if __name__ == "__main__":

    data = []

    reader = csv.reader(open('../files/grades.csv','rU'))
    for row in reader:
        data_object = {
            'ext': row[col['ext']],
            'ps1': row[col['ps1']],
            'ps2': row[col['ps2']],
            'ps3': row[col['ps3']],
            # 'ps4': row[col['ps4']],
        }
        data.append(data_object)

    with open('../output/grades.json', 'w') as out_file:
        json.dump(data, out_file)
