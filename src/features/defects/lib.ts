import { TRADE_KEYWORDS } from "./trade-keywords";

/** 하자 문장 → 하자 유형 추정 (원본 dfGuessType) */
export function guessDefectType(t: string): string {
  const c = t.replace(/\s/g, "");
  if (/누수|물샘|물이샘|방수|곰팡이|결로/.test(c)) return "누수·방수";
  if (/균열|크랙|깨짐|파손|금감|금이|떨어짐|탈락/.test(c)) return "균열·파손";
  if (/소방|감지기|스프링클러|유도등|비상등|소화/.test(c)) return "소방·안전설비";
  if (/전등|조명|등이|콘센트|스위치|전기|차단기|누전|LED/i.test(c)) return "전기·조명";
  if (/배관|막힘|배수|수전|변기|세면|하수|역류|온수|보일러|난방/.test(c)) return "설비·배관";
  if (/문|창|도어|샷시|새시|도어락|경첩|손잡이|방충망/.test(c)) return "창호·문";
  if (/작동|안됨|안켜|고장|불량작동/.test(c)) return "작동 불량";
  if (/도장|도배|벽지|들뜸|찍힘|오염|마감|실리콘|줄눈|타일|몰딩|틈/.test(c)) return "마감 불량";
  return "기타";
}

/** 원본 estMatchTrade: 품명 → 공종 */
function matchTrade(name: string, trades: string[]): string | null {
  const raw = String(name);
  if (trades.includes(raw)) return raw;
  const word = (raw.match(/[^\s]*공사/) || [])[0];
  if (word && word !== raw) {
    const w = matchTrade(word, trades);
    if (w) return w;
  }
  const c = raw.replace(/\s+/g, "");
  for (const [re, t] of TRADE_KEYWORDS) if (re.test(c)) return t;
  return null;
}

const TYPE_TRADE: Record<string, string> = {
  "누수·방수": "방수",
  "전기·조명": "전기작업",
  "설비·배관": "설비·배관",
  "창호·문": "창호",
  "소방·안전설비": "소방설비",
};

/** 하자 문장 → 공종 추정 (원본 dfGuessTrade). 현장 공종 목록에 없으면 "" */
export function guessDefectTrade(t: string, type: string, trades: string[]): string {
  const m = matchTrade(t, trades);
  if (m && trades.includes(m)) return m;
  const g = TYPE_TRADE[type];
  return g && trades.includes(g) ? g : "";
}

export interface ParsedDefect {
  floor: string;
  location: string;
  type: string;
  trade: string;
  content: string;
}

/** 카톡·문자로 받은 하자 목록 붙여넣기 → 행 목록 (원본 dfParsePaste) */
export function parseDefectPaste(text: string, trades: string[]): ParsedDefect[] {
  const out: ParsedDefect[] = [];
  text
    .split(/\r?\n/)
    .map((l) =>
      l
        .trim()
        .replace(/^[-·•※▶■□○●\d]+[.)]\s*/, "")
        .replace(/^[-·•※]\s*/, ""),
    )
    .filter(Boolean)
    .forEach((line) => {
      let floor = "";
      let rest = line;
      const fm = /(지하\s*(\d+)\s*층|B\s*(\d+)\s*층?|(\d+)\s*층|옥상|옥탑층?)/i.exec(line);
      if (fm) {
        floor = fm[2]
          ? `지하 ${fm[2]}층`
          : fm[3]
            ? `지하 ${fm[3]}층`
            : fm[4]
              ? `${fm[4]}층`
              : /옥탑/.test(fm[1])
                ? "옥탑층"
                : "옥상";
        rest = line.replace(fm[0], " ").trim();
      } else {
        const ho = /(\d)(\d{2})호/.exec(line);
        if (ho) floor = `${ho[1]}층`;
      }
      const lm =
        /([^\s]*\d+호(?:\s*(?:화장실|욕실|주방|거실|베란다|현관|침실|복도|방)(?=\s|$))?|(?:남자|여자|공용)?\s*화장실|복도|계단실|주차장|로비|현관|기계실|전기실|옥상|엘리베이터홀)/.exec(
          rest,
        );
      const location = lm ? lm[0].trim() : "";
      const type = guessDefectType(line);
      out.push({ floor, location, type, trade: guessDefectTrade(line, type, trades), content: line });
    });
  return out;
}
