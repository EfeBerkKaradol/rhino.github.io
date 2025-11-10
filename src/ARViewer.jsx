import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const ARViewer = ({
  session,
  isActive,
  onClose,
  currentParams,
  productName,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraStream, setCameraStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [arMode, setArMode] = useState(false);

  const [modelPosition, setModelPosition] = useState({ x: 0, y: 0, z: -2 });
  const [modelRotation, setModelRotation] = useState({ x: 0, y: 0, z: 0 });
  const [modelScale, setModelScale] = useState(1);

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelRef = useRef(null);

  const [isCapturing, setIsCapturing] = useState(false);

  // ---- Kamera erişimi helper (desktop + mobil + Safari) ----
  const getMediaStream = useCallback(async () => {
    // Modern API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const envConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      try {
        return await navigator.mediaDevices.getUserMedia(envConstraints);
      } catch (err) {
        console.warn(
          "[AR] environment camera constraints failed, retrying with generic video:",
          err
        );
        return await navigator.mediaDevices.getUserMedia({ video: true });
      }
    }

    // Legacy API (eski Safari vs.)
    const legacyGetUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    if (!legacyGetUserMedia) {
      throw new Error("Tarayıcı kamera API'sini desteklemiyor.");
    }

    return await new Promise((resolve, reject) => {
      legacyGetUserMedia.call(
        navigator,
        { video: true },
        (stream) => resolve(stream),
        (err) => reject(err)
      );
    });
  }, []);

  // ---- Kamera başlat ----
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("[AR] Kamera başlatılıyor...");
      const stream = await getMediaStream();
      setCameraStream(stream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => {
            console.warn("[AR] Video play() engellendi:", err);
          });
        }
      }

      setArMode(true);
    } catch (err) {
      console.error("Kamera erişim hatası:", err);

      let msg = "Kamera erişimi başarısız. ";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        msg +=
          "Tarayıcı kamera iznini engelledi. Ayarlardan bu site için kameraya izin verin.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        msg += "Herhangi bir kamera bulunamadı.";
      } else {
        msg += err.message || "Bilinmeyen bir hata oluştu.";
      }

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [getMediaStream]);

  // ---- Kamerayı durdur ----
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setArMode(false);

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, [cameraStream]);

  // ---- Three.js sahnesini kur ----
  const setupThreeScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Basit model (ileride ShapeDiver'dan gelen model ile değiştirilebilir)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x7aa2ff,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
    });

    const model = new THREE.Mesh(geometry, material);
    model.position.set(modelPosition.x, modelPosition.y, modelPosition.z);
    model.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z);
    model.scale.setScalar(modelScale);
    model.castShadow = true;

    modelRef.current = model;
    scene.add(model);
  }, [modelPosition, modelRotation, modelScale]);

  // ---- Animasyon döngüsü ----
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);

    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, []);

  // ---- Ekran görüntüsü ----
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !rendererRef.current) return;

    setIsCapturing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      const combinedCanvas = document.createElement("canvas");
      const ctx = combinedCanvas.getContext("2d");
      combinedCanvas.width = canvas.width;
      combinedCanvas.height = canvas.height;

      ctx.drawImage(video, 0, 0, combinedCanvas.width, combinedCanvas.height);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(canvas, 0, 0);

      const link = document.createElement("a");
      link.download = `AR_${productName || "Ürün"}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-")}.png`;
      link.href = combinedCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Ekran görüntüsü alınamadı:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [productName]);

  // ---- AR modu aktifken Three sahnesini başlat ----
  useEffect(() => {
    if (arMode && canvasRef.current) {
      setupThreeScene();
      animate();
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [arMode, setupThreeScene, animate]);

  // ---- Model pozisyon/güncelleme ----
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.position.set(
        modelPosition.x,
        modelPosition.y,
        modelPosition.z
      );
      modelRef.current.rotation.set(
        modelRotation.x,
        modelRotation.y,
        modelRotation.z
      );
      modelRef.current.scale.setScalar(modelScale);
    }
  }, [modelPosition, modelRotation, modelScale]);

  // ---- Bileşen unmount olurken kamerayı kapat ----
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!isActive) return null;

  return (
    <div className="ar-overlay">
      <div className="ar-container">
        <div className="ar-header">
          <h3>Artırılmış Gerçeklik - {productName}</h3>
          <button
            className="btn ghost"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="ar-error">
            <strong>Hata:</strong> {error}
            <br />
            <small>Tarayıcı ayarlarından kamera iznini kontrol edin.</small>
          </div>
        )}

        {!arMode ? (
          <div className="ar-start">
            <div className="ar-instructions">
              <h4>🎯 AR Görünüm Nasıl Çalışır?</h4>
              <p>Parametrize ettiğiniz ürünü gerçek dünyada görüntüleyin:</p>
              <ul>
                <li>
                  <strong>Kamera izni</strong> vermeniz gerekecek
                </li>
                <li>
                  <strong>İyi aydınlatma</strong> kullanın
                </li>
                <li>
                  <strong>Düz zemin</strong> seçin
                </li>
              </ul>
            </div>
            <button
              className="btn primary"
              onClick={startCamera}
              disabled={isLoading}
            >
              {isLoading ? "Kamera Açılıyor..." : "🚀 AR Modunu Başlat"}
            </button>
          </div>
        ) : (
          <div className="ar-viewer">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="ar-video"
            />
            <canvas ref={canvasRef} className="ar-canvas" />

            <div className="ar-controls">
              <div className="ar-section">
                <h5>📍 Pozisyon</h5>
                <div className="ar-control-group">
                  <label>X</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={modelPosition.x}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        x: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.x.toFixed(1)}</span>
                </div>

                <div className="ar-control-group">
                  <label>Y</label>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={modelPosition.y}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        y: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.y.toFixed(1)}</span>
                </div>

                <div className="ar-control-group">
                  <label>Z</label>
                  <input
                    type="range"
                    min="-10"
                    max="1"
                    step="0.1"
                    value={modelPosition.z}
                    onChange={(e) =>
                      setModelPosition((prev) => ({
                        ...prev,
                        z: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <span>{modelPosition.z.toFixed(1)}</span>
                </div>
              </div>

              <div className="ar-section">
                <h5>📏 Boyut</h5>
                <div className="ar-control-group">
                  <label>Ölçek</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  />
                  <span>{modelScale.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div className="ar-actions">
              <button className="btn" onClick={stopCamera}>
                ❌ Kamerayı Durdur
              </button>
              <button
                className="btn primary"
                onClick={captureScreenshot}
                disabled={isCapturing}
              >
                {isCapturing ? "📸 Kaydediliyor..." : "📸 Ekran Görüntüsü"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARViewer;
