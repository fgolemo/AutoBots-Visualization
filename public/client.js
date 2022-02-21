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

const light4 = new THREE.AmbientLight(0x404040) // soft white light
scene.add(light4)

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
    false,
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


const floor_geom = new THREE.PlaneGeometry(2, 2) // width, height, no depth for plane
var floor_tex = new THREE.TextureLoader().load(
    './boston-55-8.png',
)
const floor_mat = new THREE.MeshBasicMaterial({
    // color: 0xeba6f5,
    side: THREE.FrontSide,
    map: floor_tex, // texture as a map for material
})
const floor = new THREE.Mesh(floor_geom, floor_mat) // mesh takes just two parameters
floor.position.x = 0
floor.position.y = 0
floor.position.z = 0
floor.rotation.x = -Math.PI / 2
scene.add(floor)

const SUBSTEPS = 20

const car_geom = new THREE.BoxGeometry(0.1, 0.05, 0.05)
const car_mat = new THREE.MeshStandardMaterial({
    color: 0x94D0FF,
    opacity: 0.5,
    transparent: true,
    roughness: 1,
})
const ped_geom = new THREE.CylinderGeometry(0.025, 0.025, 0.05)
const ped_mat = new THREE.MeshStandardMaterial({
    color: 0x966BFF,
    // wireframe: true,
    opacity: 0.5,
    transparent: true,
    roughness: 1,
})
const mat_wire = new THREE.MeshStandardMaterial({
    wireframe: true,
})


var objects = []

const loader = new THREE.FileLoader()
loader.setResponseType('json')
loader.load(
    // resource URL
    'data-55-8.json',

    // onLoad callback
    function(data) {
        // output the text to the console
        console.log(data)
        for (const idx in data) {

            let obj_pred
            let obj_gt
            if (data[idx]['type'] == 'car') {
                obj_pred = new THREE.Mesh(car_geom, car_mat)
                obj_gt = new THREE.Mesh(car_geom, mat_wire)
            } else if (data[idx]['type'] == 'pedestrian') {
                obj_pred = new THREE.Mesh(ped_geom, ped_mat)
                obj_gt = new THREE.Mesh(ped_geom, mat_wire)
            } else {
                console.log('obj type not recognized:' + data[idx]['type'])
            }

            let steps_x = data[idx]['inputs_x'].concat(data[idx]['outputs_x'])
            let steps_y = data[idx]['inputs_y'].concat(data[idx]['outputs_y'])
            if (idx == 2) { // weird special case with error
                steps_x = steps_x.slice(0, -4)
                steps_y = steps_y.slice(0, -4)
            }
            let predictions = []
            for (const predIdx in data[idx]['predictions']) {
                let pred = data[idx]['predictions'][predIdx]
                predictions.push({
                    x: pred['outputs_x'],
                    y: pred['outputs_y'],
                    yaw: pred['outputs_yaw'],
                })
            }
            let pos = new THREE.Vector3(data[idx]['inputs_x'][0], 0.025, -data[idx]['inputs_y'][0])
            let rot = data[idx]['inputs_yaw'][0]
            obj_pred.position.copy(pos)
            obj_gt.position.copy(pos)
            obj_pred.rotation.set(0, rot, 0)
            obj_gt.rotation.set(0, rot, 0)
            scene.add(obj_pred)
            scene.add(obj_gt)
            objects.push({
                kind: data[idx]['type'],
                handle_pred: obj_pred,
                handle_gt: obj_gt,
                steps_x_gt: steps_x,
                steps_y_gt: steps_y,
                steps_yaw_gt: data[idx]['inputs_yaw'].concat(data[idx]['outputs_yaw']),
                in_steps: data[idx]['inputs_x'].length,
                predictions: predictions,
            })

        }
    },
    // onProgress callback
    function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    // onError callback
    function(err) {
        console.error('An error happened')
    },
)

let step = 0;
let prediction = 0;
let lastStep = -1;

const MOVE_THRESHOLD = 0.02;

