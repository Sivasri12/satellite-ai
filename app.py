import os
from flask import Flask, render_template, jsonify
import requests
from sgp4.api import Satrec, jday
from datetime import datetime

app = Flask(__name__)

# Fetch real-time satellite TLE safely
def fetch_satellites():
    url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    try:
        data = requests.get(url, timeout=10).text.splitlines()
    except Exception as e:
        print("Error fetching TLE:", e)
        return []
    sats = []
    for i in range(0, min(len(data), 150), 3):
        if i + 2 >= len(data):
            break
        name = data[i].strip()
        line1 = data[i+1].strip()
        line2 = data[i+2].strip()
        sats.append({"name": name, "line1": line1, "line2": line2})
    return sats

# Calculate satellite positions and collision risk
def calculate_positions():
    satellites = fetch_satellites()
    now = datetime.utcnow()
    jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
    result = []

    for sat in satellites[:50]:  # limit to 50 for demo
        try:
            satellite = Satrec.twoline2rv(sat["line1"], sat["line2"])
            e, r, v = satellite.sgp4(jd, fr)
            if e != 0 or r is None:
                continue
            distance = (r[0]**2 + r[1]**2 + r[2]**2)**0.5
            # Simple risk logic
            if distance < 420: risk = "HIGH"
            elif distance < 450: risk = "MEDIUM"
            else: risk = "LOW"

            result.append({
                "name": sat["name"],
                "x": r[0]/1000,  # scale down for Three.js
                "y": r[1]/1000,
                "z": r[2]/1000,
                "velocity": round((v[0]**2 + v[1]**2 + v[2]**2)**0.5,2),
                "risk": risk,
                "command": "Adjust orbit" if risk=="HIGH" else "None"
            })
        except Exception as ex:
            print(f"Error processing satellite {sat['name']}: {ex}")
            continue

    return result

# Routes
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/simulation")
def simulation():
    return render_template("simulation.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/satellites")
def satellites():
    return render_template("satellites.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/api/satellites")
def satellites_api():
    data = calculate_positions()
    return jsonify(data)

# Port from environment for Render
port = int(os.environ.get("PORT", 10000))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=True)
