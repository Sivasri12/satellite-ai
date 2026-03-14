let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

let camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 150);

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new THREE.OrbitControls(camera, renderer.domElement);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100,100,100);
scene.add(directionalLight);

// Earth
let earthGeometry = new THREE.SphereGeometry(20,64,64);
let earthMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'),
    bumpMap: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/earthbump1k.jpg'),
    bumpScale: 0.5
});
let earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

let satellites = [];
let alertBox = document.getElementById("alert-box");

fetch("/api/satellites")
.then(res=>res.json())
.then(data=>{
    data.forEach(satData=>{
        let sat = new THREE.Mesh(
            new THREE.SphereGeometry(0.5,16,16),
            new THREE.MeshPhongMaterial({color:0xffaa00})
        );
        sat.position.set(satData.x/1000, satData.y/1000, satData.z/1000);
        sat.name = satData.name;
        scene.add(sat);
        satellites.push(sat);
    });
});

function speakAlert(message){
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(message);
    synth.speak(utterThis);
}

function animate(){
    requestAnimationFrame(animate);
    earth.rotation.y += 0.001;

    satellites.forEach(sat=>{
        // simulate random collision alerts
        if(Math.random() < 0.0005){
            alertBox.style.display="block";
            speakAlert("Collision risk detected. Sending AI Command.");
            setTimeout(()=>{alertBox.style.display="none";},3000);
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
