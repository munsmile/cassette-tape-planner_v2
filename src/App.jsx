import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Upload, Music, X, Play, Pause, Square, Volume2, SkipBack, SkipForward, Sparkles, Image as ImageIcon } from "lucide-react";

const DEFAULT_TAPE_MINUTES = 90;
const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".flac", ".wav", ".aiff", ".aif", ".m4a", ".alac"];

function secondsToTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function fileNameToTitle(fileName) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function isSupportedAudioFile(file) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("audio/") || SUPPORTED_AUDIO_EXTENSIONS.some((extension) => name.endsWith(extension));
}

async function decodeAudioFile(audioContext, file) {
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer.slice(0));
}

async function audioFilesToTracks(files, audioContext) {
  const audioFiles = Array.from(files).filter(isSupportedAudioFile);
  const tracks = [];

  for (const file of audioFiles) {
    try {
      const audioBuffer = await decodeAudioFile(audioContext, file);
      tracks.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        title: fileNameToTitle(file.name),
        seconds: Math.round(audioBuffer.duration),
        fileName: file.name,
        type: file.type || "audio file",
        file,
        audioBuffer,
      });
    } catch (error) {
      tracks.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        title: fileNameToTitle(file.name),
        seconds: 0,
        fileName: file.name,
        type: file.type || "audio file",
        file,
        audioBuffer: null,
        decodeError: true,
      });
    }
  }

  return tracks;
}

function TrackRow({ track, index, isCurrent, onChangeTitle, onChangeSeconds, onRemove }) {
  const minutes = Math.floor(track.seconds / 60);
  const seconds = track.seconds % 60;

  return (
    <div className={`grid grid-cols-[32px_1fr_82px_82px_36px] items-center gap-2 rounded-xl border p-2 shadow-sm ${isCurrent ? "border-neutral-900 bg-neutral-100" : "bg-white"}`}>
      <div className="text-center text-sm font-semibold text-neutral-400">{index + 1}</div>
      <input
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
        value={track.title}
        onChange={(event) => onChangeTitle(track.id, event.target.value)}
        placeholder="제목"
      />
      <input
        className="rounded-lg border px-2 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-neutral-300"
        type="number"
        min="0"
        value={minutes}
        onChange={(event) => {
          const nextMinutes = Math.max(0, Number(event.target.value) || 0);
          onChangeSeconds(track.id, nextMinutes * 60 + seconds);
        }}
      />
      <input
        className="rounded-lg border px-2 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-neutral-300"
        type="number"
        min="0"
        max="59"
        value={seconds}
        onChange={(event) => {
          const nextSeconds = Math.min(59, Math.max(0, Number(event.target.value) || 0));
          onChangeSeconds(track.id, minutes * 60 + nextSeconds);
        }}
      />
      <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-neutral-100" onClick={() => onRemove(track.id)}>
        <X size={16} />
      </button>
      {track.decodeError && (
        <div className="col-span-5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          이 파일은 현재 브라우저에서 디코딩할 수 없습니다. FLAC은 Chrome/Edge에서 테스트해보세요.
        </div>
      )}
    </div>
  );
}

function PlaylistControls({ label, disabled, isPlaying, isPaused, progress, onPlay, onPrevious, onNext, onPause, onStop }) {
  const progressPercent = progress.duration > 0 ? Math.min(100, Math.max(0, (progress.currentTime / progress.duration) * 100)) : 0;

  return (
    <div className="mt-4 rounded-2xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-bold">{label}면 전체 재생</div>
        <div className="text-xs font-semibold text-neutral-500">
          {secondsToTime(progress.currentTime)} / {secondsToTime(progress.duration)}
        </div>
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="grid grid-cols-5 gap-2">
        <button className="flex items-center justify-center gap-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300" onClick={onPlay} disabled={disabled}>
          <Play size={15} /> 재생
        </button>
        <button className="flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={onPrevious} disabled={disabled}>
          <SkipBack size={15} /> 이전
        </button>
        <button className="flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={onNext} disabled={disabled}>
          <SkipForward size={15} /> 다음
        </button>
        <button className="flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={onPause} disabled={disabled || (!isPlaying && !isPaused)}>
          <Pause size={15} /> 일시정지
        </button>
        <button className="flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40" onClick={onStop} disabled={disabled || (!isPlaying && !isPaused)}>
          <Square size={14} /> 멈춤
        </button>
      </div>
    </div>
  );
}

