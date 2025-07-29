from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory
import csv
import os
import random
from datetime import datetime

app = Flask(__name__, static_url_path='/static')

# Constants
ARCHIVE_FILE = "data/archive.csv"
ARCHIVE_HEADERS = ["timestamp", "inputs", "prize_name", "prize_type", "prize_rarity"]

# Globals
SPIN_ARCHIVE = []

RARITY_VALUES = {
    "common": 1,
    "uncommon": 5,
    "rare": 10,
    "very rare": 50,
    "legendary": 100
}

# Load item data
def load_items(filename="data/items-5e.csv"):
    items = []
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            items.append({
                "name": row["Name"],
                "type": row["Type"],
                "rarity": row["Rarity"].lower(),
                "source": row["Source"],
                "page": row["Page"],
                "text": row["Text"]
            })
    return items

ITEMS = load_items()

# Archive each spin to file
def archive_spin(input_items, prize):
    with open(ARCHIVE_FILE, "a", newline='', encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        if os.stat(ARCHIVE_FILE).st_size == 0:
            writer.writerow(ARCHIVE_HEADERS)
        writer.writerow([
            datetime.now().isoformat(),
            "|".join([item["name"] for item in input_items]),
            "|".join([item["type"] for item in input_items]),
            "|".join([item["rarity"] for item in input_items]),
            prize["name"],
            prize["type"],
            prize["rarity"]
        ])

# Routes
@app.route("/")
def index():
    return render_template("index.html", items=ITEMS)

@app.route('/data/<filename>')
def download_file(filename):
    return send_from_directory('data', filename, as_attachment=True)

@app.route("/spin", methods=["POST"])
def spin():
    selected_names = request.json.get("selectedItems", [])
    selected_items = [item for item in ITEMS if item["name"] in selected_names]
    threshold = sum(RARITY_VALUES.get(item["rarity"], 0) for item in selected_items)

    def get_floor_rarity(threshold, rarity_values):
        sorted_rarities = sorted(rarity_values.items(), key=lambda x: x[1])
        for rarity, value in reversed(sorted_rarities):
            if threshold >= value:
                return rarity
        return "common"

    rounded_rarity = get_floor_rarity(threshold, RARITY_VALUES)
    max_rarity_value = RARITY_VALUES[rounded_rarity]

    eligible_items = [
        item for item in ITEMS
        if RARITY_VALUES.get(item["rarity"], 0) == max_rarity_value
    ]

    print(f"Threshold: {threshold}, Floored to: {rounded_rarity} ({max_rarity_value})")
    print(f"Found {len(eligible_items)} eligible items")

    result = random.choice(eligible_items)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    SPIN_ARCHIVE.append({
        "timestamp": timestamp,
        "inputs": selected_names,
        "prize": result
    })

    archive_spin(selected_items, result)

    return jsonify({
        "result": result,
        "spinPool": [item["name"] for item in eligible_items]
    })

@app.route("/archive")
def archive():
    spins = []
    if os.path.isfile(ARCHIVE_FILE):
        with open(ARCHIVE_FILE, newline='', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                spins.append({
                    "timestamp": row["timestamp"],
                    "inputs": row["inputs"].split("|"),
                    "prize": {
                        "name": row["prize_name"],
                        "type": row["prize_type"],
                        "rarity": row["prize_rarity"]
                    }
                })
    return render_template("archive.html", spins=spins)

@app.route('/about')
def about():
    return render_template('about.html')






if __name__ == "__main__":
    app.run(debug=True)
