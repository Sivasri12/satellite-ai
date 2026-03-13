// Three.js scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f2b);
const camera = new THREE.PerspectiveCamera(75, 900/500, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(900,500);
document.getElementById("globe-container").appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Earth
const earthGeo = new THREE.SphereGeometry(2,64,64);
const earthMat = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load("https://threejs.org/examples/textures/earth_atmos_2048.jpg"),
    bumpMap: new THREE.TextureLoader().load("https://threejs.org/examples/textures/earthbump1k.jpg"),
    bumpScale:0.05,
    specularMap: new THREE.TextureLoader().load("https://threejs.org/examples/textures/earthspec1k.jpg"),
    specular: new THREE.Color('grey')
});
const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

// Lighting
const light = new THREE.PointLight(0xffffff,1);
light.position.set(5,5,5);
scene.add(light);

// Camera initial position
camera.position.z=6;

// Satellite and debris arrays
const satObjects = [];
const debrisObjects = [];
const riskHistory = {};

// Chart.js setup for risk
const ctx = document.getElementById('riskChart').getContext('2d');
const riskChart = new Chart(ctx, {
    type:'line',
    data:{labels:[], datasets:[]},
    options:{responsive:true, scales:{y:{beginAtZero:true, max:3}, x:{display:true}}}
});

// GLTF Loader for satellite models
const loader = new THREE.GLTFLoader();

// Function to create orbital trail
function createTrail(position, color=0x00ff00){
    const curve = new THREE.CatmullRomCurve3(position);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    const material = new THREE.LineBasicMaterial({color: color});
    const line = new THREE.Line(geometry, material);
    return line;
}

// Generate random debris
function createDebris(){
    for(let i=0;i<15;i++){
        const geo = new THREE.SphereGeometry(0.03,8,8);
        const mat = new THREE.MeshBasicMaterial({color:0xffffff});
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(Math.random()*6-3, Math.random()*6-3, Math.random()*6-3);
        mesh.velocity = {x:(Math.random()-0.5)/50, y:(Math.random()-0.5)/50, z:(Math.random()-0.5)/50};
        debrisObjects.push(mesh);
        scene.add(mesh);
    }
}
createDebris();

// Fetch satellites & update scene/dashboard
function fetchSatellites(){
    fetch("/satellite-data")
    .then(res=>res.json())
    .then(data=>{
        const dashboard=document.getElementById("dashboard");
        dashboard.innerHTML="<tr><th>Satellite</th><th>Risk</th><th>Command</th><th>Velocity (km/s)</th><th>Altitude (km)</th></tr>";

        data.forEach((sat,idx)=>{
            // Dashboard
            const row=dashboard.insertRow();
            row.style.color=sat.risk=="HIGH"?"red":sat.risk=="MEDIUM"?"orange":"green";
            row.insertCell(0).innerText=sat.name;
            row.insertCell(1).innerText=sat.risk;
            row.insertCell(2).innerText=sat.command;
            row.insertCell(3).innerText=sat.velocity;
            row.insertCell(4).innerText=sat.altitude;

            // Satellite object
            let mesh;
            if(satObjects[idx]){
                mesh=satObjects[idx];
            } else {
                const color=sat.risk=="HIGH"?0xff0000:sat.risk=="MEDIUM"?0xffaa00:0x00ff00;
                const geometry = new THREE.SphereGeometry(0.05,12,12);
                const material = new THREE.MeshPhongMaterial({color: color});
                mesh = new THREE.Mesh(geometry, material);
                satObjects.push(mesh);
                scene.add(mesh);

                // Add trail
                const trail = createTrail([mesh.position.clone().add(new THREE.Vector3(0.1,0,0))], color);
                mesh.trail = trail;
                scene.add(trail);
            }

            // Animate movement if HIGH risk
            if(sat.risk=="HIGH"){
                const dir = new THREE.Vector3(0,0.02,0);
                mesh.position.add(dir);
            } else {
                mesh.position.set(sat.x/200, sat.y/200, sat.z/200);
            }

            // Update risk history
            if(!riskHistory[sat.name]) riskHistory[sat.name]=[];
            riskHistory[sat.name].push(sat.risk=="HIGH"?3:sat.risk=="MEDIUM"?2:1);

            // Voice alert
            if(sat.risk=="HIGH" && !mesh.alerted){
                const msg=new SpeechSynthesisUtterance(`Alert! Satellite ${sat.name} at high risk. Move orbit now!`);
                window.speechSynthesis.speak(msg);
                mesh.alerted=true;
            }
        });

        // Update Chart
        riskChart.data.labels = Array.from({length: riskHistory[data[0].name].length}, (_,i)=>i+1);
        riskChart.data.datasets=[];
        Object.keys(riskHistory).forEach((name,i)=>{
            riskChart.data.datasets.push({
                label:name,
                data:riskHistory[name],
                borderColor:`hsl(${i*36},100%,50%)`,
                fill:false
            });
        });
        riskChart.update();
    });
}

// Animate
function animate(){
    requestAnimationFrame(animate);
    earth.rotation.y+=0.001;
    controls.update();

    // Move debris
    debrisObjects.forEach(d=>{
        d.position.x += d.velocity.x;
        d.position.y += d.velocity.y;
        d.position.z += d.velocity.z;

        // Check collision with satellites
        satObjects.forEach(sat=>{
            const dist = d.position.distanceTo(sat.position);
            if(dist<0.1){
                const msg = new SpeechSynthesisUtterance(`Collision warning! Satellite ${sat.name} close to debris`);
                window.speechSynthesis.speak(msg);
            }
        });
    });

    renderer.render(scene,camera);
}
animate();
setInterval(fetchSatellites,10000);
fetchSatellites();
