import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw, Sparkles, Brain, Palette, Users, Wrench, Search, ClipboardList } from "lucide-react";

const hollandTypes = {
  R: { label: "Realistic", ko: "만들기·움직임형", icon: Wrench, emoji: "🛠️", desc: "손으로 만들고, 움직이고, 실제 물건을 다루는 활동을 좋아해요." },
  I: { label: "Investigative", ko: "탐구·분석형", icon: Search, emoji: "🔎", desc: "왜 그런지 궁금해하고, 관찰·실험·문제 해결을 좋아해요." },
  A: { label: "Artistic", ko: "상상·표현형", icon: Palette, emoji: "🎨", desc: "그림, 음악, 이야기, 꾸미기처럼 자유롭게 표현하는 활동을 좋아해요." },
  S: { label: "Social", ko: "친구·도움형", icon: Users, emoji: "🤝", desc: "친구와 함께하고, 설명하거나 도와주는 활동을 좋아해요." },
  E: { label: "Enterprising", ko: "발표·리더형", icon: Sparkles, emoji: "🎤", desc: "앞에서 말하고, 이끌고, 선택을 주도하는 활동을 좋아해요." },
  C: { label: "Conventional", ko: "정리·규칙형", icon: ClipboardList, emoji: "📋", desc: "순서, 규칙, 정리, 체크리스트가 있는 활동을 편하게 느껴요." },
};

const activityItems = [
  { id: 1, type: "R", title: "로봇 조립", emoji: "🤖", sound: "로봇을 직접 조립해 볼래?" },
  { id: 2, type: "I", title: "곤충 관찰", emoji: "🐞", sound: "작은 곤충을 자세히 관찰해 볼래?" },
  { id: 3, type: "A", title: "상상 그림", emoji: "🌈", sound: "네 마음속 세상을 그림으로 표현해 볼래?" },
  { id: 4, type: "S", title: "친구 도와주기", emoji: "🧒", sound: "친구가 어려워하면 도와줄래?" },
  { id: 5, type: "E", title: "무대 발표", emoji: "🎤", sound: "사람들 앞에서 발표해 볼래?" },
  { id: 6, type: "C", title: "스티커 정리", emoji: "🗂️", sound: "스티커를 규칙대로 정리해 볼래?" },
  { id: 7, type: "R", title: "블록 건축", emoji: "🏗️", sound: "블록으로 멋진 건물을 만들어 볼래?" },
  { id: 8, type: "I", title: "과학 실험", emoji: "🧪", sound: "색이 변하는 실험을 해 볼래?" },
  { id: 9, type: "A", title: "음악 만들기", emoji: "🎹", sound: "나만의 음악을 만들어 볼래?" },
  { id: 10, type: "S", title: "팀 놀이", emoji: "⚽", sound: "친구들과 한 팀이 되어 놀아 볼래?" },
  { id: 11, type: "E", title: "가게 놀이", emoji: "🏪", sound: "가게 주인이 되어 손님을 맞아 볼래?" },
  { id: 12, type: "C", title: "퍼즐 순서", emoji: "🧩", sound: "퍼즐을 순서대로 맞춰 볼래?" },
];

const htksItems = [
  { command: "머리", correct: "발", icon: "🧠", audio: "머리를 만지라고 하면, 발을 눌러요." },
  { command: "발", correct: "머리", icon: "🦶", audio: "발을 만지라고 하면, 머리를 눌러요." },
  { command: "무릎", correct: "어깨", icon: "🦵", audio: "무릎을 만지라고 하면, 어깨를 눌러요." },
  { command: "어깨", correct: "무릎", icon: "💪", audio: "어깨를 만지라고 하면, 무릎을 눌러요." },
  { command: "머리", correct: "발", icon: "🧠", audio: "이번에도 반대로 해요. 머리라고 하면 발!" },
  { command: "어깨", correct: "무릎", icon: "💪", audio: "어깨라고 하면 무릎을 눌러요." },
];

const bodyOptions = [
  { label: "머리", emoji: "🧠" },
  { label: "발", emoji: "🦶" },
  { label: "무릎", emoji: "🦵" },
  { label: "어깨", emoji: "💪" },
];

