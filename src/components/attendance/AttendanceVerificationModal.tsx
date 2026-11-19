'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldCheck,
  Navigation,
  Lock,
  RotateCcw,
  Check,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import {
  ITPL_OFFICE_LOCATION,
  calculateDistanceInMeters,
  evaluateGeofence,
  GeofenceResult,
} from '@/lib/geoFence';
import { IAttendanceLocation } from '@/models/Attendance';

interface AttendanceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'punch_in' | 'punch_out';
  onVerified: (payload: { photo: string; location: IAttendanceLocation }) => Promise<void>;
  isLoading?: boolean;
}

export default function AttendanceVerificationModal({
  isOpen,
  onClose,
  action,
  onVerified,
  isLoading = false,
}: AttendanceVerificationModalProps) {
  const isPunchIn = action === 'punch_in';
  const actionTitle = isPunchIn ? 'Clock In' : 'Clock Out';

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Geolocation states
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geoResult, setGeoResult] = useState<GeofenceResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Auto-scroll modal container to top when opened
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Keep latest onClose in a ref for keydown/listeners
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Keyboard shortcut: Escape to close / go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !isCameraLoading && !locationLoading) {
        onCloseRef.current();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, isCameraLoading, locationLoading]);

  // Clean up legacy local calibration if any exists
  useEffect(() => {
    try {
      localStorage.removeItem('itpl_calibrated_office_coords');
    } catch {}
  }, []);

  // Start Camera Stream with automatic fallback
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraLoading(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      let mediaStream: MediaStream;
      try {
        // Try user facing camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (err) {
        // Fallback for laptop webcams without facingMode constraint support
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      let msg = 'Unable to access camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
    } finally {
      setIsCameraLoading(false);
    }
  }, []);

  // Capture Photo with natural aspect ratio
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    canvas.width = 480;
    canvas.height = Math.round((vHeight / vWidth) * 480);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    }
  };

  // Retake Photo
  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Geolocation Fetching with Fast Cache & Hybrid Fallback
  const fetchLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    setIsSimulated(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    // 1. Instant check from recent session cache (valid for 5 minutes)
    try {
      const cached = sessionStorage.getItem('itpl_last_verified_geo');
      if (cached) {
        const { lat, lng, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          const evalResult = evaluateGeofence(lat, lng);
          setGeoResult(evalResult);
          setLocationLoading(false);
          // Return early if within perimeter for instantaneous sub-100ms verification
          if (evalResult.isWithinPerimeter) {
            return;
          }
        }
      }
    } catch {}

    // 2. Fast low-accuracy first (typically completes in 100-300ms)
    let hasResolved = false;

    const onPosSuccess = (position: GeolocationPosition) => {
      if (hasResolved) return;
      hasResolved = true;
      const { latitude, longitude } = position.coords;
      const evaluation = evaluateGeofence(latitude, longitude);
      setGeoResult(evaluation);
      setLocationLoading(false);
      try {
        sessionStorage.setItem(
          'itpl_last_verified_geo',
          JSON.stringify({ lat: latitude, lng: longitude, timestamp: Date.now() })
        );
      } catch {}
    };

    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (_err) => {
        // Fallback: try high accuracy with short 4s timeout
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err2) => {
            if (hasResolved) return;
            hasResolved = true;
            console.error('Geolocation error:', err2);
            let msg = 'Failed to retrieve your location.';
            if (err2.code === err2.PERMISSION_DENIED) {
              msg = 'Location access was denied. Please grant GPS/Location permission.';
            } else if (err2.code === err2.POSITION_UNAVAILABLE) {
              msg = 'GPS location is currently unavailable.';
            } else if (err2.code === err2.TIMEOUT) {
              msg = 'Location request timed out. Please click "Retry GPS" or check browser permissions.';
            }
            setLocationError(msg);
            setLocationLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 4500,
            maximumAge: 60000,
          }
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 2500,
        maximumAge: 120000,
      }
    );
  }, []);

  // Development / Admin Testing Simulation Toggle
  const handleSimulateOfficeLocation = () => {
    setIsSimulated(true);
    setLocationError(null);
    const simulatedLat = ITPL_OFFICE_LOCATION.latitude + 0.0001;
    const simulatedLng = ITPL_OFFICE_LOCATION.longitude + 0.0001;
    const evaluation = evaluateGeofence(simulatedLat, simulatedLng);
    setGeoResult(evaluation);
    try {
      sessionStorage.setItem(
        'itpl_last_verified_geo',
        JSON.stringify({ lat: simulatedLat, lng: simulatedLng, timestamp: Date.now() })
      );
    } catch {}
  };

  // Lifecycle on modal open / close
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      setLocationError(null);
      setGeoResult(null);
      setLocationLoading(true);
      startCamera();
      fetchLocation();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
  }, [isOpen, startCamera, fetchLocation]);

  // Ensure video element plays when stream updates
  useEffect(() => {
    if (videoRef.current && stream && !capturedPhoto) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedPhoto]);

  if (!isOpen) return null;

  const isWithinPerimeter = Boolean(geoResult?.isWithinPerimeter);
  const canSubmit = Boolean(capturedPhoto && isWithinPerimeter && !isLoading);

  const handleSubmit = async () => {
    if (!canSubmit || !capturedPhoto || !geoResult) return;

    const locationPayload: IAttendanceLocation = {
      latitude: geoResult.userLat,
      longitude: geoResult.userLng,
      distanceMeters: geoResult.distanceMeters,
      address: geoResult.officeAddress,
      isWithinPerimeter: geoResult.isWithinPerimeter,
    };

    await onVerified({
      photo: capturedPhoto,
      location: locationPayload,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isCameraLoading && !locationLoading) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white flex flex-col transition-all duration-200 my-auto shadow-2xl border border-slate-100 ${
          isFullscreen
            ? 'fixed inset-0 w-full h-[100dvh] rounded-none z-50 overflow-hidden'
            : 'w-full max-w-2xl lg:max-w-3xl rounded-2xl sm:rounded-3xl max-h-[96vh] overflow-hidden'
        }`}
      >
        {/* Pinned Sticky Header */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/95 backdrop-blur-sm shrink-0 z-20">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Go Back / Cancel"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  isPunchIn ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              >
                <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {actionTitle} Verification
                  </h2>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    REQUIRED
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-tight">
                  Live biometric selfie &amp; office perimeter (&le; {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
                </p>
              </div>
            </div>
          </div>

          {/* Header Controls: Fullscreen Toggle & Close */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex w-8 h-8 rounded-xl items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Content Area */}
        <div
          ref={scrollContainerRef}
          className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 items-stretch"
        >
          {/* Column 1: Live Selfie Capture */}
          <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="w-full flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Camera className="w-3.5 h-3.5 text-[#635BFF]" />
                  1. Live Selfie
                </label>
                {capturedPhoto ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Captured
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Snap Required
                  </span>
                )}
              </div>

              {/* Viewfinder Frame (Compact & responsive height) */}
              <div className="relative w-full aspect-[4/3] max-w-[210px] sm:max-w-[220px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-200 shadow-md flex items-center justify-center mx-auto">
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhoto}
                      alt="Captured Live Attendance"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow backdrop-blur-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </div>
                  </div>
                ) : isCameraLoading ? (
                  <div className="p-3 text-center space-y-1.5 text-white">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#635BFF]" />
                    <p className="text-[10px] text-slate-300 font-medium">Starting camera...</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-2.5 text-center space-y-1.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 mx-auto" />
                    <p className="text-[9px] text-rose-200 leading-tight">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[9px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {/* Face Guide Oval */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-[48%] border-2 border-dashed border-white/60 shadow-xs flex items-center justify-center" />
                      <span className="text-[8px] text-white/90 font-medium bg-slate-950/60 px-1.5 py-0.2 rounded-full mt-1 backdrop-blur-xs">
                        Center face
                      </span>
                    </div>

                    {/* Instant On-Screen Floating Camera Shutter */}
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="absolute bottom-2 inset-x-0 mx-auto w-10 h-10 rounded-full bg-white/95 hover:bg-white p-0.5 shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-all border-2 border-[#635BFF]"
                      title="Snap Live Selfie"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#635BFF] flex items-center justify-center text-white">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Below Viewfinder */}
            <div className="w-full flex flex-col items-center gap-1 pt-0.5">
              {capturedPhoto ? (
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  disabled={isLoading}
                  className="w-full max-w-[210px] sm:max-w-[220px] py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3 text-slate-600" />
                  <span>Retake Selfie</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={isCameraLoading || Boolean(cameraError)}
                  className="w-full max-w-[210px] sm:max-w-[220px] py-1.5 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7B73FF] hover:from-[#5249ea] hover:to-[#685ff8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Live Selfie</span>
                </button>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Column 2: Office Geofence Verification & In-Card Confirm Button */}
          <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-2xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  2. Office Geofence (&le; {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
                </label>
                <button
                  type="button"
                  onClick={fetchLocation}
                  disabled={locationLoading || isLoading}
                  className="text-[10px] font-bold text-[#635BFF] hover:text-[#5249ea] inline-flex items-center gap-1 cursor-pointer transition-colors"
                  title="Refresh current GPS coordinates"
                >
                  <RefreshCw className={`w-3 h-3 ${locationLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Office Target Card */}
              <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                    <Navigation className="w-3 h-3 text-[#0D9488]" />
                    ITPL Sangli Office
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    &le; {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m Zone
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  Pearl Enclave, MSEB Rd, Vishrambag, Sangli
                </p>
              </div>

              {/* Live Location Status Indicator */}
              {locationLoading ? (
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-xs text-slate-600">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#635BFF]" />
                  <span className="text-[11px] font-medium">Fetching fast GPS coordinates...</span>
                </div>
              ) : locationError ? (
                <div className="p-2 rounded-xl border border-rose-200 bg-rose-50/80 text-xs text-rose-700 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-[10px]">Location Permission Error</p>
                      <p className="text-[9px] leading-tight">{locationError}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={handleSimulateOfficeLocation}
                      className="text-[9px] font-semibold text-rose-800 underline hover:text-rose-950 cursor-pointer"
                    >
                      Simulate Office GPS
                    </button>
                    <button
                      type="button"
                      onClick={fetchLocation}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Retry GPS
                    </button>
                  </div>
                </div>
              ) : geoResult ? (
                <div
                  className={`p-2 rounded-xl border transition-all ${
                    isWithinPerimeter
                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                      : 'border-rose-200 bg-rose-50/80 text-rose-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-1.5">
                      {isWithinPerimeter ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-[11px] leading-tight">
                          {isWithinPerimeter ? 'Within Office Perimeter' : 'Outside Office Perimeter'}
                        </h4>
                        <p className="text-[10px] mt-0.5 font-medium leading-tight">
                          Distance:{' '}
                          <strong className="font-mono">{geoResult.distanceMeters}m</strong>{' '}
                          (Allowed: &le; {geoResult.allowedRadiusMeters}m)
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase shrink-0 ${
                        isWithinPerimeter
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      {isWithinPerimeter ? 'PERMITTED' : 'OUTSIDE'}
                    </span>
                  </div>

                  {!isWithinPerimeter && (
                    <div className="mt-1.5 pt-1 border-t border-rose-200/60 flex items-center justify-between">
                      <span className="text-[9px] text-rose-700">Testing locally?</span>
                      <button
                        type="button"
                        onClick={handleSimulateOfficeLocation}
                        className="text-[9px] font-bold text-rose-800 underline hover:text-rose-950 cursor-pointer"
                      >
                        Simulate Office GPS (Testing)
                      </button>
                    </div>
                  )}

                  {isSimulated && (
                    <p className="text-[8px] text-amber-700 italic mt-0.5 font-mono">
                      * Simulation active for local testing
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* In-Card Primary Submit Button (Right in front of user!) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isPunchIn
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : canSubmit ? (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Confirm &amp; Mark {actionTitle}</span>
                  </>
                ) : !capturedPhoto ? (
                  <>
                    <Camera className="w-4 h-4 text-slate-300" />
                    <span>1. Snap Selfie to Mark</span>
                  </>
                ) : !isWithinPerimeter ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-300" />
                    <span>2. Geofence Check Needed</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm {actionTitle}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Footer with Quick Checklist & Bottom Actions */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md shrink-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Checklist Status */}
          <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto justify-between sm:justify-start">
            <div
              className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${
                capturedPhoto
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <CheckCircle2
                className={`w-3 h-3 ${capturedPhoto ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <span>Selfie: {capturedPhoto ? 'Ready' : 'Pending'}</span>
            </div>

            <div
              className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isWithinPerimeter
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <CheckCircle2
                className={`w-3 h-3 ${isWithinPerimeter ? 'text-emerald-600' : 'text-rose-400'}`}
              />
              <span>Geofence: {isWithinPerimeter ? 'Inside' : 'Outside'}</span>
            </div>
          </div>

          {/* Action Buttons: Back + Confirm */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center justify-center gap-1 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 sm:flex-initial px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                isPunchIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm {actionTitle}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
