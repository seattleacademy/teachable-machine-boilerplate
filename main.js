// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
console.log("main.js");




import { KNNImageClassifier } from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';

// Number of classes to classify
const NUM_CLASSES = 10;
// Webcam Image size. Must be 227. 
const IMAGE_SIZE = 227;
// K value for KNN
const TOPK = 10;


class Main {
    constructor() {
        // Initiate variables
        this.infoTexts = [];
        this.training = -1; // -1 when no class is being trained
        this.videoPlaying = false;

        // Initiate deeplearn.js math and knn classifier objects
        this.knn = new KNNImageClassifier(NUM_CLASSES, TOPK);

        // Create video element that will contain the webcam image
        this.video = document.createElement('video');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('playsinline', '');

        // Add video element to DOM
        document.body.appendChild(this.video);

        // Create training buttons and info texts    
        for (let i = 0; i < NUM_CLASSES; i++) {
            const div = document.createElement('div');
            document.body.appendChild(div);
            div.style.marginBottom = '10px';

            // Create training button
            const button = document.createElement('button')
            // button.innerText = "Train " + i;
            if (i == 0) button.innerText = 'nothing';
            if (i == 1) button.innerText = 'stop';
            if (i == 2) button.innerText = 'land';
            if (i == 3) button.innerText = 'up';
            if (i == 4) button.innerText = 'down';
            if (i == 5) button.innerText = 'clockwise';
            if (i == 6) button.innerText = 'counterClockwise';
            if (i == 7) button.innerText = 'red';
            if (i == 8) button.innerText = 'green';
            if (i == 9) button.innerText = 'flipRight';
            div.appendChild(button);

            // Listen for mouse events when clicking the button
            button.addEventListener('mousedown', () => this.training = i);
            button.addEventListener('mouseup', () => this.training = -1);

            // Create info text
            const infoText = document.createElement('span')
            infoText.innerText = " No examples added";
            div.appendChild(infoText);
            this.infoTexts.push(infoText);
        }


        // Setup webcam
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then((stream) => {
                this.video.srcObject = stream;
                this.video.width = IMAGE_SIZE;
                this.video.height = IMAGE_SIZE;

                this.video.addEventListener('playing', () => this.videoPlaying = true);
                this.video.addEventListener('paused', () => this.videoPlaying = false);
            })

        // Load knn model
        this.knn.load()
            .then(() => this.start());
    }

    start() {
        if (this.timer) {
            this.stop();
        }
        this.video.play();
        this.timer = requestAnimationFrame(this.animate.bind(this));
    }

    stop() {
        this.video.pause();
        cancelAnimationFrame(this.timer);
    }

    animate() {
        if (this.videoPlaying) {
            // Get image data from video element
            const image = dl.fromPixels(this.video);

            // Train class if one of the buttons is held down
            if (this.training != -1) {
                // Add current image to classifier
                this.knn.addImage(image, this.training)
            }

            // If any examples have been added, run predict
            const exampleCount = this.knn.getClassExampleCount();
            const debugmessage = document.getElementById('debugmessage');
            debugmessage.innerText = "--";
            if (Math.max(...exampleCount) > 0) {
                this.knn.predictClass(image)
                    .then((res) => {
                        for (let i = 0; i < NUM_CLASSES; i++) {
                            // Make the predicted class bold
                            if (res.classIndex == i) {
                                this.infoTexts[i].style.fontWeight = 'bold';
                            } else {
                                this.infoTexts[i].style.fontWeight = 'normal';
                            }

                            // Update info text
                            if (exampleCount[i] > 0) {
                                this.infoTexts[i].innerText = ` ${exampleCount[i]} examples - ${res.confidences[i]*100}%`
                            }

                            if (i == 0 && res.confidences[0] >= .5) {
                                debugmessage.innerText = 'nothing';
                            }

                            if (i == 1 && res.confidences[1] >= .9) {
                                debugmessage.innerText = 'stop';
                                socket.emit("/pilot/drone", { action: 'stop' });
                            }

                            if (i == 2 && res.confidences[2] >= .9) {
                                debugmessage.innerText = 'land';
                                socket.emit("/pilot/drone", { action: 'land' });
                            }

                            if (i == 3 && res.confidences[3] >= .9) {
                                debugmessage.innerText = 'up';
                                socket.emit("/pilot/move", { action: 'up' });
                            }

                            if (i == 4 && res.confidences[4] >= .9) {
                                debugmessage.innerText = 'down';
                                socket.emit("/pilot/move", { action: 'down' });
                            }

                            if (i == 5 && res.confidences[5] >= .9) {
                                debugmessage.innerText = 'clockwise';
                                socket.emit("/pilot/move", { action: 'clockwise' });
                            }

                            if (i == 6 && res.confidences[6] >= .9) {
                                debugmessage.innerText = 'counterClockwise';
                                socket.emit("/pilot/move", { action: 'counterClockwise' });
                            }
                            if (i == 7 && res.confidences[7] >= .9) {
                                debugmessage.innerText = 'red';
                                socket.emit("/pilot/animateLeds", { animation: 'red' });
                            }
                            if (i == 8 && res.confidences[8] >= .9) {
                                debugmessage.innerText = 'green';
                                socket.emit("/pilot/animateLeds", { animation: 'green' });
                            }
                            if (i == 9 && res.confidences[9] >= .9) {
                                debugmessage.innerText = 'flip';
                                socket.emit("/pilot/animate", { action: 'flipRight' });
                            }


                        }
                    })
                    // Dispose image when done
                    .then(() => image.dispose())
            } else {
                image.dispose()
            }
        }
        this.timer = requestAnimationFrame(this.animate.bind(this));
    }
}

window.addEventListener('load', () => new Main());