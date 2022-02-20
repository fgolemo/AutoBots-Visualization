import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

const scene = new THREE.Scene()

// wtf Y is up???



const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 1

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)





const light = new THREE.PointLight(0xffffff, 2)
light.position.set(10, 10, 10)
scene.add(light)

const light2 = new THREE.PointLight(0xff00ff, 2)
light.position.set(-10, 10, 10)
scene.add(light2)

const light3 = new THREE.PointLight(0x00ffff, 2)
light.position.set(10, 10, -10)
scene.add(light3)

const light4 = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light4)

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );


window.addEventListener(
    'resize',
    () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    },
    false
)

const stats = Stats()
document.body.appendChild(stats.dom)

// const gui = new GUI()
// const cubeFolder = gui.addFolder('Cube')
// cubeFolder.add(cube.scale, 'x', -5, 5)
// cubeFolder.add(cube.scale, 'y', -5, 5)
// cubeFolder.add(cube.scale, 'z', -5, 5)
// cubeFolder.open()
// const cameraFolder = gui.addFolder('Camera')
// cameraFolder.add(camera.position, 'z', 0, 10)
// cameraFolder.open()


const floor_geom = new THREE.PlaneGeometry(2, 2); // width, height, no depth for plane
var floor_tex = new THREE.TextureLoader().load(
    "./boston-55-8.png"
);
const floor_mat = new THREE.MeshBasicMaterial({
    // color: 0xeba6f5,
    side: THREE.FrontSide,
    map: floor_tex // texture as a map for material
});
const floor = new THREE.Mesh(floor_geom, floor_mat); // mesh takes just two parameters
floor.position.x = 0;
floor.position.y = 0;
floor.position.z = 0;
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const SUBSTEPS = 20;

const car_geom = new THREE.BoxGeometry(0.1,0.05,0.05)
const car_mat1 = new THREE.MeshStandardMaterial({
    color: 0x94D0FF,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const car_mat2 = new THREE.MeshStandardMaterial({
    color: 0xFF6AD5,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const ped_geom = new THREE.CylinderGeometry(0.025,0.025,0.05)
const ped_mat1 = new THREE.MeshStandardMaterial({
    color: 0x966BFF,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1
})
const ped_mat2 = new THREE.MeshStandardMaterial({
    color: 0xFFDE8B,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1
})

var objects = [];

const loader = new THREE.FileLoader();
loader.setResponseType("json")
loader.load(
    // resource URL
    'data-55-8.json',

    // onLoad callback
    function ( data ) {
        // output the text to the console
        console.log( data );
        for (const idx in data) {

            let obj;
            if (data[idx]["type"] == "car") {
                obj = new THREE.Mesh(car_geom, car_mat1);
            } else if(data[idx]["type"] == "pedestrian") {
                obj = new THREE.Mesh(ped_geom, ped_mat1);
            } else {
                console.log("obj type not recognized:"+data[idx]["type"]);
            }

            let steps_x = data[idx]["inputs_x"].concat(data[idx]["outputs_x"]);
            let steps_y = data[idx]["inputs_y"].concat(data[idx]["outputs_y"]);
            if (idx == 2) { // weird special case with error
                steps_x = steps_x.slice(0,-4);
                steps_y = steps_y.slice(0,-4);
            }

            obj.position.set(data[idx]["inputs_x"][0], 0.025, -data[idx]["inputs_y"][0]);
            obj.rotation.set(0,data[idx]["inputs_yaw"][0],0)
            scene.add(obj);
            objects.push({
                kind: data[idx]["type"],
                handle: obj,
                steps_x_gt: steps_x,
                steps_y_gt: steps_y,
                steps_yaw_gt: data[idx]["inputs_yaw"].concat(data[idx]["outputs_yaw"]),
                in_steps: data[idx]["inputs_x"].length
            })

        }
    },
    // onProgress callback
    function ( xhr ) {
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
    },
    // onError callback
    function ( err ) {
        console.error( 'An error happened' );
    }
);

let step = 0;

function moveObjs(){
    for (const objIdx in objects) {
        let o = objects[objIdx];
        let majorStep = Math.floor(step/SUBSTEPS);
        let subStep = step % SUBSTEPS;
        // if (majorStep >= o.steps_x_gt.length) continue; // ignore objs at the end of their lifespan
        let current_x_major = o.steps_x_gt[majorStep];
        let current_y_major = -o.steps_y_gt[majorStep];
        let current_yaw_major = o.steps_yaw_gt[majorStep];
        let next_x_major = o.steps_x_gt[majorStep+1];
        let next_y_major = -o.steps_y_gt[majorStep+1];
        let next_yaw_major = o.steps_yaw_gt[majorStep+1];
        let diff_x = (next_x_major - current_x_major)  * (subStep/SUBSTEPS);
        let diff_y = (next_y_major - current_y_major) * (subStep/SUBSTEPS);
        let diff_yaw = (next_yaw_major - current_yaw_major) * (subStep/SUBSTEPS);
        o.handle.position.set(current_x_major+diff_x,0.025,current_y_major+diff_y);
        o.handle.rotation.set(0,current_yaw_major+diff_yaw,0)
        if (majorStep == o.in_steps && subStep == 0) {
            let color;
            if (o.kind =="car") {
                color = 0xFF6AD5;
            }
            else {
                color = 0xFFDE8B;
            }
            o.handle.material.color.setHex(color);
        }
    }
}

function animate() {
    requestAnimationFrame(animate)

    moveObjs();
    controls.update();
    render();
    stats.update();
    step+=1;
}

function render() {
    renderer.render(scene, camera)
}

animate()
