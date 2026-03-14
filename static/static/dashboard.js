fetch("/api/satellites")
.then(res=>res.json())
.then(data=>{
  const table = document.getElementById("table");
  let low=0, med=0, high=0;
  data.forEach(sat=>{
    let row = table.insertRow();
    row.insertCell(0).innerText = sat.name;
    row.insertCell(1).innerText = sat.velocity;
    row.insertCell(2).innerText = sat.risk;
    row.insertCell(3).innerText = sat.command;

    if(sat.risk=="HIGH") high++;
    else if(sat.risk=="MEDIUM") med++;
    else low++;
  });

  new Chart(document.getElementById("chart"),{
    type:"bar",
    data:{
      labels:["LOW","MEDIUM","HIGH"],
      datasets:[{label:"Collision Risk",data:[low,med,high],backgroundColor:["green","orange","red"]}]
    },
    options:{responsive:true,plugins:{legend:{display:false}}}
  });
});