function moveObjs() {
    let dones = 0;
    for (const objIdx in objects) {
        let o = objects[objIdx]
        let majorStep = Math.floor(step / SUBSTEPS)
        let subStep = step % SUBSTEPS
        if (majorStep >= o.steps_x_gt.length) dones+=1;
        let current_x_major_gt = o.steps_x_gt[majorStep]
        let current_y_major_gt = -o.steps_y_gt[majorStep]
        let current_yaw_major_gt = o.steps_yaw_gt[majorStep]
        let next_x_major_gt = o.steps_x_gt[majorStep + 1]
        let next_y_major_gt = -o.steps_y_gt[majorStep + 1]
        let next_yaw_major_gt = o.steps_yaw_gt[majorStep + 1]
        let diff_x_gt = (next_x_major_gt - current_x_major_gt) * (subStep / SUBSTEPS)
        let diff_y_gt = (next_y_major_gt - current_y_major_gt) * (subStep / SUBSTEPS)
        let diff_yaw_gt = (next_yaw_major_gt - current_yaw_major_gt) * (subStep / SUBSTEPS)
        if ((next_x_major_gt - current_x_major_gt) < MOVE_THRESHOLD && (next_y_major_gt - current_y_major_gt) < MOVE_THRESHOLD) {
            diff_yaw_gt = 0;
        }

        let pos_gt = new THREE.Vector3(current_x_major_gt + diff_x_gt, 0.025, current_y_major_gt + diff_y_gt)
        let rot_gt = current_yaw_major_gt + diff_yaw_gt
        let pos_pred, rot_pred

        if (majorStep < o.in_steps) {
            pos_pred = pos_gt
            rot_pred = rot_gt
        } else {
            let pred = o.predictions[prediction]
            let current_x_major_p = pred['x'][majorStep - o.in_steps]
            let current_y_major_p = -pred['y'][majorStep - o.in_steps]
            let current_yaw_major_p = pred['yaw'][majorStep - o.in_steps]
            let next_x_major_p = pred['x'][majorStep - o.in_steps + 1]
            let next_y_major_p = -pred['y'][majorStep - o.in_steps + 1]
            let next_yaw_major_p = pred['yaw'][majorStep - o.in_steps + 1]
            let diff_x_p = (next_x_major_p - current_x_major_p) * (subStep / SUBSTEPS)
            let diff_y_p = (next_y_major_p - current_y_major_p) * (subStep / SUBSTEPS)
            let diff_yaw_p = (next_yaw_major_p - current_yaw_major_p) * (subStep / SUBSTEPS)
            if ((next_x_major_p - current_x_major_p) < MOVE_THRESHOLD && (next_y_major_p - current_y_major_p) < MOVE_THRESHOLD) {
                diff_yaw_p = 0;
            }

            pos_pred = new THREE.Vector3(current_x_major_p + diff_x_p, 0.025, current_y_major_p + diff_y_p)
            rot_pred = current_yaw_major_p + diff_yaw_p
        }


        o.handle_gt.position.copy(pos_gt)
        o.handle_gt.rotation.set(0, rot_gt, 0)

        o.handle_pred.position.copy(pos_pred)
        o.handle_pred.rotation.set(0, rot_pred, 0)

        if (majorStep == o.in_steps && subStep == 0) {
            let color
            if (o.kind == 'car') {
                color = 0xFF6AD5
            } else {
                color = 0xFFDE8B
            }
            o.handle_pred.material.color.setHex(color)
        }
    }
    if (dones == objects.length && objects.length > 0) {
        if (lastStep == -1) {
            lastStep = step;
        }
        else if (step == lastStep + 20 && prediction < objects[0].predictions.length-1) {
            step = -1;
            prediction+=1;
            lastStep = -1;
            for (const objIdx in objects) {
                let o = objects[objIdx]
                let color
                if (o.kind == 'car') {
                    color = 0x94D0FF
                } else {
                    color = 0x966BFF
                }
                o.handle_pred.material.color.setHex(color)
            }
        }
    }

}

function animate() {
    requestAnimationFrame(animate)

    moveObjs()
    controls.update()
    render()
    stats.update()
    step += 1
}

function render() {
    renderer.render(scene, camera)
}

animate()
