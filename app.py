from flask import Flask, render_template, jsonify
import requests
from sgp4.api import Satrec, jday
from datetime import datetime

app = Flask(__name__)

def fetch_satellites():
    url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    data = requests.get(url).text.splitlines()

    sats = []
    for i in range(0,150,3):

        name = data[i].strip()
        line1 = data[i+1].strip()
        line2 = data[i+2].strip()

        sats.append({
            "name":name,
            "line1":line1,
            "line2":line2
        })

    return sats


def calculate_positions():

    satellites = fetch_satellites()

    now = datetime.utcnow()

    jd, fr = jday(
        now.year,
        now.month,
        now.day,
        now.hour,
        now.minute,
        now.second
    )

    result = []

    for sat in satellites[:50]:

        satellite = Satrec.twoline2rv(
            sat["line1"],
            sat["line2"]
        )

        e, r, v = satellite.sgp4(jd,fr)

        if e == 0:

            distance = (r[0]**2 + r[1]**2 + r[2]**2)**0.5

            risk = "LOW"

            if distance < 420:
                risk = "HIGH"
            elif distance < 450:
                risk = "MEDIUM"

            result.append({

                "name":sat["name"],

                "x":r[0]/1000,
                "y":r[1]/1000,
                "z":r[2]/1000,

                "velocity":round((v[0]**2+v[1]**2+v[2]**2)**0.5,2),

                "risk":risk,

                "command":"Adjust orbit" if risk=="HIGH" else "None"

            })

    return result


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


if __name__ == "__main__":
    app.run(host="0.0.0.0",port=10000)
