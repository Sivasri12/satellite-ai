from flask import Flask, render_template, jsonify
import requests
from sgp4.api import Satrec, jday
from datetime import datetime

app = Flask(__name__)

# Fetch live TLE data (limit 10 satellites)
def get_satellites():
    url = "https://celestrak.com/NORAD/elements/starlink.txt"
    res = requests.get(url).text.splitlines()
    satellites = []
    for i in range(0, min(len(res), 30), 3):
        name = res[i].strip()
        line1 = res[i+1].strip()
        line2 = res[i+2].strip()
        satellites.append({"name": name, "line1": line1, "line2": line2})
    return satellites

# Compute positions and risk
def compute_positions(satellites):
    now = datetime.utcnow()
    jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
    positions = []
    for sat in satellites:
        satellite = Satrec.twoline2rv(sat["line1"], sat["line2"])
        e, r, v = satellite.sgp4(jd, fr)
        if e == 0:
            distance = (r[0]**2 + r[1]**2 + r[2]**2)**0.5
            risk = "HIGH" if distance < 420 else "MEDIUM" if distance < 450 else "LOW"
            positions.append({
                "name": sat["name"],
                "x": r[0]/1000, "y": r[2]/1000, "z": r[1]/1000,
                "risk": risk,
                "velocity": round((v[0]**2 + v[1]**2 + v[2]**2)**0.5, 2),
                "altitude": round(distance-6371,2),
                "command": "Move orbit up 5 km" if risk=="HIGH" else "No action"
            })
    return positions

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/satellite-data")
def satellite_data():
    sats = get_satellites()
    positions = compute_positions(sats)
    return jsonify(positions)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
