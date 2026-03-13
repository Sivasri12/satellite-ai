from flask import Flask, render_template
import random

app = Flask(__name__)

@app.route("/")
def home():
    satellites = ["ISS", "STARLINK-1001", "NOAA-19", "HUBBLE"]
    satellite = random.choice(satellites)
    risk = random.choice(["LOW", "MEDIUM", "HIGH"])
    if risk == "HIGH":
        command = "Move orbit up by 5 km"
    else:
        command = "No action needed"
    return render_template("index.html", satellite=satellite, risk=risk, command=command)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
