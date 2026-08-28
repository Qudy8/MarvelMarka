"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PhaseId = 1 | 2 | 3 | 4 | 5 | 6;

type Movie = {
  id: string;
  title: string;
  original: string;
  year: number;
  phase: PhaseId;
  wiki: string;
};

type ViewState = { x: number; y: number; scale: number };

const MOVIES: Movie[] = [
  { id: "iron-man", title: "Железный человек", original: "Iron Man", year: 2008, phase: 1, wiki: "Iron_Man_(2008_film)" },
  { id: "hulk", title: "Невероятный Халк", original: "The Incredible Hulk", year: 2008, phase: 1, wiki: "The_Incredible_Hulk_(film)" },
  { id: "iron-man-2", title: "Железный человек 2", original: "Iron Man 2", year: 2010, phase: 1, wiki: "Iron_Man_2" },
  { id: "thor", title: "Тор", original: "Thor", year: 2011, phase: 1, wiki: "Thor_(film)" },
  { id: "first-avenger", title: "Первый мститель", original: "Captain America: The First Avenger", year: 2011, phase: 1, wiki: "Captain_America:_The_First_Avenger" },
  { id: "avengers", title: "Мстители", original: "The Avengers", year: 2012, phase: 1, wiki: "The_Avengers_(2012_film)" },
  { id: "iron-man-3", title: "Железный человек 3", original: "Iron Man 3", year: 2013, phase: 2, wiki: "Iron_Man_3" },
  { id: "thor-dark", title: "Тор 2: Царство тьмы", original: "Thor: The Dark World", year: 2013, phase: 2, wiki: "Thor:_The_Dark_World" },
  { id: "winter-soldier", title: "Первый мститель: Другая война", original: "Captain America: The Winter Soldier", year: 2014, phase: 2, wiki: "Captain_America:_The_Winter_Soldier" },
  { id: "guardians", title: "Стражи Галактики", original: "Guardians of the Galaxy", year: 2014, phase: 2, wiki: "Guardians_of_the_Galaxy_(film)" },
  { id: "ultron", title: "Мстители: Эра Альтрона", original: "Avengers: Age of Ultron", year: 2015, phase: 2, wiki: "Avengers:_Age_of_Ultron" },
  { id: "ant-man", title: "Человек-муравей", original: "Ant-Man", year: 2015, phase: 2, wiki: "Ant-Man_(film)" },
  { id: "civil-war", title: "Первый мститель: Противостояние", original: "Captain America: Civil War", year: 2016, phase: 3, wiki: "Captain_America:_Civil_War" },
  { id: "doctor-strange", title: "Доктор Стрэндж", original: "Doctor Strange", year: 2016, phase: 3, wiki: "Doctor_Strange_(2016_film)" },
  { id: "guardians-2", title: "Стражи Галактики. Часть 2", original: "Guardians of the Galaxy Vol. 2", year: 2017, phase: 3, wiki: "Guardians_of_the_Galaxy_Vol._2" },
  { id: "homecoming", title: "Человек-паук: Возвращение домой", original: "Spider-Man: Homecoming", year: 2017, phase: 3, wiki: "Spider-Man:_Homecoming" },
  { id: "ragnarok", title: "Тор: Рагнарёк", original: "Thor: Ragnarok", year: 2017, phase: 3, wiki: "Thor:_Ragnarok" },
  { id: "black-panther", title: "Чёрная пантера", original: "Black Panther", year: 2018, phase: 3, wiki: "Black_Panther_(film)" },
  { id: "infinity-war", title: "Мстители: Война бесконечности", original: "Avengers: Infinity War", year: 2018, phase: 3, wiki: "Avengers:_Infinity_War" },
  { id: "ant-man-wasp", title: "Человек-муравей и Оса", original: "Ant-Man and the Wasp", year: 2018, phase: 3, wiki: "Ant-Man_and_the_Wasp" },
  { id: "captain-marvel", title: "Капитан Марвел", original: "Captain Marvel", year: 2019, phase: 3, wiki: "Captain_Marvel_(film)" },
  { id: "endgame", title: "Мстители: Финал", original: "Avengers: Endgame", year: 2019, phase: 3, wiki: "Avengers:_Endgame" },
  { id: "far-from-home", title: "Человек-паук: Вдали от дома", original: "Spider-Man: Far From Home", year: 2019, phase: 3, wiki: "Spider-Man:_Far_From_Home" },
  { id: "black-widow", title: "Чёрная вдова", original: "Black Widow", year: 2021, phase: 4, wiki: "Black_Widow_(2021_film)" },
  { id: "shang-chi", title: "Шан-Чи и легенда десяти колец", original: "Shang-Chi and the Legend of the Ten Rings", year: 2021, phase: 4, wiki: "Shang-Chi_and_the_Legend_of_the_Ten_Rings" },
  { id: "eternals", title: "Вечные", original: "Eternals", year: 2021, phase: 4, wiki: "Eternals_(film)" },
  { id: "no-way-home", title: "Человек-паук: Нет пути домой", original: "Spider-Man: No Way Home", year: 2021, phase: 4, wiki: "Spider-Man:_No_Way_Home" },
  { id: "multiverse-madness", title: "Доктор Стрэндж: В мультивселенной безумия", original: "Doctor Strange in the Multiverse of Madness", year: 2022, phase: 4, wiki: "Doctor_Strange_in_the_Multiverse_of_Madness" },
  { id: "love-thunder", title: "Тор: Любовь и гром", original: "Thor: Love and Thunder", year: 2022, phase: 4, wiki: "Thor:_Love_and_Thunder" },
  { id: "wakanda", title: "Чёрная пантера: Ваканда навеки", original: "Black Panther: Wakanda Forever", year: 2022, phase: 4, wiki: "Black_Panther:_Wakanda_Forever" },
  { id: "quantumania", title: "Человек-муравей и Оса: Квантомания", original: "Ant-Man and the Wasp: Quantumania", year: 2023, phase: 5, wiki: "Ant-Man_and_the_Wasp:_Quantumania" },
  { id: "guardians-3", title: "Стражи Галактики. Часть 3", original: "Guardians of the Galaxy Vol. 3", year: 2023, phase: 5, wiki: "Guardians_of_the_Galaxy_Vol._3" },
  { id: "marvels", title: "Капитан Марвел 2", original: "The Marvels", year: 2023, phase: 5, wiki: "The_Marvels" },
  { id: "deadpool-wolverine", title: "Дэдпул и Росомаха", original: "Deadpool & Wolverine", year: 2024, phase: 5, wiki: "Deadpool_&_Wolverine" },
  { id: "brave-new-world", title: "Капитан Америка: Новый мир", original: "Captain America: Brave New World", year: 2025, phase: 5, wiki: "Captain_America:_Brave_New_World" },
  { id: "thunderbolts", title: "Громовержцы*", original: "Thunderbolts*", year: 2025, phase: 5, wiki: "Thunderbolts*" },
  { id: "fantastic-four", title: "Фантастическая четвёрка: Первые шаги", original: "The Fantastic Four: First Steps", year: 2025, phase: 6, wiki: "The_Fantastic_Four:_First_Steps" },
  { id: "spider-man-new-day", title: "Человек-паук: Совершенно новый день", original: "Spider-Man: Brand New Day", year: 2026, phase: 6, wiki: "Spider-Man:_Brand_New_Day" },
];

