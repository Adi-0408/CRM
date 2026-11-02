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
  Crosshair,
  Check,
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Geolocation states
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geoResult, setGeoResult] = useState<GeofenceResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [calibratedCoords, setCalibratedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isCalibratedNotice, setIsCalibratedNotice] = useState(false);

  // Load calibrated office coords from localStorage if previously set
  useEffect(() => {
    try {
      const saved = localStorage.getItem('itpl_calibrated_office_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setCalibratedCoords(parsed);
        }
      }
    } catch {
      // ignore parse error
    }
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

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
        msg = 'No camera device found on this system.';
      }
      setCameraError(msg);
    }
  }, [stream]);

  // Capture Photo with exact aspect ratio
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Maintain 4:3 standard selfie framing
    canvas.width = 480;
    canvas.height = Math.round((vHeight / vWidth) * 480);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw image flipped horizontally for selfie mirror effect
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);

      // Stop camera preview while photo is frozen
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
  };

  // Retake Photo
  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Geolocation Fetching
  const fetchLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);
    setIsSimulated(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Check if office coords were calibrated
        let savedOffice: { latitude: number; longitude: number } | undefined = undefined;
        try {
          const saved = localStorage.getItem('itpl_calibrated_office_coords');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
              savedOffice = parsed;
              setCalibratedCoords(parsed);
            }
          }
        } catch {}

        const evaluation = evaluateGeofence(latitude, longitude, savedOffice);
        setGeoResult(evaluation);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Failed to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Please grant GPS/Location permission.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS location is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Calibrate Office Coordinates to Current Device Position
  const handleCalibrateOfficeToCurrentLocation = () => {
    if (!geoResult) return;
    const newCoords = {
      latitude: geoResult.userLat,
      longitude: geoResult.userLng,
    };
    setCalibratedCoords(newCoords);
    localStorage.setItem('itpl_calibrated_office_coords', JSON.stringify(newCoords));
    setIsCalibratedNotice(true);
    setTimeout(() => setIsCalibratedNotice(false), 4000);

    const reEvaluated = evaluateGeofence(geoResult.userLat, geoResult.userLng, newCoords);
    setGeoResult(reEvaluated);
  };

  // Reset Calibrated Coordinates to Default
  const handleResetCalibration = () => {
    setCalibratedCoords(null);
    localStorage.removeItem('itpl_calibrated_office_coords');
    if (geoResult) {
      const reEvaluated = evaluateGeofence(geoResult.userLat, geoResult.userLng);
      setGeoResult(reEvaluated);
    }
  };

  // Development / Admin Testing Simulation Toggle
  const handleSimulateOfficeLocation = () => {
    setIsSimulated(true);
    setLocationError(null);
    const targetLat = calibratedCoords?.latitude || ITPL_OFFICE_LOCATION.latitude;
    const targetLng = calibratedCoords?.longitude || ITPL_OFFICE_LOCATION.longitude;
    const simulatedLat = targetLat + 0.0001;
    const simulatedLng = targetLng + 0.0001;
    const evaluation = evaluateGeofence(simulatedLat, simulatedLng, calibratedCoords || undefined);
    setGeoResult(evaluation);
  };

  // Lifecycle on modal open / close
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCameraError(null);
      startCamera();
      fetchLocation();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

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
      calibratedOffice: calibratedCoords || undefined,
    };

    await onVerified({
      photo: capturedPhoto,
      location: locationPayload,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isPunchIn ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{actionTitle} Verification</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200/80 text-slate-700">
                  REQUIRED
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live selfie & office perimeter verification (≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Live Selfie Capture with Perfectly Aligned Camera Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5 text-[#635BFF]" />
                1. Live Selfie Capture
              </label>
              {capturedPhoto ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Photo Captured
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Selfie Required
                </span>
              )}
            </div>

            {/* Centered, Well-Proportioned 4:3 Camera Viewfinder */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-200 shadow-lg flex items-center justify-center">
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhoto}
                      alt="Captured Live Attendance"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow backdrop-blur-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Live Selfie Verified
                    </div>
                  </div>
                ) : cameraError ? (
                  <div className="p-4 text-center space-y-3 max-w-xs">
                    <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-200 font-medium leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Try Again
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

                    {/* Biometric Oval Face Alignment Guide */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-36 h-48 rounded-[48%] border-2 border-dashed border-white/60 shadow-xs flex items-center justify-center">
                        <div className="w-3 h-3 border-t-2 border-l-2 border-white/90 absolute top-5 left-8" />
                        <div className="w-3 h-3 border-t-2 border-r-2 border-white/90 absolute top-5 right-8" />
                        <div className="w-3 h-3 border-b-2 border-l-2 border-white/90 absolute bottom-5 left-8" />
                        <div className="w-3 h-3 border-b-2 border-r-2 border-white/90 absolute bottom-5 right-8" />
                      </div>
                      <span className="text-[10px] text-white/90 font-medium bg-slate-950/60 px-2.5 py-0.5 rounded-full mt-2 backdrop-blur-xs">
                        Center face in frame
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dedicated Camera Action Bar (Outside & Below Video to Avoid Covering Face) */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {capturedPhoto ? (
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    Retake Selfie
                  </button>
                ) : !cameraError ? (
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#635BFF] to-[#7B73FF] hover:from-[#5249ea] hover:to-[#685ff8] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Take Live Selfie
                  </button>
                ) : null}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Section 2: Office Geofence Verification */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                2. Office Geofence Verification (≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m Perimeter)
              </label>
              <button
                type="button"
                onClick={fetchLocation}
                disabled={locationLoading || isLoading}
                className="text-[11px] font-bold text-[#635BFF] hover:text-[#5249ea] inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Refresh current GPS coordinates"
              >
                <RefreshCw
                  className={`w-3 h-3 ${locationLoading ? 'animate-spin' : ''}`}
                />
                Refresh GPS
              </button>
            </div>

            {/* Office Target Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#0D9488]" />
                  {ITPL_OFFICE_LOCATION.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Perimeter: ≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {ITPL_OFFICE_LOCATION.address}
              </p>
              {calibratedCoords && (
                <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Office Pin Calibrated to your desk position
                  </span>
                  <button
                    type="button"
                    onClick={handleResetCalibration}
                    className="text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Calibration Notice Banner */}
            {isCalibratedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Office GPS pin successfully calibrated to your current position!</span>
              </div>
            )}

            {/* Live Location Status Indicator */}
            {locationLoading ? (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-center gap-2.5 text-xs text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-[#635BFF]" />
                <span>Acquiring high-precision GPS coordinates...</span>
              </div>
            ) : locationError ? (
              <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/80 text-xs text-rose-700 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Location Permission Error</p>
                    <p className="text-[11px]">{locationError}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200/60">
                  <button
                    type="button"
                    onClick={handleSimulateOfficeLocation}
                    className="text-[10px] font-semibold text-rose-800 underline hover:text-rose-950 cursor-pointer"
                  >
                    Simulate Office GPS (Testing)
                  </button>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Retry GPS
                  </button>
                </div>
              </div>
            ) : geoResult ? (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWithinPerimeter
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : 'border-rose-200 bg-rose-50/80 text-rose-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isWithinPerimeter ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs">
                        {isWithinPerimeter
                          ? 'Passable: Within Office Perimeter'
                          : 'Blocked: Outside Office Perimeter'}
                      </h4>
                      <p className="text-[11px] mt-0.5 font-medium">
                        Distance from Pearl Enclave:{' '}
                        <strong className="font-mono text-xs">
                          {geoResult.distanceMeters}m
                        </strong>{' '}
                        (Allowed: ≤ {geoResult.allowedRadiusMeters}m)
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Detected: {geoResult.userLat.toFixed(5)}, {geoResult.userLng.toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex-shrink-0 ${
                      isWithinPerimeter
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {isWithinPerimeter ? 'PERMITTED' : 'OUTSIDE'}
                  </span>
                </div>

                {/* Office Calibration Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    Are you at your office desk?
                  </span>
                  <button
                    type="button"
                    onClick={handleCalibrateOfficeToCurrentLocation}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-indigo-400 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer text-[10px]"
                    title="Calibrate the office center coordinates to your exact current position"
                  >
                    <Crosshair className="w-3 h-3 text-indigo-600" />
                    <span>Calibrate Office GPS Pin Here</span>
                  </button>
                </div>

                {isSimulated && (
                  <p className="text-[10px] text-amber-700 italic mt-1 font-mono">
                    * Simulation active for local testing
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Summary Checklist */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                capturedPhoto ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  capturedPhoto ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              Live Selfie
            </span>
            <span>•</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                isWithinPerimeter ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  isWithinPerimeter ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              Location (≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
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
