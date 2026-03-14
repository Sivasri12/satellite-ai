// Three.js scene
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

// Camera
let camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 50, 200);

// Renderer
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.minDistance = 50;
controls.maxDistance = 400;

// Lights
let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100,100,100);
scene.add(directionalLight);

// Earth with clouds
let earthGeometry = new THREE.SphereGeometry(20,64,64);
let earthMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'),
    bumpMap: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/earthbump1k.jpg'),
    bumpScale: 0.5,
});
let earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Satellite containers
let satellites = [];
let trails = [];
let alertBox = document.getElementById("alert-box");

// Fetch TLE data
fetch("/api/satellites")
.then(res => res.json())
.then(data => {
    data.forEach(satData => {
        // Satellite sphere
        let sat = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshPhongMaterial({color: 0x00ff00})
        );
        sat.position.set(satData.x/1000, satData.y/1000, satData.z/1000);
        sat.name = satData.name;
        sat.risk = Math.floor(Math.random() * 10); // initial risk %
        scene.add(sat);
        satellites.push(sat);

        // Trail
        let trailMat = new THREE.LineBasicMaterial({color: 0xffffff, opacity:0.4, transparent:true});
        let trailGeo = new THREE.BufferGeometry().setFromPoints([sat.position.clone()]);
        let trailLine = new THREE.Line(trailGeo, trailMat);
        scene.add(trailLine);
        trails.push({line: trailLine, points: [sat.position.clone()]});
    });
});

// AI voice alert
function speakAlert(message){
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(message);
    synth.speak(utter);
}

// Animate loop
function animate(){
    requestAnimationFrame(animate);
    earth.rotation.y += 0.001;

    satellites.forEach((sat, index) => {
        // Random orbit motion simulation
        sat.position.applyAxisAngle(new THREE.Vector3(0,1,0), 0.002);

        // Update trail
        let trail = trails[index];
        trail.points.push(sat.position.clone());
        if(trail.points.length > 50) trail.points.shift(); // keep trail length short
        trail.line.geometry.setFromPoints(trail.points);

        // Dynamic risk simulation
        sat.risk = Math.min(100, Math.max(0, sat.risk + (Math.random()-0.5)*2));

        // Change color based on risk
        if(sat.risk > 70) sat.material.color.set(0xff0000);
        else if(sat.risk > 30) sat.material.color.set(0xffff00);
        else sat.material.color.set(0x00ff00);

        // Collision alert
        if(sat.risk > 80 && Math.random() < 0.01){
            alertBox.style.display="block";
            speakAlert(`Collision risk high for ${sat.name}. AI command sent.`);
            setTimeout(()=>{alertBox.style.display="none";},4000);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Hover info
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let infoBox = document.createElement("div");
infoBox.style.position = "absolute";
infoBox.style.background = "rgba(0,0,0,0.7)";
infoBox.style.color = "white";
infoBox.style.padding = "5px 10px";
infoBox.style.display = "none";
infoBox.style.borderRadius = "5px";
document.body.appendChild(infoBox);

function onMouseMove(event){
    mouse.x = (event.clientX/window.innerWidth)*2-1;
    mouse.y = -(event.clientY/window.innerHeight)*2+1;
}
window.addEventListener('mousemove', onMouseMove, false);

function hoverUpdate(){
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(satellites);
    if(intersects.length>0){
        let sat = intersects[0].object;
        infoBox.innerHTML = `${sat.name}<br>Risk: ${sat.risk.toFixed(1)}%`;
        infoBox.style.left = (mouse.x*0.5+0.5)*window.innerWidth + "px";
        infoBox.style.top = (mouse.y*0.5+0.5)*window.innerHeight + "px";
        infoBox.style.display = "block";
    }else{
        infoBox.style.display = "none";
    }
    requestAnimationFrame(hoverUpdate);
}
hoverUpdate();

// Responsive
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
