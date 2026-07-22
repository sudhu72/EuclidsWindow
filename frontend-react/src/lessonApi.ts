// Lesson pipeline client — reuses the backend's parallel build endpoint
// (outline + all scenes in one call).

export interface LessonSection {
  title: string;
  type: "explain" | "example" | "quiz";
  summary: string;
}

export interface LessonScene {
  type: string;
  narration?: string | null;
  classmate_question?: string | null;
  classmate_answer?: string | null;
  question?: string | null;
  choices?: string[] | null;
  correct_index?: number | null;
  explanation?: string | null;
}

export interface LessonBuild {
  title: string;
  topic: string;
  level: string;
  sections: LessonSection[];
  scenes: (LessonScene | null)[];
}

export async function buildLesson(topic: string, level: string): Promise<LessonBuild> {
  const resp = await fetch("/api/ai/lesson/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, level }),
  });
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).detail;
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// Retry a single scene that failed to generate during the parallel build.
export async function fetchScene(
  topic: string,
  level: string,
  section: LessonSection
): Promise<LessonScene> {
  const resp = await fetch("/api/ai/lesson/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      level,
      section_title: section.title,
      section_type: section.type,
      summary: section.summary || "",
    }),
  });
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).detail;
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  return resp.json();
}