const PHASES: Array<{ id: PhaseId; label: string; years: string; color: string }> = [
  { id: 1, label: "Фаза I", years: "2008—2012", color: "#65d5ff" },
  { id: 2, label: "Фаза II", years: "2013—2015", color: "#9b8cff" },
  { id: 3, label: "Фаза III", years: "2016—2019", color: "#ff5d66" },
  { id: 4, label: "Фаза IV", years: "2021—2022", color: "#ffb547" },
  { id: 5, label: "Фаза V", years: "2023—2025", color: "#45e0b7" },
  { id: 6, label: "Фаза VI", years: "2025—", color: "#f278ff" },
];

const SSPOISK_IDS: Record<string, string> = {
  "iron-man": "61237",
  "hulk": "255380",
  "iron-man-2": "411924",
  "thor": "258941",
  "first-avenger": "160946",
  "avengers": "263531",
  "iron-man-3": "462762",
  "thor-dark": "595938",
  "winter-soldier": "676266",
  "guardians": "689066",
  "ultron": "679830",
  "ant-man": "195496",
  "civil-war": "822708",
  "doctor-strange": "409600",
  "guardians-2": "841263",
  "homecoming": "690593",
  "ragnarok": "822709",
  "black-panther": "623250",
  "infinity-war": "843649",
  "ant-man-wasp": "935940",
  "captain-marvel": "843859",
  "endgame": "843650",
  "far-from-home": "1008445",
  "black-widow": "823956",
  "shang-chi": "1219149",
  "eternals": "1198811",
  "no-way-home": "1309570",
  "multiverse-madness": "1219909",
  "love-thunder": "1282688",
  "wakanda": "1199773",
  "quantumania": "1318868",
  "guardians-3": "1044280",
  "marvels": "1287544",
  "deadpool-wolverine": "1008444",
  "brave-new-world": "4443920",
  "thunderbolts": "5001443",
  "fantastic-four": "1287545",
  "spider-man-new-day": "5494049",
};

