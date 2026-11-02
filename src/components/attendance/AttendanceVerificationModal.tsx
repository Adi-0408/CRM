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
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Geolocation states
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geoResult, setGeoResult] = useState<GeofenceResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Keyboard shortcut: Escape to close / go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
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
  }, [stream]);

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
        const evaluation = evaluateGeofence(latitude, longitude);
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

  // Development / Admin Testing Simulation Toggle
  const handleSimulateOfficeLocation = () => {
    setIsSimulated(true);
    setLocationError(null);
    const simulatedLat = ITPL_OFFICE_LOCATION.latitude + 0.0001;
    const simulatedLng = ITPL_OFFICE_LOCATION.longitude + 0.0001;
    const evaluation = evaluateGeofence(simulatedLat, simulatedLng);
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
    };

    await onVerified({
      photo: capturedPhoto,
      location: locationPayload,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Sticky Header with Back Button and Close Button */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Primary Back Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow active:scale-95"
              title="Go Back / Cancel Verification"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Back</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm ${
                  isPunchIn ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{actionTitle} Verification</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-slate-200 text-slate-700">
                    REQUIRED
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Live selfie & office perimeter verification (≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Column 1: Live Selfie Capture */}
            <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Camera className="w-3.5 h-3.5 text-[#635BFF]" />
                  1. Live Selfie
                </label>
                {capturedPhoto ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Captured
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Snap Required
                  </span>
                )}
              </div>

              {/* Viewfinder Frame */}
              <div className="relative w-full aspect-[4/3] max-w-[260px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-200 shadow-md flex items-center justify-center">
                {capturedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedPhoto}
                      alt="Captured Live Attendance"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow backdrop-blur-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </div>
                  </div>
                ) : isCameraLoading ? (
                  <div className="p-4 text-center space-y-2 text-white">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#635BFF]" />
                    <p className="text-[11px] text-slate-300 font-medium">Starting camera...</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-3 text-center space-y-2">
                    <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                    <p className="text-[10px] text-rose-200 leading-tight">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
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
                      <div className="w-28 h-36 rounded-[48%] border-2 border-dashed border-white/60 shadow-xs flex items-center justify-center" />
                      <span className="text-[9px] text-white/90 font-medium bg-slate-950/60 px-2 py-0.5 rounded-full mt-1.5 backdrop-blur-xs">
                        Center face
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Below Viewfinder */}
              <div className="w-full flex flex-col items-center gap-2 pt-1">
                {capturedPhoto ? (
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    disabled={isLoading}
                    className="w-full max-w-[260px] py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    Retake Selfie
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={isCameraLoading || Boolean(cameraError)}
                    className="w-full max-w-[260px] py-2 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7B73FF] hover:from-[#5249ea] hover:to-[#685ff8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    Take Live Selfie
                  </button>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Column 2: Office Geofence Verification */}
            <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                    2. Office Geofence (≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m)
                  </label>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={locationLoading || isLoading}
                    className="text-[10px] font-bold text-[#635BFF] hover:text-[#5249ea] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Refresh current GPS coordinates"
                  >
                    <RefreshCw className={`w-3 h-3 ${locationLoading ? 'animate-spin' : ''}`} />
                    Refresh GPS
                  </button>
                </div>

                {/* Office Target Card */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-[#0D9488]" />
                      ITPL Sangli Office
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      ≤ {ITPL_OFFICE_LOCATION.allowedRadiusMeters}m Zone
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Pearl Enclave, MSEB Rd, near Walchand college, Vishrambag, Sangli
                  </p>
                </div>

                {/* Live Location Status Indicator */}
                {locationLoading ? (
                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-center gap-2 text-xs text-slate-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#635BFF]" />
                    <span>Fetching high-precision GPS...</span>
                  </div>
                ) : locationError ? (
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/80 text-xs text-rose-700 space-y-2">
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-[11px]">Location Permission Error</p>
                        <p className="text-[10px]">{locationError}</p>
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
                        className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                      >
                        Retry GPS
                      </button>
                    </div>
                  </div>
                ) : geoResult ? (
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isWithinPerimeter
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                        : 'border-rose-200 bg-rose-50/80 text-rose-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {isWithinPerimeter ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs">
                            {isWithinPerimeter ? 'Within Office Perimeter' : 'Outside Office Perimeter'}
                          </h4>
                          <p className="text-[11px] mt-0.5 font-medium">
                            Distance:{' '}
                            <strong className="font-mono">{geoResult.distanceMeters}m</strong>{' '}
                            (Allowed: ≤ {geoResult.allowedRadiusMeters}m)
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                            GPS: {geoResult.userLat.toFixed(5)}, {geoResult.userLng.toFixed(5)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                          isWithinPerimeter
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                        }`}
                      >
                        {isWithinPerimeter ? 'PERMITTED' : 'OUTSIDE'}
                      </span>
                    </div>

                    {isSimulated && (
                      <p className="text-[9px] text-amber-700 italic mt-1 font-mono">
                        * Simulation active for local testing
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions with Checklist and Back / Confirm Buttons */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20 shrink-0">
          {/* Checklist */}
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
              Selfie
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

          {/* Action Buttons: Go Back + Confirm */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                isPunchIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
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