function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.88;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

function scoreLevel(score, max) {
  const ratio = max === 0 ? 0 : score / max;
  if (ratio >= 0.75) return { label: "안정적", desc: "규칙을 기억하고 반대로 행동하는 힘이 비교적 안정적이에요." };
  if (ratio >= 0.45) return { label: "보통", desc: "규칙을 이해하지만, 중간중간 짧은 안내와 확인이 도움이 돼요." };
  return { label: "지원 필요", desc: "짧은 과제, 그림 안내, 반복 연습이 도움이 될 수 있어요." };
}

export default function ChildTraitAnalysisPage() {
  const [step, setStep] = useState("intro");
  const [selected, setSelected] = useState([]);
  const [htksIndex, setHtksIndex] = useState(0);
  const [htksAnswers, setHtksAnswers] = useState([]);

  const hollandScores = useMemo(() => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    selected.forEach((id) => {
      const item = activityItems.find((x) => x.id === id);
      if (item) scores[item.type] += 1;
    });
    return scores;
  }, [selected]);

  const topTypes = useMemo(() => {
    return Object.entries(hollandScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => v > 0)
      .slice(0, 3)
      .map(([key]) => key);
  }, [hollandScores]);

  const htksScore = htksAnswers.reduce((sum, item) => sum + item.score, 0);
  const htksMax = htksItems.length * 2;
  const htksLevel = scoreLevel(htksScore, htksMax);

  const toggleActivity = (item) => {
    speak(item.sound);
    setSelected((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (prev.length >= 6) return prev;
      return [...prev, item.id];
    });
  };

  const answerHtks = (label) => {
    const item = htksItems[htksIndex];
    const score = label === item.correct ? 2 : 0;
    const answer = { command: item.command, correct: item.correct, selected: label, score };
    const next = [...htksAnswers, answer];
    setHtksAnswers(next);
    if (htksIndex + 1 >= htksItems.length) setStep("result");
    else setHtksIndex(htksIndex + 1);
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setStep("intro");
    setSelected([]);
    setHtksIndex(0);
    setHtksAnswers([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">HTKS × Holland Code</p>
            <h1 className="text-2xl font-bold tracking-tight md:text-4xl">자녀 성향 분석 놀이터</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              아이가 글을 많이 읽지 않아도 그림, 소리, 터치로 흥미와 자기조절 반응을 확인하는 웹 프로토타입입니다.
            </p>
          </div>
          <Button variant="outline" onClick={reset} className="rounded-2xl">
            <RotateCcw className="mr-2 h-4 w-4" /> 처음부터
          </Button>
        </header>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.section key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="overflow-hidden rounded-3xl border-0 shadow-lg">
                <CardContent className="grid gap-6 p-6 md:grid-cols-2 md:p-10">
                  <div className="flex flex-col justify-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">🌟</div>
                    <h2 className="text-3xl font-bold">아이 혼자서도 할 수 있는 성향 체크</h2>
                    <p className="mt-4 text-slate-600">
                      먼저 좋아하는 활동 그림을 고르고, 다음에는 “반대로 누르기” 게임을 진행합니다. 결과는 진단이 아니라 추천 참고용입니다.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button onClick={() => setStep("holland")} className="rounded-2xl px-6 py-6 text-base">
                        시작하기
                      </Button>
                      <Button variant="secondary" onClick={() => speak("안녕! 지금부터 그림을 보고 좋아하는 활동을 골라 볼 거야.")} className="rounded-2xl px-6 py-6 text-base">
                        <Volume2 className="mr-2 h-5 w-5" /> 소리 안내 듣기
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {["🎨", "🤖", "🔎", "🤝"].map((emoji, index) => (
                      <motion.div key={emoji} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: index * 0.08 }} className="flex aspect-square items-center justify-center rounded-3xl bg-slate-50 text-7xl shadow-inner">
                        {emoji}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {step === "holland" && (
            <motion.section key="holland" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">좋아하는 그림을 골라요</h2>
                  <p className="text-slate-600">최대 6개까지 선택할 수 있어요. 그림을 누르면 소리 안내가 나옵니다.</p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-sm">선택 {selected.length}/6</div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {activityItems.map((item) => {
                  const isOn = selected.includes(item.id);
                  return (
                    <button key={item.id} onClick={() => toggleActivity(item)} className={`rounded-3xl border-2 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${isOn ? "border-slate-900" : "border-transparent"}`}>
                      <div className="flex aspect-square items-center justify-center rounded-3xl bg-slate-50 text-6xl">{item.emoji}</div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="text-xs text-slate-500">{hollandTypes[item.type].ko}</p>
                        </div>
                        <Volume2 className="h-4 w-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button disabled={selected.length < 3} onClick={() => { speak("이제 반대로 누르기 게임을 시작할게요."); setStep("htks"); }} className="rounded-2xl px-6 py-6 text-base">
                  다음 게임으로
                </Button>
              </div>
            </motion.section>
          )}

          {step === "htks" && (
            <motion.section key="htks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="rounded-3xl border-0 shadow-lg">
                <CardContent className="p-6 md:p-10">
                  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">반대로 누르기 게임</h2>
                      <p className="text-slate-600">말한 곳을 그대로 누르지 말고, 짝이 되는 반대 버튼을 눌러요.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">{htksIndex + 1}/{htksItems.length}</div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-6xl shadow-inner">{htksItems[htksIndex].icon}</div>
                    <p className="text-sm font-medium text-slate-500">지시</p>
                    <h3 className="mt-1 text-4xl font-black">“{htksItems[htksIndex].command}”</h3>
                    <Button variant="secondary" onClick={() => speak(htksItems[htksIndex].audio)} className="mt-4 rounded-2xl">
                      <Volume2 className="mr-2 h-5 w-5" /> 안내 듣기
                    </Button>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {bodyOptions.map((option) => (
                      <button key={option.label} onClick={() => answerHtks(option.label)} className="rounded-3xl bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <div className="text-6xl">{option.emoji}</div>
                        <p className="mt-3 text-xl font-bold">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {step === "result" && (
            <motion.section key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"><Brain className="h-7 w-7" /></div>
                  <div>
                    <h2 className="text-2xl font-bold">분석 결과</h2>
                    <p className="text-slate-600">진단이 아닌, 활동 추천을 위한 참고 결과입니다.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <Card className="rounded-3xl border-0 shadow-md lg:col-span-2">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold">흥미 성향 Top 3</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {(topTypes.length ? topTypes : ["A", "I", "S"]).map((type) => {
                        const info = hollandTypes[type];
                        const Icon = info.icon;
                        return (
                          <div key={type} className="rounded-3xl bg-slate-50 p-5">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-5xl">{info.emoji}</span>
                              <Icon className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">{info.label}</p>
                            <h4 className="text-lg font-bold">{info.ko}</h4>
                            <p className="mt-2 text-sm text-slate-600">{info.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold">자기조절 게임 점수</h3>
                    <div className="my-5 text-center">
                      <p className="text-5xl font-black">{htksScore}<span className="text-xl text-slate-400">/{htksMax}</span></p>
                      <p className="mt-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">{htksLevel.label}</p>
                    </div>
                    <p className="text-sm text-slate-600">{htksLevel.desc}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-5 rounded-3xl border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold">추천 학습 방식</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <h4 className="font-bold">활동 추천</h4>
                      <p className="mt-2 text-sm text-slate-600">상위 흥미 유형과 연결된 만들기, 탐구, 표현, 협동 활동을 짧은 프로젝트 형태로 제공하세요.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <h4 className="font-bold">공간 추천</h4>
                      <p className="mt-2 text-sm text-slate-600">시각 자료가 잘 보이는 벽면, 선택 가능한 활동 바구니, 완료 체크 보드를 함께 두면 좋아요.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <h4 className="font-bold">진행 팁</h4>
                      <p className="mt-2 text-sm text-slate-600">자기조절 점수가 낮을수록 긴 설명보다 그림 규칙, 짧은 미션, 즉시 칭찬이 효과적입니다.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