function TapeSide({ label, tracks, maxSeconds, activeSide, currentTrackId, isPlaying, isPaused, progress, silenceSeconds, onDropTracks, onAddManual, onPlaySide, onPrevious, onNext, onPause, onStop, onChangeTitle, onChangeSeconds, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const musicSeconds = tracks.reduce((sum, track) => sum + track.seconds, 0);
  const silenceGapCount = Math.max(0, tracks.length - 1);
  const silenceTotalSeconds = silenceGapCount * Math.max(0, Number(silenceSeconds) || 0);
  const usedSeconds = musicSeconds + silenceTotalSeconds;
  const remainingSeconds = maxSeconds - usedSeconds;
  const isOver = remainingSeconds < 0;
  const isThisSideActive = activeSide === label;
  const playableTracks = tracks.filter((track) => track.audioBuffer);
  const sideProgress = isThisSideActive ? progress : { currentTime: 0, duration: 0 };

  async function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const droppedTracks = await onDropTracks(event.dataTransfer.files);
    return droppedTracks;
  }

  return (
    <section
      className={`rounded-3xl border p-4 shadow-sm transition ${dragOver ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 bg-neutral-50"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">{label}</div>
          <h2 className="text-xl font-bold">{label}면</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{secondsToTime(usedSeconds)}</div>
          <div className={`text-sm ${isOver ? "font-semibold text-red-600" : "text-neutral-500"}`}>
            사용 남은 시간: {isOver ? `-${secondsToTime(Math.abs(remainingSeconds))}` : secondsToTime(remainingSeconds)}
          </div>
          {silenceTotalSeconds > 0 && (
            <div className="text-xs text-neutral-400">무음부 포함: +{secondsToTime(silenceTotalSeconds)} ({silenceGapCount}구간)</div>
          )}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-[32px_1fr_82px_82px_36px] gap-2 px-2 text-xs font-semibold text-neutral-500">
        <div />
        <div>제목</div>
        <div className="text-right">분</div>
        <div className="text-right">초</div>
        <div />
      </div>

      <div className="space-y-2">
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            isCurrent={isThisSideActive && currentTrackId === track.id}
            onChangeTitle={onChangeTitle}
            onChangeSeconds={onChangeSeconds}
            onRemove={onRemove}
          />
        ))}
      </div>

      <PlaylistControls
        label={label}
        disabled={playableTracks.length === 0}
        isPlaying={isThisSideActive && isPlaying}
        isPaused={isThisSideActive && isPaused}
        progress={sideProgress}
        onPlay={() => onPlaySide(label)}
        onPrevious={() => onPrevious(label)}
        onNext={() => onNext(label)}
        onPause={onPause}
        onStop={onStop}
      />

      <div className={`mt-4 rounded-2xl border-2 border-dashed p-5 text-center ${dragOver ? "border-neutral-900 bg-white" : "border-neutral-300 bg-white/70"}`}>
        <Upload className="mx-auto mb-2" size={24} />
        <p className="text-sm font-semibold">MP3, FLAC, WAV, AIFF, M4A 파일을 이 {label}면 박스에 드래그 앤 드롭</p>
        <p className="mt-1 text-xs text-neutral-500">Web Audio API로 디코딩 후 재생합니다. 긴 무손실 파일은 로딩 시간이 걸릴 수 있습니다.</p>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-700" onClick={onAddManual}>
        <Plus size={16} /> 곡 추가
      </button>
    </section>
  );
}

export default function CassetteTapePlanner() {
  const [tapeMinutes, setTapeMinutes] = useState(DEFAULT_TAPE_MINUTES);
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState("default");
  const [activeSide, setActiveSide] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nowPlayingTitle, setNowPlayingTitle] = useState("");
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [audioError, setAudioError] = useState("");
  const [silenceSeconds, setSilenceSeconds] = useState(0);
  const [isWaitingSilence, setIsWaitingSilence] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [jacketDesign, setJacketDesign] = useState(null);

  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);
  const activeSideRef = useRef(null);
  const currentTrackIndexRef = useRef(-1);
  const sideARef = useRef([]);
  const sideBRef = useRef([]);
  const selectedOutputDeviceIdRef = useRef("default");
  const silenceSecondsRef = useRef(0);
  const silenceTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const playbackStartContextTimeRef = useRef(0);
  const pausedOffsetRef = useRef(0);
  const currentDurationRef = useRef(0);
  const manualStopRef = useRef(false);

  const sideSeconds = useMemo(() => Math.round((Number(tapeMinutes) || 0) * 60 / 2), [tapeMinutes]);
  const supportsAudioContextOutputSelection = typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;

  const currentTracks = activeSide === "A" ? sideA : activeSide === "B" ? sideB : [];
  const currentPlayableTracks = currentTracks.filter((track) => track.audioBuffer);
  const currentTrack = currentTrackIndex >= 0 ? currentPlayableTracks[currentTrackIndex] : null;

  useEffect(() => {
    activeSideRef.current = activeSide;
  }, [activeSide]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  useEffect(() => {
    sideARef.current = sideA;
  }, [sideA]);

  useEffect(() => {
    sideBRef.current = sideB;
  }, [sideB]);

  useEffect(() => {
    selectedOutputDeviceIdRef.current = selectedOutputDeviceId;
  }, [selectedOutputDeviceId]);

  useEffect(() => {
    silenceSecondsRef.current = silenceSeconds;
  }, [silenceSeconds]);

  useEffect(() => {
    loadAudioDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", loadAudioDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", loadAudioDevices);
      stopPlayback();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  async function ensureAudioContext() {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    await applyOutputDevice(selectedOutputDeviceIdRef.current);
    return audioContextRef.current;
  }

  async function loadAudioDevices() {
    setAudioError("");
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setAudioDevices([]);
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((device) => device.kind === "audiooutput"));
    } catch {
      setAudioError("오디오 출력 장치 목록을 불러올 수 없습니다.");
    }
  }

  async function requestAudioDevicePermission() {
    setAudioError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await loadAudioDevices();
    } catch {
      setAudioError("장치 이름 표시를 위해 브라우저의 오디오 권한이 필요할 수 있습니다.");
    }
  }

  async function selectOutputDevice() {
    setAudioError("");

    try {
      if (!navigator.mediaDevices?.selectAudioOutput) {
        setAudioError("현재 브라우저는 출력 장치 직접 선택을 지원하지 않습니다. Windows에서는 Chrome 또는 Edge 최신 버전에서 테스트해주세요.");
        return;
      }

      const device = await navigator.mediaDevices.selectAudioOutput();

      if (device?.deviceId) {
        setSelectedOutputDeviceId(device.deviceId);
        selectedOutputDeviceIdRef.current = device.deviceId;
        await ensureAudioContext();
        await applyOutputDevice(device.deviceId);
        await loadAudioDevices();
      }
    } catch {
      setAudioError("출력 장치 선택이 취소되었거나 권한이 허용되지 않았습니다.");
    }
  }

  async function applyOutputDevice(deviceId = selectedOutputDeviceIdRef.current) {
    const audioContext = audioContextRef.current;
    if (!audioContext || !supportsAudioContextOutputSelection || !audioContext.setSinkId) return;
    try {
      await audioContext.setSinkId(deviceId || "default");
    } catch {
      setAudioError("선택한 출력 장치로 변경할 수 없습니다. Chrome/Edge, HTTPS 또는 localhost 환경을 확인해주세요.");
    }
  }

  function getPlayableTracks(side) {
    const tracks = side === "A" ? sideARef.current : sideBRef.current;
    return tracks.filter((track) => track.audioBuffer);
  }

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsWaitingSilence(false);
  }

  function stopCurrentSource() {
    if (sourceNodeRef.current) {
      manualStopRef.current = true;
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
  }

  function startProgressTimer() {
    if (progressTimerRef.current) cancelAnimationFrame(progressTimerRef.current);

    const tick = () => {
      const audioContext = audioContextRef.current;
      if (!audioContext || !isPlayingRef.current) return;

      const elapsed = audioContext.currentTime - playbackStartContextTimeRef.current;
      const currentTime = Math.min(currentDurationRef.current, pausedOffsetRef.current + elapsed);
      setProgress({ currentTime, duration: currentDurationRef.current });
      progressTimerRef.current = requestAnimationFrame(tick);
    };

    progressTimerRef.current = requestAnimationFrame(tick);
  }

  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  function stopProgressTimer() {
    if (progressTimerRef.current) {
      cancelAnimationFrame(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  async function playSpecificTrack(side, index, offset = 0) {
    const audioContext = await ensureAudioContext();
    const playableTracks = getPlayableTracks(side);
    const track = playableTracks[index];
    if (!track?.audioBuffer || !gainNodeRef.current) return;

    clearSilenceTimer();
    stopCurrentSource();
    manualStopRef.current = false;

    const source = audioContext.createBufferSource();
    source.buffer = track.audioBuffer;
    source.connect(gainNodeRef.current);
    source.onended = () => {
      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }
      playNextTrackAfterEnded();
    };

    const safeOffset = Math.min(Math.max(0, offset), track.audioBuffer.duration);
    source.start(0, safeOffset);

    sourceNodeRef.current = source;
    playbackStartContextTimeRef.current = audioContext.currentTime;
    pausedOffsetRef.current = safeOffset;
    currentDurationRef.current = track.audioBuffer.duration;

    setActiveSide(side);
    activeSideRef.current = side;
    setCurrentTrackIndex(index);
    currentTrackIndexRef.current = index;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    setProgress({ currentTime: safeOffset, duration: track.audioBuffer.duration });
    setNowPlayingTitle(`${side}면 - ${track.title || track.fileName || "Untitled"}`);
    setAudioError("");
    startProgressTimer();
  }

  async function playSide(side) {
    setJacketDesign(null);
    const playableTracks = getPlayableTracks(side);
    if (playableTracks.length === 0) return;

    if (activeSide === side && isPaused && currentTrackIndex >= 0) {
      await playSpecificTrack(side, currentTrackIndex, pausedOffsetRef.current);
      return;
    }

    const startIndex = activeSide === side && currentTrackIndex >= 0 ? currentTrackIndex : 0;
    await playSpecificTrack(side, Math.min(startIndex, playableTracks.length - 1), 0);
  }

  function playNextTrackAfterEnded() {
    stopProgressTimer();
    const side = activeSideRef.current;
    if (!side) return;

    const playableTracks = getPlayableTracks(side);
    const nextIndex = currentTrackIndexRef.current + 1;

    if (nextIndex >= playableTracks.length) {
      setJacketDesign(createCassetteJacket(side, playableTracks));
      stopPlayback();
      return;
    }

    const waitSeconds = Math.max(0, Number(silenceSecondsRef.current) || 0);
    if (waitSeconds > 0) {
      setIsWaitingSilence(true);
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      setNowPlayingTitle(`${side}면 - 다음 곡까지 ${waitSeconds}초 무음`);
      setProgress({ currentTime: 0, duration: 0 });

      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        setIsWaitingSilence(false);
        playSpecificTrack(side, nextIndex, 0);
      }, waitSeconds * 1000);
      return;
    }

    playSpecificTrack(side, nextIndex, 0);
  }

  function playNextTrack(sideOverride) {
    const side = sideOverride || activeSideRef.current;
    if (!side) return;
    const playableTracks = getPlayableTracks(side);
    const nextIndex = Math.min(currentTrackIndexRef.current + 1, playableTracks.length - 1);
    playSpecificTrack(side, nextIndex, 0);
  }

  function playPreviousTrack(sideOverride) {
    const side = sideOverride || activeSideRef.current;
    if (!side) return;
    const previousIndex = Math.max(0, currentTrackIndexRef.current - 1);
    playSpecificTrack(side, previousIndex, 0);
  }

  function pausePlayback() {
    if (!audioContextRef.current || !sourceNodeRef.current) return;
    const elapsed = audioContextRef.current.currentTime - playbackStartContextTimeRef.current;
    pausedOffsetRef.current = Math.min(currentDurationRef.current, pausedOffsetRef.current + elapsed);
    stopCurrentSource();
    stopProgressTimer();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(true);
    setProgress({ currentTime: pausedOffsetRef.current, duration: currentDurationRef.current });
  }

  function stopPlayback() {
    clearSilenceTimer();
    stopCurrentSource();
    stopProgressTimer();
    setActiveSide(null);
    activeSideRef.current = null;
    setCurrentTrackIndex(-1);
    currentTrackIndexRef.current = -1;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setIsWaitingSilence(false);
    setNowPlayingTitle("");
    setProgress({ currentTime: 0, duration: 0 });
    pausedOffsetRef.current = 0;
    currentDurationRef.current = 0;
  }

  function addManual(side) {
    const track = {
      id: crypto.randomUUID(),
      title: "",
      seconds: 0,
      fileName: "",
      type: "manual",
      file: null,
      audioBuffer: null,
    };
    if (side === "A") setSideA((prev) => [...prev, track]);
    else setSideB((prev) => [...prev, track]);
  }

  function updateTrack(side, id, updater) {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => prev.map((track) => (track.id === id ? { ...track, ...updater(track) } : track)));
  }

  function removeTrack(side, id) {
    const setter = side === "A" ? setSideA : setSideB;
    setter((prev) => {
      const playableTracks = getPlayableTracks(side);
      const targetPlayableIndex = playableTracks.findIndex((track) => track.id === id);
      if (activeSideRef.current === side && currentTrackIndexRef.current === targetPlayableIndex) stopPlayback();
      return prev.filter((track) => track.id !== id);
    });
  }

  async function handleFilesForSide(side, files) {
    setIsDecoding(true);
    setAudioError("");
    try {
      const audioContext = await ensureAudioContext();
      const tracks = await audioFilesToTracks(files, audioContext);
      if (tracks.length > 0) {
        if (side === "A") setSideA((prev) => [...prev, ...tracks]);
        else setSideB((prev) => [...prev, ...tracks]);
      }
      if (tracks.some((track) => track.decodeError)) {
        setAudioError("일부 파일은 현재 브라우저에서 디코딩할 수 없습니다. FLAC/ALAC는 브라우저별 지원 차이가 있습니다.");
      }
    } finally {
      setIsDecoding(false);
    }
  }

  async function handleFileInput(side, event) {
    await handleFilesForSide(side, event.target.files);
    event.target.value = "";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-100 to-white p-4 text-neutral-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-neutral-500"><Music size={16} /> TAPE</div>
              <h1 className="text-3xl font-black tracking-tight">카세트 테이프 플래너</h1>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-neutral-600">테이프 총 길이</label>
              <input className="w-24 rounded-xl border px-3 py-2 text-right text-lg font-bold outline-none focus:ring-2 focus:ring-neutral-300" type="number" min="1" value={tapeMinutes} onChange={(event) => setTapeMinutes(Math.max(1, Number(event.target.value) || 1))} />
              <span className="text-sm text-neutral-500">분 → 각 면: {secondsToTime(sideSeconds)}</span>
            </div>
          </div>
        </header>

        <section className="mb-4 rounded-3xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-700"><Volume2 size={16} /> 오디오 출력 장치</div>
              <div className="mt-1 text-xs text-neutral-500">Web Audio API 기반 재생입니다. DAC 선택은 Chrome/Edge의 HTTPS 또는 localhost 환경에서 주로 지원됩니다.</div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="min-w-72 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300 disabled:bg-neutral-100"
                value={selectedOutputDeviceId}
                onChange={async (event) => {
                  const nextDeviceId = event.target.value;
                  setSelectedOutputDeviceId(nextDeviceId);
                  selectedOutputDeviceIdRef.current = nextDeviceId;
                  await applyOutputDevice(nextDeviceId);
                }}
                disabled={!supportsAudioContextOutputSelection}
              >
                <option value="default">기본 출력 장치</option>
                {audioDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || `오디오 출력 장치 ${index + 1}`}</option>
                ))}
              </select>
              <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700" onClick={selectOutputDevice}>출력 장치 직접 선택</button>
              <button className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-100" onClick={requestAudioDevicePermission}>장치 목록 새로고침</button>
            </div>
          </div>

          {!supportsAudioContextOutputSelection && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">현재 브라우저는 Web Audio API의 출력 장치 직접 선택을 지원하지 않습니다. OS 사운드 설정에서 DAC를 기본 출력 장치로 선택해주세요.</p>
          )}

          <div className="mt-3 rounded-2xl border bg-neutral-50 p-3">
            <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700 sm:flex-row sm:items-center">
              <span>곡 사이 무음부</span>
              <input className="w-28 rounded-xl border bg-white px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-neutral-300" type="number" min="0" step="0.5" value={silenceSeconds} onChange={(event) => setSilenceSeconds(Math.max(0, Number(event.target.value) || 0))} />
              <span className="text-neutral-500">초</span>
            </label>
            <p className="mt-1 text-xs text-neutral-500">한 곡이 끝난 뒤 다음 곡을 재생하기 전에 설정한 시간만큼 기다립니다. 이 시간은 A면/B면 사용 시간에도 포함됩니다.</p>
          </div>

          {nowPlayingTitle && <p className="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold">{isWaitingSilence ? "무음 대기 중" : "현재 재생 중"}: {nowPlayingTitle}</p>}
          {isDecoding && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">음원을 Web Audio API로 디코딩하는 중입니다. 긴 무손실 파일은 시간이 걸릴 수 있습니다.</p>}
          {audioError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{audioError}</p>}
          <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">Web Audio API는 브라우저에서 가능한 고품질 재생 제어 방식이지만, Exclusive Mode / bit-perfect를 보장하지는 않습니다. FLAC/ALAC 지원은 브라우저 코덱 지원에 따라 달라집니다.</p>
        </section>

        <div className="mb-4 flex flex-wrap gap-2">
          <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm" onClick={() => fileInputARef.current?.click()}>A면 파일 선택</button>
          <button className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm" onClick={() => fileInputBRef.current?.click()}>B면 파일 선택</button>
          <input ref={fileInputARef} className="hidden" type="file" multiple accept="audio/*,.mp3,.flac,.wav,.aiff,.aif,.m4a,.alac" onChange={(event) => handleFileInput("A", event)} />
          <input ref={fileInputBRef} className="hidden" type="file" multiple accept="audio/*,.mp3,.flac,.wav,.aiff,.aif,.m4a,.alac" onChange={(event) => handleFileInput("B", event)} />
        </div>

        <JacketPreview design={jacketDesign} onClose={() => setJacketDesign(null)} />

        <div className="grid gap-4 lg:grid-cols-2">
          <TapeSide
            label="A"
            tracks={sideA}
            maxSeconds={sideSeconds}
            activeSide={activeSide}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            isPaused={isPaused}
            progress={progress}
            silenceSeconds={silenceSeconds}
            onDropTracks={(files) => handleFilesForSide("A", files)}
            onAddManual={() => addManual("A")}
            onPlaySide={playSide}
            onPrevious={playPreviousTrack}
            onNext={playNextTrack}
            onPause={pausePlayback}
            onStop={stopPlayback}
            onChangeTitle={(id, title) => updateTrack("A", id, () => ({ title }))}
            onChangeSeconds={(id, seconds) => updateTrack("A", id, () => ({ seconds }))}
            onRemove={(id) => removeTrack("A", id)}
          />
          <TapeSide
            label="B"
            tracks={sideB}
            maxSeconds={sideSeconds}
            activeSide={activeSide}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            isPaused={isPaused}
            progress={progress}
            silenceSeconds={silenceSeconds}
            onDropTracks={(files) => handleFilesForSide("B", files)}
            onAddManual={() => addManual("B")}
            onPlaySide={playSide}
            onPrevious={playPreviousTrack}
            onNext={playNextTrack}
            onPause={pausePlayback}
            onStop={stopPlayback}
            onChangeTitle={(id, title) => updateTrack("B", id, () => ({ title }))}
            onChangeSeconds={(id, seconds) => updateTrack("B", id, () => ({ seconds }))}
            onRemove={(id) => removeTrack("B", id)}
          />
        </div>
      </div>
    </main>
  );
}
