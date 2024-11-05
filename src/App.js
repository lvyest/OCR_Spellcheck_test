document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photo = document.getElementById('photo');
    const ocrResult = document.getElementById('ocr-result');
    const captureButton = document.getElementById('capture');
    const checkSpellingButton = document.getElementById('check-spelling');
    const correctedText = document.getElementById('corrected-text');

    // Start the camera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => console.error('Camera error:', err));

    // Capture image and call Google Vision API
    captureButton.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataURL = canvas.toDataURL('image/png');
        photo.src = imageDataURL;
        photo.style.display = 'block';

        // Send Base64 image data to Google Cloud Vision API
        const base64Image = imageDataURL.replace(/^data:image\/(png|jpeg);base64,/, "");

        const visionAPIUrl = `https://vision.googleapis.com/v1/images:annotate?key=AIzaSyA_tJPJrushDk7N9KVrDXuFOmgonLOf1c0`;

        const requestBody = {
            requests: [
                {
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: "TEXT_DETECTION"
                        }
                    ]
                }
            ]
        };

        fetch(visionAPIUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            const recognizedText = data.responses[0].fullTextAnnotation.text;
            ocrResult.value = recognizedText;
        })
        .catch(err => console.error('OCR error:', err));
    });

    // Call Spell Check API (external API for spell checking)
    checkSpellingButton.addEventListener('click', () => {
        const text = ocrResult.value;
        if (text.trim() === '') {
            alert('먼저 텍스트를 인식해주세요!');
            return;
        }

        // LanguageTool API로 맞춤법 검사 요청
        fetch('https://api.languagetoolplus.com/v2/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                text: text,
                language: 'ko' // 한국어로 설정
            })
        })
        .then(response => response.json())
        .then(data => {
            // 수정된 텍스트를 결과로 표시
            const corrected = data.matches.map(match => match.replacements[0]?.value || match.context.text).join(' ');
            correctedText.innerText = corrected || '맞춤법 오류가 없습니다.';
        })
        .catch(err => console.error('맞춤법 검사 에러:', err));
    });
});
