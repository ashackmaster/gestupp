import { useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  isZoomIn: boolean;
  isZoomOut: boolean;
  isOpenHand: boolean;
  isFist: boolean;
  isPeace: boolean; // Index + Middle for position move
  isReset: boolean; // Thumb + Pinky for reset
  palmPosition: { x: number; y: number } | null;
  rotation: { x: number; y: number };
  position: { x: number; y: number }; // For position movement
}

export const useHandTracking = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [landmarks, setLandmarks] = useState<HandLandmark[] | null>(null);
  const [gesture, setGesture] = useState<GestureState>({
    isZoomIn: false,
    isZoomOut: false,
    isOpenHand: false,
    isFist: false,
    isPeace: false,
    isReset: false,
    palmPosition: null,
    rotation: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
  });

  const prevPalmPosition = useRef<{ x: number; y: number } | null>(null);
  const animationFrame = useRef(0);

  const isFingerExtended = useCallback((
    tip: HandLandmark,
    pip: HandLandmark,
    mcp: HandLandmark,
    wrist: HandLandmark
  ): boolean => {
    const tipToWrist = Math.sqrt(
      Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2)
    );
    const pipToWrist = Math.sqrt(
      Math.pow(pip.x - wrist.x, 2) + Math.pow(pip.y - wrist.y, 2)
    );
    const mcpToWrist = Math.sqrt(
      Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2)
    );
    
    return tipToWrist > pipToWrist * 0.95 && tipToWrist > mcpToWrist;
  }, []);

  const isThumbExtended = useCallback((
    thumbTip: HandLandmark,
    thumbIp: HandLandmark,
    thumbMcp: HandLandmark,
    wrist: HandLandmark,
    indexMcp: HandLandmark
  ): boolean => {
    const thumbToIndexMcp = Math.sqrt(
      Math.pow(thumbTip.x - indexMcp.x, 2) + Math.pow(thumbTip.y - indexMcp.y, 2)
    );
    return thumbToIndexMcp > 0.12;
  }, []);

  const calculateGesture = useCallback((handLandmarks: HandLandmark[]): GestureState => {
    const wrist = handLandmarks[0];
    const thumbTip = handLandmarks[4];
    const thumbIp = handLandmarks[3];
    const thumbMcp = handLandmarks[2];
    const indexTip = handLandmarks[8];
    const indexPip = handLandmarks[6];
    const indexMcp = handLandmarks[5];
    const middleTip = handLandmarks[12];
    const middlePip = handLandmarks[10];
    const middleMcp = handLandmarks[9];
    const ringTip = handLandmarks[16];
    const ringPip = handLandmarks[14];
    const ringMcp = handLandmarks[13];
    const pinkyTip = handLandmarks[20];
    const pinkyPip = handLandmarks[18];
    const pinkyMcp = handLandmarks[17];

    const palmX = (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4;
    const palmY = (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4;
    const palmPosition = { x: palmX, y: palmY };

    const thumbExtended = isThumbExtended(thumbTip, thumbIp, thumbMcp, wrist, indexMcp);
    const indexExtended = isFingerExtended(indexTip, indexPip, indexMcp, wrist);
    const middleExtended = isFingerExtended(middleTip, middlePip, middleMcp, wrist);
    const ringExtended = isFingerExtended(ringTip, ringPip, ringMcp, wrist);
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPip, pinkyMcp, wrist);

    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    // 1. Index + Thumb open (others closed) = Zoom In
    const isZoomIn = thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

    // 2. Only Index open (thumb and others closed) = Zoom Out
    const isZoomOut = !thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

    // 3. All fingers open = Move/Rotate
    const isOpenHand = extendedCount >= 4 && thumbExtended;

    // 4. All fingers closed = Fist/Freeze
    const isFist = extendedCount === 0 && !thumbExtended;

    // 5. Index + Middle open (peace sign) = Position Move
    const isPeace = indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended;

    // 6. Thumb + Pinky open (others closed) = Reset
    const isReset = thumbExtended && pinkyExtended && !indexExtended && !middleExtended && !ringExtended;

    // Direct rotation without momentum - moves exactly with hand
    let rotation = { x: 0, y: 0 };
    if (prevPalmPosition.current && isOpenHand) {
      const deltaX = (palmPosition.x - prevPalmPosition.current.x) * 3; // Direct multiplier
      const deltaY = (palmPosition.y - prevPalmPosition.current.y) * 3;
      rotation = { x: deltaY, y: -deltaX };
    }

    // Position movement for peace gesture
    let position = { x: 0, y: 0 };
    if (prevPalmPosition.current && isPeace) {
      const deltaX = (palmPosition.x - prevPalmPosition.current.x) * 5;
      const deltaY = (palmPosition.y - prevPalmPosition.current.y) * 5;
      position = { x: -deltaX, y: -deltaY };
    }

    prevPalmPosition.current = palmPosition;

    return {
      isZoomIn,
      isZoomOut,
      isOpenHand,
      isFist,
      isPeace,
      isReset,
      palmPosition,
      rotation,
      position,
    };
  }, [isFingerExtended, isThumbExtended]);

  const drawEnhancedLandmarks = useCallback((
    ctx: CanvasRenderingContext2D,
    handLandmarks: HandLandmark[],
    gestureState: GestureState,
    width: number,
    height: number
  ) => {
    animationFrame.current += 0.05;
    const pulse = Math.sin(animationFrame.current) * 0.5 + 0.5;

    ctx.clearRect(0, 0, width, height);

    let primaryColor = '#00ffff';
    let secondaryColor = '#0088aa';
    if (gestureState.isZoomIn) {
      primaryColor = '#00ff88';
      secondaryColor = '#00aa55';
    } else if (gestureState.isZoomOut) {
      primaryColor = '#ff8800';
      secondaryColor = '#aa5500';
    } else if (gestureState.isFist) {
      primaryColor = '#8844ff';
      secondaryColor = '#5522aa';
    } else if (gestureState.isPeace) {
      primaryColor = '#ff44aa';
      secondaryColor = '#aa2277';
    } else if (gestureState.isReset) {
      primaryColor = '#ff0066';
      secondaryColor = '#aa0044';
    } else if (gestureState.isOpenHand) {
      primaryColor = '#00ffff';
      secondaryColor = '#0088aa';
    }

    const palmCenter = {
      x: (handLandmarks[0].x + handLandmarks[5].x + handLandmarks[9].x + handLandmarks[13].x + handLandmarks[17].x) / 5,
      y: (handLandmarks[0].y + handLandmarks[5].y + handLandmarks[9].y + handLandmarks[13].y + handLandmarks[17].y) / 5
    };
    
    const palmRadius = 35 + pulse * 10;
    ctx.beginPath();
    ctx.arc(palmCenter.x * width, palmCenter.y * height, palmRadius, 0, Math.PI * 2);
    ctx.fillStyle = `${primaryColor}15`;
    ctx.fill();
    ctx.strokeStyle = `${primaryColor}60`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(palmCenter.x * width, palmCenter.y * height);
    ctx.rotate(animationFrame.current);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * (palmRadius + 15);
      const y = Math.sin(angle) * (palmRadius + 15);
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
    }
    ctx.strokeStyle = `${primaryColor}80`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17], [5, 17]
    ];

    connections.forEach(([start, end]) => {
      const startPoint = handLandmarks[start];
      const endPoint = handLandmarks[end];
      
      const gradient = ctx.createLinearGradient(
        startPoint.x * width, startPoint.y * height,
        endPoint.x * width, endPoint.y * height
      );
      gradient.addColorStop(0, `${primaryColor}cc`);
      gradient.addColorStop(1, `${secondaryColor}cc`);

      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    handLandmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      const isFingertip = [4, 8, 12, 16, 20].includes(index);
      const isKnuckle = [5, 9, 13, 17].includes(index);
      const isJoint = [1, 2, 3, 6, 7, 10, 11, 14, 15, 18, 19].includes(index);
      const isWrist = index === 0;

      if (isFingertip) {
        const glowSize = 18 + pulse * 8;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `${primaryColor}20`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 12 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `${primaryColor}60`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      let pointSize = 4;
      let pointColor = secondaryColor;
      
      if (isFingertip) {
        pointSize = 8;
        pointColor = primaryColor;
      } else if (isKnuckle) {
        pointSize = 6;
        pointColor = primaryColor;
      } else if (isWrist) {
        pointSize = 10;
        pointColor = primaryColor;
      } else if (isJoint) {
        pointSize = 4;
        pointColor = secondaryColor;
      }

      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = primaryColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x - pointSize * 0.2, y - pointSize * 0.2, pointSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff80';
      ctx.fill();
    });

    // Gesture-specific indicators
    if (gestureState.isZoomIn) {
      ctx.beginPath();
      ctx.moveTo(handLandmarks[4].x * width, handLandmarks[4].y * height);
      ctx.lineTo(handLandmarks[8].x * width, handLandmarks[8].y * height);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ff88';
      ctx.stroke();
      ctx.shadowBlur = 0;

      const midX = (handLandmarks[4].x + handLandmarks[8].x) / 2 * width;
      const midY = (handLandmarks[4].y + handLandmarks[8].y) / 2 * height;
      ctx.beginPath();
      ctx.moveTo(midX - 10, midY);
      ctx.lineTo(midX + 10, midY);
      ctx.moveTo(midX, midY - 10);
      ctx.lineTo(midX, midY + 10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (gestureState.isZoomOut) {
      const indexTip = handLandmarks[8];
      ctx.beginPath();
      ctx.arc(indexTip.x * width, indexTip.y * height, 25 + pulse * 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff8800';
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(indexTip.x * width - 10, indexTip.y * height);
      ctx.lineTo(indexTip.x * width + 10, indexTip.y * height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (gestureState.isFist) {
      // Freeze indicator - ice crystal pattern
      ctx.save();
      ctx.translate(palmCenter.x * width, palmCenter.y * height);
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -40);
        ctx.strokeStyle = '#8844ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8844ff';
        ctx.stroke();
      }
      ctx.restore();
    }

    if (gestureState.isPeace) {
      // Position move indicator - arrows
      const indexTip = handLandmarks[8];
      const middleTip = handLandmarks[12];
      const midX = (indexTip.x + middleTip.x) / 2 * width;
      const midY = (indexTip.y + middleTip.y) / 2 * height;
      
      // Draw crosshair
      ctx.beginPath();
      ctx.strokeStyle = '#ff44aa';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff44aa';
      
      // Arrows
      const arrowSize = 30;
      // Up
      ctx.moveTo(midX, midY - arrowSize);
      ctx.lineTo(midX - 8, midY - arrowSize + 10);
      ctx.moveTo(midX, midY - arrowSize);
      ctx.lineTo(midX + 8, midY - arrowSize + 10);
      // Down
      ctx.moveTo(midX, midY + arrowSize);
      ctx.lineTo(midX - 8, midY + arrowSize - 10);
      ctx.moveTo(midX, midY + arrowSize);
      ctx.lineTo(midX + 8, midY + arrowSize - 10);
      // Left
      ctx.moveTo(midX - arrowSize, midY);
      ctx.lineTo(midX - arrowSize + 10, midY - 8);
      ctx.moveTo(midX - arrowSize, midY);
      ctx.lineTo(midX - arrowSize + 10, midY + 8);
      // Right
      ctx.moveTo(midX + arrowSize, midY);
      ctx.lineTo(midX + arrowSize - 10, midY - 8);
      ctx.moveTo(midX + arrowSize, midY);
      ctx.lineTo(midX + arrowSize - 10, midY + 8);
      
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (gestureState.isReset) {
      ctx.save();
      ctx.translate(palmCenter.x * width, palmCenter.y * height);
      ctx.rotate(-animationFrame.current * 2);
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 1.5);
      ctx.strokeStyle = '#ff0066';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0066';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(45, 0);
      ctx.lineTo(35, -10);
      ctx.lineTo(35, 10);
      ctx.closePath();
      ctx.fillStyle = '#ff0066';
      ctx.fill();
      ctx.restore();
    }

    if (gestureState.isOpenHand && (gestureState.rotation.x !== 0 || gestureState.rotation.y !== 0)) {
      const arrowLength = 40;
      const angle = Math.atan2(-gestureState.rotation.x, gestureState.rotation.y);
      const magnitude = Math.sqrt(gestureState.rotation.x ** 2 + gestureState.rotation.y ** 2);
      const scaledLength = Math.min(arrowLength, arrowLength * magnitude * 5);
      
      if (scaledLength > 5) {
        ctx.save();
        ctx.translate(palmCenter.x * width, palmCenter.y * height);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, -palmRadius - 10);
        ctx.lineTo(0, -palmRadius - 10 - scaledLength);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, -palmRadius - 10 - scaledLength);
        ctx.lineTo(-8, -palmRadius - scaledLength);
        ctx.lineTo(8, -palmRadius - scaledLength);
        ctx.closePath();
        ctx.fillStyle = '#00ffff';
        ctx.fill();
        ctx.restore();
      }
    }
  }, []);

  const processResults = useCallback((results: HandLandmarkerResult) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        
        if (results.landmarks && results.landmarks.length > 0) {
          const handLandmarks = results.landmarks[0] as HandLandmark[];
          setLandmarks(handLandmarks);
          
          const gestureState = calculateGesture(handLandmarks);
          setGesture(gestureState);

          drawEnhancedLandmarks(ctx, handLandmarks, gestureState, width, height);
        } else {
          ctx.clearRect(0, 0, width, height);
          setLandmarks(null);
          setGesture({
            isZoomIn: false,
            isZoomOut: false,
            isOpenHand: false,
            isFist: false,
            isPeace: false,
            isReset: false,
            palmPosition: null,
            rotation: { x: 0, y: 0 },
            position: { x: 0, y: 0 },
          });
        }
      }
    }
  }, [calculateGesture, drawEnhancedLandmarks]);

  const detectHands = useCallback(() => {
    if (videoRef.current && handLandmarkerRef.current && videoRef.current.readyState >= 2) {
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
      processResults(results);
    }
    animationFrameIdRef.current = requestAnimationFrame(detectHands);
  }, [processResults]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Refs not ready, retrying...');
      return;
    }
    
    if (isTracking || isLoading) return;
    
    setIsLoading(true);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handLandmarkerRef.current = handLandmarker;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      videoRef.current.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            resolve();
          };
        }
      });

      setIsTracking(true);
      setIsLoading(false);

      detectHands();
    } catch (error) {
      console.error('Failed to start hand tracking:', error);
      setIsLoading(false);
    }
  }, [detectHands, isTracking, isLoading]);

  const stopTracking = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }

    setIsTracking(false);
    setLandmarks(null);
  }, []);

  return {
    videoRef,
    canvasRef,
    isTracking,
    isLoading,
    landmarks,
    gesture,
    startTracking,
    stopTracking,
  };
};
