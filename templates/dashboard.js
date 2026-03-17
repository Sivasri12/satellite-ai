// Dummy live data simulation
const satellites = [
    {name:"ISS", risk:Math.random()*100, distance:420},
    {name:"Hubble", risk:Math.random()*100, distance:540},
    {name:"NOAA 20", risk:Math.random()*100, distance:830},
    {name:"Terra", risk:Math.random()*100, distance:705},
    {name:"Landsat 8", risk:Math.random()*100, distance:705},
];

// Populate table
let tableBody = document.getElementById("satTable");
satellites.forEach(sat => {
    let row = document.createElement("tr");
    row.innerHTML = `<td>${sat.name}</td><td>${sat.risk.toFixed(1)}</td><td>${sat.distance}</td>`;
    tableBody.appendChild(row);
});

// Create Chart
const ctx = document.getElementById('riskChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: satellites.map(s => s.name),
        datasets: [{
            label: 'Collision Risk (%)',
            data: satellites.map(s => s.risk),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive:true,
        plugins: {
            legend: {
                labels: {color: "#fff"} // white text for legend
            }
        },
        scales: {
            x: { ticks: { color:"#fff" }, grid: { color: "#ffffff33" } },
            y: { ticks: { color:"#fff" }, grid: { color: "#ffffff33" }, beginAtZero: true }
        }
    }
});
