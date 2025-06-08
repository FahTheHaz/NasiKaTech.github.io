// Azure Config (replace with your keys)
const visionKey = "3dJbtiz1fojqKcKd6CHW3enFNXShYRjozjP2kvcAM8qNX5PB634JJQQJ99BFACqBBLyXJ3w3AAAFACOGUgmP"; // Replace with your Azure Computer Vision key
const visionEndpoint = "https://computervision567.cognitiveservices.azure.com/";
const speechKey = "9um0Pni9a6iK5P6ldTgsQkrXuqpdsdW4x5yl6Y3wsXP5Uat4MHsvJQQJ99BFACqBBLyXJ3w3AAAYACOGaZ4h"; // Replace with your Azure Speech key
const speechRegion = "southeastasia"; // Replace with your Azure Speech region

// DOM Elements
const cameraView = document.getElementById("cameraView");
const resultDiv = document.getElementById("result");
const speakButton = document.getElementById("speakButton");

// 1. Access iPhone Camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        cameraView.srcObject = stream;
        setInterval(() => detectObjects(cameraView), 3000); // Scan every 3 seconds
    })
    .catch(err => console.error("Camera error:", err));

// 2. Detect Obstacles with Azure Computer Vision
async function detectObjects(video) {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg").split(",")[1];

    const response = await fetch(`${visionEndpoint}/vision/v3.0/detect`, {
        // const response = await fetch(`${southeastasia}/vision/v3.0/detect`, {
        // 
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": visionKey,
            "Content-Type": "application/octet-stream"
        },
        body: atob(imageData)
    });

    const data = await response.json();
    const obstacles = data.objects?.filter(obj => obj.confidence > 0.7 && (obj.object === "person" || obj.object === "tree"));
    if (obstacles?.length > 0) {
        const warningMessage = `Warning: ${obstacles[0].object} ahead!`;
        resultDiv.textContent = warningMessage;
        playAudioWarning(warningMessage);
    }
}

// 3. Audio Alerts with Azure Speech
async function playAudioWarning(text) {
    const response = await fetch(`https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": speechKey,
            "Content-Type": "application/ssml+xml"
        },
        body: `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="en-US-JennyNeural">${text}</voice>
            </speak>
        `
    });

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
}

// Button to trigger speech manually
speakButton.addEventListener("click", () => {
    const text = resultDiv.textContent;
    if (text) {
        playAudioWarning(text);
    }
});