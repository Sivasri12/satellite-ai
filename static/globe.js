// Three.js Setup
let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 5000);
camera.position.set(0, 50, 150);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
let dirLight = new THREE.DirectionalLight(0xffffff,1);
dirLight.position.set(100,100,100);
scene.add(dirLight);

// Earth
let earthGeo = new THREE.SphereGeometry(20,64,64);
let earthMat = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'),
    bumpMap: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/earthbump1k.jpg'),
    bumpScale: 0.5
});
let earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

// Satellites
let satellites = [];
let alertBox = document.getElementById("alert-box");

// Fetch live satellite positions
fetch("/api/satellites")
.then(res => res.json())
.then(data => {
    data.forEach(satData => {
        let sat = new THREE.Mesh(new THREE.SphereGeometry(0.5,16,16), new THREE.MeshPhongMaterial({color:0xffaa00}));
        sat.position.set(satData.x/1000, satData.y/1000, satData.z/1000); // scale for display
        sat.name = satData.name;
        scene.add(sat);
        satellites.push(sat);
    });
});

// Voice alert
function speakAlert(message){
    let synth = window.speechSynthesis;
    let utter = new SpeechSynthesisUtterance(message);
    synth.speak(utter);
}

// Animate
function animate(){
    requestAnimationFrame(animate);
    earth.rotation.y += 0.001;

    satellites.forEach(sat => {
        // Random collision simulation for demo
        if(Math.random()<0.0005){
            alertBox.style.display = "block";
            speakAlert("Collision risk detected for "+sat.name+". Sending automatic command to satellite.");
            setTimeout(()=>{alertBox.style.display="none";},3000);
        }
    });

    controls.update();
    renderer.render(scene,camera);
}
animate();

// Responsive
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