const STORAGE_KEY = "marvel-timeline-board-v1";
const WORLD_WIDTH = 11000;
const WORLD_HEIGHT = 2500;
const TIMELINE_Y = 980;
const MAX_VIEW_X = 0;
const clampViewX = (x: number) => Math.min(MAX_VIEW_X, x);

const getMovieX = (index: number) => 520 + index * 266;
const getMovieY = (index: number) => (index % 2 === 0 ? 500 : 1110);

function movieLink(movie: Movie) {
  return `https://www.sspoisk.ru/film/${SSPOISK_IDS[movie.id]}/`;
}

async function getHighQualityPoster(movie: Movie) {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(movie.wiki)}`);
  if (!response.ok) throw new Error("Постер временно недоступен");
  const data = await response.json();
  const source = data?.originalimage?.source ?? data?.thumbnail?.source;
  if (!source) throw new Error("У фильма не найден постер");
  return String(source);
}

async function imageBlobToPng(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось подготовить постер");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((png) => png ? resolve(png) : reject(new Error("Не удалось преобразовать постер")), "image/png");
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось подготовить постер для буфера"));
    reader.readAsDataURL(blob);
  });
}

function Poster({ movie }: { movie: Movie }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let live = true;
    const cached = sessionStorage.getItem(`poster:${movie.id}`);
    if (cached) {
      setSrc(cached);
      return;
    }
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(movie.wiki)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const image = data?.originalimage?.source ?? data?.thumbnail?.source;
        if (live && image) {
          setSrc(image);
          sessionStorage.setItem(`poster:${movie.id}`, image);
        }
      })
      .catch(() => undefined);
    return () => { live = false; };
  }, [movie.id, movie.wiki]);

  return src ? (
    <img src={src} alt={`Постер фильма «${movie.title}»`} draggable={false} />
  ) : (
    <span className="poster-fallback" aria-label={`Постер фильма «${movie.title}»`}>
      <b>{movie.original.split(" ").slice(0, 2).map((word) => word[0]).join("")}</b>
      <small>MARVEL STUDIOS</small>
    </span>
  );
}

export default function Home() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<null | {
    pointerId?: number;
    moved?: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>(null);
  const suppressPosterClickRef = useRef(false);
  const [view, setView] = useState<ViewState>({ x: 0, y: -250, scale: 0.72 });
  const [watched, setWatched] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState("Карта готова к исследованию");
  const [copyingMovie, setCopyingMovie] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setWatched(Array.isArray(data.watched) ? data.watched : []);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ watched }));
  }, [watched, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const matchingIds = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("ru");
    if (!value) return new Set(MOVIES.map((movie) => movie.id));
    return new Set(MOVIES.filter((movie) => `${movie.title} ${movie.original} ${movie.year}`.toLocaleLowerCase("ru").includes(value)).map((movie) => movie.id));
  }, [query]);

  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest(".watched-control, input, button")) return;
    suppressPosterClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId, moved: false,
      startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      suppressPosterClickRef.current = true;
      if (drag.pointerId !== undefined) event.currentTarget.setPointerCapture(drag.pointerId);
    }
    event.preventDefault();
    setView((current) => ({ ...current, x: clampViewX(drag.originX + dx), y: drag.originY + dy }));
  };

  const stopDrag = () => { dragRef.current = null; };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const nextScale = Math.min(1.45, Math.max(0.28, view.scale * Math.exp(-event.deltaY * 0.0018)));
    const worldX = (mouseX - view.x) / view.scale;
    const worldY = (mouseY - view.y) / view.scale;
    setView({ x: clampViewX(mouseX - worldX * nextScale), y: mouseY - worldY * nextScale, scale: nextScale });
  };

  const toggleWatched = (movieId: string) => {
    setWatched((current) => current.includes(movieId) ? current.filter((id) => id !== movieId) : [...current, movieId]);
  };

  const copyMovieAnnouncement = async (movie: Movie) => {
    const copiedAt = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const text = `Начали смотреть "${movie.title}" ${movie.year}г\n${copiedAt}\n\nhttps://www.twitch.tv/guacamolemolly`;
    setCopyingMovie(movie.id);

    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Браузер не поддерживает копирование изображений");
      }
      const posterUrl = await getHighQualityPoster(movie);
      const posterResponse = await fetch(posterUrl);
      if (!posterResponse.ok) throw new Error("Не удалось загрузить постер");
      const png = await imageBlobToPng(await posterResponse.blob());
      const posterDataUrl = await blobToDataUrl(png);
      const html = `<div><p>${text.split("\n").map((line) => line.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")).join("<br>")}</p><img src="${posterDataUrl}" alt="Постер фильма ${movie.title}" style="max-width:720px;height:auto"></div>`;
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
        "image/png": png,
      })]);
      setToast(`Текст и постер «${movie.title}» скопированы`);
    } catch (error) {
      try {
        await navigator.clipboard.writeText(text);
        setToast(`Текст скопирован, но постер недоступен: ${error instanceof Error ? error.message : "ошибка браузера"}`);
      } catch {
        setToast("Не удалось открыть буфер обмена. Разрешите сайту копирование в настройках браузера.");
      }
    } finally {
      setCopyingMovie(null);
    }
  };

  const focusPhase = (phase: PhaseId) => {
    const firstIndex = MOVIES.findIndex((movie) => movie.phase === phase);
    const rect = viewportRef.current?.getBoundingClientRect();
    setView((current) => ({ ...current, x: clampViewX((rect?.width ?? 900) * 0.22 - getMovieX(firstIndex) * current.scale), y: -250 }));
  };

  const focusSearch = () => {
    const movie = MOVIES.find((entry) => matchingIds.has(entry.id));
    if (!movie || !query.trim()) return;
    const index = MOVIES.indexOf(movie);
    const rect = viewportRef.current?.getBoundingClientRect();
    setView((current) => ({ ...current, x: clampViewX((rect?.width ?? 900) / 2 - getMovieX(index) * current.scale), y: (rect?.height ?? 700) / 2 - getMovieY(index) * current.scale }));
  };

  const resetBoard = () => {
    if (watched.length) {
      const accepted = window.confirm("Удалить все отметки о просмотре с этой карты?");
      if (!accepted) return;
    }
    setWatched([]); setView({ x: 0, y: -250, scale: 0.72 });
    setToast("Карта возвращена к началу");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="marvel-mark">
            MARVEL
            <span className="creator-sticker">by GUACAMOLEMOLLY</span>
          </span>
          <span className="brand-divider" />
          <div>
            <h1>Timeline Board</h1>
            <p>{watched.length} из {MOVIES.length} просмотрено · 6 фаз</p>
          </div>
        </div>

        <div className="search-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && focusSearch()}
            placeholder="Найти героя, фильм или год"
            aria-label="Поиск по фильмам"
          />
          {query && <button onClick={() => setQuery("")} aria-label="Очистить поиск">×</button>}
        </div>

        <div className="top-actions">
          <button className="round-button" onClick={() => setHelpOpen(true)} aria-label="Как пользоваться">?</button>
          <button className="reset-button" onClick={resetBoard}>Сбросить карту</button>
        </div>
      </header>

      <nav className="phasebar" aria-label="Фазы киновселенной Marvel">
        {PHASES.map((phase) => (
          <button key={phase.id} onClick={() => focusPhase(phase.id)} style={{ "--phase": phase.color } as React.CSSProperties}>
            <i /> <span>{phase.label}</span> <small>{phase.years}</small>
          </button>
        ))}
      </nav>

      <div
        ref={viewportRef}
        className="board-viewport"
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onDragStart={(event) => event.preventDefault()}
        onWheel={handleWheel}
      >
        <div className="world-grid" style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <div className="world-heading">
            <span>АРХИВ · ЗЕМЛЯ—616</span>
            <h2>Сага разворачивается<br />слева направо.</h2>
            <p>Перетаскивайте пространство. Нажмите на постер, чтобы открыть фильм на SSpoisk.</p>
          </div>

          <div className="timeline-line" style={{ top: TIMELINE_Y }} />

          {PHASES.map((phase) => {
            const indices = MOVIES.map((movie, index) => ({ movie, index })).filter(({ movie }) => movie.phase === phase.id);
            const first = indices[0]?.index ?? 0;
            const last = indices.at(-1)?.index ?? first;
            const left = getMovieX(first) - 78;
            const width = getMovieX(last) - getMovieX(first) + 254;
            return (
              <div key={phase.id} className="phase-range" style={{ left, top: TIMELINE_Y - 44, width, "--phase": phase.color } as React.CSSProperties}>
                <div className="phase-range-label"><b>{phase.label}</b><span>{phase.years}</span></div>
              </div>
            );
          })}

          {MOVIES.map((movie, index) => {
            const x = getMovieX(index);
            const y = getMovieY(index);
            const above = y < TIMELINE_Y;
            const phase = PHASES.find((entry) => entry.id === movie.phase)!;
            const matched = matchingIds.has(movie.id);
            const isWatched = watched.includes(movie.id);
            return (
              <article
                key={movie.id}
                className={`movie-node ${above ? "above" : "below"} ${matched ? "matched" : "muted"} ${isWatched ? "watched" : ""}`}
                style={{ left: x, top: y, "--phase": phase.color } as React.CSSProperties}
              >
                <span className="connector" />
                <span className="timeline-dot"><i /></span>
                <div className="movie-order">{String(index + 1).padStart(2, "0")}</div>
                <div className="poster-shell">
                  <a
                    className="poster-link"
                    href={movieLink(movie)}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable={false}
                    onClick={(event) => {
                      if (!suppressPosterClickRef.current) return;
                      event.preventDefault();
                      event.stopPropagation();
                      suppressPosterClickRef.current = false;
                    }}
                    aria-label={`Открыть страницу фильма «${movie.title}» на SSpoisk`}
                  >
                    <Poster movie={movie} />
                    <span className="play-orbit"><b>▶</b></span>
                  </a>
                  <label
                    className="watched-control"
                    title={isWatched ? "Отмечено как просмотренное" : "Отметить как просмотренное"}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <input type="checkbox" checked={isWatched} onChange={() => toggleWatched(movie.id)} />
                    <i aria-hidden="true">✓</i>
                    <span>{isWatched ? "Просмотрено" : "Отметить просмотренным"}</span>
                  </label>
                </div>
                <div className="movie-copy">
                  <span>{movie.year} · {phase.label}</span>
                  <h3>{movie.title}</h3>
                  <p>{movie.original}</p>
                  <button
                    className="copy-watch-button"
                    type="button"
                    disabled={copyingMovie === movie.id}
                    onClick={() => copyMovieAnnouncement(movie)}
                    aria-label={`Скопировать текст и постер фильма «${movie.title}»`}
                    title={copyingMovie === movie.id ? "Готовим постер…" : "Скопировать текст и постер"}
                  >
                    <span className="copy-glyph" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="8" y="8" width="11" height="11" rx="2" />
                        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                      </svg>
                    </span>
                  </button>
                </div>
              </article>
            );
          })}

        </div>
      </div>

      <div className="zoom-control">
        <button onClick={() => setView((current) => ({ ...current, scale: Math.max(0.28, current.scale - 0.1) }))} aria-label="Уменьшить">−</button>
        <span>{Math.round(view.scale * 100)}%</span>
        <button onClick={() => setView((current) => ({ ...current, scale: Math.min(1.45, current.scale + 0.1) }))} aria-label="Увеличить">+</button>
      </div>

      <div className="board-status">
        <span className="live-dot" />
        <span>{hydrated ? "Сохраняется на этом устройстве" : "Загрузка карты…"}</span>
        <kbd>колесо</kbd><span>масштаб под курсором</span>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}

      {helpOpen && (
        <div className="modal-backdrop" onPointerDown={() => setHelpOpen(false)}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onPointerDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Закрыть">×</button>
            <span className="modal-kicker">КАК ЭТО РАБОТАЕТ</span>
            <h2 id="help-title">Ваша карта киновселенной</h2>
            <div className="help-grid">
              <div><b>01</b><h3>Исследуйте</h3><p>Тяните пустое пространство, а колесом масштабируйте карту относительно курсора. Фазы идут слева направо.</p></div>
              <div><b>02</b><h3>Готовьте эфир</h3><p>Кнопка «Копировать» забирает текст с текущим временем, Twitch-ссылку и постер фильма в хорошем качестве.</p></div>
              <div><b>03</b><h3>Открывайте</h3><p>Нажмите на постер — страница фильма на SSpoisk откроется в новой вкладке.</p></div>
            </div>
            <button className="primary-button" onClick={() => setHelpOpen(false)}>Начать путешествие</button>
          </section>
        </div>
      )}
    </main>
  );
}
